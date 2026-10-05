import { calculate, type ScenarioInput } from './scenario';
export function explain(input:ScenarioInput) {
  const r=calculate(input);const usd=(x:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(x);
  if (r.coverage === 'insufficient-input') return 'Add at least one positive scheduled obligation before assessing coverage. A zero shortfall without payments is not a completed assessment.';
  return `Under your assumption of ${input.unavailablePercent}% unavailable for ${input.durationDays} days, ${usd(r.blocked)} is temporarily inaccessible. ${r.firstShortfallDay===null?'All scheduled obligations remain covered.':`The first unmet obligation occurs on day ${r.firstShortfallDay}; the maximum cumulative shortfall is ${usd(r.maximumShortfall)}.`} Total scheduled outflows are ${usd(r.expenses)}. Compare a simulated allocation below; review it before applying. Bank model signals do not set the unavailable percentage.`;
}
export function answer(question:string,input:ScenarioInput) {
  if(/ignore|system prompt|transfer real|send money|execute|secret|api.key|withdraw/i.test(question))return 'I can explain this simulated portfolio and compare allocations. I cannot execute banking transactions or reveal credentials.';
  if(!/liquid|cash|payroll|scenario|shortfall|expense|cover|risk|payment|fund|plan/i.test(question))return 'Ask whether this scenario covers your payments, or use the allocation comparison. All calculations use the inputs shown here.';
  return explain(input);
}
