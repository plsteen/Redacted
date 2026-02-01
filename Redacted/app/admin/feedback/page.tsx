"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { AdminLayout } from "@/components/Admin/AdminLayout";

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface p-6">Loading...</div>}>
      <AdminFeedbackContent />
    </Suspense>
  );
}

interface Feedback {
  id: string;
  case_id: string;
  rating: number;
  comment: string | null;
  time_spent: number;
  hints_used: number;
  player_name: string;
  submitted_at: string;
}

function AdminFeedbackContent() {
  const searchParams = useSearchParams();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Simple password check (in production, use proper auth)
  const ADMIN_PASSWORD = "redacted2026";

  useEffect(() => {
    const authParam = searchParams?.get("auth");
    if (authParam === ADMIN_PASSWORD) {
      setAuthenticated(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authenticated) return;

    const fetchFeedback = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("case_feedback")
          .select("*")
          .order("submitted_at", { ascending: false });

        if (error) throw error;
        setFeedback((data as unknown as Feedback[]) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [authenticated]);

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

  const averageRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : "N/A";

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
            className="w-full rounded-lg bg-[var(--color-gold)] text-black py-3 font-semibold hover:bg-[var(--color-gold)]/90 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Tilbakemeldinger">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel p-6">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide mb-2">
              Total Responses
            </p>
            <p className="text-3xl font-bold text-[var(--color-gold)]">{feedback.length}</p>
          </div>
          <div className="glass-panel p-6">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide mb-2">
              Average Rating
            </p>
            <p className="text-3xl font-bold text-[var(--color-gold)]">{averageRating} ★</p>
          </div>
          <div className="glass-panel p-6">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide mb-2">
              With Comments
            </p>
            <p className="text-3xl font-bold text-[var(--color-gold)]">
              {feedback.filter((f) => f.comment).length}
            </p>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-[var(--color-muted)]">Loading feedback...</p>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-red-400">Error: {error}</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-[var(--color-muted)]">No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="glass-panel p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-white font-semibold">{item.player_name}</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={
                              star <= item.rating
                                ? "text-[var(--color-gold)]"
                                : "text-[var(--color-muted)]/30"
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-muted)]">
                      {formatDate(item.submitted_at)} • {item.case_id}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--color-muted)]">
                    <p>Time: {formatTime(item.time_spent)}</p>
                    <p>Hints: {item.hints_used}</p>
                  </div>
                </div>
                {item.comment && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-sm text-[var(--color-muted)] italic">&ldquo;{item.comment}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  );
}
