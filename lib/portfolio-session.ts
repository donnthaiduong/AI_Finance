import { parseSession, type Activity } from './session';
import { calculatePortfolio, comparePortfolio, normalizePortfolioInput, type PortfolioInput, type BankPosition } from './portfolio';

export type PortfolioActivity = { at: string; from: string; to: string; amount: number; before: PortfolioInput; after: PortfolioInput };
export type PortfolioSession = { schemaVersion:2; input:PortfolioInput; activity:PortfolioActivity[]; legacyActivity?:Activity[] };
const legacyPositions=(positions:{cert:number;amount:number}[]):BankPosition[]=>positions.map(p=>({id:'fdic-'+p.cert,bankName:'Bank '+p.cert,cert:p.cert,amount:p.amount}));
function legacyInput(input:ReturnType<typeof parseSession>['scenario']):PortfolioInput {
  return {positions:legacyPositions(input.positions),payments:input.payments,affectedId:'fdic-'+input.affectedCert,unavailablePercent:input.unavailablePercent,durationDays:input.durationDays};
}
function sessionInput(input:PortfolioInput):PortfolioInput {
  if(Array.isArray(input?.positions)&&input.positions.length===0){
    if(input.affectedId!=='' || !Array.isArray(input.payments) || input.payments.length!==0)throw new Error('Empty portfolio must have no affected bank or payments.');
    calculatePortfolio({...input,positions:[{id:'validation',bankName:'Validation',cert:null,amount:0}],affectedId:'validation'});
    return {positions:[],payments:[],affectedId:'',unavailablePercent:input.unavailablePercent,durationDays:input.durationDays};
  }
  return normalizePortfolioInput(input);
}
export function parsePortfolioSession(value:unknown):PortfolioSession {
  if(!value || typeof value!=='object')throw new Error('Simulation must be a JSON object.');
  const raw=value as Partial<PortfolioSession>;
  if(raw.schemaVersion!==2){
    const old=parseSession(value);
    const input=legacyInput(old.scenario);
    const activity=old.audit.filter(a=>a.scenario).map(a=>{
      const before=legacyInput(a.scenario!);
      const comparison=comparePortfolio(before,'fdic-'+a.from,'fdic-'+a.to,a.amount);
      return {at:a.at,from:comparison.from,to:comparison.to,amount:a.amount,before,after:comparison.after};
    });
    return {schemaVersion:2,input,activity,legacyActivity:old.audit.filter(a=>!a.scenario)};
  }
  const input=sessionInput(raw.input!);
  if(!Array.isArray(raw.activity) || raw.activity.length>50)throw new Error('Invalid activity history.');
  const activity=raw.activity.map(a=>{
    if(!a || typeof a.at!=='string' || !Number.isFinite(Date.parse(a.at)))throw new Error('Invalid activity date.');
    const comparison=comparePortfolio(sessionInput(a.before),a.from,a.to,a.amount);
    if(JSON.stringify(comparison.after)!==JSON.stringify(sessionInput(a.after)))throw new Error('Activity does not match its reviewed transfer.');
    return {at:a.at,from:a.from,to:a.to,amount:a.amount,before:comparison.before,after:comparison.after};
  });
  if(raw.legacyActivity!==undefined && (!Array.isArray(raw.legacyActivity) || raw.legacyActivity.length>50))throw new Error('Invalid legacy history.');
  const legacyActivity=(raw.legacyActivity||[]).map(a=>parseSession({positions:a.before,payments:[],audit:[a]}).audit[0]);
  return {schemaVersion:2,input,activity,legacyActivity};
}
export function serializePortfolioSession(input:PortfolioInput,activity:PortfolioActivity[],legacyActivity:Activity[]=[]) {
  return JSON.stringify(parsePortfolioSession({schemaVersion:2,input,activity,legacyActivity}),null,2);
}
