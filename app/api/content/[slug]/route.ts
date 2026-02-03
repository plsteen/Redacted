import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { readFile } from "fs/promises";
import path from "path";

interface MysteryRow {
  id: string;
  title: string;
  slug: string;
  difficulty: number | null;
  price_nok: number | null;
}

interface PurchaseRow {
  id: string;
}

interface SessionRow {
  id: string;
  status: string;
  mystery_id: string;
}

// Get mystery content (tasks, evidence, case info) - protected
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";
  const sessionCode = searchParams.get("sessionCode");

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

  const adminSupabase = getSupabaseAdminClient();

  // Get mystery by slug
  const { data: mystery } = await adminSupabase
    .from("mysteries")
    .select("id, title, slug, difficulty, price_nok")
    .eq("slug", slug)
    .single();

  const typedMystery = mystery as unknown as MysteryRow | null;

  if (!typedMystery) {
    return NextResponse.json({ error: "Mystery not found" }, { status: 404 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  let hasAccess = false;
  let accessType: "purchased" | "session" | "demo" | null = null;

  // Check for direct purchase
  if (user) {
    const { data: purchase } = await adminSupabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("mystery_id", typedMystery.id)
      .eq("status", "completed")
      .single();

    const typedPurchase = purchase as unknown as PurchaseRow | null;

    if (typedPurchase) {
      hasAccess = true;
      accessType = "purchased";
    }
  }

  // Check for session-based access
  if (!hasAccess && sessionCode) {
    const { data: session } = await adminSupabase
      .from("sessions")
      .select("id, status, mystery_id")
      .eq("code", sessionCode)
      .eq("mystery_id", typedMystery.id)
      .single();

    const typedSession = session as unknown as SessionRow | null;

    if (typedSession && (typedSession.status === "active" || typedSession.status === "lobby")) {
      hasAccess = true;
      accessType = "session";
    }
  }

  // Allow demo access for first case or free cases
  if (!hasAccess && (typedMystery.price_nok === 0 || typedMystery.price_nok === null)) {
    hasAccess = true;
    accessType = "demo";
  }

  if (!hasAccess) {
    return NextResponse.json(
      {
        error: "Access denied",
        mystery: {
          id: typedMystery.id,
          title: typedMystery.title,
          slug: typedMystery.slug,
          difficulty: typedMystery.difficulty,
          priceNok: typedMystery.price_nok,
        },
        requiresPurchase: true,
      },
      { status: 403 }
    );
  }

  // Load content from files
  try {
    const contentDir = path.join(
      process.cwd(),
      "content",
      "cases",
      slug,
      locale
    );

    const [caseData, tasksData, evidenceData] = await Promise.all([
      readFile(path.join(contentDir, "case.json"), "utf-8").then(JSON.parse),
      readFile(path.join(contentDir, "tasks.json"), "utf-8").then(JSON.parse),
      readFile(path.join(contentDir, "evidence.json"), "utf-8").then(JSON.parse),
    ]);

    return NextResponse.json({
      mystery: {
        id: typedMystery.id,
        title: typedMystery.title,
        slug: typedMystery.slug,
        difficulty: typedMystery.difficulty,
      },
      accessType,
      content: {
        case: caseData,
        tasks: tasksData,
        evidence: evidenceData,
      },
    });
  } catch (error) {
    console.error(`Failed to load content for ${slug}/${locale}:`, error);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }
}
