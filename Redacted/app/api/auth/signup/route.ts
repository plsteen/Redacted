import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Sign up with email and password
export async function POST(request: NextRequest) {
  try {
    const { email, password, locale = "en" } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: locale === "no" ? "E-post og passord er påkrevd" : "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: locale === "no" ? "Passord må være minst 6 tegn" : "Password must be at least 6 characters" },
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: email.split("@")[0],
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      
      // Handle specific errors
      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: locale === "no" ? "E-posten er allerede registrert" : "Email is already registered" },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return NextResponse.json({
        success: true,
        requiresConfirmation: true,
        message: locale === "no" 
          ? "Sjekk e-posten din for å bekrefte kontoen" 
          : "Check your email to confirm your account",
      });
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
