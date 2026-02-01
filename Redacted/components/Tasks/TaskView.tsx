"use client";

import { useState, useEffect } from "react";
import { getMessagesForLocale } from "@/lib/i18n";
import type { Task } from "@/types/mystery";

interface Props {
  task: Task;
  onSubmit: (answer: string) => Promise<boolean> | boolean;
  onUseHint: () => void;
  hintUsed: boolean;
  isLocked: boolean;
  locale: string;
  currentTaskIdx: number;
}

export function TaskView({ task, onSubmit, onUseHint, hintUsed, isLocked, locale, currentTaskIdx }: Props) {
  const t = getMessagesForLocale(locale);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");

  // Reset input when task changes - necessary for controlled input sync
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset on task change
    setValue("");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset on task change  
    setStatus("idle");
  }, [currentTaskIdx]);

  const handleSubmit = async (answer: string) => {
    const confirmMessage = t.play.confirmSubmit ?? (locale === "no" ? "Er du helt sikker på svaret?" : "Are you sure about your answer?");
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setStatus("idle");
    const ok = await onSubmit(answer);
    setStatus(ok ? "correct" : "wrong");
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-[var(--color-gold)]">{t.play.taskSection}</p>
          <h3 className="text-xl font-semibold leading-tight break-words">{task.question}</h3>
          {hintUsed && (
            <div className="mt-3 rounded-md bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--color-gold)] mb-1">💡 {t.play.hint}</p>
              <p className="text-sm text-[var(--color-muted)]">{task.hint}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {task.type === "mcq" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {task.options.map((option) => (
              <button
                key={option}
                type="button"
                disabled={isLocked}
                onClick={() => handleSubmit(option)}
                className="rounded-md border border-white/10 px-4 py-3 text-left text-sm text-white transition hover:border-white/25 disabled:opacity-60"
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              aria-label={t.play.answerPlaceholder}
              placeholder={t.play.answerPlaceholder}
              value={value}
              disabled={isLocked}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#0b0c10] px-4 py-3 text-sm text-white outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleSubmit(value)}
              className="rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isLocked ? t.play.locked : t.play.submit}
            </button>
          </div>
        )}

        {status === "correct" && (
          <p className="text-sm text-[var(--color-gold)]">✓</p>
        )}
        {status === "wrong" && (
          <p className="text-sm text-red-300">{t.play.tryAgain}</p>
        )}

        {/* Hint button at bottom - less prominent */}
        {!hintUsed && (
          <button
            type="button"
            disabled={isLocked}
            className="mt-4 w-full text-center py-2 text-xs text-white/50 hover:text-white/70 transition border-t border-white/10 disabled:opacity-60"
            onClick={() => {
              if (isLocked) return;
              const confirmMessage = t.play.confirmHint ?? (locale === "no" ? "Er du helt sikker på at du vil bruke et hint?" : "Are you sure you want to use a hint?");
              if (window.confirm(confirmMessage)) {
                onUseHint();
              }
            }}
          >
            {t.play.hint}
          </button>
        )}
      </div>
    </div>
  );
}
