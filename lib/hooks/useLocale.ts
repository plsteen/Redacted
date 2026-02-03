"use client";

import { useSyncExternalStore } from "react";

type Locale = "en" | "no";

function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const cookies = document.cookie.split("; ");
  const localeCookie = cookies.find((row) => row.startsWith("locale="));
  return localeCookie?.split("=")[1] === "no" ? "no" : "en";
}

function subscribe(callback: () => void): () => void {
  // Re-check when cookie might change (on visibility change)
  const handler = () => callback();
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}

function getSnapshot(): Locale {
  return getLocaleFromCookie();
}

function getServerSnapshot(): Locale {
  return "en";
}

/**
 * Hook to get the current locale from cookies.
 * Uses useSyncExternalStore to avoid the setState-in-useEffect anti-pattern.
 */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
