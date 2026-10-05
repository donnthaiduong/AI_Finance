import { calculate, transfer, validatePortfolio, type Position, type ScenarioInput } from './scenario';

export type Activity = {at:string;from:number;to:number;amount:number;before:Position[];after:Position[];
  scenario?:ScenarioInput;beforeResult?:ReturnType<typeof calculate>;afterResult?:ReturnType<typeof calculate>};
export type Session = {schemaVersion:1;positions:ScenarioInput['positions'];payments:ScenarioInput['payments'];
  scenario:ScenarioInput;audit:Activity[];evidenceVersion?:string;modelVersion?:string};

export function parseSession(value:unknown):Session {
  if (!value || typeof value !== 'object') throw new Error('Simulation must be a JSON object.');
  const s=value as Partial<Session>;
  if (s.schemaVersion!==undefined && s.schemaVersion!==1) throw new Error('Unsupported simulation version.');
  validatePortfolio(s.positions!,s.payments!);
  const positions=structuredClone(s.positions!), payments=structuredClone(s.payments!);
  const scenario=s.scenario ? {...s.scenario,positions,payments} : {positions,payments,affectedCert:positions[0].cert,unavailablePercent:80,durationDays:21};
  calculate(scenario);
  if (s.audit!==undefined && (!Array.isArray(s.audit) || s.audit.length>50)) throw new Error('Invalid activity history.');
  const audit=(s.audit||[]).map(a=>{
    if (!a || typeof a.at!=='string' || !Number.isFinite(Date.parse(a.at))) throw new Error('Invalid activity date.');
    validatePortfolio(a.before,[]);validatePortfolio(a.after,[]);
    const after=transfer(a.before,a.from,a.to,a.amount);
    if (JSON.stringify(after)!==JSON.stringify(a.after)) throw new Error('Activity allocation does not match its transfer.');
    const entry:Activity={at:a.at,from:a.from,to:a.to,amount:a.amount,before:structuredClone(a.before),after};
    if(a.scenario){entry.scenario={...a.scenario,positions:entry.before};entry.beforeResult=calculate(entry.scenario);entry.afterResult=calculate({...entry.scenario,positions:after});}
    return entry;
  });
  const version=(v:unknown)=>typeof v==='string' && /^[a-zA-Z0-9-]{1,100}$/.test(v)?v:undefined;
  return {schemaVersion:1,positions,payments,scenario,audit,evidenceVersion:version(s.evidenceVersion),modelVersion:version(s.modelVersion)};
}

export function serializeSession(input:ScenarioInput,audit:Activity[],versions:{evidenceVersion?:string;modelVersion?:string}={}) {
  return JSON.stringify(parseSession({schemaVersion:1,positions:input.positions,payments:input.payments,scenario:input,audit,...versions}),null,2);
}
