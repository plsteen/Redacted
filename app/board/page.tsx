"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import evidenceEn from "@/content/cases/silent-harbour/en/evidence.json";
import evidenceNo from "@/content/cases/silent-harbour/no/evidence.json";
import type { Evidence } from "@/types/mystery";
import { BoardGrid } from "@/components/Board/BoardGrid";
import { TopBar } from "@/components/Shared/TopBar";
import { getMessagesForLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/hooks/useLocale";

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface p-6">Loading...</div>}>
      <BoardPageContent />
    </Suspense>
  );
}

function BoardPageContent() {
  const searchParams = useSearchParams();
  const locale = useLocale();

  const t = getMessagesForLocale(locale);
  const evidence: Evidence[] = (locale === "no" ? evidenceNo : evidenceEn) as Evidence[];
  const sessionCode = useMemo(() => {
    const urlSession = searchParams?.get("session");
    if (urlSession) return urlSession;
    
    // Use same code from host if available in sessionStorage
    const stored = sessionStorage.getItem("sessionCode");
    return stored ?? "DEMO";
  }, [searchParams]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="noise-bg" />
      <div className="relative mx-auto max-w-7xl px-6 py-8 space-y-6">
        <TopBar />
        <div className="glass-panel p-4 text-sm text-[var(--color-muted)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]">{t.board.title}</p>
              <p className="text-sm text-[var(--color-muted)]">Session: {sessionCode}</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white w-fit">Silent Harbour</span>
          </div>
        </div>

        <BoardGrid evidence={evidence} locale={locale} />
      </div>
    </div>
  );
}
