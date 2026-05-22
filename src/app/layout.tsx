import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TL Library",
  description: "Thrones & Liberty — Data Library & Tools",
  icons: { icon: "https://assets.playnccdn.com/common/tl.ico" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read theme cookie server-side → no script tag needed, no flash
  const cookieStore = await cookies();
  const theme = (cookieStore.get("theme")?.value === "light" ? "light" : "dark") as "dark" | "light";

  return (
    <html data-theme={theme} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
