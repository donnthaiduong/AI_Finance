'use client';
import { useState } from 'react';
import type { PortfolioInput, Comparison } from '../lib/portfolio';
import { calculatePortfolio } from '../lib/portfolio';
import { AlertTriangle, CheckCircle2, CircleDashed, ArrowRight } from 'lucide-react';
import { BarList, HelpTip, MarketChart, Money, exact, tidy } from './ui';

/** Same user assumptions applied to each bank in turn. Not a forecast and not drawn from bank evidence. */
export function bankExposure(input:PortfolioInput){
 return input.positions.map(p=>{try{const r=calculatePortfolio({...input,affectedId:p.id});return {id:p.id,name:p.bankName||'Unnamed bank',amount:p.amount,shortfall:r.maximumShortfall,firstDay:r.firstShortfallDay};}catch{return {id:p.id,name:p.bankName||'Unnamed bank',amount:p.amount,shortfall:0,firstDay:null as number|null};}});
}

export type Prep={destination:string;options:{id:string;name:string}[];onFind:(id:string)=>void;onDestination:(id:string)=>void;checked:boolean;onChecked:(v:boolean)=>void;onConfirm:()=>void;notice:string;onDismissNotice:()=>void};

function Kpi({label,tip,help,value,note,tone,whole:w}:{label:string;tip:string;help:string;value:number;note:string;tone?:'bad'|'good';whole?:boolean}){
 return <div className={'kpi '+(tone??'')}><div className="kpi-top"><span>{label}</span><HelpTip title={tip}>{help}</HelpTip></div><strong><Money value={value} whole={w}/></strong><small>{note}</small></div>;
}

