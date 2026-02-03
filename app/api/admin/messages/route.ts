import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ messages: [] });
  }

  const supabase = getSupabaseAdminClient();
  const status = searchParams.get("status");

  try {
    let query = supabase
      .from("contact_messages")
      .select("id, name, email, subject, message, locale, user_id, status, admin_note, created_at, resolved_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ messages: data || [] });
  } catch (error) {
    console.error("Failed to fetch contact messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, status, adminNote } = body || {};

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("contact_messages")
      .update({
        status,
        admin_note: adminNote || null,
        resolved_at: status === "closed" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update contact message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
