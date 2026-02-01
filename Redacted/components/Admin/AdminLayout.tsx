"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const menuItems = [
  { href: "/admin", icon: "🏠", label: "Dashboard", color: "amber" },
  { href: "/admin/activity", icon: "👥", label: "User Activity", color: "green" },
  { href: "/admin/analytics", icon: "📊", label: "Game Stats", color: "amber" },
  { href: "/admin/feedback", icon: "💬", label: "Feedback", color: "green" },
  { href: "/admin/purchases", icon: "💰", label: "Purchases", color: "blue" },
  { href: "/admin/codes", icon: "🎟️", label: "Access Codes", color: "purple" },
  { href: "/admin/logs", icon: "📋", label: "Event Log", color: "amber" },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");

  const handleLogout = () => {
    router.push("/admin");
  };

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
            href="/catalog"
            className="flex items-center gap-2 px-4 py-2 text-sm text-stone-400 hover:text-white transition"
          >
            <span>📁</span> View Catalog
          </Link>
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
        {/* Header */}
        <header className="bg-stone-950/50 border-b border-stone-800 px-8 py-6">
          <h1 className="text-2xl font-bold">{title}</h1>
        </header>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
