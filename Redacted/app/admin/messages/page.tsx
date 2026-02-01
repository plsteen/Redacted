"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: string | null;
  user_id: string | null;
  status: "new" | "open" | "closed";
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "open" | "closed">("new");

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("auth", authParam || "");
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/messages?${params.toString()}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [authParam, statusFilter]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchMessages();
  }, [authParam, router, fetchMessages]);

  const updateStatus = async (id: string, status: "new" | "open" | "closed") => {
    try {
      await fetch(`/api/admin/messages?auth=${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchMessages();
    } catch {
      // ignore
    }
  };

  if (authParam !== "redacted2026") return null;

  return (
    <AdminLayout title="Messages">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {["all", "new", "open", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-lg text-sm transition border ${
                statusFilter === status
                  ? "border-white/30 text-white"
                  : "border-transparent text-stone-400 hover:text-white"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={fetchMessages}
          className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-400">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-stone-500">No messages yet</div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-stone-800 border border-stone-700 rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{msg.subject}</p>
                  <p className="text-stone-400 text-sm">{msg.name} • {msg.email}</p>
                  <p className="text-stone-500 text-xs mt-1">
                    {new Date(msg.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full border border-white/20 text-xs text-white/70">
                    {msg.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => updateStatus(msg.id, msg.status === "closed" ? "open" : "closed")}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/10 hover:border-white/30 text-white/70"
                  >
                    {msg.status === "closed" ? "Reopen" : "Close"}
                  </button>
                </div>
              </div>
              <p className="text-stone-300 text-sm mt-4 whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminMessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
