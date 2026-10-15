import Link from 'next/link';
import { SITE } from '../lib/site';

export default function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-in">
      <p className="site-footer-name" aria-hidden="true">{SITE.name}</p>
      <div className="site-footer-row">
        <p>{SITE.disclaimer}</p>
        <nav aria-label="Footer"><Link href="/tools">Tools</Link><Link href="/research">Research</Link><Link href="/advisory">Advisory</Link></nav>
      </div>
    </div>
  </footer>;
}
