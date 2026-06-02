import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ThemeInitScript from "@/components/ThemeInitScript";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "TL Library",
  description: "Throne & Liberty — Data Library & Tools",
  icons: { icon: "https://assets.playnccdn.com/common/tl.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body>
        <I18nProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto animate-fade-in">
              {children}
            </main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
