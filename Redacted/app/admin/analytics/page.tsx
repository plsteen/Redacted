"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { AdminLayout } from "@/components/Admin/AdminLayout";

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface p-6">Loading...</div>}>
      <AdminAnalyticsContent />
    </Suspense>
  );
}

interface SessionAnalytics {
  id: string;
  case_id: string;
  player_name: string;
  total_time_seconds: number;
  hints_used: number;
  tasks_completed: number;
  rating: number | null;
  comment: string | null;
  completed_at: string;
}

interface TaskCompletion {
  id: string;
  session_id: string;
  case_id: string;
  task_idx: number;
  time_spent_seconds: number;
  hints_used: number;
  attempts: number;
  completed_at: string;
}

interface Purchase {
  id: string;
  user_id: string;
  mystery_id: string;
  amount: number;
  currency: string;
  status: string;
  purchased_at: string;
}

function AdminAnalyticsContent() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionAnalytics[]>([]);
  const [taskData, setTaskData] = useState<TaskCompletion[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("all");

  const ADMIN_PASSWORD = "redacted2026";

  const fetchData = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Fetch session analytics
      const { data: sessionData, error: sessionError } = await supabase
        .from("session_analytics")
        .select("*")
        .order("completed_at", { ascending: false });

      if (sessionError) throw sessionError;

      // Fetch task completion logs
      const { data: taskDataRes, error: taskError } = await supabase
        .from("task_completion_log")
        .select("*")
        .order("completed_at", { ascending: false });

      if (taskError) throw taskError;

      // Fetch purchases
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .select("*")
        .order("purchased_at", { ascending: false });

      if (purchaseError) console.error("Purchase error:", purchaseError);

      setSessions((sessionData as unknown as SessionAnalytics[]) || []);
      setTaskData((taskDataRes as unknown as TaskCompletion[]) || []);
      setPurchases((purchaseData as unknown as Purchase[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const authParam = searchParams?.get("auth");
    if (authParam === ADMIN_PASSWORD) {
      setAuthenticated(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
  }, [authenticated, fetchData]);

  // Escape key handler for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedSession) {
        setSelectedSession(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("no-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Time filtering
  const now = new Date();
  const getFilterDate = () => {
    if (timeFilter === "24h") return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (timeFilter === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (timeFilter === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return null;
  };

  const filterDate = getFilterDate();
  const filteredSessions = filterDate 
    ? sessions.filter(s => new Date(s.completed_at) >= filterDate)
    : sessions;
  const filteredPurchases = filterDate
    ? purchases.filter(p => new Date(p.purchased_at) >= filterDate)
    : purchases;

  // Calculate statistics
  const totalSessions = filteredSessions.length;
  const avgTime = totalSessions > 0
    ? Math.floor(filteredSessions.reduce((sum, s) => sum + s.total_time_seconds, 0) / totalSessions)
    : 0;
  const avgRating = filteredSessions.filter(s => s.rating).length > 0
    ? (filteredSessions.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / filteredSessions.filter(s => s.rating).length).toFixed(1)
    : "N/A";
  const completionRate = totalSessions > 0
    ? Math.round((filteredSessions.filter(s => s.tasks_completed >= 7).length / totalSessions) * 100)
    : 0;
  const totalHints = filteredSessions.reduce((sum, s) => sum + s.hints_used, 0);
  const avgHints = totalSessions > 0 ? (totalHints / totalSessions).toFixed(1) : "0";

  // Revenue stats
  const totalRevenue = filteredPurchases
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPurchases = filteredPurchases.filter(p => p.status === "completed").length;

  // Task-level statistics
  const taskStats = [0, 1, 2, 3, 4, 5, 6].map(idx => {
    const tasksForIdx = taskData.filter(t => t.task_idx === idx);
    const avgTime = tasksForIdx.length > 0
      ? Math.floor(tasksForIdx.reduce((sum, t) => sum + t.time_spent_seconds, 0) / tasksForIdx.length)
      : 0;
    const avgHints = tasksForIdx.length > 0
      ? (tasksForIdx.reduce((sum, t) => sum + t.hints_used, 0) / tasksForIdx.length).toFixed(1)
      : "0";
    const avgAttempts = tasksForIdx.length > 0
      ? (tasksForIdx.reduce((sum, t) => sum + t.attempts, 0) / tasksForIdx.length).toFixed(1)
      : "0";
    return { idx, count: tasksForIdx.length, avgTime, avgHints, avgAttempts };
  });

  // Rating distribution
  const ratingCounts = [1, 2, 3, 4, 5].map(r => 
    filteredSessions.filter(s => s.rating === r).length
  );

  // Session details
  const selectedSessionTasks = selectedSession
    ? taskData.filter(t => t.session_id === selectedSession).sort((a, b) => a.task_idx - b.task_idx)
    : [];

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="glass-panel p-8 max-w-md w-full">
          <h1 className="text-2xl font-serif text-white mb-6 text-center">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && password === ADMIN_PASSWORD) {
                setAuthenticated(true);
              }
            }}
            placeholder="Enter admin password"
            className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-white focus:border-[var(--color-gold)]/50 focus:outline-none mb-4"
            autoFocus
          />
          <button
            onClick={() => {
              if (password === ADMIN_PASSWORD) {
                setAuthenticated(true);
              } else {
                alert("Incorrect password");
              }
            }}
            className="w-full rounded-lg bg-[var(--color-gold)] text-black py-3 font-semibold hover:bg-[var(--color-gold)]/90 transition cursor-pointer"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Spillstatistikk">
      {loading ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-[var(--color-muted)]">Laster statistikk...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-red-400">Feil: {error}</p>
        </div>
      ) : (
        <>
          {/* Time Filter */}
          <div className="flex gap-2 mb-6">
            {["all", "24h", "7d", "30d"].map(filter => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm transition cursor-pointer ${
                  timeFilter === filter
                    ? "bg-amber-600 text-white"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              >
                {filter === "all" ? "Alle" : filter === "24h" ? "24 timer" : filter === "7d" ? "7 dager" : "30 dager"}
              </button>
            ))}
          </div>

          {/* Overview Stats - Two rows */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Spill gjennomført</p>
              <p className="text-3xl font-bold text-amber-400">{totalSessions}</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Gj.snitt tid</p>
              <p className="text-3xl font-bold text-blue-400">{formatTime(avgTime)}</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Fullføringsrate</p>
              <p className="text-3xl font-bold text-green-400">{completionRate}%</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Gj.snitt rating</p>
              <p className="text-3xl font-bold text-purple-400">{avgRating} ★</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Gj.snitt hints</p>
              <p className="text-3xl font-bold">{avgHints}</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Totale hints</p>
              <p className="text-3xl font-bold">{totalHints}</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Kjøp</p>
              <p className="text-3xl font-bold text-green-400">{totalPurchases}</p>
            </div>
            <div className="bg-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Omsetning</p>
              <p className="text-3xl font-bold text-green-400">{totalRevenue} kr</p>
            </div>
          </div>

          {/* Rating Distribution */}
          {filteredSessions.filter(s => s.rating).length > 0 && (
            <div className="bg-stone-800 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Ratingfordeling</h2>
              <div className="flex items-end gap-2 h-24">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingCounts[star - 1];
                  const maxCount = Math.max(...ratingCounts);
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={star} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-amber-600 rounded-t"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-xs text-stone-400">{star}★</span>
                      <span className="text-xs text-stone-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task Difficulty Analysis */}
          <div className="bg-stone-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-2">Oppgaveanalyse</h2>
            <p className="text-xs text-stone-400 mb-4">Gj.snitt tid, hints og forsøk per oppgave</p>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
              {taskStats.map(stat => (
                <div key={stat.idx} className="bg-stone-900 rounded-lg p-3 text-center">
                  <p className="text-amber-400 font-semibold mb-2">
                    Oppgave {stat.idx + 1}
                  </p>
                  <p className="text-sm text-white mb-1">{formatTime(stat.avgTime)}</p>
                  <p className="text-xs text-stone-400">{stat.avgHints} hints</p>
                  <p className="text-xs text-stone-400">{stat.avgAttempts} forsøk</p>
                  <p className="text-xs text-stone-500 mt-2">{stat.count} spill</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions List */}
          <div className="bg-stone-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Siste spilløkter</h2>
            {filteredSessions.length === 0 ? (
              <p className="text-stone-400 text-center py-8">Ingen spilløkter registrert ennå</p>
            ) : (
              <div className="space-y-3">
                {filteredSessions.slice(0, 20).map(session => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session.id === selectedSession ? null : session.id)}
                    className="w-full bg-stone-900 rounded-lg p-4 hover:bg-stone-850 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <p className="text-white font-semibold">{session.player_name}</p>
                        {session.rating && (
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span
                                key={star}
                                className={star <= session.rating! ? "text-amber-400" : "text-stone-600"}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                        {session.tasks_completed >= 7 && (
                          <span className="px-2 py-0.5 bg-green-600/30 text-green-400 rounded text-xs">
                            Fullført
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400">
                        {formatDate(session.completed_at)}
                      </p>
                    </div>
                    <div className="flex gap-4 text-xs text-stone-400">
                      <span>⏱ {formatTime(session.total_time_seconds)}</span>
                      <span>💡 {session.hints_used} hints</span>
                      <span>✓ {session.tasks_completed}/7 oppgaver</span>
                    </div>
                    {session.comment && (
                      <p className="text-sm text-stone-400 italic mt-2 border-l-2 border-stone-600 pl-3">
                        &ldquo;{session.comment}&rdquo;
                      </p>
                    )}
                    
                    {/* Session Details (expanded) */}
                    {selectedSession === session.id && selectedSessionTasks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-stone-700">
                        <p className="text-xs text-amber-400 uppercase tracking-wide mb-3">
                          Oppgavedetaljer
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                          {selectedSessionTasks.map(task => (
                            <div key={task.id} className="bg-stone-800 rounded p-2 text-center">
                              <p className="text-xs text-white font-semibold mb-1">#{task.task_idx + 1}</p>
                              <p className="text-xs text-stone-300">{formatTime(task.time_spent_seconds)}</p>
                              {task.hints_used > 0 && (
                                <p className="text-xs text-amber-400">{task.hints_used} hint</p>
                              )}
                              {task.attempts > 1 && (
                                <p className="text-xs text-stone-500">{task.attempts} forsøk</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
