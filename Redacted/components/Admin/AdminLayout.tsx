"use client";

import { useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const menuItems = [
  { href: "/admin", icon: "🏠", label: "Dashboard", color: "amber" },
  { href: "/admin/sessions", icon: "🎮", label: "Live Sessions", color: "green" },
  { href: "/admin/case-analytics", icon: "📈", label: "Case Analytics", color: "blue" },
  { href: "/admin/cases", icon: "🎯", label: "Case Manager", color: "blue" },
  { href: "/admin/activity", icon: "👥", label: "User Activity", color: "green" },
  { href: "/admin/messages", icon: "📨", label: "Messages", color: "blue" },
  { href: "/admin/feedback", icon: "💬", label: "Feedback", color: "green" },
  { href: "/admin/purchases", icon: "💰", label: "Purchases", color: "blue" },
  { href: "/admin/codes", icon: "🎟️", label: "Access Codes", color: "purple" },
  { href: "/admin/logs", icon: "📋", label: "Event Log", color: "amber" },
  { href: "/admin/debug", icon: "🔧", label: "Debug Tools", color: "purple" },
  { href: "/admin/users", icon: "👤", label: "Admin Users", color: "purple" },
  { href: "/admin/health", icon: "💚", label: "System Health", color: "green" },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    router.push("/admin");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/debug?auth=${authParam}&q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="min-h-screen bg-stone-900 text-amber-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-950 border-r border-stone-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-stone-800">
          <h1 className="text-xl font-bold text-amber-400">REDACTED</h1>
          <p className="text-xs text-stone-500 mt-1">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const colorClasses = {
              amber: isActive ? "bg-amber-600/20 border-amber-600 text-amber-400" : "hover:bg-stone-800",
              green: isActive ? "bg-green-600/20 border-green-600 text-green-400" : "hover:bg-stone-800",
              blue: isActive ? "bg-blue-600/20 border-blue-600 text-blue-400" : "hover:bg-stone-800",
              purple: isActive ? "bg-purple-600/20 border-purple-600 text-purple-400" : "hover:bg-stone-800",
            };
            
            return (
              <Link
                key={item.href}
                href={`${item.href}?auth=${authParam}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition ${
                  isActive 
                    ? colorClasses[item.color as keyof typeof colorClasses]
                    : "border-transparent hover:bg-stone-800 text-stone-300 hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm text-stone-400 hover:text-white transition"
          >
            <span>🏠</span> Go to Homepage
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition w-full text-left"
          >
            <span>🚪</span> Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header with Search */}
        <header className="bg-stone-950/50 border-b border-stone-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{title}</h1>
            
            {/* Search Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg hover:border-amber-500 transition text-sm"
            >
              <span>🔍</span>
              <span className="text-stone-400">Search</span>
              <kbd className="px-2 py-0.5 bg-stone-900 border border-stone-700 rounded text-xs text-stone-500">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Search Modal */}
          {showSearch && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-32">
              <div className="bg-stone-800 border border-stone-700 rounded-lg shadow-2xl w-full max-w-2xl mx-4">
                <form onSubmit={handleSearch} className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🔍</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users, sessions, purchases..."
                      autoFocus
                      className="flex-1 px-4 py-3 bg-stone-900 border border-stone-600 rounded text-amber-100 placeholder-stone-500 text-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSearch(false)}
                      className="px-3 py-3 text-stone-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-xs text-stone-500 px-2">
                    Press <kbd className="px-2 py-0.5 bg-stone-900 rounded">Enter</kbd> to search or{" "}
                    <kbd className="px-2 py-0.5 bg-stone-900 rounded">Esc</kbd> to close
                  </div>
                </form>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
