"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface ActivityLog {
  id: string;
  user_id: string | null;
  session_id: string;
  action: string;
  page_url: string;
  referrer: string;
  user_agent: string;
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  device_type: string;
  screen_width: number;
  screen_height: number;
  ip_address: string;
  metadata: Record<string, unknown>;
  error_message: string | null;
  error_stack: string | null;
  created_at: string;
}

interface Stats {
  totalLogs: number;
  logs24h: number;
  logs7d: number;
  logs30d: number;
  uniqueUsers: number;
  totalErrors: number;
  errors24h: number;
  actionCounts: Record<string, number>;
}

function LogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLogs: 0, logs24h: 0, logs7d: 0, logs30d: 0,
    uniqueUsers: 0, totalErrors: 0, errors24h: 0, actionCounts: {}
  });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ auth: authParam || "" });
      if (showErrorsOnly) params.set("hasError", "true");
      if (timeRange !== "all") params.set("timeRange", timeRange);
      
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      
      setLogs(data.logs || []);
      setStats(data.stats || {
        totalLogs: 0, logs24h: 0, logs7d: 0, logs30d: 0,
        uniqueUsers: 0, totalErrors: 0, errors24h: 0, actionCounts: {}
      });
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  }, [authParam, showErrorsOnly, timeRange]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchLogs();
  }, [authParam, router, fetchLogs]);

  // Escape key handler for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedLog) {
        setSelectedLog(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedLog]);

  const filteredLogs = actionFilter === "all" 
    ? logs 
    : logs.filter(log => log.action === actionFilter);

  const uniqueActions = Object.keys(stats.actionCounts).sort((a, b) => 
    (stats.actionCounts[b] || 0) - (stats.actionCounts[a] || 0)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("no-NO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes("error")) return "text-red-400";
    if (action.includes("login") || action.includes("signup")) return "text-green-400";
    if (action.includes("purchase") || action.includes("redeem")) return "text-purple-400";
    if (action.includes("game") || action.includes("play")) return "text-blue-400";
    return "text-stone-300";
  };

  if (authParam !== "redacted2026") {
    return null;
  }

  return (
    <AdminLayout title="Event Log">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-stone-800 rounded-lg p-4">
          <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Events (24h)</p>
          <p className="text-3xl font-bold text-blue-400">{stats.logs24h}</p>
        </div>
        <div className="bg-stone-800 rounded-lg p-4">
          <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Events (7 days)</p>
          <p className="text-3xl font-bold text-amber-400">{stats.logs7d}</p>
        </div>
        <div className="bg-stone-800 rounded-lg p-4">
          <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Errors (24h)</p>
          <p className={`text-3xl font-bold ${stats.errors24h > 0 ? "text-red-400" : "text-stone-400"}`}>{stats.errors24h}</p>
        </div>
        <div className="bg-stone-800 rounded-lg p-4">
          <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Total Events</p>
          <p className="text-3xl font-bold">{stats.totalLogs}</p>
          <p className="text-xs text-red-400 mt-1">{stats.totalErrors} errors total</p>
        </div>
      </div>

      {/* Action Breakdown */}
      {Object.keys(stats.actionCounts).length > 0 && (
        <div className="bg-stone-800 rounded-lg p-4 mb-6">
          <p className="text-stone-400 text-xs uppercase tracking-wide mb-3">Event Types</p>
          <div className="flex flex-wrap gap-2">
            {uniqueActions.map(action => (
              <button
                key={action}
                onClick={() => setActionFilter(actionFilter === action ? "all" : action)}
                className={`px-3 py-1 rounded-full text-xs transition cursor-pointer ${
                  actionFilter === action 
                    ? "bg-amber-600 text-white" 
                    : "bg-stone-700 text-stone-300 hover:bg-stone-600"
                }`}
              >
                {action} <span className="opacity-60">({stats.actionCounts[action]})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg cursor-pointer"
        >
          <option value="all">All time</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showErrorsOnly}
            onChange={(e) => setShowErrorsOnly(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-stone-300">Errors only</span>
        </label>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg cursor-pointer transition"
        >
          🔄 Refresh
        </button>
        {actionFilter !== "all" && (
          <button
            onClick={() => setActionFilter("all")}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg cursor-pointer transition"
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-stone-400">Loading...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-stone-800 rounded-lg p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-stone-400">No logs found</p>
          <p className="text-stone-500 text-sm mt-2">
            Logs are generated when users interact with the site
          </p>
        </div>
      ) : (
        <div className="bg-stone-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-700">
              <tr>
                <th className="text-left p-3 text-stone-300">Time</th>
                <th className="text-left p-3 text-stone-300">Action</th>
                <th className="text-left p-3 text-stone-300">User</th>
                <th className="text-left p-3 text-stone-300">Device</th>
                <th className="text-left p-3 text-stone-300">Browser</th>
                <th className="text-left p-3 text-stone-300">Status</th>
                <th className="text-right p-3 text-stone-300"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="border-t border-stone-700 hover:bg-stone-750 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="p-3 text-stone-400 font-mono text-xs">
                    {formatDate(log.created_at)}
                  </td>
                  <td className={`p-3 font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </td>
                  <td className="p-3 text-stone-300">
                    {log.user_id ? log.user_id.slice(0, 8) + "..." : "Anonymous"}
                  </td>
                  <td className="p-3 text-stone-400">
                    <span className="capitalize">{log.device_type || "?"}</span>
                    {log.screen_width && (
                      <span className="text-stone-500 text-xs ml-1">
                        {log.screen_width}×{log.screen_height}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-stone-400">
                    {log.browser_name} {log.browser_version}
                    <span className="text-stone-500 text-xs block">{log.os_name} {log.os_version}</span>
                  </td>
                  <td className="p-3">
                    {log.error_message ? (
                      <span className="text-red-400 text-xs" title={log.error_message}>
                        ⚠️ Error
                      </span>
                    ) : (
                      <span className="text-green-400">✓</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="text-amber-400 hover:text-amber-300 text-xs cursor-pointer"
                    >
                      Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-stone-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold">Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-sm">
              {/* Basic Info */}
              <div className="bg-stone-900 rounded-lg p-4">
                <h3 className="text-amber-400 mb-2 font-sans font-semibold">Basic Info</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-stone-500">ID:</span> {selectedLog.id}</div>
                  <div><span className="text-stone-500">Time:</span> {new Date(selectedLog.created_at).toISOString()}</div>
                  <div><span className="text-stone-500">Action:</span> <span className={getActionColor(selectedLog.action)}>{selectedLog.action}</span></div>
                  <div><span className="text-stone-500">User:</span> {selectedLog.user_id || "Anonymous"}</div>
                  <div><span className="text-stone-500">Session:</span> {selectedLog.session_id || "-"}</div>
                  <div><span className="text-stone-500">IP:</span> {selectedLog.ip_address || "-"}</div>
                </div>
              </div>

              {/* Page Info */}
              <div className="bg-stone-900 rounded-lg p-4">
                <h3 className="text-amber-400 mb-2 font-sans font-semibold">Page</h3>
                <div><span className="text-stone-500">URL:</span> {selectedLog.page_url || "-"}</div>
                <div><span className="text-stone-500">Referrer:</span> {selectedLog.referrer || "-"}</div>
              </div>

              {/* Device Info */}
              <div className="bg-stone-900 rounded-lg p-4">
                <h3 className="text-amber-400 mb-2 font-sans font-semibold">Device</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-stone-500">Type:</span> {selectedLog.device_type}</div>
                  <div><span className="text-stone-500">Screen:</span> {selectedLog.screen_width}×{selectedLog.screen_height}</div>
                  <div><span className="text-stone-500">Browser:</span> {selectedLog.browser_name} {selectedLog.browser_version}</div>
                  <div><span className="text-stone-500">OS:</span> {selectedLog.os_name} {selectedLog.os_version}</div>
                </div>
                <div className="mt-2 text-xs text-stone-500 break-all">
                  <span className="text-stone-600">User-Agent:</span> {selectedLog.user_agent}
                </div>
              </div>

              {/* Metadata */}
              {Object.keys(selectedLog.metadata || {}).length > 0 && (
                <div className="bg-stone-900 rounded-lg p-4">
                  <h3 className="text-amber-400 mb-2 font-sans font-semibold">Metadata</h3>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Info */}
              {selectedLog.error_message && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-red-400 mb-2 font-sans font-semibold">Error</h3>
                  <div className="text-red-300">{selectedLog.error_message}</div>
                  {selectedLog.error_stack && (
                    <pre className="mt-2 text-xs text-red-400/70 overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.error_stack}
                    </pre>
                  )}
                </div>
              )}

              {/* Copy for AI */}
              <div className="mt-4 pt-4 border-t border-stone-700">
                <button
                  onClick={() => {
                    const text = JSON.stringify(selectedLog, null, 2);
                    navigator.clipboard.writeText(text);
                    alert("Copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm cursor-pointer transition"
                >
                  📋 Copy JSON (for debugging)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminLogsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <LogsContent />
    </Suspense>
  );
}
