import { calculate, transfer, type ScenarioInput } from './scenario';

export function propose(input: ScenarioInput, from: number, to: number, amount: number) {
  const before = structuredClone(input);
  const positions = transfer(before.positions, from, to, amount);
  return { fingerprint: JSON.stringify(before), from, to, amount, before,
    after: {...before, positions}, beforeResult: calculate(before), afterResult: calculate({...before, positions}) };
}
export function confirm(input: ScenarioInput, proposal: ReturnType<typeof propose>, confirmed: boolean) {
  if (!confirmed || JSON.stringify(input) !== proposal.fingerprint) throw new Error('Confirm a current proposal before applying.');
  // Recompute rather than trust a serialized or mutated proposal payload.
  const current = propose(input, proposal.from, proposal.to, proposal.amount);
  return { input: current.after, audit: {at: new Date().toISOString(), ...current} };
}
