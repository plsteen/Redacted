"use client";

import { useCallback, useState } from "react";
import { getMessagesForLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/hooks/useLocale";

const LANG_ORDER: Array<{ code: "en" | "no"; labelKey: "english" | "norwegian" }> = [
  { code: "en", labelKey: "english" },
  { code: "no", labelKey: "norwegian" },
];

export function LanguageSwitcher() {
  const [isChanging, setIsChanging] = useState(false);
  const currentLocale = useLocale();
  
  const t = getMessagesForLocale(currentLocale);

  const setLocale = useCallback(
    async (nextLocale: "en" | "no") => {
      if (nextLocale === currentLocale) return;
      setIsChanging(true);
      // Set cookie
      document.cookie = `locale=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=strict`;
      setTimeout(() => {
        window.location.reload();
      }, 100);
    },
    [currentLocale],
  );

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-1 py-1 text-xs text-white backdrop-blur-sm">
      {LANG_ORDER.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLocale(lang.code)}
          disabled={isChanging}
          className={`rounded-full px-4 py-2 font-semibold uppercase tracking-wider transition-all ${
            currentLocale === lang.code
              ? "bg-[var(--color-gold)] text-black shadow-lg shadow-[var(--color-gold)]/30"
              : "text-white/60 hover:text-white hover:bg-white/5"
          } disabled:opacity-50`}
          aria-label={lang.code === "en" ? t.language.english : t.language.norwegian}
        >
          {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
