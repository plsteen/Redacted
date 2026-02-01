import en from "@/locales/en/common.json";
import no from "@/locales/no/common.json";

export const SUPPORTED_LOCALES = ["en", "no"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export interface Messages {
  brand: string;
  brandTagline: string;
  nav: {
    play: string;
    board: string;
    docs: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    bullets: string[];
  };
  forms: {
    sessionCode: string;
    sessionCodeHelp: string;
    joinSession: string;
    createSession: string;
    hostNote: string;
  };
  play: {
    taskSection: string;
    hint: string;
    hintUsed: string;
    evidence: string;
    answerPlaceholder: string;
    submit: string;
    confirmSubmit: string;
    confirmHint: string;
    joinCode: string;
    copy: string;
    copied: string;
    tryAgain: string;
    locked: string;
    progress: string;
  };
  board: {
    title: string;
    pinned: string;
    timeline: string;
    present: string;
  };
  language: {
    label: string;
    english: string;
    norwegian: string;
  };
  footer: {
    note: string;
  };
}

const messagesMap: Record<AppLocale, Messages> = {
  en: en as Messages,
  no: no as Messages,
};

export function isSupportedLocale(value: string | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function getMessagesForLocale(locale: string | undefined): Messages {
  if (locale && isSupportedLocale(locale)) {
    return messagesMap[locale];
  }
  return messagesMap.en;
}

export function getPreferredLocale(): AppLocale {
  // Default to 'en' in static render; client-side can override via LanguageSwitcher
  return "en";
}
