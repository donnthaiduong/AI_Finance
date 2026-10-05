import { calculate, transfer, InputError, type ScenarioInput } from './scenario';
import { minimumPreparation } from './preparation';

export type BankPosition = { id: string; bankName: string; cert: number | null; amount: number };
export type PortfolioInput = { positions: BankPosition[]; payments: ScenarioInput['payments']; affectedId: string; unavailablePercent: number; durationDays: number };
// Fits 32 named banks and 100 payments at the allowed Unicode label lengths.
export const MAX_PORTFOLIO_REQUEST_BYTES=128000;
export type Comparison = { fingerprint: string; from: string; to: string; amount: number; before: PortfolioInput; after: PortfolioInput; beforeResult: ReturnType<typeof calculate>; afterResult: ReturnType<typeof calculate> };

export function coreInput(input: PortfolioInput): ScenarioInput {
  if (!input || typeof input !== 'object' || !Array.isArray(input.positions)) throw new InputError('A portfolio is required.');
  const ids = new Set<string>(), banks = new Set<number>(), names = new Set<string>();
  for (const p of input.positions) {
    if (!p || typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(p.id) || ids.has(p.id)) throw new InputError('Each position requires a unique stable ID.');
    if (typeof p.bankName !== 'string' || !p.bankName.trim() || p.bankName.length > 120) throw new InputError('Enter a bank name.');
    const name = p.bankName.trim().toLowerCase();
    if (names.has(name)) throw new InputError('Combine accounts at the same bank into one balance.');
    if (p.cert !== null && (!Number.isSafeInteger(p.cert) || p.cert <= 0 || banks.has(p.cert))) throw new InputError('Combine balances with the same FDIC certificate.');
    ids.add(p.id); names.add(name); if (p.cert !== null) banks.add(p.cert);
  }
  const affected = input.positions.findIndex(p => p.id === input.affectedId);
  if (affected < 0) throw new InputError('Choose an affected portfolio bank.');
  return { positions: input.positions.map((p,i) => ({ cert:i+1,amount:p.amount })), payments:input.payments, affectedCert:affected+1, unavailablePercent:input.unavailablePercent, durationDays:input.durationDays };
}
export function calculatePortfolio(input: PortfolioInput) { return calculate(coreInput(input)); }
export function normalizePortfolioInput(input:PortfolioInput):PortfolioInput {
  calculatePortfolio(input);
  return {positions:input.positions.map(p=>({id:p.id,bankName:p.bankName,cert:p.cert,amount:p.amount})),payments:input.payments.map(p=>({id:p.id,label:p.label,amount:p.amount,day:p.day})),affectedId:input.affectedId,unavailablePercent:input.unavailablePercent,durationDays:input.durationDays};
}
export function comparePortfolio(input: PortfolioInput, from: string, to: string, amount: number): Comparison {
  const beforeResult = calculatePortfolio(input);
  const source = input.positions.findIndex(p=>p.id===from), destination = input.positions.findIndex(p=>p.id===to);
  const moved = transfer(coreInput(input).positions,source+1,destination+1,amount);
  const before = structuredClone(input);
  const after = {...structuredClone(input),positions:input.positions.map((p,i)=>({...p,amount:moved[i].amount}))};
  return { fingerprint:JSON.stringify({input,from,to,amount}), from,to,amount,before,after,beforeResult,afterResult:calculatePortfolio(after) };
}
export function confirmPortfolio(input: PortfolioInput, comparison: Comparison, checked: boolean) {
  if (!checked || comparison.fingerprint !== JSON.stringify({input,from:comparison.from,to:comparison.to,amount:comparison.amount})) throw new InputError('Review and confirm a current comparison.');
  return comparePortfolio(input,comparison.from,comparison.to,comparison.amount);
}
export function minimumPortfolio(input: PortfolioInput, to: string) {
  const destination=input.positions.findIndex(p=>p.id===to);
  const result=minimumPreparation(coreInput(input),destination+1);
  if(result.status!=='feasible')return result;
  return {...result,from:input.affectedId,to,comparison:comparePortfolio(input,input.affectedId,to,result.amount)};
}
