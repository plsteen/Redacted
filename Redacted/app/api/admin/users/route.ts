import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "moderator" | "viewer";
  status: "active" | "inactive";
  created_at: string;
  last_login: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authParam = searchParams.get("auth");

    // Super admin auth check
    if (authParam !== "redacted2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    
    // Fetch all admin users
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, role, status, created_at, last_login")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ admins: data || [] });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authParam = searchParams.get("auth");

    // Super admin auth check
    if (authParam !== "redacted2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role = "moderator" } = body;

    if (!email || !["admin", "moderator", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid email or role" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Check if already exists
    const { data: existing } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Admin user already exists" },
        { status: 409 }
      );
    }

    // Insert new admin user
    const { data, error } = await supabase
      .from("admin_users")
      .insert({
        email,
        role,
        status: "active",
      })
      .select("id, email, role, status, created_at, last_login")
      .single();

    if (error) throw error;

    return NextResponse.json({ admin: data }, { status: 201 });
  } catch (error) {
    console.error("Failed to create admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authParam = searchParams.get("auth");

    // Super admin auth check
    if (authParam !== "redacted2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, role, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Admin ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const updates: any = { updated_at: new Date().toISOString() };

    if (role && ["admin", "moderator", "viewer"].includes(role)) {
      updates.role = role;
    }
    if (status && ["active", "inactive"].includes(status)) {
      updates.status = status;
    }

    const { data, error } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("id", id)
      .select("id, email, role, status, created_at, last_login")
      .single();

    if (error) throw error;

    return NextResponse.json({ admin: data });
  } catch (error) {
    console.error("Failed to update admin user:", error);
    return NextResponse.json(
      { error: "Failed to update admin user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authParam = searchParams.get("auth");

    // Super admin auth check
    if (authParam !== "redacted2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Admin ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete admin user:", error);
    return NextResponse.json(
      { error: "Failed to delete admin user" },
      { status: 500 }
    );
  }
}
