import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

// POST - Redeem an access code
export async function POST(request: NextRequest) {
  try {
    const { code, locale = "en" } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: locale === "no" ? "Kode er påkrevd" : "Code is required" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 500 }
      );
    }

    // Get current user
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
      return NextResponse.json(
        { error: locale === "no" ? "Du må være logget inn" : "You must be logged in" },
        { status: 401 }
      );
    }

    const adminSupabase = getSupabaseAdminClient();

    // Define type for access code
    interface AccessCode {
      id: string;
      code: string;
      mystery_id: string;
      max_uses: number;
      used_count: number;
      expires_at: string | null;
      is_active: boolean;
    }

    // Find the access code
    const normalizedCode = code.toUpperCase().replace(/\s/g, "");
    const { data: accessCodeRaw, error: codeError } = await adminSupabase
      .from("access_codes")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .single();

    if (codeError || !accessCodeRaw) {
      return NextResponse.json(
        { error: locale === "no" ? "Ugyldig kode" : "Invalid code" },
        { status: 400 }
      );
    }

    const accessCode = accessCodeRaw as unknown as AccessCode;

    // Check expiration
    if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: locale === "no" ? "Koden har utløpt" : "Code has expired" },
        { status: 400 }
      );
    }

    // Check max uses
    if (accessCode.used_count >= accessCode.max_uses) {
      return NextResponse.json(
        { error: locale === "no" ? "Koden er brukt opp" : "Code has been fully redeemed" },
        { status: 400 }
      );
    }

    // Check if user already redeemed this code
    const { data: existingRedemption } = await adminSupabase
      .from("access_code_redemptions")
      .select("id")
      .eq("access_code_id", accessCode.id)
      .eq("user_id", user.id)
      .single();

    if (existingRedemption) {
      return NextResponse.json(
        { error: locale === "no" ? "Du har allerede brukt denne koden" : "You have already used this code" },
        { status: 400 }
      );
    }

    // Check if user already owns this mystery
    const { data: existingPurchase } = await adminSupabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("mystery_id", accessCode.mystery_id)
      .eq("status", "completed")
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: locale === "no" ? "Du eier allerede denne saken" : "You already own this case" },
        { status: 400 }
      );
    }

    // Record redemption
    const { error: redemptionError } = await adminSupabase
      .from("access_code_redemptions")
      .insert({
        access_code_id: accessCode.id,
        user_id: user.id,
        mystery_id: accessCode.mystery_id,
      });

    if (redemptionError) throw redemptionError;

    // Create purchase record (with $0 amount)
    const { error: purchaseError } = await adminSupabase
      .from("purchases")
      .insert({
        user_id: user.id,
        mystery_id: accessCode.mystery_id,
        platform: "access_code",
        amount: 0,
        currency: "NOK",
        status: "completed",
      });

    if (purchaseError) throw purchaseError;

    // Update used count
    await adminSupabase
      .from("access_codes")
      .update({ used_count: accessCode.used_count + 1 })
      .eq("id", accessCode.id);

    // Get mystery info for response
    const { data: mystery } = await adminSupabase
      .from("mysteries")
      .select("title, slug")
      .eq("id", accessCode.mystery_id)
      .single();

    return NextResponse.json({
      success: true,
      mystery: mystery || { title: "Mystery", slug: "" },
      message: locale === "no" 
        ? "Koden er løst inn! Du har nå tilgang til saken." 
        : "Code redeemed! You now have access to the case.",
    });
  } catch (error) {
    console.error("Redeem code error:", error);
    return NextResponse.json(
      { error: "Failed to redeem code" },
      { status: 500 }
    );
  }
}
