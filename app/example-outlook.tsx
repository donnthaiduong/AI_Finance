'use client';
import { useState } from 'react';
import { examplePortfolio } from '../lib/example-portfolio';
import { calculatePortfolio } from '../lib/portfolio';
import CashChart from './cash-chart';
import { tidy } from './ui';

const input = examplePortfolio(), result = calculatePortfolio(input);
export default function ExampleOutlook() {
  const [day, setDay] = useState(result.firstShortfallDay ?? 1);
  return <section className="example-outlook" aria-label="Interactive example cash plan">
    <div className="example-top"><span className="example-badge">Example plan</span><span>USD · 30 days</span></div>
    <div className="example-result"><div><span>Cash shortfall</span><strong>{tidy(result.maximumShortfall)}</strong></div><div><span>First gap</span><strong>Day {result.firstShortfallDay}</strong></div></div>
    <p className="example-assumption">Bank A · {input.unavailablePercent}% unavailable · {input.durationDays} days</p>
    <CashChart daily={result.daily} opening={result.accessibleNow} day={day} onDay={setDay} durationDays={input.durationDays} firstShortfallDay={result.firstShortfallDay}/>
    <p className="source-note">Illustrative balances and payments. Simulation only.</p>
  </section>;
}
