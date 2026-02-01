import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Sign in with email and password
export async function POST(request: NextRequest) {
  try {
    const { email, password, locale = "en" } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: locale === "no" ? "E-post og passord er påkrevd" : "Email and password are required" },
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      
      if (error.message.includes("Invalid login credentials")) {
        return NextResponse.json(
          { error: locale === "no" ? "Feil e-post eller passord" : "Invalid email or password" },
          { status: 401 }
        );
      }
      
      if (error.message.includes("Email not confirmed")) {
        return NextResponse.json(
          { error: locale === "no" ? "Bekreft e-posten din først" : "Please confirm your email first" },
          { status: 401 }
        );
      }
      
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name || data.user.email?.split("@")[0],
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to sign in" },
      { status: 500 }
    );
  }
}
