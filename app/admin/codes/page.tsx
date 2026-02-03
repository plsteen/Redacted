"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface AccessCode {
  id: string;
  code: string;
  mystery_id: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  note: string | null;
  mysteries?: { title: string; slug: string };
}

interface Mystery {
  id: string;
  title: string;
  code: string;
}

function CodesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState<{
    mysteryId: string;
    maxUses: number;
    note: string;
  }>({
    mysteryId: "",
    maxUses: 1,
    note: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [codesRes, mysteriesRes] = await Promise.all([
        fetch(`/api/admin/codes?auth=${authParam}`),
        fetch(`/api/admin/mysteries?auth=${authParam}`),
      ]);
      
      const codesData = await codesRes.json();
      const mysteriesData = await mysteriesRes.json();
      
      setCodes(codesData.codes || []);
      setMysteries(mysteriesData.mysteries || []);
      
      if (mysteriesData.mysteries?.length > 0) {
        setNewCode(prev => ({ ...prev, mysteryId: mysteriesData.mysteries[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    
    try {
      const res = await fetch(`/api/admin/codes?auth=${authParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCode),
      });
      
      const data = await res.json();
      
      if (res.ok && data.code) {
        setCreatedCode(data.code.code);
        fetchData();
      } else {
        alert(data.error || "Failed to create code");
      }
    } catch {
      alert("Failed to create code");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(codeId: string) {
    if (!confirm("Deactivate this code?")) return;
    
    try {
      const res = await fetch(`/api/admin/codes?auth=${authParam}&id=${codeId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to deactivate code");
      }
    } catch {
      alert("Failed to deactivate code");
    }
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    alert(`Copied: ${code}`);
  }

  if (authParam !== "redacted2026") {
    return null;
  }

  return (
    <AdminLayout title="Access Codes">
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold"
        >
          + Generate New Code
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-stone-400">Loading...</p>
        </div>
      ) : (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-stone-800 rounded-lg p-4">
                <p className="text-stone-400 text-sm">Total Generated</p>
                <p className="text-2xl font-bold">{codes.length}</p>
              </div>
              <div className="bg-stone-800 rounded-lg p-4">
                <p className="text-stone-400 text-sm">Active Codes</p>
                <p className="text-2xl font-bold text-green-400">
                  {codes.filter(c => c.is_active).length}
                </p>
              </div>
              <div className="bg-stone-800 rounded-lg p-4">
                <p className="text-stone-400 text-sm">Total Redeemed</p>
                <p className="text-2xl font-bold text-purple-400">
                  {codes.reduce((sum, c) => sum + c.used_count, 0)}
                </p>
              </div>
            </div>

            {/* Codes Table */}
            {codes.length === 0 ? (
              <div className="bg-stone-800 rounded-lg p-12 text-center">
                <div className="text-5xl mb-4">🎟️</div>
                <p className="text-stone-400">No codes generated yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg"
                >
                  Generate your first code
                </button>
              </div>
            ) : (
              <div className="bg-stone-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-stone-700">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-stone-300">Code</th>
                      <th className="text-left p-4 text-sm font-medium text-stone-300">Case</th>
                      <th className="text-left p-4 text-sm font-medium text-stone-300">Usage</th>
                      <th className="text-left p-4 text-sm font-medium text-stone-300">Note</th>
                      <th className="text-left p-4 text-sm font-medium text-stone-300">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-stone-300">Created</th>
                      <th className="text-right p-4 text-sm font-medium text-stone-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((code) => (
                      <tr key={code.id} className="border-t border-stone-700 hover:bg-stone-750">
                        <td className="p-4">
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="font-mono text-purple-400 hover:text-purple-300"
                          title="Click to copy"
                          >
                            {code.code}
                          </button>
                        </td>
                        <td className="p-4 text-stone-300">
                          {code.mysteries?.title || "Unknown"}
                        </td>
                        <td className="p-4">
                          <span className={code.used_count >= code.max_uses ? "text-red-400" : "text-green-400"}>
                            {code.used_count}/{code.max_uses}
                          </span>
                        </td>
                        <td className="p-4 text-stone-400 text-sm">
                          {code.note || "-"}
                        </td>
                        <td className="p-4">
                          {code.is_active ? (
                            <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs">
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-stone-400 text-sm">
                          {new Date(code.created_at).toLocaleDateString("no-NO")}
                        </td>
                        <td className="p-4 text-right">
                          {code.is_active && (
                            <button
                              onClick={() => handleDeactivate(code.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      {/* Create Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowCreateModal(false);
            setCreatedCode(null);
          }}
        >
          <div 
            className="bg-stone-800 rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {createdCode ? (
              <div className="text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold mb-4">Code Generated!</h2>
                <div 
                  className="bg-stone-900 rounded-lg p-4 mb-4 cursor-pointer hover:bg-stone-700 transition"
                  onClick={() => copyToClipboard(createdCode)}
                >
                  <p className="font-mono text-2xl text-purple-400">{createdCode}</p>
                  <p className="text-stone-400 text-xs mt-2">Click to copy</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedCode(null);
                  }}
                  className="px-6 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-6">Generate Access Code</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-400 mb-1">Select Case</label>
                    <select
                      value={newCode.mysteryId}
                      onChange={(e) => setNewCode({ ...newCode, mysteryId: e.target.value })}
                      className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-lg"
                      required
                    >
                      {mysteries.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-stone-400 mb-1">Max Uses</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCode.maxUses}
                      onChange={(e) => setNewCode({ ...newCode, maxUses: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-400 mb-1">Note (optional)</label>
                    <input
                      type="text"
                      value={newCode.note}
                      onChange={(e) => setNewCode({ ...newCode, note: e.target.value })}
                      placeholder="E.g. 'For influencer X'"
                      className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !newCode.mysteryId}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg font-semibold"
                    >
                      {creating ? "..." : "Generate"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminCodesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <CodesContent />
    </Suspense>
  );
}
