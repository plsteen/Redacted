import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

// GET - Get session events/progress
export async function GET(
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

    // Get session progress as events - try both UUID and text formats
    let progress = null;
    let error = null;
    
    // First try treating it as UUID
    ({ data: progress, error } = await supabase
      .from("session_progress")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false }));

    // Get activity log for this session (works with any format)
    const { data: activityLog } = await supabase
      .from("user_activity_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Combine and format as events
    const events = [
      ...(progress || []).map(p => ({
        id: p.id,
        session_id: sessionId,
        event_type: "task_progress",
        data: {
          task_idx: p.task_idx,
          is_correct: p.is_correct,
          hint_used: p.hint_used,
          time_spent_seconds: p.time_spent_seconds
        },
        timestamp: p.created_at
      })),
      ...(activityLog || []).map(a => ({
        id: a.id,
        session_id: sessionId,
        event_type: a.action,
        data: a.metadata || {},
        timestamp: a.created_at
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to fetch session events:", error);
    return NextResponse.json(
      { error: "Failed to fetch session events" },
      { status: 500 }
    );
  }
}
