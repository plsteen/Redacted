"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface LibraryItem {
  id: string;
  slug: string;
  title: string;
  locale: string;
  difficulty: number;
  purchasedAt: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = useCallback(async () => {
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      setLibrary(data.library || []);
    } catch {
      console.error("Failed to fetch library");
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (!data.user) {
        // Not logged in, redirect to catalog
        router.push("/catalog");
        return;
      }

      setUser(data.user);
      await fetchLibrary();
    } catch {
      console.error("Failed to fetch user");
      router.push("/catalog");
    } finally {
      setLoading(false);
    }
  }, [router, fetchLibrary]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/catalog");
  }

  async function startSession(item: LibraryItem) {
    // Navigate to play page with the mystery
    router.push(`/play?case=${item.slug}&host=true`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
        <div className="text-xl">Loading your library...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-900 text-amber-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Case Library</h1>
          <div className="flex items-center gap-4">
            <span className="text-amber-200">{user?.displayName}</span>
            <button
              onClick={() => router.push("/catalog")}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded"
            >
              Browse Catalog
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Library Grid */}
        {library.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {library.map((item) => (
              <div
                key={item.id}
                className="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-green-900 to-stone-800 flex items-center justify-center">
                  <span className="text-6xl">📁</span>
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400">
                      {"⭐".repeat(item.difficulty)}
                    </span>
                    <span className="text-stone-400 text-sm">
                      Difficulty {item.difficulty}/3
                    </span>
                  </div>
                  <p className="text-stone-400 text-sm mb-4">
                    Purchased:{" "}
                    {new Date(item.purchasedAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => startSession(item)}
                    className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded font-semibold"
                  >
                    🎮 Host a Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-stone-400 text-lg mb-4">
              Your library is empty
            </p>
            <button
              onClick={() => router.push("/catalog")}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded font-semibold"
            >
              Browse Cases to Purchase
            </button>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-amber-400 hover:text-amber-300"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
