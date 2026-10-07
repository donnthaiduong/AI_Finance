import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Research', description: 'Retrospective pilot on whether a deposit-overlap network helps forecast deposit growth.' };

// Figures come from outputs/REPRODUCTION_REPORT.json (run 20261004T100243583769Z), test split 2024-2025, 256 observations.
const ROWS = [
  { model: 'Lag growth', mae: '3.04', recall: '0.27' },
  { model: 'Ridge (default)', mae: '3.02', recall: '0.21' },
  { model: 'Graph model (GraphSAGE, 3-seed mean)', mae: '2.72', recall: '0.23' },
  { model: 'Same model without the network (3-seed mean)', mae: '2.33', recall: '0.26' },
];

const LIMITS = [
  'Current revised data. Original publication timestamps are unavailable, so this is not a point-in-time early-warning result.',
  '32 large banks that still operate: survivorship bias, and limited relevance to the smaller banks many SMEs use.',
  'A previous-year branch-deposit availability proxy stands in for historical publication dates, which are unverified.',
  'Geographic overlap measures similarity. It is not evidence of causal contagion.',
  'Treasury rates are context only and are not model features.',
];

export default function Research() {
  return <main className="site-main">
    <section className="page-intro">
      <p className="site-eyebrow">RESEARCH</p>
      <h1>A deposit-overlap network did not beat the same model without it</h1>
      <p className="lead">Our retrospective pilot asked whether banks that overlap geographically help forecast next-quarter deposit growth. The graph model improved on Ridge, but not on the control that removes the network, so we do not claim a network benefit.</p>
    </section>

    <section className="home-section" aria-labelledby="res-table">
      <h2 id="res-table">Test results, 2024–2025</h2>
      <div className="table-wrap" role="region" aria-label="Test results by model" tabIndex={0}>
        <table className="res-table">
          <thead><tr><th>Model</th><th>Error (MAE, percentage points)</th><th>Recall, worst-decline quintile</th></tr></thead>
          <tbody>{ROWS.map(r => <tr key={r.model}><td>{r.model}</td><td>{r.mae}</td><td>{r.recall}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="source-note">Source: reproduction run 20261004T100243583769Z in this repository. Test split 2024–2025, 256 observations. Lower error is better. Model selection used validation data only, never test data.</p>
      <p>Because the control without the network has the lowest error, the graph model&apos;s gain over Ridge is not attributable to the network. Ridge remains the default for any deposit-growth estimate shown in our tools.</p>
    </section>

    <section className="home-section band" aria-labelledby="res-limits">
      <h2 id="res-limits">What this result does and does not show</h2>
      <ul className="limit-list">{LIMITS.map(l => <li key={l}>{l}</li>)}</ul>
      <p>A deposit forecast is not a probability that a bank will fail, and it never sets the share of cash you assume is unavailable in the Liquidity Check. Those assumptions stay yours.</p>
    </section>

    <section className="home-cta">
      <h2>See how bank evidence appears in the tool</h2>
      <p>Public reporting is shown with its source, reporting period and collection date, as context only.</p>
      <Link className="btn primary" href="/tools/liquidity-check">Open the Liquidity Check <ArrowRight size={16}/></Link>
    </section>
  </main>;
}
