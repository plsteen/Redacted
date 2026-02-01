"use client";

import { ReactNode } from "react";

// Minimal wrapper to enable client context hooks like useRouter needed for locale switching.
export function LocaleResolver({ children }: { children: ReactNode }) {
  return children;
}
