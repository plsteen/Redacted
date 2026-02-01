import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  // Idempotency check: Skip if we've already processed this event
  const { data: existingEvent } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
  }

  // Store event for idempotency
  await supabase.from("stripe_events").insert({
    id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);
        // Optionally update purchase status or notify user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const mysteryId = session.metadata?.mystery_id;

  if (!userId || !mysteryId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  // Check if purchase already exists (idempotency)
  const { data: existingPurchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .single();

  if (existingPurchase) {
    console.log(`Purchase for session ${session.id} already exists`);
    return;
  }

  // Create purchase record
  const { error: purchaseError } = await supabase.from("purchases").insert({
    user_id: userId,
    mystery_id: mysteryId,
    platform: "stripe",
    amount: (session.amount_total || 0) / 100, // Convert from øre to NOK
    currency: session.currency?.toUpperCase() || "NOK",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
    status: "completed",
  });

  if (purchaseError) {
    console.error("Failed to create purchase:", purchaseError);
    throw purchaseError;
  }

  // Update user's Stripe customer ID if not set
  if (session.customer) {
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer.id;

    await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId)
      .is("stripe_customer_id", null);
  }

  console.log(`Purchase created for user ${userId}, mystery ${mysteryId}`);
}
