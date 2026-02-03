import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import { ReactNode } from "react";
import { ReactQueryProvider } from "@/components/Shared/ReactQueryProvider";
import "./globals.css";

const headingFont = EB_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Redacted | Nordic Noir Mystery",
  description:
    "Kooperativt etterforskningsspill med realtime synk, Supabase og Nordic Noir.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-surface text-foreground">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} antialiased bg-surface text-foreground`}
      >
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
