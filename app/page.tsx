import Link from 'next/link';
import Image from 'next/image';
import ExampleOutlook from './example-outlook';

export default function Home() {
  return <main className="home">
    <section className="chapter chapter-hero">
      <h1 data-reveal>30 days.<br/>Know your cash.</h1>
      <div className="hero-row">
        <div>
          <p className="lead" data-reveal>Can you pay the essentials if one bank becomes unavailable? Enter your balances and payments, and see the answer to the cent.</p>
          <Link className="btn primary" href="/tools/liquidity-check" data-reveal>Check my cash</Link>
          <p className="fine" data-reveal>No sign-up. Saved on your device. Simulation only.</p>
        </div>
        <div data-reveal><ExampleOutlook/></div>
      </div>
    </section>

    <section className="chapter chapter-sage" aria-labelledby="how-h">
      <h2 id="how-h" data-reveal>A clear path to a cash plan.</h2>
      <ol className="stages">
        <li data-reveal><strong>Add your cash</strong><span>Balances by bank, and the payments you must make.</span></li>
        <li data-reveal><strong>Test an interruption</strong><span>Pick one bank, the share you could not use, and for how long.</span></li>
        <li data-reveal><strong>Prepare your plan</strong><span>Find the smallest move to cover the gap, confirm it, export one page.</span></li>
      </ol>
    </section>

    <section className="chapter chapter-yellow" aria-labelledby="proof-h">
      <h2 id="proof-h" data-reveal>Built to be checked.</h2>
      <div className="marks">
        <p data-reveal><strong>To the cent</strong>Every amount is calculated in whole cents, and moving cash never changes your total.</p>
        <p data-reveal><strong>Your assumptions</strong>Balances, payments and the unavailable share are yours. Public bank data is context only.</p>
        <p data-reveal><strong>Nothing moves</strong>No account connection, no transfers. A proposal applies to the simulation only after you confirm.</p>
      </div>
      <div className="proof-figs">
        <figure data-reveal>
          <Image src="/figures/research-seeds.png" width={1760} height={544} alt="Test error by training seed. The three no-network seeds fall between 2.26 and 2.39; the three graph-model seeds fall between 2.71 and 2.73." sizes="(max-width: 1000px) 100vw, 50vw"/>
          <figcaption>We publish results that do not flatter us. In our pilot, the model without the network had lower error on every seed.</figcaption>
        </figure>
        <figure data-reveal>
          <Image src="/figures/research-recall-seeds.png" width={1760} height={544} alt="Recall of the worst-decline quintile by training seed. Graph model: 0.196, 0.232, 0.250. No network: 0.232, 0.250, 0.304. The ranges overlap." sizes="(max-width: 1000px) 100vw, 50vw"/>
          <figcaption>On recall of the worst-decline banks the two models overlap, so we claim no difference.</figcaption>
        </figure>
      </div>
    </section>

    <section className="chapter chapter-black" aria-labelledby="more-h">
      <h2 id="more-h" data-reveal>Three ways in.</h2>
      <div className="trio">
        <article data-reveal>
          <div className="frag" data-ui><b>$17,000</b><span>short from day 15, if Bank A is 80% unavailable for 21 days</span></div>
          <h3>Tools</h3><p>Find a cash gap and the smallest move that covers it.</p>
          <Link href="/tools/liquidity-check">Start a plan</Link>
        </article>
        <article data-reveal>
          <Image className="frag-img" src="/figures/research-results.png" width={1920} height={832} alt="Bar charts of test error and recall for four models. The model without the network has the lowest error, 2.33 points." sizes="(max-width: 900px) 100vw, 33vw"/>
          <h3>Research</h3><p>Our deposit-network pilot did not beat the same model without the network.</p>
          <Link href="/research">View research</Link>
        </article>
        <article data-reveal>
          <div className="frag" data-ui><b>80%</b><span>of Bank A you could not use. For how many days?</span></div>
          <h3>Advisory</h3><p>Pressure-test your assumptions with us before you rely on them.</p>
          <Link href="/advisory">Get in touch</Link>
        </article>
      </div>
    </section>

    <section className="chapter chapter-orange" aria-labelledby="cta-h">
      <h2 id="cta-h" data-reveal>Check your next 30 days.</h2>
      <Link className="btn dark" data-reveal href="/tools/liquidity-check">Check my cash</Link>
    </section>
  </main>;
}
