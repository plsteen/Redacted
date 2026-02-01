"use client";

import { useRouter } from "next/navigation";

export default function PurchaseCancelPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🛒</div>
        <h1 className="text-3xl font-bold mb-4">Purchase Cancelled</h1>
        <p className="text-stone-300 mb-8">
          Your purchase was cancelled. No charges have been made.
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/catalog")}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold"
          >
            Back to Catalog
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-stone-700 hover:bg-stone-600 text-white rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    </main>
  );
}
