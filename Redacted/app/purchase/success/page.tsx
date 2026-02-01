"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Derive state from searchParams without useEffect
  const { loading, error } = useMemo(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      return { loading: false, error: "No session ID found" };
    }
    // Just show success - the webhook handles the actual purchase creation
    return { loading: false, error: null };
  }, [searchParams]);

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
        <div className="text-xl">Processing your purchase...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-stone-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/catalog")}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded font-semibold"
          >
            Back to Catalog
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-4">Purchase Successful!</h1>
        <p className="text-stone-300 mb-8">
          Your case has been added to your library. You can now host sessions
          and invite friends to play!
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/library")}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded font-semibold"
          >
            🎮 Go to My Library
          </button>
          <button
            onClick={() => router.push("/catalog")}
            className="w-full py-3 bg-stone-700 hover:bg-stone-600 text-white rounded"
          >
            Browse More Cases
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
