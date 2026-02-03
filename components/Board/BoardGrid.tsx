"use client";

import { useState } from "react";
import { getMessagesForLocale } from "@/lib/i18n";
import type { Evidence } from "@/types/mystery";

interface Props {
  evidence: Evidence[];
  locale: string;
}

export function BoardGrid({ evidence, locale }: Props) {
  const t = getMessagesForLocale(locale);
  const [pinned, setPinned] = useState<Evidence[]>(evidence.slice(0, 2));

  const togglePin = (item: Evidence) => {
    setPinned((prev) => {
      const exists = prev.find((e) => e.id === item.id);
      return exists ? prev.filter((e) => e.id !== item.id) : [...prev, item];
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5">
        <div className="mb-3 flex items-center justify-between text-sm text-[var(--color-muted)]">
          <span>{t.board.pinned}</span>
          <span>{pinned.length}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {pinned.map((item) => (
            <article key={item.id} className="rounded-md border border-white/10 p-3">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-[var(--color-muted)]">{item.description}</p>
              <button
                type="button"
                className="mt-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white hover:border-white/25"
                onClick={() => togglePin(item)}
              >
                Unpin
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="glass-panel p-5">
        <div className="mb-3 flex items-center justify-between text-sm text-[var(--color-muted)]">
          <span>{t.board.timeline}</span>
          <span>{evidence.length} evidence</span>
        </div>
        <div className="space-y-3">
          {evidence.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2 text-sm text-white">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-[var(--color-muted)]">Unlocks on task {item.unlocked_on_task_idx}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white hover:border-white/25"
                onClick={() => togglePin(item)}
              >
                {t.board.present}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
