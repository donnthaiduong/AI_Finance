import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator } from 'lucide-react';

export const metadata: Metadata = { title: 'Tools', description: 'Planning tools that run in your browser with your own assumptions.' };

export default function Tools() {
  return <main className="site-main">
    <section className="page-intro">
      <p className="site-eyebrow">TOOLS</p>
      <h1>Your cash. A clearer plan.</h1>
      <p className="lead">Plan with your balances and assumptions. Saved on your device.</p>
    </section>
    <section className="home-section" aria-label="Available tools">
      <div className="service-grid single">
        <article className="service-card">
          <span className="service-icon"><Calculator size={22}/></span>
          <span className="service-tag">Tool</span>
          <h3>Liquidity Check</h3>
          <p>Connect bank balances, payment timing and cash gaps. Compare preparation, then export your plan.</p>
          <p className="source-note">USD · No bank connection · Simulation only</p>
          <Link className="service-link" href="/tools/liquidity-check">Open the tool <ArrowRight size={16}/></Link>
        </article>
      </div>
    </section>
  </main>;
}
