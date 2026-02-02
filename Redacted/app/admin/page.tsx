"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface DashboardStats {
  totalRevenue: number;
  totalPurchases: number;
  revenue24h: number;
  purchases24h: number;
  totalSessions: number;
  sessions24h: number;
  avgRating: number;
  avgTime: number;
  completionRate: number;
  totalErrors: number;
  errors24h: number;
  recentFeedback: { player_name?: string; rating?: number; comment?: string; completed_at: string }[];
  recentPurchases: { mystery_id: string; amount?: number; purchased_at: string }[];
}

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authParam === "redacted2026") {
      setAuthenticated(true);
    }
  }, [authParam]);

  useEffect(() => {
    if (authenticated) {
      fetchDashboardStats();
    }
  }, [authenticated]);

  async function fetchDashboardStats() {
    try {
      const supabase = getSupabaseBrowserClient();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch purchases
      const { data: purchases } = await supabase
        .from("purchases")
        .select("*")
        .eq("status", "completed") as { data: Array<{ amount?: number; purchased_at: string; mystery_id: string }> | null };

      const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalPurchases = purchases?.length || 0;
      const purchases24h = purchases?.filter(p => new Date(p.purchased_at) >= new Date(yesterday)).length || 0;
      const revenue24h = purchases?.filter(p => new Date(p.purchased_at) >= new Date(yesterday)).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Fetch sessions
      const { data: sessions } = await supabase
        .from("session_analytics")
        .select("*")
        .order("completed_at", { ascending: false }) as { data: Array<{ completed_at: string; rating?: number; total_time_seconds: number; tasks_completed: number; player_name?: string; comment?: string; mystery_title?: string }> | null };

      const totalSessions = sessions?.length || 0;
      const sessions24h = sessions?.filter(s => new Date(s.completed_at) >= new Date(yesterday)).length || 0;
      const avgRating = sessions?.filter(s => s.rating).length 
        ? sessions.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.filter(s => s.rating).length 
        : 0;
      const avgTime = totalSessions && sessions
        ? Math.floor(sessions.reduce((sum, s) => sum + s.total_time_seconds, 0) / totalSessions)
        : 0;
      const completionRate = totalSessions && sessions
        ? Math.round((sessions.filter(s => s.tasks_completed >= 7).length / totalSessions) * 100)
        : 0;

      // Fetch errors
      const { data: logs } = await supabase
        .from("user_activity_log")
        .select("error_message, created_at")
        .not("error_message", "is", null) as { data: Array<{ error_message: string | null; created_at: string }> | null };

      const totalErrors = logs?.length || 0;
      const errors24h = logs?.filter(l => new Date(l.created_at) >= new Date(yesterday)).length || 0;

      // Recent feedback (last 5 with comments)
      const recentFeedback = sessions
        ?.filter(s => s.rating)
        .slice(0, 5)
        .map(s => ({
          player_name: s.player_name,
          rating: s.rating,
          comment: s.comment,
          completed_at: s.completed_at
        })) || [];

      // Recent purchases (last 5)
      const recentPurchases = purchases
        ?.sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime())
        .slice(0, 5)
        .map(p => ({
          mystery_id: p.mystery_id,
          amount: p.amount,
          purchased_at: p.purchased_at
        })) || [];

      setStats({
        totalRevenue,
        totalPurchases,
        revenue24h,
        purchases24h,
        totalSessions,
        sessions24h,
        avgRating,
        avgTime,
        completionRate,
        totalErrors,
        errors24h,
        recentFeedback,
        recentPurchases
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "redacted2026") {
      router.push("/admin?auth=redacted2026");
    } else {
      alert("Wrong password");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold mb-8 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 bg-stone-800 border border-stone-600 rounded-lg text-amber-100"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold cursor-pointer"
            >
              Log in
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="text-center py-12 text-stone-400">Loading stats...</div>
      ) : stats ? (
        <>
          {/* Key Metrics - Top Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Revenue (Total)</p>
              <p className="text-3xl font-bold text-green-400">{stats.totalRevenue} kr</p>
              {stats.revenue24h > 0 && (
                <p className="text-xs text-green-300 mt-1">+{stats.revenue24h} kr last 24h</p>
              )}
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Games Played</p>
              <p className="text-3xl font-bold text-blue-400">{stats.totalSessions}</p>
              {stats.sessions24h > 0 && (
                <p className="text-xs text-blue-300 mt-1">+{stats.sessions24h} last 24h</p>
              )}
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-amber-400">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"} ★
              </p>
              <p className="text-xs text-stone-500 mt-1">{stats.completionRate}% completion</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Errors</p>
              <p className={`text-3xl font-bold ${stats.errors24h > 0 ? "text-red-400" : "text-stone-400"}`}>
                {stats.totalErrors}
              </p>
              {stats.errors24h > 0 && (
                <p className="text-xs text-red-300 mt-1">{stats.errors24h} last 24h ⚠️</p>
              )}
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Purchases</p>
              <p className="text-2xl font-bold">{stats.totalPurchases}</p>
              {stats.purchases24h > 0 && (
                <p className="text-xs text-green-300 mt-1">+{stats.purchases24h} last 24h</p>
              )}
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Avg Play Time</p>
              <p className="text-2xl font-bold">{formatTime(stats.avgTime)}</p>
            </div>
          </div>

          {/* Trends & Insights */}
          <div className="bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📈</span> Trends & Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {stats.sessions24h > 0 && stats.sessions24h >= stats.totalSessions * 0.2 && (
                <div className="bg-stone-700/50 rounded p-3 border border-blue-500/30">
                  <p className="text-blue-300 font-medium">📊 High engagement</p>
                  <p className="text-stone-400 text-xs mt-1">{stats.sessions24h} games in last 24 hours ({Math.round(stats.sessions24h / stats.totalSessions * 100)}% of total)</p>
                </div>
              )}
              {stats.errors24h > 5 && (
                <div className="bg-stone-700/50 rounded p-3 border border-red-500/30">
                  <p className="text-red-300 font-medium">⚠️ Error spike</p>
                  <p className="text-stone-400 text-xs mt-1">{stats.errors24h} errors in last 24h. Check event log for details</p>
                </div>
              )}
              {stats.revenue24h > stats.totalRevenue * 0.15 && (
                <div className="bg-stone-700/50 rounded p-3 border border-green-500/30">
                  <p className="text-green-300 font-medium">💰 Strong sales</p>
                  <p className="text-stone-400 text-xs mt-1">{stats.revenue24h} kr revenue in last 24 hours ({Math.round(stats.revenue24h / stats.totalRevenue * 100)}% of total)</p>
                </div>
              )}
              {stats.completionRate < 60 && (
                <div className="bg-stone-700/50 rounded p-3 border border-yellow-500/30">
                  <p className="text-yellow-300 font-medium">🎮 Completion rate</p>
                  <p className="text-stone-400 text-xs mt-1">{stats.completionRate}% players completing all tasks. Check game difficulty</p>
                </div>
              )}
              {stats.avgRating >= 4.5 && (
                <div className="bg-stone-700/50 rounded p-3 border border-amber-500/30">
                  <p className="text-amber-300 font-medium">⭐ Excellent reviews</p>
                  <p className="text-stone-400 text-xs mt-1">Avg rating {stats.avgRating.toFixed(1)} stars. Players love it!</p>
                </div>
              )}
              {stats.totalSessions > 0 && (
                <div className="bg-stone-700/50 rounded p-3 border border-stone-600">
                  <p className="text-stone-300 font-medium">🎯 System health</p>
                  <p className="text-stone-400 text-xs mt-1">All systems operational. {Math.round(stats.completionRate)}% quality metric</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity - Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Feedback */}
            <div className="bg-stone-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Feedback</h2>
                <button
                  onClick={() => router.push(`/admin/feedback?auth=${authParam}`)}
                  className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  View all →
                </button>
              </div>
              {stats.recentFeedback.length === 0 ? (
                <p className="text-stone-500 text-sm">No feedback yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentFeedback.map((fb, i) => (
                    <div key={i} className="bg-stone-900 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{fb.player_name || "Anonymous"}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= (fb.rating || 0) ? "text-amber-400" : "text-stone-600"}>★</span>
                          ))}
                        </div>
                      </div>
                      {fb.comment && (
                        <p className="text-xs text-stone-400 italic">&ldquo;{fb.comment}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Purchases */}
            <div className="bg-stone-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Purchases</h2>
                <button
                  onClick={() => router.push(`/admin/purchases?auth=${authParam}`)}
                  className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  View all →
                </button>
              </div>
              {stats.recentPurchases.length === 0 ? (
                <p className="text-stone-500 text-sm">No purchases yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentPurchases.map((p, i) => (
                    <div key={i} className="bg-stone-900 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{p.mystery_id}</span>
                        <p className="text-xs text-stone-500">{formatDate(p.purchased_at)}</p>
                      </div>
                      <span className="text-green-400 font-semibold">{p.amount} kr</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <button
              onClick={() => router.push(`/admin/cases?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-blue-600 transition cursor-pointer"
            >
              <span className="text-2xl">🎯</span>
              <p className="text-sm mt-2">Cases</p>
            </button>
            <button
              onClick={() => router.push(`/admin/case-analytics?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-amber-600 transition cursor-pointer"
            >
              <span className="text-2xl">📈</span>
              <p className="text-sm mt-2">Case Analytics</p>
            </button>
            <button
              onClick={() => router.push(`/admin/sessions?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-green-600 transition cursor-pointer"
            >
              <span className="text-2xl">🎮</span>
              <p className="text-sm mt-2">Live Sessions</p>
            </button>
            <button
              onClick={() => router.push(`/admin/activity?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-green-600 transition cursor-pointer"
            >
              <span className="text-2xl">👥</span>
              <p className="text-sm mt-2">User Activity</p>
            </button>
            <button
              onClick={() => router.push(`/admin/messages?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-blue-600 transition cursor-pointer"
            >
              <span className="text-2xl">📨</span>
              <p className="text-sm mt-2">Messages</p>
            </button>
            <button
              onClick={() => router.push(`/admin/feedback?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-green-600 transition cursor-pointer"
            >
              <span className="text-2xl">💬</span>
              <p className="text-sm mt-2">Feedback</p>
            </button>
            <button
              onClick={() => router.push(`/admin/purchases?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-blue-600 transition cursor-pointer"
            >
              <span className="text-2xl">💰</span>
              <p className="text-sm mt-2">Purchases</p>
            </button>
            <button
              onClick={() => router.push(`/admin/codes?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-purple-600 transition cursor-pointer"
            >
              <span className="text-2xl">🎟️</span>
              <p className="text-sm mt-2">Access Codes</p>
            </button>
            <button
              onClick={() => router.push(`/admin/debug?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-purple-600 transition cursor-pointer"
            >
              <span className="text-2xl">🔧</span>
              <p className="text-sm mt-2">Debug Tools</p>
            </button>
            <button
              onClick={() => router.push(`/admin/logs?auth=${authParam}`)}
              className="bg-stone-800 border border-stone-700 rounded-lg p-4 text-center hover:border-orange-600 transition cursor-pointer"
            >
              <span className="text-2xl">📋</span>
              <p className="text-sm mt-2">Event Log</p>
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-red-400">Failed to load stats</div>
      )}
    </AdminLayout>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
