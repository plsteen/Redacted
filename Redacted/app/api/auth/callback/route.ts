import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = searchParams.get("locale") || "en";
  const next = searchParams.get("next") || `/catalog`;

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}?error=missing_code`, request.url));
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL(`/${locale}?error=auth_failed`, request.url));
  }

  // Sync user to public.users table (only if admin client is available)
  if (data.user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminSupabase = getSupabaseAdminClient();
    
    // Check if user exists in public.users
    const { data: existingUser } = await adminSupabase
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .single();

    if (!existingUser) {
      // Create user in public.users table
      await adminSupabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.email?.split("@")[0] || "Host",
      });
    } else {
      // Update email if needed
      await adminSupabase
        .from("users")
        .update({ email: data.user.email })
        .eq("id", data.user.id);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
