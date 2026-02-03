import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

interface MysteryRow {
  id: string;
  title: string;
  slug: string;
  price_nok: number | null;
}

interface PurchaseRow {
  id: string;
}

interface UserRow {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { mysteryId, userId, locale = "en" } = await request.json();

    if (!mysteryId || !userId) {
      return NextResponse.json(
        { error: "Missing mysteryId or userId" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get mystery details
    const { data: mystery, error: mysteryError } = await supabase
      .from("mysteries")
      .select("id, title, slug, price_nok")
      .eq("id", mysteryId)
      .single();

    const typedMystery = mystery as unknown as MysteryRow | null;

    if (mysteryError || !typedMystery) {
      return NextResponse.json(
        { error: "Mystery not found" },
        { status: 404 }
      );
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("mystery_id", mysteryId)
      .eq("status", "completed")
      .single();

    const typedPurchase = existingPurchase as unknown as PurchaseRow | null;

    if (typedPurchase) {
      return NextResponse.json(
        { error: "Already purchased", code: "ALREADY_PURCHASED" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: user } = await supabase
      .from("users")
      .select("id, email, stripe_customer_id")
      .eq("id", userId)
      .single();

    const typedUser = user as unknown as UserRow | null;

    let stripeCustomerId = typedUser?.stripe_customer_id;
    const stripe = getStripe();

    if (!stripeCustomerId && typedUser?.email) {
      const customer = await stripe.customers.create({
        email: typedUser.email,
        metadata: {
          supabase_user_id: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Store customer ID
      await supabase
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId);
    }

    // Create Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId || undefined,
      customer_email: !stripeCustomerId ? typedUser?.email || undefined : undefined,
      line_items: [
        {
          price_data: {
            currency: "nok",
            product_data: {
              name: typedMystery.title,
              description: `Mystery case: ${typedMystery.title}`,
              metadata: {
                mystery_id: mysteryId,
                mystery_slug: typedMystery.slug,
              },
            },
            unit_amount: (typedMystery.price_nok || 149) * 100, // Convert to øre
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
        mystery_id: mysteryId,
        mystery_slug: typedMystery.slug,
      },
      success_url: `${baseUrl}/${locale}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${locale}/catalog`,
      locale: locale === "no" ? "nb" : "en",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
