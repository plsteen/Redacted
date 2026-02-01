import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

interface PurchaseRow {
  id: string;
  user_id: string;
  mystery_id: string;
  platform: string;
  amount: number;
  currency: string;
  status: string;
  stripe_checkout_session_id: string | null;
  purchased_at: string;
  users: { email: string } | null;
  mysteries: { title: string; slug: string } | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  // Simple auth check
  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if service role key is available
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Return empty data for development
    return NextResponse.json({
      totalRevenue: 0,
      totalPurchases: 0,
      uniqueCustomers: 0,
      recentPurchases: [],
    });
  }

  const supabase = getSupabaseAdminClient();

  try {
    // Get all purchases with user and mystery info
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select(`
        id,
        user_id,
        mystery_id,
        platform,
        amount,
        currency,
        status,
        stripe_checkout_session_id,
        purchased_at,
        users (email),
        mysteries (title, slug)
      `)
      .order("purchased_at", { ascending: false })
      .limit(100);

    if (purchasesError) {
      throw purchasesError;
    }

    const typedPurchases = (purchases || []) as unknown as PurchaseRow[];

    // Calculate stats
    const completedPurchases = typedPurchases.filter(
      (p) => p.status === "completed"
    );

    const totalRevenue = completedPurchases.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    const uniqueCustomers = new Set(
      completedPurchases.map((p) => p.user_id)
    ).size;

    // Transform purchases for response
    const recentPurchases = typedPurchases.map((p) => ({
      id: p.id,
      userId: p.user_id,
      userEmail: p.users?.email || null,
      mysteryTitle: p.mysteries?.title || "Unknown",
      mysterySlug: p.mysteries?.slug || "",
      amount: p.amount,
      currency: p.currency,
      platform: p.platform,
      status: p.status,
      purchasedAt: p.purchased_at,
      stripeCheckoutSessionId: p.stripe_checkout_session_id,
    }));

    return NextResponse.json({
      totalRevenue,
      totalPurchases: completedPurchases.length,
      uniqueCustomers,
      recentPurchases,
    });
  } catch (error) {
    console.error("Failed to fetch purchase stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase data" },
      { status: 500 }
    );
  }
}
