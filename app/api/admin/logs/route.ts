import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sendThrottledErrorNotification } from "@/lib/email";

// Helper to parse user agent
function parseUserAgent(ua: string) {
  const browser = {
    name: "Unknown",
    version: "Unknown",
  };
  const os = {
    name: "Unknown",
    version: "Unknown",
  };
  let deviceType = "desktop";

  // Browser detection
  if (ua.includes("Firefox/")) {
    browser.name = "Firefox";
    browser.version = ua.match(/Firefox\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.includes("Edg/")) {
    browser.name = "Edge";
    browser.version = ua.match(/Edg\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.includes("Chrome/")) {
    browser.name = "Chrome";
    browser.version = ua.match(/Chrome\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    browser.name = "Safari";
    browser.version = ua.match(/Version\/(\d+)/)?.[1] || "Unknown";
  }

  // OS detection
  if (ua.includes("Windows")) {
    os.name = "Windows";
    os.version = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || "Unknown";
  } else if (ua.includes("Mac OS X")) {
    os.name = "macOS";
    os.version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace("_", ".") || "Unknown";
  } else if (ua.includes("Linux")) {
    os.name = "Linux";
  } else if (ua.includes("Android")) {
    os.name = "Android";
    os.version = ua.match(/Android (\d+)/)?.[1] || "Unknown";
    deviceType = "mobile";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os.name = "iOS";
    os.version = ua.match(/OS (\d+)/)?.[1] || "Unknown";
    deviceType = ua.includes("iPad") ? "tablet" : "mobile";
  }

  // Device type from screen or user agent
  if (ua.includes("Mobile")) deviceType = "mobile";
  if (ua.includes("Tablet")) deviceType = "tablet";

  return { browser, os, deviceType };
}

// POST - Log user activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      sessionId,
      action,
      pageUrl,
      referrer,
      metadata = {},
      screenWidth,
      screenHeight,
      errorMessage,
      errorStack,
    } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: true }); // Silently skip if not configured
    }

    const supabase = getSupabaseAdminClient();
    const userAgent = request.headers.get("user-agent") || "";
    const { browser, os, deviceType } = parseUserAgent(userAgent);

    // Get IP from headers (Vercel/Cloudflare provide these)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") ||
               null;

    await supabase.from("user_activity_log").insert({
      user_id: userId || null,
      session_id: sessionId,
      action,
      page_url: pageUrl,
      referrer,
      user_agent: userAgent,
      browser_name: browser.name,
      browser_version: browser.version,
      os_name: os.name,
      os_version: os.version,
      device_type: deviceType,
      screen_width: screenWidth,
      screen_height: screenHeight,
      ip_address: ip,
      metadata,
      error_message: errorMessage,
      error_stack: errorStack,
    });

    // Send email notification for errors
    if (errorMessage) {
      sendThrottledErrorNotification({
        action,
        errorMessage,
        errorStack,
        userId,
        sessionId,
        pageUrl,
        userAgent,
        timestamp: new Date().toISOString(),
      }).catch(err => console.error('Failed to send error email:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Activity log error:", error);
    return NextResponse.json({ success: true }); // Don't fail the request
  }
}

// GET - Retrieve activity logs (admin only)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get("auth");

  if (authParam !== "redacted2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ logs: [], errors: [], stats: {} });
  }

  const supabase = getSupabaseAdminClient();
  const limit = parseInt(searchParams.get("limit") || "200");
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const hasError = searchParams.get("hasError") === "true";
  const timeRange = searchParams.get("timeRange") || "all"; // 24h, 7d, 30d, all

  try {
    // Calculate time filter
    let timeFilter: Date | null = null;
    if (timeRange === "24h") {
      timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (timeRange === "7d") {
      timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "30d") {
      timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    let query = supabase
      .from("user_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action) query = query.eq("action", action);
    if (userId) query = query.eq("user_id", userId);
    if (hasError) query = query.not("error_message", "is", null);
    if (timeFilter) query = query.gte("created_at", timeFilter.toISOString());

    const { data: logs, error: logsError } = await query;
    if (logsError) throw logsError;

    // Get error summary
    const { data: errors } = await supabase
      .from("error_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    // Time-based stats
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total logs
    const { count: totalLogs } = await supabase
      .from("user_activity_log")
      .select("*", { count: "exact", head: true });

    // Logs in time periods
    const { count: logs24h } = await supabase
      .from("user_activity_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last24h.toISOString());

    const { count: logs7d } = await supabase
      .from("user_activity_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last7d.toISOString());

    const { count: logs30d } = await supabase
      .from("user_activity_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last30d.toISOString());

    // Unique users (total) - get distinct user_ids
    const { data: uniqueUsersData } = await supabase
      .from("user_activity_log")
      .select("user_id")
      .not("user_id", "is", null) as { data: Array<{ user_id: string | null }> | null };
    
    const uniqueUserIds = new Set((uniqueUsersData || []).map(u => u.user_id).filter(Boolean));
    const uniqueUsers = uniqueUserIds.size;

    // Error counts
    const { count: totalErrors } = await supabase
      .from("user_activity_log")
      .select("*", { count: "exact", head: true })
      .not("error_message", "is", null);

    const { count: errors24h } = await supabase
      .from("user_activity_log")
      .select("*", { count: "exact", head: true })
      .not("error_message", "is", null)
      .gte("created_at", last24h.toISOString());

    // Action breakdown
    const { data: actionData } = await supabase
      .from("user_activity_log")
      .select("action") as { data: Array<{ action: string }> | null };
    
    const actionCounts: Record<string, number> = {};
    (actionData || []).forEach(item => {
      actionCounts[item.action] = (actionCounts[item.action] || 0) + 1;
    });

    return NextResponse.json({
      logs: logs || [],
      errors: errors || [],
      stats: {
        totalLogs: totalLogs || 0,
        logs24h: logs24h || 0,
        logs7d: logs7d || 0,
        logs30d: logs30d || 0,
        uniqueUsers,
        totalErrors: totalErrors || 0,
        errors24h: errors24h || 0,
        actionCounts,
      },
    });
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
