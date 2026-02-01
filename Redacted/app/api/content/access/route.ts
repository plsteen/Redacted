import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

interface PurchaseRow {
  id: string;
}

interface SessionRow {
  id: string;
  status: string;
  mystery_id: string;
}

// Check if user has access to a mystery's content
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mysteryId = searchParams.get("mysteryId");
  const sessionCode = searchParams.get("sessionCode");

  if (!mysteryId) {
    return NextResponse.json(
      { error: "mysteryId is required" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, check for direct purchase
  if (user) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("mystery_id", mysteryId)
      .eq("status", "completed")
      .single();

    const typedPurchase = purchase as unknown as PurchaseRow | null;

    if (typedPurchase) {
      return NextResponse.json({
        hasAccess: true,
        accessType: "purchased",
        userId: user.id,
      });
    }
  }

  // Check for session-based access (co-player)
  if (sessionCode) {
    const adminSupabase = getSupabaseAdminClient();

    const { data: session } = await adminSupabase
      .from("sessions")
      .select("id, status, mystery_id")
      .eq("code", sessionCode)
      .eq("status", "active")
      .single();

    const typedSession = session as unknown as SessionRow | null;

    if (typedSession && typedSession.mystery_id === mysteryId) {
      return NextResponse.json({
        hasAccess: true,
        accessType: "session",
        sessionId: typedSession.id,
      });
    }
  }

  return NextResponse.json({
    hasAccess: false,
    reason: user ? "not_purchased" : "not_authenticated",
  });
}
