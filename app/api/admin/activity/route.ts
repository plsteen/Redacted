import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ stats: {}, activeUsers: [], recentActivity: [] });
  }

  const supabase = getSupabaseAdminClient();

  try {
    const now = new Date();
    const last5min = new Date(now.getTime() - 5 * 60 * 1000);
    const last15min = new Date(now.getTime() - 15 * 60 * 1000);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all activity for analysis
    const { data: allActivity } = await supabase
      .from("user_activity_log")
      .select("user_id, session_id, action, page_url, metadata, created_at, device_type, browser_name, os_name")
      .order("created_at", { ascending: false })
      .limit(5000) as { data: Array<{ user_id: string | null; session_id: string | null; action: string; page_url: string | null; metadata: Record<string, unknown> | null; created_at: string; device_type: string | null; browser_name: string | null; os_name: string | null }> | null };

    // Get total registered users from auth (via purchases or any user_id reference)
    const { data: usersData } = await supabase
      .from("user_activity_log")
      .select("user_id")
      .not("user_id", "is", null) as { data: Array<{ user_id: string | null }> | null };
    
    const allUserIds = new Set((usersData || []).map(u => u.user_id).filter(Boolean));
    const totalRegistered = allUserIds.size;

    // Active users calculations
    const usersLast5min = new Set(
      (allActivity || [])
        .filter(a => new Date(a.created_at) >= last5min)
        .map(a => a.session_id || a.user_id)
        .filter(Boolean)
    );

    const usersLast15min = new Set(
      (allActivity || [])
        .filter(a => new Date(a.created_at) >= last15min)
        .map(a => a.session_id || a.user_id)
        .filter(Boolean)
    );

    const usersLast24h = new Set(
      (allActivity || [])
        .filter(a => new Date(a.created_at) >= last24h)
        .map(a => a.user_id || a.session_id)
        .filter(Boolean)
    );

    const usersLast7d = new Set(
      (allActivity || [])
        .filter(a => new Date(a.created_at) >= last7d)
        .map(a => a.user_id || a.session_id)
        .filter(Boolean)
    );

    const usersLast30d = new Set(
      (allActivity || [])
        .filter(a => new Date(a.created_at) >= last30d)
        .map(a => a.user_id || a.session_id)
        .filter(Boolean)
    );

    // Currently active users (last 15 min) with their current location
    const recentActivityMap = new Map<string, {
      sessionId: string;
      userId: string | null;
      lastAction: string;
      lastPage: string;
      lastSeen: string;
      device: string;
      browser: string;
      os: string;
      caseId: string | null;
      currentStep: string | null;
    }>();

    (allActivity || [])
      .filter(a => new Date(a.created_at) >= last15min)
      .forEach(a => {
        const key = a.session_id || a.user_id;
        if (!key) return;
        
        if (!recentActivityMap.has(key)) {
          // Extract case info from metadata or page_url
          let caseId = null;
          let currentStep = null;
          
          if (a.metadata) {
            const meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
            caseId = meta.caseId || meta.case_id || null;
            if (typeof meta.step === "string" && meta.step.trim().length > 0) {
              currentStep = meta.step;
            } else if (Number.isFinite(meta.taskIndex)) {
              currentStep = `Task ${meta.taskIndex + 1}`;
            }
          }
          
          // Try to extract from page_url
          if (!caseId && a.page_url) {
            const playMatch = a.page_url.match(/\/play\?.*case=([^&]+)/);
            const boardMatch = a.page_url.match(/\/board\?.*case=([^&]+)/);
            if (playMatch) caseId = playMatch[1];
            if (boardMatch) caseId = boardMatch[1];
          }

          // Determine current step from action or page
          if (!currentStep) {
            if (a.action === 'game_start') currentStep = 'Starting game';
            else if (a.action === 'game_complete') currentStep = 'Completed';
            else if (a.action === 'task_complete') currentStep = 'Solving tasks';
            else if (a.action === 'hint_used') currentStep = 'Using hints';
            else if (a.page_url?.includes('/play')) currentStep = 'Playing';
            else if (a.page_url?.includes('/board')) currentStep = 'On board';
            else if (a.page_url?.includes('/catalog')) currentStep = 'Browsing catalog';
            else if (a.page_url?.includes('/library')) currentStep = 'In library';
            else if (a.page_url?.includes('/admin')) currentStep = 'Admin panel';
            else currentStep = 'Browsing';
          }

          recentActivityMap.set(key, {
            sessionId: a.session_id || 'unknown',
            userId: a.user_id,
            lastAction: a.action,
            lastPage: a.page_url || '/',
            lastSeen: a.created_at,
            device: a.device_type || 'unknown',
            browser: a.browser_name || 'unknown',
            os: a.os_name || 'unknown',
            caseId,
            currentStep,
          });
        }
      });

    const activeUsers = Array.from(recentActivityMap.values())
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    // Page distribution for active users
    const pageDistribution: Record<string, number> = {};
    activeUsers.forEach(u => {
      const page = u.currentStep || 'Unknown';
      pageDistribution[page] = (pageDistribution[page] || 0) + 1;
    });

    // Device breakdown for all users last 24h
    const deviceBreakdown: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    const seen24hSessions = new Set<string>();
    (allActivity || [])
      .filter(a => new Date(a.created_at) >= last24h)
      .forEach(a => {
        const key = a.session_id || a.user_id;
        if (key && !seen24hSessions.has(key)) {
          seen24hSessions.add(key);
          const device = a.device_type || 'desktop';
          deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
        }
      });

    // Browser breakdown
    const browserBreakdown: Record<string, number> = {};
    const seenBrowserSessions = new Set<string>();
    (allActivity || [])
      .filter(a => new Date(a.created_at) >= last24h)
      .forEach(a => {
        const key = a.session_id || a.user_id;
        if (key && !seenBrowserSessions.has(key)) {
          seenBrowserSessions.add(key);
          const browser = a.browser_name || 'Unknown';
          browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
        }
      });

    // Recent game sessions (from session_analytics)
    const { data: recentGames } = await supabase
      .from("session_analytics")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      stats: {
        activeNow: usersLast5min.size,
        activeLast15min: usersLast15min.size,
        activeLast24h: usersLast24h.size,
        activeLast7d: usersLast7d.size,
        activeLast30d: usersLast30d.size,
        totalRegistered,
        pageDistribution,
        deviceBreakdown,
        browserBreakdown,
      },
      activeUsers,
      recentGames: recentGames || [],
    });
  } catch (error) {
    console.error("Failed to fetch user activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
