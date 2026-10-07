import type { Metadata } from "next";
import "./globals.css";
import "./finance-design.css";
import "./site.css";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";

export const metadata: Metadata = {
  title: { default: "CascadeGuard | Liquidity tools, research and advisory", template: "%s | CascadeGuard" },
  description: "Check 30-day cash coverage with public bank evidence and user-confirmed liquidity simulations, backed by open research and advisory.",
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
      <body className="antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
