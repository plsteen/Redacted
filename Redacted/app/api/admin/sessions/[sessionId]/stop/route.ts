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

    // Update session status to abandoned
    const { error } = await supabase
      .from("sessions")
      .update({ status: "abandoned" })
      .eq("id", sessionId);

    if (error) throw error;

    // Log admin action
    await supabase.from("admin_action_log").insert({
      admin_user: "admin",
      action_type: "session_stop",
      target_type: "session",
      target_id: sessionId,
      details: { reason: "Manual admin stop" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to stop session:", error);
    return NextResponse.json(
      { error: "Failed to stop session" },
      { status: 500 }
    );
  }
}
