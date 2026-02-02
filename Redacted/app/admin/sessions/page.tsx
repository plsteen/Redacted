"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface ActiveSession {
  id: string;
  code: string;
  mystery_id: string;
  language: string;
  status: string;
  created_at: string;
  player_count: number;
  current_task: number | null;
  mystery_title?: string;
}

interface SessionEvent {
  id: string;
  session_id: string;
  event_type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

function SessionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "lobby" | "completed">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!authParam || authParam !== "redacted2026") return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/sessions?auth=${authParam}&filter=${filter}`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [authParam, filter]);

  const fetchSessionEvents = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/events?auth=${authParam}`);
      const data = await res.json();
      setSessionEvents(data.events || []);
    } catch (error) {
      console.error("Failed to fetch session events:", error);
    }
  }, [authParam]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchSessions();
  }, [authParam, router, fetchSessions]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh || authParam !== "redacted2026") return;
    const interval = setInterval(() => fetchSessions(), 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, authParam, fetchSessions]);

  // Fetch events when session is selected
  useEffect(() => {
    if (selectedSession) {
      fetchSessionEvents(selectedSession.id);
    }
  }, [selectedSession, fetchSessionEvents]);

  // Realtime subscription for selected session
  useEffect(() => {
    if (!selectedSession) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`admin-session-${selectedSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_progress",
          filter: `session_id=eq.${selectedSession.id}`,
        },
        (payload) => {
          setSessionEvents((prev) => [
            {
              id: crypto.randomUUID(),
              session_id: selectedSession.id,
              event_type: "progress_update",
              data: payload.new as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  const handleStopSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to stop this session? Players will be disconnected.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/stop?auth=${authParam}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to stop session");
      
      // Refresh list
      await fetchSessions();
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      alert("Session stopped");
    } catch (error) {
      console.error("Failed to stop session:", error);
      alert("Failed to stop session");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "lobby":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "abandoned":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-stone-500/20 text-stone-400 border-stone-500/30";
    }
  };

  // Calculate case distribution
  const caseDistribution = sessions.reduce((acc, session) => {
    const caseKey = session.mystery_title || session.code;
    acc[caseKey] = (acc[caseKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  if (authParam !== "redacted2026") return null;

  return (
    <AdminLayout title="Sessions Monitor">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(["all", "active", "lobby", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f
                    ? "bg-amber-600 text-black"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-stone-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchSessions}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-400">
              {sessions.filter((s) => s.status === "active").length}
            </p>
            <p className="text-sm text-stone-400">Active Sessions</p>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-400">
              {sessions.filter((s) => s.status === "lobby").length}
            </p>
            <p className="text-sm text-stone-400">In Lobby</p>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-400">
              {sessions.reduce((sum, s) => sum + s.player_count, 0)}
            </p>
            <p className="text-sm text-stone-400">Total Players</p>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{sessions.length}</p>
            <p className="text-sm text-stone-400">Sessions (24h)</p>
          </div>
        </div>

        {/* Cases Distribution */}
        {Object.keys(caseDistribution).length > 0 && (
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">📊 Where Players Are</h3>
            <div className="space-y-3">
              {Object.entries(caseDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([caseName, count]) => (
                  <div key={caseName} className="flex items-center justify-between">
                    <span className="text-stone-300 font-medium">{caseName}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 bg-amber-600 rounded-full" 
                        style={{ width: `${Math.max(20, count * 30)}px` }}
                      />
                      <span className="text-stone-400 text-sm w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions List */}
          <div className="bg-stone-800 border border-stone-700 rounded-lg">
            <div className="p-4 border-b border-stone-700">
              <h3 className="font-semibold text-white">Sessions</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-stone-400">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center text-stone-500">No sessions found</div>
              ) : (
                <div className="divide-y divide-stone-700">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left p-4 hover:bg-stone-700/50 transition ${
                        selectedSession?.id === session.id ? "bg-stone-700/50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-amber-400">{session.code}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(
                            session.status
                          )}`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-400">
                          {session.player_count} player{session.player_count !== 1 ? "s" : ""} •
                          Task {session.current_task || 0}
                        </span>
                        <span className="text-stone-500">{formatTime(session.created_at)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Session Detail */}
          <div className="bg-stone-800 border border-stone-700 rounded-lg">
            {selectedSession ? (
              <>
                <div className="p-4 border-b border-stone-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      Session: {selectedSession.code}
                    </h3>
                    <p className="text-sm text-stone-400">
                      Started {formatTime(selectedSession.created_at)}
                    </p>
                  </div>
                  {selectedSession.status === "active" && (
                    <button
                      onClick={() => handleStopSession(selectedSession.id)}
                      className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded text-sm hover:bg-red-600/30 transition"
                    >
                      🛑 Stop Session
                    </button>
                  )}
                </div>

                {/* Session Info */}
                <div className="p-4 border-b border-stone-700 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-stone-500">Status</p>
                    <p className="text-white">{selectedSession.status}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Language</p>
                    <p className="text-white">{selectedSession.language.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Players</p>
                    <p className="text-white">{selectedSession.player_count}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Current Task</p>
                    <p className="text-white">{selectedSession.current_task || "Not started"}</p>
                  </div>
                </div>

                {/* Event Stream */}
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-stone-300 mb-3">
                    Event Stream (Live)
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {sessionEvents.length === 0 ? (
                      <p className="text-stone-500 text-sm">No events yet</p>
                    ) : (
                      sessionEvents.slice(0, 50).map((event) => (
                        <div
                          key={event.id}
                          className="bg-stone-900 rounded p-2 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-amber-400">{event.event_type}</span>
                            <span className="text-stone-500">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="text-stone-400 whitespace-pre-wrap">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-stone-500">
                Select a session to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Loading...</div>}>
      <SessionsContent />
    </Suspense>
  );
}
