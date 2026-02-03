"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface ActiveUser {
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
}

interface RecentGame {
  id: string;
  case_id: string;
  player_name: string;
  total_time_seconds: number;
  hints_used: number;
  tasks_completed: number;
  rating: number | null;
  completed_at: string;
}

interface Stats {
  activeNow: number;
  activeLast15min: number;
  activeLast24h: number;
  activeLast7d: number;
  activeLast30d: number;
  totalRegistered: number;
  pageDistribution: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
}

function ActivityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  
  const [stats, setStats] = useState<Stats>({
    activeNow: 0,
    activeLast15min: 0,
    activeLast24h: 0,
    activeLast7d: 0,
    activeLast30d: 0,
    totalRegistered: 0,
    pageDistribution: {},
    deviceBreakdown: {},
    browserBreakdown: {},
  });
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/activity?auth=${authParam}`);
      const data = await res.json();
      
      setStats(data.stats || {});
      setActiveUsers(data.activeUsers || []);
      setRecentGames(data.recentGames || []);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoading(false);
    }
  }, [authParam]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchData();
  }, [authParam, router, fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || authParam !== "redacted2026") return;
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, authParam, fetchData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatLastSeen = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    
    if (mins === 0) return `${secs}s ago`;
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const getStatusColor = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 60000) return "bg-green-500"; // Active < 1 min
    if (diff < 300000) return "bg-yellow-500"; // Active < 5 min
    return "bg-stone-500"; // Idle
  };

  const getDeviceIcon = (device: string) => {
    if (device === "mobile") return "📱";
    if (device === "tablet") return "📱";
    return "💻";
  };

  if (authParam !== "redacted2026") {
    return null;
  }

  return (
    <AdminLayout title="User Activity">
      {loading ? (
        <div className="text-center py-12 text-stone-400">Loading...</div>
      ) : (
        <>
          {/* Live indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-stone-500"}`} />
              <span className="text-stone-400 text-sm">
                {autoRefresh ? "Live • Auto-refreshing every 30s" : "Paused"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition ${
                  autoRefresh 
                    ? "bg-stone-700 text-stone-300 hover:bg-stone-600" 
                    : "bg-green-600 text-white hover:bg-green-500"
                }`}
              >
                {autoRefresh ? "Pause" : "Resume"}
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm cursor-pointer transition"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* User Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Active Now</p>
              <p className="text-3xl font-bold text-green-400">{stats.activeNow}</p>
              <p className="text-xs text-stone-500 mt-1">Last 5 minutes</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Recent</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.activeLast15min}</p>
              <p className="text-xs text-stone-500 mt-1">Last 15 minutes</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Today</p>
              <p className="text-3xl font-bold text-blue-400">{stats.activeLast24h}</p>
              <p className="text-xs text-stone-500 mt-1">Last 24 hours</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">This Week</p>
              <p className="text-3xl font-bold text-purple-400">{stats.activeLast7d}</p>
              <p className="text-xs text-stone-500 mt-1">Last 7 days</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">This Month</p>
              <p className="text-3xl font-bold text-amber-400">{stats.activeLast30d}</p>
              <p className="text-xs text-stone-500 mt-1">Last 30 days</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Registered</p>
              <p className="text-3xl font-bold">{stats.totalRegistered}</p>
              <p className="text-xs text-stone-500 mt-1">All time</p>
            </div>
          </div>

          {/* Device & Browser breakdown */}
          <div className="bg-stone-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Devices & Browsers (24h)</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-stone-400 text-xs uppercase tracking-wide mb-3">Devices</p>
                <div className="space-y-2">
                  {Object.entries(stats.deviceBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between">
                        <span className="text-stone-300 capitalize">
                          {device === "desktop" ? "💻" : device === "mobile" ? "📱" : "📱"} {device}
                        </span>
                        <span className="text-stone-400">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-stone-400 text-xs uppercase tracking-wide mb-3">Browsers</p>
                <div className="space-y-2">
                  {Object.entries(stats.browserBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([browser, count]) => (
                      <div key={browser} className="flex items-center justify-between">
                        <span className="text-stone-300">{browser}</span>
                        <span className="text-stone-400">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Users List */}
          <div className="bg-stone-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Active Users ({activeUsers.length})
            </h2>
            {activeUsers.length === 0 ? (
              <p className="text-stone-500 text-sm text-center py-8">No active users right now</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-stone-400 border-b border-stone-700">
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Session</th>
                      <th className="pb-3 pr-4">Location</th>
                      <th className="pb-3 pr-4">Case</th>
                      <th className="pb-3 pr-4">Device</th>
                      <th className="pb-3 pr-4">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((user) => (
                      <tr key={user.sessionId} className="border-b border-stone-700/50">
                        <td className="py-3 pr-4">
                          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(user.lastSeen)}`} />
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs text-stone-400">
                            {user.sessionId.slice(0, 8)}...
                          </span>
                          {user.userId && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-600/30 text-blue-400 rounded text-xs">
                              logged in
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-white">{user.currentStep || "Unknown"}</span>
                        </td>
                        <td className="py-3 pr-4">
                          {user.caseId ? (
                            <span className="px-2 py-0.5 bg-amber-600/30 text-amber-400 rounded text-xs">
                              {user.caseId}
                            </span>
                          ) : (
                            <span className="text-stone-500">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-stone-300">
                            {getDeviceIcon(user.device)} {user.browser}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-stone-400">{formatLastSeen(user.lastSeen)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Games */}
          <div className="bg-stone-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Game Sessions</h2>
            {recentGames.length === 0 ? (
              <p className="text-stone-500 text-sm text-center py-8">No game sessions yet</p>
            ) : (
              <div className="space-y-3">
                {recentGames.map((game) => (
                  <div key={game.id} className="bg-stone-900 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{game.player_name}</span>
                      <span className="text-stone-400 mx-2">•</span>
                      <span className="text-amber-400">{game.case_id}</span>
                      <div className="text-xs text-stone-500 mt-1">
                        {formatTime(game.total_time_seconds)} • {game.tasks_completed}/7 tasks • {game.hints_used} hints
                      </div>
                    </div>
                    <div className="text-right">
                      {game.rating && (
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= game.rating! ? "text-amber-400" : "text-stone-600"}>★</span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-stone-500 mt-1">
                        {new Date(game.completed_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export default function AdminActivityPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <ActivityContent />
    </Suspense>
  );
}
