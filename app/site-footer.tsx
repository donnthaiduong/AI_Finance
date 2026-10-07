import Link from 'next/link';
import { SITE } from '../lib/site';

export default function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-in">
      <div><strong>{SITE.name}</strong><p>{SITE.disclaimer}</p></div>
      <nav aria-label="Footer"><Link href="/tools">Tools</Link><Link href="/research">Research</Link><Link href="/advisory">Advisory</Link></nav>
    </div>
  </footer>;
}
