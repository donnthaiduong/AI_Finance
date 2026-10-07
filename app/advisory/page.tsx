import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { SITE } from '../../lib/site';

export const metadata: Metadata = { title: 'Advisory', description: 'Talk through your own liquidity plan and pressure-test its assumptions.' };

// DRAFT COPY: the scope below is limited to what the product already does. Owner to confirm offering, process and contact route.
const COVERS = [
  'Reading your Liquidity Check result and the assumptions behind it',
  'Pressure-testing the share of cash you assume is unavailable, and for how long',
  'Reviewing the smallest preparation and the operational checks around it, such as cutoffs, approvals and payroll instructions',
  'Understanding the public bank evidence shown next to your plan, and its limits',
];
const NOT = ['Investment advice', 'A prediction that any bank will fail', 'Connecting to your accounts or moving money'];

export default function Advisory() {
  const email = SITE.contactEmail;
  return <main className="site-main">
    <section className="page-intro">
      <p className="site-eyebrow">ADVISORY</p>
      <h1>Talk through your liquidity plan with us</h1>
      <p className="lead">You bring the balances, payments and assumptions. We help you pressure-test them and understand the result. Advisory complements the Liquidity Check; it does not replace your own judgement.</p>
    </section>

    <section className="home-section" aria-labelledby="adv-cover">
      <div className="value-grid">
        <div className="value-card"><h3 id="adv-cover">What a conversation can cover</h3><ul>{COVERS.map(c => <li key={c}><Check size={16}/>{c}</li>)}</ul></div>
        <div className="value-card"><h3>What it is not</h3><ul className="neg">{NOT.map(c => <li key={c}><X size={16}/>{c}</li>)}</ul></div>
      </div>
    </section>

    <section className="home-cta">
      <h2>Start a conversation</h2>
      {email
        ? <><p>Tell us a little about your business and what you want to check.</p><a className="btn primary" href={`mailto:${email}?subject=${encodeURIComponent('Liquidity plan conversation')}`}>Email us <ArrowRight size={16}/></a></>
        : <p>Contact details are not configured yet.</p>}
      <p className="source-note">Prefer to start on your own? <Link href="/tools/liquidity-check">Try the Liquidity Check</Link> first and bring the one-page plan.</p>
    </section>
  </main>;
}
