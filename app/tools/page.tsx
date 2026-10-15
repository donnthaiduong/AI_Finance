import type { Metadata } from 'next';
import Link from 'next/link';
import { AnswerFragment, BanksFragment, PaymentsFragment, ProposalFragment } from '../fragments';

export const metadata: Metadata = { title: 'Tools', description: 'Planning tools that run in your browser with your own assumptions.' };

export default function Tools() {
  return <main className="inner">
    <section className="chapter chapter-hero">
      <h1 data-reveal>Your cash. A clearer plan.</h1>
      <p className="lead" data-reveal>Plan with your balances and assumptions. The Liquidity Check shows whether cash covers your essential payments for 30 days if one bank becomes unavailable.</p>
      <Link className="btn primary" href="/tools/liquidity-check" data-reveal>Open the Liquidity Check</Link>
      <p className="fine" data-reveal>USD. No bank connection. Saved on your device. Simulation only.</p>
    </section>

    <section className="chapter chapter-sage" aria-labelledby="get-h">
      <h2 id="get-h" data-reveal>What you get.</h2>
      <div className="fragments">
        <figure data-reveal><AnswerFragment/><figcaption><strong>The answer first.</strong> One sentence says whether, and when, cash runs short.</figcaption></figure>
        <figure data-reveal><ProposalFragment/><figcaption><strong>The smallest move.</strong> The least cash to shift to another bank, to the cent, applied only after you confirm.</figcaption></figure>
        <figure data-reveal><PaymentsFragment/><figcaption><strong>Payments by day.</strong> See which payment hits the gap.</figcaption></figure>
        <figure data-reveal><BanksFragment/><figcaption><strong>Every bank in turn.</strong> Check how exposed each bank would leave you.</figcaption></figure>
      </div>
      <p className="fine-ink" data-reveal>Fragments show the example plan, calculated by the same code as the tool.</p>
    </section>

    <section className="chapter chapter-black" aria-labelledby="start-h">
      <h2 id="start-h" data-reveal>Before you start.</h2>
      <div className="marks">
        <p data-reveal><strong>Your numbers</strong>Balances, payments and the share you could not use are your assumptions.</p>
        <p data-reveal><strong>On your device</strong>No sign-up. Your plan is saved in this browser and can be exported as a file.</p>
        <p data-reveal><strong>Nothing moves</strong>No account connection and no transfers. A proposal changes the simulation only.</p>
      </div>
    </section>

    <section className="chapter chapter-orange" aria-labelledby="tcta-h">
      <h2 id="tcta-h" data-reveal>Check your next 30 days.</h2>
      <Link className="btn dark" href="/tools/liquidity-check" data-reveal>Open the Liquidity Check</Link>
    </section>
  </main>;
}
