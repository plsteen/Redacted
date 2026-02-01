"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "moderator" | "viewer";
  status: "active" | "inactive";
  created_at: string;
  last_login: string | null;
}

function UsersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "moderator" | "viewer">("moderator");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?auth=${authParam || ""}`);
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [authParam]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchAdmins();
  }, [authParam, router, fetchAdmins]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users?auth=${authParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add admin");
      }

      setSuccess("Admin user added successfully");
      setNewEmail("");
      setNewRole("moderator");
      fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add admin");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users?auth=${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");
      fetchAdmins();
      setSuccess("Role updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/users?auth=${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      fetchAdmins();
      setSuccess(`Admin ${newStatus}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;

    try {
      const res = await fetch(`/api/admin/users?auth=${authParam}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete admin");
      fetchAdmins();
      setSuccess("Admin removed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete admin");
    }
  };

  if (authParam !== "redacted2026") return null;

  return (
    <AdminLayout title="Admin Users">
      <div className="space-y-8">
        {/* Add New Admin Section */}
        <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Admin</h2>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <input
                type="email"
                placeholder="Email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white placeholder:text-stone-400 focus:outline-none focus:border-[var(--color-gold)]"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white focus:outline-none focus:border-[var(--color-gold)]"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="moderator">Moderator (manage messages)</option>
                <option value="admin">Admin (full access)</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !newEmail}
                className="px-4 py-2 bg-[var(--color-gold)] text-black font-semibold rounded hover:bg-[var(--color-gold)]/90 transition disabled:opacity-50"
              >
                {isAdding ? "Adding..." : "Add Admin"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
              {success}
            </div>
          )}
        </div>

        {/* Admin Users List */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Current Admin Users ({admins.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-stone-400">Loading...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-stone-500">No admin users yet</div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-stone-800 border border-stone-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{admin.email}</p>
                    <p className="text-stone-400 text-sm">
                      Added {new Date(admin.created_at).toLocaleDateString()}
                      {admin.last_login && (
                        <> • Last login: {new Date(admin.last_login).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Role Selector */}
                    <select
                      value={admin.role}
                      onChange={(e) => handleUpdateRole(admin.id, e.target.value)}
                      className="px-2 py-1 bg-stone-700 border border-stone-600 rounded text-sm text-white focus:outline-none focus:border-[var(--color-gold)]"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>

                    {/* Status Toggle */}
                    <button
                      onClick={() => handleToggleStatus(admin.id, admin.status)}
                      className={`px-2 py-1 rounded text-xs font-semibold border transition ${
                        admin.status === "active"
                          ? "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30"
                          : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                      }`}
                    >
                      {admin.status === "active" ? "Active" : "Inactive"}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="px-2 py-1 rounded text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
