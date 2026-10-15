'use client';
import { useMemo, useState } from 'react';
import { examplePortfolio } from '../lib/example-portfolio';
import { calculatePortfolio } from '../lib/portfolio';
import CashChart from './cash-chart';
import { tidy } from './ui';

const base = examplePortfolio();

/** The same calculation as the tool, run on the example plan; the slider changes only the unavailable share. */
export default function ExampleOutlook() {
  const [pct, setPct] = useState(base.unavailablePercent), [picked, setPicked] = useState<number | null>(null);
  const input = useMemo(() => ({ ...base, unavailablePercent: pct }), [pct]);
  const result = useMemo(() => calculatePortfolio(input), [input]);
  const day = picked ?? result.firstShortfallDay ?? 1;
  return <section className="example-outlook" aria-label="Interactive example cash plan">
    <p className="example-answer" aria-live="polite">{result.maximumShortfall > 0
      ? <>Short by <b>{tidy(result.maximumShortfall)}</b> from day <b>{result.firstShortfallDay}</b></>
      : <>Every payment is covered</>}</p>
    <label className="example-slider">Bank A unavailable: <b>{pct}%</b>
      <input type="range" min={0} max={100} step={5} value={pct} onChange={e => { setPct(Number(e.target.value)); setPicked(null); }}/>
    </label>
    <p className="example-assumption">Example plan: {input.durationDays} days, USD. Illustrative balances and payments. Simulation only.</p>
    <div data-ui><CashChart daily={result.daily} opening={result.accessibleNow} day={day} onDay={setPicked} durationDays={input.durationDays} firstShortfallDay={result.firstShortfallDay}/></div>
  </section>;
}
