import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface PurchaseWithMystery {
  id: string;
  mystery_id: string;
  purchased_at: string;
  mysteries: {
    id: string;
    slug: string;
    title: string;
    locale: string;
    difficulty: number | null;
  } | null;
}

// Get user's purchased mysteries (library)
export async function GET() {
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

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all purchases with mystery details
  const { data: purchases, error } = await supabase
    .from("purchases")
    .select(`
      id,
      mystery_id,
      purchased_at,
      mysteries (
        id,
        slug,
        title,
        locale,
        difficulty
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("purchased_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch library:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 }
    );
  }

  const typedPurchases = (purchases || []) as unknown as PurchaseWithMystery[];

  // Transform to cleaner format
  const library = typedPurchases.map((p) => ({
    id: p.mystery_id,
    slug: p.mysteries?.slug,
    title: p.mysteries?.title,
    locale: p.mysteries?.locale,
    difficulty: p.mysteries?.difficulty,
    purchasedAt: p.purchased_at,
  }));

  return NextResponse.json({ library });
}
