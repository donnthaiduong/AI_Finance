import Link from 'next/link';
import { ArrowRight, Calculator, FileText, MessageCircle, Check } from 'lucide-react';
import ExampleOutlook from './example-outlook';

const SERVICES = [
  { icon: Calculator, title: 'Check your cash', text: 'Find a cash gap. Compare a plan.', href: '/tools/liquidity-check', cta: 'Start a plan' },
  { icon: FileText, title: 'Explore the evidence', text: 'Bank data, sources and research.', href: '/research', cta: 'View research' },
  { icon: MessageCircle, title: 'Talk it through', text: 'Review your assumptions with us.', href: '/advisory', cta: 'Get in touch' },
];

export default function Home() {
  return <main className="site-main minimal-home">
    <section className="home-hero">
      <div className="home-hero-copy">
        <p className="site-eyebrow">CASH PLANNING FOR SMALL BUSINESSES</p>
        <h1>30 days.<br/>Know your cash.</h1>
        <p className="lead">Can you pay the essentials if one bank becomes unavailable?</p>
        <div className="home-actions"><Link className="btn primary" href="/tools/liquidity-check">Check my cash <ArrowRight size={16}/></Link><a className="btn ghost" href="#how">How it works</a></div>
        <ul className="home-trust"><li><Check size={15}/>No sign-up</li><li><Check size={15}/>Saved on your device</li><li><Check size={15}/>Simulation only</li></ul>
        <p className="preview-hint">New here? Explore the example chart →</p>
      </div>
      <ExampleOutlook/>
    </section>
    <section id="how" className="home-section compact-how" aria-labelledby="how-h">
      <h2 id="how-h">A clear path to a cash plan.</h2>
      <ol className="how-steps">
        <li><b>1</b><div><strong>Add your cash</strong><p>Balances and essential payments.</p></div></li>
        <li><b>2</b><div><strong>Test an interruption</strong><p>One bank. Your assumptions.</p></div></li>
        <li><b>3</b><div><strong>Prepare your plan</strong><p>Compare, confirm, export.</p></div></li>
      </ol>
    </section>
    <section className="home-section compact-services" aria-label="Tools, research and advisory">
      <div className="service-grid">{SERVICES.map(s=><article className="service-card" key={s.title}>
        <span className="service-icon"><s.icon size={21}/></span><h3>{s.title}</h3><p>{s.text}</p><Link className="service-link" href={s.href}>{s.cta}<ArrowRight size={16}/></Link>
      </article>)}</div>
    </section>
  </main>;
}
