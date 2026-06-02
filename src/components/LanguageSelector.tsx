"use client";

import { useI18n, type Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" }
];

export default function LanguageSelector() {
  const { locale, setLocale, isLoading } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <Languages size={18} style={{ color: "var(--text-muted)" }} />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        disabled={isLoading}
        className="rounded-lg border px-3 py-1.5 text-sm transition-colors"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
        }}
        title="Select language"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
      {isLoading && (
        <span
          className="text-xs animate-pulse"
          style={{ color: "var(--text-muted)" }}
        >
          Loading...
        </span>
      )}
    </div>
  );
}