export default function LiquidityOverview({input,result,comparison,onEdit,onScenario,prep,onPlan,assumptionsReviewed=true}:{assumptionsReviewed?:boolean;input:PortfolioInput;result:ReturnType<typeof calculatePortfolio>;comparison:Comparison|null;onEdit:(step:number)=>void;onScenario:()=>void;onPlan?:()=>void;prep?:Prep}){
 const [pickedDay,setDay]=useState<number|null>(null);
 const day=pickedDay??result.firstShortfallDay??1;
 const selected=result.daily[day-1];
 const payments=[...input.payments].sort((a,b)=>a.day-b.day);
 const affected=input.positions.find(p=>p.id===input.affectedId);
 const pending=result.coverage==='insufficient-input';
 const short=result.maximumShortfall>0;
 const firstDue=result.firstShortfallDay?payments.filter(p=>p.day===result.firstShortfallDay).map(p=>p.label||'Payment'):[];
 const minStressed=Math.min(...result.daily.map(d=>d.stressed));
 const exposure=bankExposure(input),worst=[...exposure].sort((a,b)=>b.shortfall-a.shortfall)[0];
 const scope=exposure.length<2?'Only one bank is entered, so no other bank can be compared.':worst.shortfall===0?`The same assumptions applied to each of your ${exposure.length} banks in turn: every case is covered.`:worst.id===input.affectedId?`Across your ${exposure.length} banks, ${worst.name} has the largest shortfall under the same assumptions.`:`Under the same assumptions, ${worst.name} would have a larger shortfall than this one: ${tidy(worst.shortfall)}.`;
 const largest=input.positions.reduce((m,p)=>p.amount>m.amount?p:m,input.positions[0]);
 const shareOf=(v:number)=>result.total?(v/result.total*100):0;
 const unaffected=input.positions.filter(p=>p.id!==input.affectedId);
 const defaultDest=(unaffected.length?unaffected.reduce((m,p)=>p.amount>m.amount?p:m,unaffected[0]).id:'');
 const [dest,setDest]=useState('');
 const destination=prep?.options.some(o=>o.id===dest)?dest:prep?.options.some(o=>o.id===prep.destination)?prep.destination:defaultDest;
 const tone=pending?'pending':short?'risk':'ok';
 const Icon=pending?CircleDashed:short?AlertTriangle:CheckCircle2;
 const bankName=(id:string)=>input.positions.find(p=>p.id===id)?.bankName||'Removed bank';

 return <div className="overview-surface">
 <section className={'card hero '+tone} aria-label="Result summary">
  <div className="hero-main">
   <span className="hero-icon"><Icon size={26}/></span>
   <div>
    <p className="eyebrow">{pending?'NEXT STEP':assumptionsReviewed?'RESULT UNDER YOUR ASSUMPTIONS':'RESULT UNDER DEFAULT ASSUMPTIONS'}</p>
    <h2>{pending?'Add your essential payments to see coverage.':short?<>If {affected?.bankName||'the selected bank'} is {input.unavailablePercent}% unavailable for {input.durationDays} days, you are <em>{tidy(result.maximumShortfall)}</em> short{result.firstShortfallDay?<> from <em>day {result.firstShortfallDay}</em>{firstDue.length?` (${firstDue.join(', ')})`:''}</>:''}.</>:<>Your entered cash covers every scheduled payment, even if {affected?.bankName||'the selected bank'} is {input.unavailablePercent}% unavailable for {input.durationDays} days.</>}</h2>
    <p className="hero-sub">{pending?'Without obligations there is nothing to compare your cash against.':short?'Shortfall means obligations that would go unpaid because the cash is not accessible in time. This is a plan, not a transfer: no real money moves.':'This is a simulation of one hypothetical interruption, not a prediction. Processing delays and future receipts are not modelled.'}</p>
    {!pending&&<p className="scope-note"><b>All banks:</b> {scope}</p>}
    <div className="chips"><span className="chip">{affected?.bankName||'—'}</span><span className="chip">{input.unavailablePercent}% unavailable</span><span className="chip">{input.durationDays} days</span><button className="quiet-link" onClick={onScenario}>{assumptionsReviewed||pending?'Change assumptions':'Review default assumptions'}</button></div>
   </div>
  </div>
  <div className="hero-action">
   {pending?<><p className="small">Payroll, suppliers and rent are the usual essentials.</p><button className="primary" onClick={()=>onEdit(1)}>Add essential payments <ArrowRight size={16}/></button></>
   :!short?<><p className="small">Cash is covered under these assumptions. Next, put the assumptions and result on one page.</p><button className="primary" onClick={onPlan}>Create one-page plan <ArrowRight size={16}/></button><button className="quiet" onClick={onScenario}>Test another scenario</button></>
   :prep&&!unaffected.length?<><div className="action-title"><b>No other bank to move cash to</b></div><p className="small">Preparation moves cash from the affected bank to another bank before the interruption. With one bank there is nothing to reallocate. Add another bank you hold cash at, or test a smaller percentage or shorter duration.</p><button className="primary" onClick={()=>onEdit(0)}>Add another bank <ArrowRight size={16}/></button><button className="quiet" onClick={onScenario}>Change assumptions</button></>
   :prep?<>
    <div className="action-title"><b>Move cash before the freeze</b><HelpTip title="Minimum preparation">The smallest amount to move out of the affected bank into another bank <i>before</i> the interruption so scheduled payments stay covered. It is found by the same exact calculation, to the cent. Nothing is applied until you confirm.</HelpTip></div>
    <label className="field">Move to<select value={destination} onChange={e=>{setDest(e.target.value);prep.onDestination(e.target.value);}}>{prep.options.map(o=><option key={o.id} value={o.id}>{o.name||'Unnamed bank'}</option>)}</select></label>
    {!comparison&&<button className="primary" onClick={()=>prep.onFind(destination)}>Find minimum preparation</button>}
    {comparison&&<div className="proposal inline">
     <p><b>Move {exact(comparison.amount)}</b> from {bankName(comparison.from)} to {bankName(comparison.to)}.</p>
     <p className="before-after"><span>Shortfall</span><b className="bad-text">{exact(comparison.beforeResult.maximumShortfall)}</b><ArrowRight size={14}/><b className="good-text">{exact(comparison.afterResult.maximumShortfall)}</b></p>
     <label className="confirm"><input type="checkbox" checked={prep.checked} onChange={e=>prep.onChecked(e.target.checked)}/>I reviewed this and want it applied to my simulation. Confirm that destination can pay on time and cutoffs allow it.</label>
     <button className="primary" disabled={!prep.checked} onClick={prep.onConfirm}>Confirm simulation</button>
    </div>}
   </>:<button className="primary" onClick={onScenario}>Review in Scenario Lab <ArrowRight size={16}/></button>}
  </div>
 </section>

 <div className="kpis">
  <Kpi label="Total cash" tip="Total cash" help="The sum of every bank balance you entered. These are your own figures, not read from a bank." value={result.total} note={`${input.positions.length} bank${input.positions.length===1?'':'s'} · entered balances`}/>
  <Kpi label="Available at interruption" tip="Available at interruption" help="Total cash minus the part you assume is temporarily unavailable at the affected bank. This is a user assumption, not a forecast." value={result.accessibleNow} note={`${exact(result.blocked)} temporarily unavailable`} tone="good"/>
  <Kpi label="Essential payments" tip="Essential payments" help="All scheduled obligations in the next 30 days that you entered. They are plans, not completed transactions." value={result.expenses} note={`${input.payments.length} obligation${input.payments.length===1?'':'s'} · next 30 days`}/>
  <Kpi label="Maximum shortfall" tip="Maximum shortfall" help="The largest amount of obligations left unpaid on any day in the scenario. It is $0 when entered cash covers everything. It is not credit and not a bank-failure probability." value={result.maximumShortfall} note={pending?'Add payments to assess':result.firstShortfallDay?`First appears on day ${result.firstShortfallDay}`:'Entered obligations covered'} tone={short?'bad':undefined}/>
 </div>

 <section className="card chart-panel" aria-label="Cash outlook">
  <div className="panel-head">
   <div><h2>{pending?'30-day cash outlook':short?`Cash first falls below zero on day ${result.firstShortfallDay}`:'Cash stays at or above zero every day'} <HelpTip title="Cash outlook">Cash left after each day&apos;s scheduled payments. The solid blue line applies your interruption; the dashed grey line shows no interruption. Payments due are drawn beneath on the same days; red bars are days with unmet obligations. Hover, tap, or use the arrow keys to inspect any day.</HelpTip></h2><p>30-day cash outlook · cash left after scheduled obligations, with payments due beneath</p></div>
   <dl className="stat-row"><div><dt>Lowest cash left <HelpTip title="Lowest cash left">The smallest end-of-day balance across the 30 days in your scenario. Below zero means unmet obligations.</HelpTip></dt><dd className={minStressed<0?'bad-text':''}>{tidy(minStressed)}</dd></div><div><dt>Funds return</dt><dd>{input.durationDays<30?`Day ${input.durationDays+1}`:'After day 30'}</dd></div></dl>
  </div>
  <div className="chart-legend"><span><i className="lg-line scenario"/>Selected interruption</span><span><i className="lg-line baseline"/>No interruption</span>{comparison&&<span><i className="lg-line prepared"/>Proposed allocation</span>}<span><i className="lg-box due"/>Payment due</span><span><i className="lg-box short"/>Unmet payment day</span></div>
  <MarketChart daily={result.daily} proposed={comparison?.afterResult.daily} day={day} onDay={setDay} durationDays={input.durationDays} firstShortfallDay={result.firstShortfallDay}/>
  <p className="small muted">Days count from the start of your hypothetical interruption. Negative values are unmet obligations. The line steps because your balance only changes on days a payment is due. Future receipts and processing delays are excluded.</p>
  <p className="source-note">Source: balances and payments you entered · Assumption: {affected?.bankName||'selected bank'}, {input.unavailablePercent}% unavailable for {input.durationDays} days · Simulation, not a forecast</p>
 </section>

 <div className="two-up">
  <section className="card">
   <div className="section-heading"><div><h2>{largest?.bankName||'One bank'} holds {shareOf(largest?.amount??0).toFixed(0)}% of your cash <HelpTip title="Cash by bank">How your total cash is split across the banks you entered. Accounts at the same bank should be combined.</HelpTip></h2><p>Cash by bank, largest first</p></div><button className="quiet" onClick={()=>onEdit(0)}>Manage banks</button></div>
   <BarList ariaLabel="Cash by bank" rows={[...input.positions].sort((a,b)=>b.amount-a.amount).map(p=>({key:p.id,label:(p.bankName||'Unnamed bank')+(p.id===input.affectedId?' (selected)':''),value:p.amount,text:`${exact(p.amount)} · ${shareOf(p.amount).toFixed(1)}%`,tone:p.id===input.affectedId?'accent' as const:'muted' as const}))}/>
   <p className="source-note">Source: balances you entered, not read from a bank.</p>
  </section>
  <section className="card">
   <div className="section-heading"><div><h2>Shortfall if each bank were the one interrupted <HelpTip title="Each bank in turn">Your {input.unavailablePercent}% and {input.durationDays} days are applied to each bank in turn. These are your assumptions, not a forecast, and nothing here draws on public bank data. Minimum preparation is calculated for the selected bank only.</HelpTip></h2><p>Same {input.unavailablePercent}% unavailable for {input.durationDays} days, each bank in turn</p></div></div>
   <BarList ariaLabel="Shortfall if each bank were interrupted" rows={[...exposure].sort((a,b)=>b.shortfall-a.shortfall).map(r=>({key:r.id,label:r.name+(r.id===input.affectedId?' (selected)':''),value:r.shortfall,text:r.shortfall>0?exact(r.shortfall):'Covered',note:r.firstDay?`First short day ${r.firstDay}`:undefined,tone:r.shortfall>0?'bad' as const:'muted' as const}))}/>
   <p className="source-note">Source: balances and payments you entered.</p>
  </section>
 </div>

 <section className="card">
  <div className="section-heading"><div><h2>Upcoming obligations</h2><p>Planned obligations, not completed transactions</p></div><button className="quiet" onClick={()=>onEdit(1)}>Manage payments</button></div>
  {payments.length?<div className="table-scroll" role="region" aria-label="Upcoming obligations" tabIndex={0}><table className="ob-table"><thead><tr><th>Day</th><th>Payment</th><th className="num">Amount</th><th>Status</th></tr></thead><tbody>{payments.slice(0,8).map(p=>{const gap=!!result.daily[p.day-1]?.shortfall;return <tr key={p.id}><td>{p.day}</td><td>{p.label||'Payment'}</td><td className="num">{exact(p.amount)}</td><td className={gap?'bad-text':'good-text'}>{gap?'Cash gap on this day':'Covered under assumptions'}</td></tr>;})}</tbody></table></div>:<p>No payments yet. Add your essentials to get a meaningful result.</p>}
  {payments.length>8&&<button className="quiet" onClick={()=>onEdit(1)}>View all {payments.length} obligations →</button>}
  <p className="source-note">Source: payments you entered.</p>
 </section>
 </div>;
}
