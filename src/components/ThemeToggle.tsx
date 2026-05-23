"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  // Lazy initializer: reads localStorage on first client render
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    return saved ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  });

  // Sync data-theme attribute AND cookie whenever theme changes
  // The cookie is read server-side on the next request to avoid flash
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "switch to light theme" : "switch to dark theme"}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all"
      style={{
        background: "var(--accent-glow)",
        color: "var(--accent-bright)",
        border: "1px solid var(--border)",
      }}
    >
      {theme === "dark"
        ? <><Sun size={13} /> Light Theme </>
        : <><Moon size={13} /> Dark Theme</>
      }
    </button>
  );
}
