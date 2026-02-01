import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import Stripe from "stripe";

interface PurchaseRecord {
  id: string;
  user_id: string;
  mystery_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  refunded_at: string | null;
}

// POST - Process refund
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { purchaseId, reason } = body;

    if (!purchaseId) {
      return NextResponse.json(
        { error: "Purchase ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get purchase details
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("id, user_id, mystery_id, amount, currency, status, stripe_payment_intent_id, refunded_at")
      .eq("id", purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    const typedPurchase = purchase as unknown as PurchaseRecord;

    if (typedPurchase.refunded_at) {
      return NextResponse.json(
        { error: "Purchase already refunded" },
        { status: 400 }
      );
    }

    let stripeRefundId = null;

    // If Stripe payment, process refund via Stripe
    if (typedPurchase.stripe_payment_intent_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2026-01-28.clover",
        });

        const refund = await stripe.refunds.create({
          payment_intent: typedPurchase.stripe_payment_intent_id,
          reason: "requested_by_customer",
        });

        stripeRefundId = refund.id;
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
        // Continue with database refund even if Stripe fails
      }
    }

    // Record refund in database
    const { error: refundError } = await supabase.from("refunds").insert({
      purchase_id: purchaseId,
      user_id: typedPurchase.user_id,
      amount: typedPurchase.amount,
      currency: typedPurchase.currency || "NOK",
      reason: reason || "Admin refund",
      refunded_by: "admin",
      stripe_refund_id: stripeRefundId,
    });

    if (refundError) throw refundError;

    // Update purchase record
    const { error: updateError } = await supabase
      .from("purchases")
      .update({
        refunded_at: new Date().toISOString(),
        refund_amount: typedPurchase.amount,
        status: "refunded",
      })
      .eq("id", purchaseId);

    if (updateError) throw updateError;

    // Optionally remove purchase access
    // For now, we'll keep the access but mark as refunded

    return NextResponse.json({
      success: true,
      refundId: stripeRefundId,
      message: stripeRefundId 
        ? "Refund processed via Stripe" 
        : "Refund recorded (manual Stripe refund may be needed)",
    });
  } catch (error) {
    console.error("Failed to process refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}

// GET - List refunds
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ refunds: [] });
  }

  const supabase = getSupabaseAdminClient();

  try {
    const { data: refunds, error } = await supabase
      .from("refunds")
      .select(`
        id,
        amount,
        currency,
        reason,
        refunded_by,
        refunded_at,
        stripe_refund_id,
        purchases (
          id,
          mystery_id,
          mysteries (title)
        ),
        users (email)
      `)
      .order("refunded_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ refunds: refunds || [] });
  } catch (error) {
    console.error("Failed to fetch refunds:", error);
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}
