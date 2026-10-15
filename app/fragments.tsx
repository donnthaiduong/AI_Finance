import { examplePortfolio } from '../lib/example-portfolio';
import { calculatePortfolio, minimumPortfolio } from '../lib/portfolio';

// Cropped, read-only fragments of the Liquidity Check, computed by the same functions as the tool on the example plan.
// They are pictures of the product: nothing here is a control, and no figure is typed in by hand.
const input = examplePortfolio();
const result = calculatePortfolio(input);
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const usd2 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const affected = input.positions.find(p => p.id === input.affectedId)!;
const name = (id: string) => input.positions.find(p => p.id === id)?.bankName ?? '';

export function AnswerFragment() {
  return <div className="ui" data-ui role="group" aria-label={`Result: short by ${usd(result.maximumShortfall)} from day ${result.firstShortfallDay}`}>
    <p className="ui-answer">Short by <b>{usd(result.maximumShortfall)}</b> from day <b>{result.firstShortfallDay}</b></p>
    <p className="ui-note">If {affected.bankName} is {input.unavailablePercent}% unavailable for {input.durationDays} days.</p>
    <dl>
      <div><dt>Total cash</dt><dd>{usd(result.total)}</dd></div>
      <div><dt>Available at interruption</dt><dd>{usd(result.accessibleNow)}</dd></div>
      <div><dt>Essential payments</dt><dd>{usd(result.expenses)}</dd></div>
    </dl>
  </div>;
}

export function ProposalFragment() {
  const p = minimumPortfolio(input, 'demo-b');
  if (p.status !== 'feasible') return null;
  const c = p.comparison;
  return <div className="ui" data-ui role="group" aria-label={`Minimum preparation: move ${usd2(c.amount)} from ${name(c.from)} to ${name(c.to)}`}>
    <p className="ui-title">Move cash before the freeze</p>
    <p className="ui-answer">Move <b>{usd2(c.amount)}</b> from {name(c.from)} to {name(c.to)}</p>
    <dl>
      <div><dt>Shortfall before</dt><dd className="bad">{usd2(c.beforeResult.maximumShortfall)}</dd></div>
      <div><dt>Shortfall after</dt><dd className="good">{usd2(c.afterResult.maximumShortfall)}</dd></div>
    </dl>
    <p className="ui-note">Applied to the simulation only after you confirm.</p>
  </div>;
}

export function PaymentsFragment() {
  return <div className="ui" data-ui role="group" aria-label="Payments by day and whether cash covers them">
    <p className="ui-title">Planned payments</p>
    <table><thead><tr><th>Day</th><th>Payment</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>{[...input.payments].sort((a, b) => a.day - b.day).map(pay => {
        const gap = result.daily[pay.day - 1].shortfall > 0;
        return <tr key={pay.id}><td>{pay.day}</td><td>{pay.label}</td><td>{usd(pay.amount)}</td><td className={gap ? 'bad' : ''}>{gap ? 'Cash gap' : 'Covered'}</td></tr>;
      })}</tbody></table>
  </div>;
}

export function BanksFragment() {
  return <div className="ui" data-ui role="group" aria-label="Cash by bank, and the shortfall if each bank were the one interrupted">
    <p className="ui-title">If each bank were the one interrupted</p>
    <table><thead><tr><th>Bank</th><th>Cash</th><th>Shortfall</th></tr></thead>
      <tbody>{input.positions.map(pos => {
        const s = calculatePortfolio({ ...input, affectedId: pos.id }).maximumShortfall;
        return <tr key={pos.id}><td>{pos.bankName}</td><td>{usd(pos.amount)}</td><td className={s > 0 ? 'bad' : ''}>{s > 0 ? usd(s) : 'Covered'}</td></tr>;
      })}</tbody></table>
    <p className="ui-note">Same {input.unavailablePercent}% for {input.durationDays} days, each bank in turn.</p>
  </div>;
}

export function AssumptionsFragment() {
  return <div className="ui" data-ui role="group" aria-label={`Assumptions: ${affected.bankName}, ${input.unavailablePercent}% unavailable, ${input.durationDays} days`}>
    <p className="ui-title">Your assumptions</p>
    <dl>
      <div><dt>Bank that becomes unavailable</dt><dd>{affected.bankName}</dd></div>
      <div><dt>Share you could not use</dt><dd>{input.unavailablePercent}%</dd></div>
      <div><dt>For how many days</dt><dd>{input.durationDays}</dd></div>
    </dl>
    <p className="ui-note">These are yours. Public bank data never sets them.</p>
  </div>;
}
