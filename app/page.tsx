import Link from 'next/link';
import { ArrowRight, Calculator, FileText, MessageCircle, Check, X } from 'lucide-react';

const SERVICES = [
  { icon: Calculator, tag: 'Tool', title: 'Liquidity Check', href: '/tools/liquidity-check', cta: 'Open the tool',
    text: 'Test whether your cash covers essential payments for 30 days if access to one bank is interrupted. See the first shortfall day and the smallest preparation, then export a one-page plan.',
    meta: 'Runs in your browser. Inputs stay on your device. Simulation only.' },
  { icon: FileText, tag: 'Research', title: 'Research & Reports', href: '/research', cta: 'Read the research',
    text: 'Reproducible research on bank deposits, with the results that did not improve on the baseline published alongside the ones that did.',
    meta: 'Every figure traces to a source, a reporting period and a run.' },
  { icon: MessageCircle, tag: 'Advisory', title: 'Advisory', href: '/advisory', cta: 'Talk to us',
    text: 'Talk through your own liquidity plan. You bring the balances, payments and assumptions; we help you pressure-test them.',
    meta: 'Complements the tool. Not investment advice.' },
];

const VALUES = [
  { title: 'Transparent sources and assumptions', points: [
    'Bank figures carry their source, reporting period, collection date and version.',
    'Balances, payment schedules and the share of cash you cannot use are your assumptions, and are labelled as yours.',
    'We never infer a freeze rate or a bank-failure probability from deposit forecasts.' ] },
  { title: 'Precise and verifiable', points: [
    'Amounts are calculated to the cent, and total cash is preserved when you reallocate it.',
    'Imported plans are recalculated, and nothing is applied until you confirm it.',
    'Research reports include the results that did not beat the baseline.' ] },
];

const NOT = ['Connect to your bank accounts', 'Move real money', 'Give investment advice', 'Predict that a bank will fail'];

export default function Home() {
  return <main className="site-main">
    <section className="home-hero">
      <div className="home-hero-copy">
        <p className="site-eyebrow">LIQUIDITY CLARITY FOR FINANCE LEADERS</p>
        <h1>Know whether your cash covers the next 30 days, before a bank disruption tests it.</h1>
        <p className="lead">CascadeGuard brings together a transparent liquidity tool, reproducible research and advisory support, so you can prepare with numbers you can trace.</p>
        <div className="home-actions">
          <a className="btn primary" href="#services">Explore our services <ArrowRight size={16}/></a>
          <Link className="btn ghost" href="/tools/liquidity-check">Try the Liquidity Check</Link>
        </div>
      </div>
      <figure className="home-example" aria-label="Illustrative example result">
        <figcaption>EXAMPLE RESULT · ILLUSTRATIVE ASSUMPTIONS</figcaption>
        <p className="example-headline">If Example bank A is 80% unavailable for 21 days, you are <em>$17,000</em> short from <em>day 15</em>.</p>
        <dl>
          <div><dt>Total cash</dt><dd>$180,000</dd></div>
          <div><dt>Essential payments</dt><dd>$150,000</dd></div>
          <div><dt>Smallest preparation</dt><dd>$21,250 to Example bank B</dd></div>
        </dl>
        <p className="source-note">Example data, not observed business balances. A simulation under stated assumptions, not a prediction.</p>
      </figure>
    </section>

    <section id="services" className="home-section" aria-labelledby="services-h">
      <p className="site-eyebrow">WHAT WE OFFER</p>
      <h2 id="services-h">Three ways to work with us</h2>
      <div className="service-grid">
        {SERVICES.map(s => <article className="service-card" key={s.title}>
          <span className="service-icon"><s.icon size={22}/></span>
          <span className="service-tag">{s.tag}</span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
          <p className="source-note">{s.meta}</p>
          <Link className="service-link" href={s.href}>{s.cta} <ArrowRight size={16}/></Link>
        </article>)}
      </div>
    </section>

    <section className="home-section band" aria-labelledby="values-h">
      <p className="site-eyebrow">HOW WE WORK</p>
      <h2 id="values-h">What you can rely on, every time</h2>
      <div className="value-grid">
        {VALUES.map(v => <div className="value-card" key={v.title}>
          <h3>{v.title}</h3>
          <ul>{v.points.map(p => <li key={p}><Check size={16}/>{p}</li>)}</ul>
        </div>)}
      </div>
      <div className="not-strip"><strong>What we do not do</strong><ul>{NOT.map(n => <li key={n}><X size={14}/>{n}</li>)}</ul></div>
    </section>

    <section className="home-section" aria-labelledby="how-h">
      <p className="site-eyebrow">THE LIQUIDITY CHECK</p>
      <h2 id="how-h">From your numbers to a one-page plan</h2>
      <ol className="how-steps">
        <li><b>1</b><div><strong>Enter what you hold and owe</strong><p>Cash by bank and the essential payments due in the next 30 days.</p></div></li>
        <li><b>2</b><div><strong>Set an interruption assumption</strong><p>Choose a bank, the share you cannot use and for how long. See the first day you would fall short.</p></div></li>
        <li><b>3</b><div><strong>Review the smallest preparation</strong><p>Compare a reallocation, confirm it in the simulation and export a one-page plan.</p></div></li>
      </ol>
      <Link className="btn primary" href="/tools/liquidity-check">Open the Liquidity Check <ArrowRight size={16}/></Link>
    </section>

    <section className="home-section" aria-labelledby="research-h">
      <div className="research-teaser">
        <div>
          <p className="site-eyebrow">LATEST RESEARCH NOTE</p>
          <h2 id="research-h">Does a deposit-overlap network help forecast deposit changes? Not yet shown.</h2>
          <p>In our retrospective pilot, a graph model did not beat the same model without the network, so the simpler Ridge model stays the default. We publish the comparison, the limits and the data scope.</p>
          <Link className="service-link" href="/research">Read the note <ArrowRight size={16}/></Link>
        </div>
      </div>
    </section>

    <section className="home-cta">
      <h2>Want to talk through your liquidity plan?</h2>
      <p>Bring your one-page plan or your questions.</p>
      <Link className="btn primary" href="/advisory">Talk to us <ArrowRight size={16}/></Link>
    </section>
  </main>;
}
