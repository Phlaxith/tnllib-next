import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TL Library",
  description: "Thrones & Liberty — Data Library & Tools",
  icons: { icon: "https://assets.playnccdn.com/common/tl.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // lang is set dynamically per locale by HtmlLang in [locale]/layout.tsx
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
