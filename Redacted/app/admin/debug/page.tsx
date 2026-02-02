"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface UserSession {
  userId: string;
  email?: string;
  sessionId: string;
  caseCode?: string;
  startedAt: string;
  lastActivity: string;
  actions: number;
  errors: number;
}

function DebugToolsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  const [authenticated, setAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"user" | "session">("user");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authParam === "redacted2026") {
      setAuthenticated(true);
    }
  }, [authParam]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchResults([]);

    try {
      const supabase = getSupabaseBrowserClient();

      if (searchType === "user") {
        // Search by email or user ID
        const { data: users } = await supabase
          .from("profiles")
          .select("id, email, created_at")
          .or(`email.ilike.%${searchQuery}%,id.eq.${searchQuery}`)
          .limit(10);

        setSearchResults(users || []);
      } else {
        // Search by session ID
        const { data: sessions } = await supabase
          .from("sessions")
          .select("*")
          .or(`id.eq.${searchQuery},code.ilike.%${searchQuery}%`)
          .limit(10);

        setSearchResults(sessions || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async (userId: string) => {
    setLoading(true);
    setSelectedUser(userId);

    try {
      const supabase = getSupabaseBrowserClient();

      // Get user's activity log
      const { data: activity } = await supabase
        .from("user_activity_log")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      setUserActivity(activity || []);
    } catch (error) {
      console.error("Failed to load user activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("no-NO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes("error")) return "text-red-400";
    if (action.includes("completed")) return "text-green-400";
    if (action.includes("started")) return "text-blue-400";
    return "text-stone-400";
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

  return (
    <AdminLayout title="Debug Tools">
      <div className="space-y-6">
        {/* Search Section */}
        <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">🔍 Search & Inspect</h2>

          <div className="space-y-4">
            {/* Search Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setSearchType("user")}
                className={`px-4 py-2 rounded cursor-pointer transition ${
                  searchType === "user"
                    ? "bg-amber-600 text-white"
                    : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                }`}
              >
                Search User
              </button>
              <button
                onClick={() => setSearchType("session")}
                className={`px-4 py-2 rounded cursor-pointer transition ${
                  searchType === "session"
                    ? "bg-amber-600 text-white"
                    : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                }`}
              >
                Search Session
              </button>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  searchType === "user"
                    ? "Enter email or user ID..."
                    : "Enter session ID or code..."
                }
                className="flex-1 px-4 py-2 bg-stone-900 border border-stone-600 rounded text-amber-100 placeholder-stone-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold cursor-pointer disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-stone-400">Found {searchResults.length} result(s):</p>
                {searchType === "user" ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => loadUserActivity(user.id)}
                      className="bg-stone-900 border border-stone-700 rounded p-4 cursor-pointer hover:border-amber-500 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{user.email || "No email"}</p>
                          <p className="text-xs text-stone-500">ID: {user.id}</p>
                        </div>
                        <span className="text-xs text-stone-400">
                          Joined {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  searchResults.map((session) => (
                    <div
                      key={session.id}
                      className="bg-stone-900 border border-stone-700 rounded p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Session: {session.code || session.id}</p>
                          <p className="text-xs text-stone-500">Status: {session.status}</p>
                        </div>
                        <button
                          onClick={() => router.push(`/admin/sessions?auth=${authParam}`)}
                          className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
                        >
                          View in Sessions →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !loading && (
              <p className="text-stone-500 text-sm mt-4">No results found</p>
            )}
          </div>
        </div>

        {/* User Activity Timeline */}
        {selectedUser && (
          <div className="bg-stone-800 border border-amber-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">📜 Activity Timeline</h2>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserActivity([]);
                }}
                className="text-sm text-stone-400 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-sm text-stone-400 mb-4">
              Showing last 100 actions for user: <span className="text-white font-mono">{selectedUser}</span>
            </p>

            {loading ? (
              <p className="text-stone-500">Loading activity...</p>
            ) : userActivity.length === 0 ? (
              <p className="text-stone-500">No activity found for this user</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {userActivity.map((log, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-900 border border-stone-700 rounded p-3 text-sm"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`font-medium ${getActionColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                      <span className="text-xs text-stone-500">
                        {formatDate(log.created_at)}
                      </span>
                    </div>

                    {log.session_id && (
                      <p className="text-xs text-stone-600 mb-1">
                        Session: <span className="font-mono">{log.session_id}</span>
                      </p>
                    )}

                    {log.metadata && (
                      <pre className="text-xs text-stone-500 bg-stone-950 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}

                    {log.error_message && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
                        <p className="text-xs text-red-400">⚠️ {log.error_message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold mb-2">🔗 Session Replay</h3>
            <p className="text-xs text-stone-400 mb-4">
              View complete user journey through a session
            </p>
            <button
              onClick={() => alert("Session replay coming soon!")}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-sm cursor-pointer w-full"
            >
              Coming Soon
            </button>
          </div>

          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold mb-2">📊 API Inspector</h3>
            <p className="text-xs text-stone-400 mb-4">
              Monitor real-time API calls and responses
            </p>
            <button
              onClick={() => alert("API inspector coming soon!")}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-sm cursor-pointer w-full"
            >
              Coming Soon
            </button>
          </div>

          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold mb-2">👁️ View as User</h3>
            <p className="text-xs text-stone-400 mb-4">
              Experience the app from a user's perspective
            </p>
            <button
              onClick={() => alert("View as user coming soon!")}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-sm cursor-pointer w-full"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function DebugToolsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <DebugToolsContent />
    </Suspense>
  );
}
