import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

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
  return <main className="inner">
    <section className="chapter chapter-hero">
      <h1 data-reveal>No proven gain from the network.</h1>
      <p className="lead" data-reveal>Our retrospective pilot asked whether banks that overlap geographically help forecast next-quarter deposit growth. The graph model improved on Ridge, but not on the control that removes the network, so we do not claim a network benefit.</p>
    </section>

    <section className="chapter" aria-labelledby="res-table">
      <h2 id="res-table" data-reveal>Test results, 2024–2025.</h2>
      <div className="table-wrap" role="region" aria-label="Test results by model" tabIndex={0} data-ui data-reveal>
        <table className="res-table">
          <thead><tr><th>Model</th><th>Error (MAE, percentage points)</th><th>Recall, worst-decline quintile</th></tr></thead>
          <tbody>{ROWS.map(r => <tr key={r.model}><td>{r.model}</td><td>{r.mae}</td><td>{r.recall}</td></tr>)}</tbody>
        </table>
      </div>
      <figure className="figure" data-reveal><Image src="/figures/research-results.png" width={1920} height={832} alt="Two bar charts of test results for four models. Forecast error: lag growth 3.04, Ridge 3.02, graph model 2.72, same model without the network 2.33 percentage points. Recall of the worst-decline quintile: 0.27, 0.21, 0.23, 0.26." sizes="(max-width: 1240px) 100vw, 1240px"/><figcaption>Drawn by a script in this repository from the reproduction report, so it cannot drift from the table above.</figcaption></figure>
      <p className="source-note" data-reveal>Source: reproduction run 20261004T100243583769Z in this repository. Test split 2024–2025, 256 observations. Lower error is better. Model selection used validation data only, never test data.</p>
      <p data-reveal>Because the control without the network has the lowest error, the graph model&apos;s gain over Ridge is not attributable to the network. Ridge remains the default for any deposit-growth estimate shown in our tools.</p>
    </section>

    <section className="chapter chapter-sage" aria-labelledby="res-seeds">
      <h2 id="res-seeds" data-reveal>Seed by seed.</h2>
      <div className="proof-figs">
        <figure data-reveal><Image src="/figures/research-seeds.png" width={1760} height={544} alt="Test error by seed. The three no-network seeds fall between 2.26 and 2.39; the three graph-model seeds fall between 2.71 and 2.73." sizes="(max-width: 1000px) 100vw, 50vw"/><figcaption>Each dot is one training seed. Every no-network seed has lower error than every graph seed in this run.</figcaption></figure>
        <figure data-reveal><Image src="/figures/research-recall-seeds.png" width={1760} height={544} alt="Recall of the worst-decline quintile by training seed. Graph model: 0.196, 0.232, 0.250. No network: 0.232, 0.250, 0.304. The ranges overlap." sizes="(max-width: 1000px) 100vw, 50vw"/><figcaption>Recall by seed: the two models overlap, so this pilot shows no difference in recall.</figcaption></figure>
      </div>
    </section>

    <section className="chapter chapter-yellow" aria-labelledby="res-limits">
      <h2 id="res-limits" data-reveal>What this does and does not show.</h2>
      <ul className="big-list">{LIMITS.map(l => <li key={l} data-reveal>{l}</li>)}</ul>
      <p data-reveal>A deposit forecast is not a probability that a bank will fail, and it never sets the share of cash you assume is unavailable in the Liquidity Check. Those assumptions stay yours.</p>
    </section>

    <section className="chapter chapter-orange" aria-labelledby="res-cta">
      <div>
        <h2 id="res-cta" data-reveal>See bank evidence in the tool.</h2>
        <p className="cta-note" data-reveal>Public reporting is shown with its source, reporting period and collection date, as context only.</p>
      </div>
      <Link className="btn dark" href="/tools/liquidity-check" data-reveal>Open the Liquidity Check</Link>
    </section>
  </main>;
}
