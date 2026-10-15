import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";
import "./finance-design.css";
import "./site.css";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import Reveal from "./reveal";

const albert = Albert_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-albert", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CascadeGuard | Liquidity tools, research and advisory", template: "%s | CascadeGuard" },
  description: "Check 30-day cash coverage with public bank evidence and user-confirmed liquidity simulations, backed by open research and advisory.",
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
      <body className={`${albert.variable} antialiased`}>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Reveal />
      </body>
    </html>
  );
}
