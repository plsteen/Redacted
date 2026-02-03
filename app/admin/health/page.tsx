"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface HealthMetric {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  message?: string;
  lastCheck: string;
}

interface SystemStats {
  database: HealthMetric;
  storage: HealthMetric;
  realtime: HealthMetric;
  stripe: HealthMetric;
  errorRate: number;
  activeConnections: number;
  avgResponseTime: number;
  uptime: number;
}

interface RecentError {
  id: string;
  action: string;
  error_message: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

function SystemHealthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");

  const [health, setHealth] = useState<SystemStats | null>(null);
  const [errors, setErrors] = useState<RecentError[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/health?auth=${authParam}`);
      const data = await res.json();
      setHealth(data.health);
      setErrors(data.recentErrors || []);
    } catch (error) {
      console.error("Failed to fetch health:", error);
    } finally {
      setLoading(false);
    }
  }, [authParam]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchHealth();
  }, [authParam, router, fetchHealth]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-amber-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-stone-500";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/10 border-green-500/30";
      case "degraded":
        return "bg-amber-500/10 border-amber-500/30";
      case "down":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-stone-500/10 border-stone-500/30";
    }
  };

  if (authParam !== "redacted2026") return null;

  return (
    <AdminLayout title="System Health">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-stone-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (30s)
            </label>
          </div>
          <button
            onClick={fetchHealth}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition"
          >
            🔄 Refresh Now
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-400">Checking system health...</div>
        ) : health ? (
          <>
            {/* Service Status */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[health.database, health.storage, health.realtime, health.stripe].map((metric) => (
                <div
                  key={metric.name}
                  className={`border rounded-lg p-4 ${getStatusBg(metric.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{metric.name}</span>
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(metric.status)}`} />
                  </div>
                  <p className="text-sm text-stone-400">
                    {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                  </p>
                  {metric.latency !== undefined && (
                    <p className="text-xs text-stone-500 mt-1">{metric.latency}ms latency</p>
                  )}
                  {metric.message && (
                    <p className="text-xs text-stone-500 mt-1">{metric.message}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">
                  {health.errorRate.toFixed(2)}%
                </p>
                <p className="text-sm text-stone-400">Error Rate (24h)</p>
              </div>
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">
                  {health.activeConnections}
                </p>
                <p className="text-sm text-stone-400">Active Connections</p>
              </div>
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">
                  {health.avgResponseTime}ms
                </p>
                <p className="text-sm text-stone-400">Avg Response Time</p>
              </div>
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-400">
                  {health.uptime.toFixed(2)}%
                </p>
                <p className="text-sm text-stone-400">Uptime (30d)</p>
              </div>
            </div>

            {/* Recent Errors */}
            <div className="bg-stone-800 border border-stone-700 rounded-lg">
              <div className="p-4 border-b border-stone-700">
                <h3 className="font-semibold text-white">Recent Errors</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {errors.length === 0 ? (
                  <div className="p-8 text-center text-stone-500">
                    No errors in the last 24 hours 🎉
                  </div>
                ) : (
                  <div className="divide-y divide-stone-700">
                    {errors.map((error) => (
                      <div key={error.id} className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-red-400">
                            {error.action}
                          </span>
                          <span className="text-xs text-stone-500">
                            {new Date(error.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-stone-300">{error.error_message}</p>
                        {error.metadata && (
                          <pre className="mt-2 text-xs text-stone-500 bg-stone-900 p-2 rounded overflow-x-auto">
                            {JSON.stringify(error.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-red-400">Failed to load system health</div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function SystemHealthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Loading...</div>}>
      <SystemHealthContent />
    </Suspense>
  );
}
