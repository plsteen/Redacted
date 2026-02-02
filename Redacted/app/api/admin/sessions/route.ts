import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

// GET - List sessions with filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");
  const filter = searchParams.get("filter") || "all";

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    
    let query = supabase
      .from("sessions")
      .select(`
        id,
        code,
        mystery_id,
        language,
        status,
        created_at,
        mysteries(code)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    // Apply filter
    if (filter === "active") {
      query = query.eq("status", "active");
    } else if (filter === "lobby") {
      query = query.eq("status", "lobby");
    } else if (filter === "completed") {
      query = query.eq("status", "completed");
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    // Get player counts for each session
    const sessionIds = sessions?.map(s => s.id) || [];
    
    let playerCounts: Record<string, number> = {};
    let taskProgress: Record<string, number | null> = {};

    if (sessionIds.length > 0) {
      // Get player counts
      const { data: players } = await supabase
        .from("session_players")
        .select("session_id")
        .in("session_id", sessionIds);

      playerCounts = (players || []).reduce((acc, p) => {
        acc[p.session_id] = (acc[p.session_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get current task for each session
      const { data: progress } = await supabase
        .from("session_progress")
        .select("session_id, task_idx")
        .in("session_id", sessionIds)
        .order("task_idx", { ascending: false });

      // Get max task for each session
      (progress || []).forEach(p => {
        if (!taskProgress[p.session_id] || p.task_idx > (taskProgress[p.session_id] || 0)) {
          taskProgress[p.session_id] = p.task_idx;
        }
      });
    }

    const enrichedSessions = sessions?.map(session => ({
      ...session,
      player_count: playerCounts[session.id] || 0,
      current_task: taskProgress[session.id] || null,
      mystery_title: (session.mysteries as { code: string } | null)?.code || "Unknown"
    }));

    return NextResponse.json({ sessions: enrichedSessions || [] });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
