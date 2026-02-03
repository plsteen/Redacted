"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface Purchase {
  id: string;
  userId: string;
  userEmail: string | null;
  mysteryTitle: string;
  mysterySlug: string;
  amount: number;
  currency: string;
  platform: string;
  status: string;
  purchasedAt: string;
  stripeCheckoutSessionId: string | null;
}

interface DashboardStats {
  totalRevenue: number;
  totalPurchases: number;
  uniqueCustomers: number;
  recentPurchases: Purchase[];
}

function PurchasesDashboardContent() {
  const searchParams = useSearchParams();
  const authParam = searchParams?.get("auth");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showRefundModal, setShowRefundModal] = useState<Purchase | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/purchases?auth=${authParam}`);
      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Failed to load purchase data");
    } finally {
      setLoading(false);
    }
  }, [authParam]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      setError("Unauthorized");
      setLoading(false);
      return;
    }

    fetchStats();
  }, [authParam, fetchStats]);

  async function handleRefund(purchase: Purchase) {
    if (!confirm(`Refundere ${purchase.amount} ${purchase.currency} til ${purchase.userEmail}?`)) {
      return;
    }
    
    setRefundingId(purchase.id);
    
    try {
      const res = await fetch(`/api/admin/refunds?auth=${authParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: purchase.id,
          reason: refundReason || "Admin refund",
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || "Refund processed");
        setShowRefundModal(null);
        setRefundReason("");
        fetchStats();
      } else {
        alert(data.error || "Failed to process refund");
      }
    } catch {
      alert("Failed to process refund");
    } finally {
      setRefundingId(null);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Kjøp & Refunds">
        <div className="text-xl">Loading purchases...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Kjøp & Refunds">
        <div className="text-red-400">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kjøp & Refunds">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <p className="text-stone-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-400">
              {stats?.totalRevenue.toFixed(2)} NOK
            </p>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <p className="text-stone-400 text-sm mb-1">Total Purchases</p>
            <p className="text-3xl font-bold text-amber-400">
              {stats?.totalPurchases}
            </p>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <p className="text-stone-400 text-sm mb-1">Unique Customers</p>
            <p className="text-3xl font-bold text-blue-400">
              {stats?.uniqueCustomers}
            </p>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-stone-800 border border-stone-700 rounded-lg">
          <div className="p-4 border-b border-stone-700">
            <h2 className="text-xl font-semibold">Recent Purchases</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-300">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-300">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-300">
                    Case
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-300">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-300">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-stone-300">
                    Handling
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700">
                {stats?.recentPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-stone-700/30">
                    <td className="px-4 py-3 text-sm">
                      {new Date(purchase.purchasedAt).toLocaleString("no-NO")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {purchase.userEmail || purchase.userId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {purchase.mysteryTitle}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400">
                      {purchase.amount} {purchase.currency}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          purchase.status === "completed"
                            ? "bg-green-900 text-green-300"
                            : purchase.status === "refunded"
                            ? "bg-red-900 text-red-300"
                            : "bg-yellow-900 text-yellow-300"
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {purchase.status === "completed" && purchase.amount > 0 && (
                        <button
                          onClick={() => handleRefund(purchase)}
                          disabled={refundingId === purchase.id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          {refundingId === purchase.id ? "..." : "Refunder"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!stats?.recentPurchases || stats.recentPurchases.length === 0) && (
            <div className="p-8 text-center text-stone-400">
              No purchases yet
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function PurchasesDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      }
    >
      <PurchasesDashboardContent />
    </Suspense>
  );
}
