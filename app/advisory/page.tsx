import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '../../lib/site';
import { AnswerFragment, AssumptionsFragment, PaymentsFragment, ProposalFragment } from '../fragments';

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
  const mail = email ? `mailto:${email}?subject=${encodeURIComponent('Liquidity plan conversation')}` : '';
  return <main className="inner">
    <section className="chapter chapter-hero">
      <h1 data-reveal>Talk it through.</h1>
      <p className="lead" data-reveal>You bring the balances, payments and assumptions. We help you pressure-test them and understand the result. Advisory complements the Liquidity Check; it does not replace your own judgement.</p>
      {email
        ? <a className="btn primary" data-reveal href={mail}>Email us</a>
        : <p className="fine" data-reveal>Contact details are not configured yet.</p>}
    </section>

    <section className="chapter chapter-sage" aria-labelledby="adv-cover">
      <h2 id="adv-cover" data-reveal>What a conversation can cover.</h2>
      <div className="split">
        <ul className="big-list">{COVERS.map(c => <li key={c} data-reveal>{c}</li>)}</ul>
        <div className="fragments one">
          <figure data-reveal><AssumptionsFragment/><figcaption>Start from your assumptions.</figcaption></figure>
          <figure data-reveal><AnswerFragment/><figcaption>Read what they imply.</figcaption></figure>
        </div>
      </div>
    </section>

    <section className="chapter chapter-yellow" aria-labelledby="adv-not">
      <h2 id="adv-not" data-reveal>What it is not.</h2>
      <div className="split">
        <ul className="big-list">{NOT.map(c => <li key={c} data-reveal>{c}</li>)}</ul>
        <div className="fragments one">
          <figure data-reveal><ProposalFragment/><figcaption>A proposal changes the simulation only, after you confirm.</figcaption></figure>
          <figure data-reveal><PaymentsFragment/><figcaption>Planned payments are your own entries.</figcaption></figure>
        </div>
      </div>
    </section>

    <section className="chapter chapter-orange" aria-labelledby="adv-cta">
      <div>
        <h2 id="adv-cta" data-reveal>Start a conversation.</h2>
        <p className="cta-note" data-reveal>Prefer to start on your own? <Link href="/tools/liquidity-check">Try the Liquidity Check</Link> first and bring the one-page plan.</p>
      </div>
      {email && <a className="btn dark" data-reveal href={mail}>Email us</a>}
    </section>
  </main>;
}
