import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

interface SessionRow {
  id: string;
  code: string;
  mystery_id: string | null;
  language: string;
  status: string;
  created_at: string;
  mysteries: { code: string } | null;
}

interface ActivityRow {
  session_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

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
    
    // Get sessions from the sessions table
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

    const { data: dbSessions, error } = await query;

    if (error) {
      console.error("Database error:", error);
      // If sessions table query fails, still try activity log
    }

    // Also get active sessions from user_activity_log for real-time data
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: activityData } = await supabase
      .from("user_activity_log")
      .select("session_id, metadata, created_at")
      .gte("created_at", last24h.toISOString())
      .order("created_at", { ascending: false }) as { data: ActivityRow[] | null };

    // Build a map of active sessions from activity log, counting unique users
    const activeSessions = new Map<string, {
      sessionId: string;
      lastActivity: string;
      users: Set<string>;
      caseCode: string;
    }>();

    (activityData || []).forEach((activity) => {
      if (!activity.session_id) return;
      
      const userId = (activity.metadata as any)?.userId || 
                     (activity.metadata as any)?.user_id || 
                     "anonymous";
      const caseCode = (activity.metadata as any)?.caseCode || 
                       (activity.metadata as any)?.case_id || 
                       "unknown";

      if (!activeSessions.has(activity.session_id)) {
        activeSessions.set(activity.session_id, {
          sessionId: activity.session_id,
          lastActivity: activity.created_at,
          users: new Set([userId]),
          caseCode: String(caseCode),
        });
      } else {
        const session = activeSessions.get(activity.session_id)!;
        session.users.add(userId);
        // Update if this activity is more recent
        if (activity.created_at > session.lastActivity) {
          session.lastActivity = activity.created_at;
        }
      }
    });

    // Merge database sessions with activity data
    const enrichedSessions = ((dbSessions as unknown as SessionRow[]) || [])
      .map(session => ({
        id: session.id,
        code: session.code,
        mystery_id: session.mystery_id,
        language: session.language,
        status: session.status,
        created_at: session.created_at,
        player_count: 0,
        current_task: null,
        mystery_title: (session.mysteries as { code: string } | null)?.code || "Unknown"
      }));

    // Add activity-based sessions that don't exist in database
    activeSessions.forEach((actSession) => {
      if (!enrichedSessions.find(s => s.id === actSession.sessionId)) {
        enrichedSessions.push({
          id: actSession.sessionId,
          code: actSession.sessionId,
          mystery_id: null,
          language: "en",
          status: "active",
          created_at: actSession.lastActivity,
          player_count: actSession.users.size,
          current_task: null,
          mystery_title: actSession.caseCode
        });
      }
    });

    // Get player counts for database sessions
    const sessionIds = ((dbSessions as unknown as SessionRow[]) || []).map(s => s.id);
    
    let playerCounts: Record<string, number> = {};
    let taskProgress: Record<string, number | null> = {};

    if (sessionIds.length > 0) {
      // Get player counts from session_players table
      const { data: players } = await supabase
        .from("session_players")
        .select("session_id")
        .in("session_id", sessionIds);

      playerCounts = (players as any[] || []).reduce((acc, p) => {
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
      (progress as any[] || []).forEach(p => {
        if (!taskProgress[p.session_id] || p.task_idx > (taskProgress[p.session_id] || 0)) {
          taskProgress[p.session_id] = p.task_idx;
        }
      });
    }

    // Apply enrichment
    const finalSessions = enrichedSessions.map(session => ({
      ...session,
      player_count: playerCounts[session.id] || session.player_count,
      current_task: taskProgress[session.id] || session.current_task,
    }));

    return NextResponse.json({ sessions: finalSessions });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions", details: String(error) },
      { status: 500 }
    );
  }
}
