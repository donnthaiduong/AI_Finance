import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CascadeGuard | SME Treasury Copilot",
  description: "Check 30-day cash coverage with public bank evidence and user-confirmed liquidity simulations.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
