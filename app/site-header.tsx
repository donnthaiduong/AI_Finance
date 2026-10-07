'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { SITE } from '../lib/site';

export default function SiteHeader() {
  const path = usePathname();
  return <header className="site-header">
    <div className="site-header-in">
      <Link className="site-brand" href="/"><ShieldCheck size={22}/>{SITE.name}</Link>
      <nav className="site-nav" aria-label="Site">
        {SITE.nav.map(n => <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? 'page' : undefined} className={path.startsWith(n.href) ? 'active' : ''}>{n.label}</Link>)}
      </nav>
      <Link className="site-cta" href="/tools/liquidity-check">Open Liquidity Check <ArrowRight size={16}/></Link>
    </div>
  </header>;
}
