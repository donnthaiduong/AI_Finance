export type Position = { cert: number; amount: number };
export type Payment = { id: string; label: string; amount: number; day: number };
export type ScenarioInput = { positions: Position[]; payments: Payment[]; affectedCert: number; unavailablePercent: number; durationDays: number };
export class InputError extends Error {}
const cents = (x: number) => Math.round(x * 100);
function money(x: number) { if (!Number.isFinite(x) || x < 0 || x > 1e10 || Math.abs(x * 100 - Math.round(x * 100)) > 0.0001) throw new InputError('Amounts must be non-negative USD values with at most two decimals.'); return cents(x); }
export function validatePortfolio(positions: Position[], payments: Payment[]) {
  if (!Array.isArray(positions) || positions.length < 1 || positions.length > 32 || !Array.isArray(payments) || payments.length > 100) throw new InputError('Choose 1–32 banks and at most 100 payments.');
  const seen = new Set<number>();
  for (const p of positions) { if (!p || !Number.isSafeInteger(p.cert) || p.cert <= 0 || seen.has(p.cert)) throw new InputError('Each bank must have one valid, unique certificate.'); seen.add(p.cert); money(p.amount); }
  const ids = new Set<string>();
  for (const p of payments) { if (!p || typeof p.id !== 'string' || !p.id.trim() || p.id.length > 120 || ids.has(p.id) || typeof p.label !== 'string' || !p.label.trim() || p.label.length > 120 || !Number.isInteger(p.day) || p.day < 1 || p.day > 30) throw new InputError('Payments need a unique ID, a label and a day from 1 to 30.'); ids.add(p.id); money(p.amount); }
}
export function calculate(input: ScenarioInput) {
  validatePortfolio(input.positions, input.payments);
  if (!input.positions.some(p => p.cert === input.affectedCert) || !Number.isFinite(input.unavailablePercent) || input.unavailablePercent < 0 || input.unavailablePercent > 100 || !Number.isInteger(input.durationDays) || input.durationDays < 1 || input.durationDays > 30) throw new InputError('Choose a portfolio bank, 0–100% unavailable and 1–30 days.');
  const total = input.positions.reduce((s, p) => s + cents(p.amount), 0);
  const blocked = Math.round(cents(input.positions.find(p => p.cert === input.affectedCert)!.amount) * input.unavailablePercent / 100);
  let spent = 0, maximumShortfall = 0, firstShortfallDay: number | null = null;
  const daily = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const due = input.payments.filter(p => p.day === day).reduce((s, p) => s + cents(p.amount), 0);
    spent += due;
    // A duration of D means unavailable on days 1..D, returning at start of D+1.
    const available = total - (day <= input.durationDays ? blocked : 0) - spent;
    const shortfall = Math.max(0, -available);
    maximumShortfall = Math.max(maximumShortfall, shortfall);
    if (shortfall && firstShortfallDay === null) firstShortfallDay = day;
    return { day, due: due / 100, baseline: (total - spent) / 100, stressed: available / 100, shortfall: shortfall / 100 };
  });
  return { total: total / 100, blocked: blocked / 100, accessibleNow: (total - blocked) / 100, expenses: spent / 100, maximumShortfall: maximumShortfall / 100, firstShortfallDay, concentration: total ? Math.max(...input.positions.map(p => cents(p.amount))) / total : 0, daily, assumptions: 'No inflows, interest or fees. Funds return at start of day duration+1. Shortfalls are unmet obligations, not automatic credit.' };
}
export function transfer(positions: Position[], from: number, to: number, amount: number) {
  validatePortfolio(positions, []); const value = money(amount);
  const source = positions.find(p => p.cert === from), target = positions.find(p => p.cert === to);
  if (!source || !target || from === to || value <= 0 || value > cents(source.amount)) throw new InputError('Select two different portfolio banks and a positive amount within the source balance.');
  const next = positions.map(p => ({ ...p, amount: (cents(p.amount) + (p.cert === to ? value : p.cert === from ? -value : 0)) / 100 }));
  validatePortfolio(next, []);
  return next;
}
