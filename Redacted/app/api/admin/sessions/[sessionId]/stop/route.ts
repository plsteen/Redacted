import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

// POST - Stop a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId } = await params;
    const supabase = getSupabaseAdminClient();

    // Try to update session status in database (may or may not exist)
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ status: "abandoned" })
      .eq("id", sessionId);

    // Log admin action regardless (even if session doesn't exist in DB)
    await supabase.from("admin_action_log").insert({
      admin_user: "admin",
      action_type: "session_stop",
      target_type: "session",
      target_id: sessionId,
      details: { reason: "Manual admin stop" }
    }).catch(err => console.error("Failed to log action:", err));

    return NextResponse.json({ success: true, message: "Session stopped" });
  } catch (error) {
    console.error("Failed to stop session:", error);
    return NextResponse.json(
      { error: "Failed to stop session", details: String(error) },
      { status: 500 }
    );
  }
}
