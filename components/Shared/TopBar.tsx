"use client";

import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";
import { getMessagesForLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/hooks/useLocale";

export function TopBar({
  showLanguageSwitcher = true,
}: {
  showLanguageSwitcher?: boolean;
}) {
  const locale = useLocale();
  const t = getMessagesForLocale(locale);

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
      <div className="flex-shrink-0">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)] -ml-0.5">
          {t.brand}
        </p>
        <p className="text-sm text-[var(--color-muted)]">{t.brandTagline}</p>
      </div>
      {showLanguageSwitcher && (
        <div className="flex flex-shrink-0 items-center gap-3">
          <LanguageSwitcher />
        </div>
      )}
    </header>
  );
}
