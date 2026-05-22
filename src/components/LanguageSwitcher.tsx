"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { routing } from "@/i18n/routing";

const FLAG: Record<string, string> = { fr: "🇫🇷", en: "🇬🇧" };
const LABEL: Record<string, string> = { fr: "FR", en: "EN" };

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = useCallback((locale: string) => {
    // pathname looks like /fr/bestiary → replace /fr with /locale
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/") || "/");
  }, [pathname, router]);

  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-primary)" }}>
      {routing.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
          style={{
            background: currentLocale === locale ? "var(--accent-glow)" : "transparent",
            color: currentLocale === locale ? "var(--accent-bright)" : "var(--text-muted)",
            border: currentLocale === locale ? "1px solid var(--border-bright)" : "1px solid transparent",
          }}
          title={locale === "fr" ? "Français" : "English"}
        >
          {FLAG[locale]} {LABEL[locale]}
        </button>
      ))}
    </div>
  );
}

