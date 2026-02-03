"use client";

import type { Task } from "@/types/mystery";
import { getMessagesForLocale } from "@/lib/i18n";

interface Props {
  tasks: Task[];
  currentIdx: number;
  locale: string;
}

export function ProgressHUD({ tasks, currentIdx, locale }: Props) {
  const t = getMessagesForLocale(locale);

  return (
    <div className="glass-panel p-4">
      <div className="mb-3 text-xs text-[var(--color-muted)]">
        <span>{t.play.progress}</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {tasks.map((task, idx) => {
          const state = idx === currentIdx ? "active" : idx < currentIdx ? "done" : "todo";
          return (
            <div
              key={task.id}
              className={`h-2 rounded-full ${
                state === "active"
                  ? "bg-[var(--color-gold)]"
                  : state === "done"
                    ? "bg-[var(--color-accent)]"
                    : "bg-white/10"
              }`}
              aria-label={`${t.play.taskSection} ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
