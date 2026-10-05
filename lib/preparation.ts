import { calculate, transfer, InputError, type ScenarioInput } from './scenario';

/** Minimum reallocation BEFORE the selected bank interruption, to an unaffected bank. */
export function minimumPreparation(input: ScenarioInput, destination: number) {
  const before = calculate(input);
  if (before.coverage === 'insufficient-input') return { status: 'insufficient-input' as const, amount: 0, before };
  if (!before.maximumShortfall) return { status: 'not-needed' as const, amount: 0, before };
  if (before.expenses > before.total) return { status: 'infeasible' as const, amount: 0, before, reason: 'Scheduled obligations exceed total existing funds. Reallocation cannot create money.' };
  if (destination === input.affectedCert || !input.positions.some(p => p.cert === destination)) throw new InputError('Choose a different portfolio bank as destination.');
  const from = input.affectedCert;
  const sourceCents = Math.round(input.positions.find(p => p.cert === from)!.amount * 100);
  const destinationCents = Math.round(input.positions.find(p => p.cert === destination)!.amount * 100);
  // The supported per-bank input ceiling must also hold after a preparation.
  const maximum = Math.min(sourceCents, 1e12 - destinationCents);
  const resultAt = (value: number) => calculate({ ...input, positions: transfer(input.positions, from, destination, value / 100) });
  if (!maximum || resultAt(maximum).maximumShortfall > 0) return { status: 'infeasible' as const, amount: 0, before, reason: 'No feasible reallocation to this destination within supported balance limits and the entered assumptions.' };
  let low = 1, high = maximum;
  // Blocked cents decrease monotonically as the source balance decreases.
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (resultAt(middle).maximumShortfall === 0) high = middle;
    else low = middle + 1;
  }
  return { status: 'feasible' as const, from, to: destination, amount: low / 100, before, after: resultAt(low) };
}
