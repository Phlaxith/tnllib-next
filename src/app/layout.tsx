import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "TL Library",
  description: "Throne & Liberty — Data Library & Tools",
  icons: { icon: "https://assets.playnccdn.com/common/tl.ico" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read theme cookie server-side → no script tag needed, no flash
  const cookieStore = await cookies();
  const theme = (cookieStore.get("theme")?.value === "light" ? "light" : "dark") as "dark" | "light";

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 overflow-y-auto animate-fade-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
