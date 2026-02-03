"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface CaseStats {
  caseCode: string;
  caseTitle: string;
  totalPlays: number;
  completedPlays: number;
  avgScore: number;
  avgTimeSeconds: number;
  avgRating: number;
  completionRate: number;
  taskFailures: Array<{ taskIdx: number; failures: number }>;
  recentSessions: Array<{
    playerName: string;
    completedAt: string;
    score: number;
    rating?: number;
  }>;
}

function CaseAnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  const [authenticated, setAuthenticated] = useState(false);
  const [caseStats, setCaseStats] = useState<CaseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  useEffect(() => {
    if (authParam === "redacted2026") {
      setAuthenticated(true);
    }
  }, [authParam]);

  useEffect(() => {
    if (authenticated) {
      fetchCaseAnalytics();
    }
  }, [authenticated]);

  async function fetchCaseAnalytics() {
    try {
      const supabase = getSupabaseBrowserClient();

      // Fetch all session analytics
      const { data: sessions } = await supabase
        .from("session_analytics")
        .select("*")
        .order("completed_at", { ascending: false }) as {
        data: Array<{
          mystery_title?: string;
          mystery_id?: string;
          player_name?: string;
          completed_at: string;
          score: number;
          rating?: number;
          total_time_seconds: number;
          tasks_completed: number;
        }> | null;
      };

      if (!sessions || sessions.length === 0) {
        setCaseStats([]);
        setLoading(false);
        return;
      }

      // Group by case
      const caseMap = new Map<string, {
        title: string;
        plays: number;
        completions: number;
        totalScore: number;
        totalTime: number;
        totalRating: number;
        ratingCount: number;
        recentSessions: Array<{ playerName: string; completedAt: string; score: number; rating?: number }>;
      }>();

      sessions.forEach((session) => {
        const caseCode = session.mystery_id || "unknown";
        const caseTitle = session.mystery_title || caseCode;

        if (!caseMap.has(caseCode)) {
          caseMap.set(caseCode, {
            title: caseTitle,
            plays: 0,
            completions: 0,
            totalScore: 0,
            totalTime: 0,
            totalRating: 0,
            ratingCount: 0,
            recentSessions: [],
          });
        }

        const caseData = caseMap.get(caseCode)!;
        caseData.plays++;
        caseData.totalScore += session.score;
        caseData.totalTime += session.total_time_seconds;

        if (session.tasks_completed >= 7) {
          caseData.completions++;
        }

        if (session.rating) {
          caseData.totalRating += session.rating;
          caseData.ratingCount++;
        }

        // Keep last 5 sessions
        if (caseData.recentSessions.length < 5) {
          caseData.recentSessions.push({
            playerName: session.player_name || "Anonymous",
            completedAt: session.completed_at,
            score: session.score,
            rating: session.rating,
          });
        }
      });

      // Convert to array
      const statsArray: CaseStats[] = Array.from(caseMap.entries()).map(([code, data]) => ({
        caseCode: code,
        caseTitle: data.title,
        totalPlays: data.plays,
        completedPlays: data.completions,
        avgScore: Math.round(data.totalScore / data.plays),
        avgTimeSeconds: Math.floor(data.totalTime / data.plays),
        avgRating: data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0,
        completionRate: Math.round((data.completions / data.plays) * 100),
        taskFailures: [], // TODO: Calculate from session_progress table
        recentSessions: data.recentSessions,
      }));

      // Sort by total plays
      statsArray.sort((a, b) => b.totalPlays - a.totalPlays);

      setCaseStats(statsArray);
    } catch (error) {
      console.error("Failed to fetch case analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("no-NO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-amber-600 rounded cursor-pointer"
          >
            Go to Admin Login
          </button>
        </div>
      </main>
    );
  }

  const selectedCaseData = selectedCase ? caseStats.find(c => c.caseCode === selectedCase) : null;

  return (
    <AdminLayout title="Case Analytics">
      {loading ? (
        <div className="text-center py-12 text-stone-400">Loading case analytics...</div>
      ) : caseStats.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          No case analytics available yet. Players need to complete games first.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Case Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {caseStats.map((caseData) => (
              <div
                key={caseData.caseCode}
                onClick={() => setSelectedCase(selectedCase === caseData.caseCode ? null : caseData.caseCode)}
                className={`bg-stone-800 border rounded-lg p-6 cursor-pointer transition ${
                  selectedCase === caseData.caseCode
                    ? "border-amber-500 ring-2 ring-amber-500/20"
                    : "border-stone-700 hover:border-stone-600"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-amber-400">{caseData.caseTitle}</h3>
                    <p className="text-xs text-stone-500">{caseData.caseCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{caseData.totalPlays}</p>
                    <p className="text-xs text-stone-500">plays</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Completion Rate:</span>
                    <span className={`font-semibold ${caseData.completionRate >= 60 ? "text-green-400" : "text-yellow-400"}`}>
                      {caseData.completionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Avg Score:</span>
                    <span className="font-semibold">{caseData.avgScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Avg Time:</span>
                    <span className="font-semibold">{formatTime(caseData.avgTimeSeconds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Avg Rating:</span>
                    <span className="font-semibold text-amber-400">
                      {caseData.avgRating > 0 ? `${caseData.avgRating.toFixed(1)} ★` : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-stone-700">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{caseData.completedPlays} completed</span>
                    <span>Click for details →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed View */}
          {selectedCaseData && (
            <div className="bg-stone-800 border border-amber-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {selectedCaseData.caseTitle} — Detailed Analytics
                </h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-sm text-stone-400 hover:text-white cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-stone-900 rounded p-4">
                  <p className="text-xs text-stone-500 mb-1">Total Plays</p>
                  <p className="text-3xl font-bold">{selectedCaseData.totalPlays}</p>
                </div>
                <div className="bg-stone-900 rounded p-4">
                  <p className="text-xs text-stone-500 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-400">{selectedCaseData.completedPlays}</p>
                  <p className="text-xs text-stone-600">{selectedCaseData.completionRate}% rate</p>
                </div>
                <div className="bg-stone-900 rounded p-4">
                  <p className="text-xs text-stone-500 mb-1">Avg Score</p>
                  <p className="text-3xl font-bold text-blue-400">{selectedCaseData.avgScore}</p>
                  <p className="text-xs text-stone-600">out of 100</p>
                </div>
                <div className="bg-stone-900 rounded p-4">
                  <p className="text-xs text-stone-500 mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold text-amber-400">
                    {selectedCaseData.avgRating > 0 ? selectedCaseData.avgRating.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-stone-600">★ stars</p>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-stone-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-4 text-stone-400 uppercase tracking-wide">
                  Recent Sessions
                </h3>
                {selectedCaseData.recentSessions.length === 0 ? (
                  <p className="text-stone-600 text-sm">No sessions yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCaseData.recentSessions.map((session, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-stone-800 rounded p-3 text-sm"
                      >
                        <div>
                          <span className="font-medium">{session.playerName}</span>
                          <p className="text-xs text-stone-500">{formatDate(session.completedAt)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-blue-400 font-semibold">{session.score} pts</span>
                          {session.rating && (
                            <span className="text-amber-400">{session.rating} ★</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default function CaseAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <CaseAnalyticsContent />
    </Suspense>
  );
}
