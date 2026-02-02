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

  useEffect(() => {
    if (authParam === "redacted2026") {
      setAuthenticated(true);
    }
  }, [authParam]);

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
        {/* Info Message */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            🔧 Debug tools for inspecting system behavior. More features coming soon.
          </p>
        </div>

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
