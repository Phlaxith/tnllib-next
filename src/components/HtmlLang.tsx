"use client";

import { useEffect } from "react";

/**
 * Sets the `lang` attribute on <html> dynamically based on the current locale.
 * Necessary because the root layout does not have access to the locale param.
 */
export default function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

