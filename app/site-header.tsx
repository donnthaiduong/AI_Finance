'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from '../lib/site';

export default function SiteHeader() {
  const path = usePathname();
  return <header className="site-header">
    <div className="site-header-in">
      <Link className="site-brand" href="/">{SITE.name}</Link>
      <nav className="site-nav" aria-label="Site">
        {SITE.nav.map(n => <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? 'page' : undefined}>{n.label}</Link>)}
      </nav>
      <Link className="site-cta" href="/tools/liquidity-check">Check my cash</Link>
    </div>
  </header>;
}
