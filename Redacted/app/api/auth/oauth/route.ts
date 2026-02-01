import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Sign in with OAuth provider (Google, Apple, etc.)
export async function POST(request: NextRequest) {
  try {
    const { provider, locale = "en" } = await request.json();

    const validProviders = ["google", "apple", "facebook"];
    if (!provider || !validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "apple" | "facebook",
      options: {
        redirectTo: `${baseUrl}/api/auth/callback?locale=${locale}`,
        queryParams: provider === "google" ? {
          access_type: "offline",
          prompt: "consent",
        } : undefined,
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      url: data.url,
    });
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}
