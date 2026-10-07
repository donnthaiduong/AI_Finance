import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator } from 'lucide-react';

export const metadata: Metadata = { title: 'Tools', description: 'Planning tools that run in your browser with your own assumptions.' };

export default function Tools() {
  return <main className="site-main">
    <section className="page-intro">
      <p className="site-eyebrow">TOOLS</p>
      <h1>Planning tools you can inspect</h1>
      <p className="lead">Each tool runs in your browser on your own assumptions, shows its sources and never connects to your accounts.</p>
    </section>
    <section className="home-section" aria-label="Available tools">
      <div className="service-grid single">
        <article className="service-card">
          <span className="service-icon"><Calculator size={22}/></span>
          <span className="service-tag">Tool</span>
          <h3>Liquidity Check</h3>
          <p>Does your cash cover essential payments for 30 days if access to one bank is interrupted? Find the first shortfall day and the smallest preparation, then export a one-page plan.</p>
          <p className="source-note">Inputs stay on your device. USD. Simulation only, not a prediction.</p>
          <Link className="service-link" href="/tools/liquidity-check">Open the tool <ArrowRight size={16}/></Link>
        </article>
      </div>
    </section>
  </main>;
}
