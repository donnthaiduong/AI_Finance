'use client';
import { useState } from 'react';
import type { PortfolioInput, Comparison } from '../lib/portfolio';
import { calculatePortfolio } from '../lib/portfolio';
import { AlertTriangle, CheckCircle2, CircleDashed, ArrowRight } from 'lucide-react';
import { BANK_COLORS, CashChart, Donut, DueBars, Gauge, HelpTip, Money, exact, whole } from './ui';

export type Prep={destination:string;options:{id:string;name:string}[];onFind:(id:string)=>void;checked:boolean;onChecked:(v:boolean)=>void;onConfirm:()=>void;notice:string;onDismissNotice:()=>void};

function Kpi({label,tip,help,value,note,tone,whole:w}:{label:string;tip:string;help:string;value:number;note:string;tone?:'bad'|'good';whole?:boolean}){
 return <div className={'kpi '+(tone??'')}><div className="kpi-top"><span>{label}</span><HelpTip title={tip}>{help}</HelpTip></div><strong><Money value={value} whole={w}/></strong><small>{note}</small></div>;
}

export default function LiquidityOverview({input,result,comparison,onEdit,onScenario,compact=false,prep}:{compact?:boolean;input:PortfolioInput;result:ReturnType<typeof calculatePortfolio>;comparison:Comparison|null;onEdit:(step:number)=>void;onScenario:()=>void;prep?:Prep}){
 const [pickedDay,setDay]=useState<number|null>(null);
 const day=pickedDay??result.firstShortfallDay??1;
 const selected=result.daily[day-1];
 const payments=[...input.payments].sort((a,b)=>a.day-b.day);
 const affected=input.positions.find(p=>p.id===input.affectedId);
 const pending=result.coverage==='insufficient-input';
 const short=result.maximumShortfall>0;
 const firstDue=result.firstShortfallDay?payments.filter(p=>p.day===result.firstShortfallDay).map(p=>p.label||'Payment'):[];
 const minStressed=Math.min(...result.daily.map(d=>d.stressed));
 const largest=input.positions.reduce((m,p)=>p.amount>m.amount?p:m,input.positions[0]);
 const shareOf=(v:number)=>result.total?(v/result.total*100):0;
 const unaffected=input.positions.filter(p=>p.id!==input.affectedId);
 const defaultDest=(unaffected.length?unaffected.reduce((m,p)=>p.amount>m.amount?p:m,unaffected[0]).id:'');
 const [dest,setDest]=useState('');
 const destination=prep?.options.some(o=>o.id===dest)?dest:prep?.options.some(o=>o.id===prep.destination)?prep.destination:defaultDest;
 const tone=pending?'pending':short?'risk':'ok';
 const Icon=pending?CircleDashed:short?AlertTriangle:CheckCircle2;
 const bankName=(id:string)=>input.positions.find(p=>p.id===id)?.bankName||'Removed bank';
 const hasDraw=!compact;

 return <div className={compact?'overview-surface compact-outlook':'overview-surface'}>
 {hasDraw&&<section className={'card hero '+tone} aria-label="Result summary">
  <div className="hero-main">
   <span className="hero-icon"><Icon size={26}/></span>
   <div>
    <p className="eyebrow">{pending?'NEXT STEP':'RESULT UNDER YOUR ASSUMPTIONS'}</p>
    <h2>{pending?'Add your essential payments to see coverage.':short?<>If {affected?.bankName||'the selected bank'} is {input.unavailablePercent}% unavailable for {input.durationDays} days, you are <em>{exact(result.maximumShortfall)}</em> short{result.firstShortfallDay?<> from <em>day {result.firstShortfallDay}</em>{firstDue.length?` (${firstDue.join(', ')})`:''}</>:''}.</>:<>Your entered cash covers every scheduled payment, even if {affected?.bankName||'the selected bank'} is {input.unavailablePercent}% unavailable for {input.durationDays} days.</>}</h2>
    <p className="hero-sub">{pending?'Without obligations there is nothing to compare your cash against.':short?'Shortfall means obligations that would go unpaid because the cash is not accessible in time. This is a plan, not a transfer: no real money moves.':'This is a simulation of one hypothetical interruption, not a prediction. Other banks and processing delays are not modelled.'}</p>
    <div className="chips"><span className="chip">{affected?.bankName||'—'}</span><span className="chip">{input.unavailablePercent}% unavailable</span><span className="chip">{input.durationDays} days</span><button className="quiet-link" onClick={onScenario}>Change assumptions</button></div>
   </div>
  </div>
  <div className="hero-action">
   {pending?<><p className="small">Payroll, suppliers and rent are the usual essentials.</p><button className="primary" onClick={()=>onEdit(1)}>Add essential payments <ArrowRight size={16}/></button></>
   :!short?<><p className="small">Open Scenario Lab to test other durations or percentages.</p><button className="primary" onClick={onScenario}>Test another scenario <ArrowRight size={16}/></button></>
   :prep&&unaffected.length?<>
    <div className="action-title"><b>Move cash before the freeze</b><HelpTip title="Minimum preparation">The smallest amount to move out of the affected bank into another bank <i>before</i> the interruption so scheduled payments stay covered. It is found by the same exact calculation, to the cent. Nothing is applied until you confirm.</HelpTip></div>
    <label className="field">Move to<select value={destination} onChange={e=>setDest(e.target.value)}>{prep.options.map(o=><option key={o.id} value={o.id}>{o.name||'Unnamed bank'}</option>)}</select></label>
    {!comparison&&<button className="primary" onClick={()=>prep.onFind(destination)}>Find minimum preparation</button>}
    {comparison&&<div className="proposal inline">
     <p><b>Move {exact(comparison.amount)}</b> from {bankName(comparison.from)} to {bankName(comparison.to)}.</p>
     <p className="before-after"><span>Shortfall</span><b className="bad-text">{exact(comparison.beforeResult.maximumShortfall)}</b><ArrowRight size={14}/><b className="good-text">{exact(comparison.afterResult.maximumShortfall)}</b></p>
     <label className="confirm"><input type="checkbox" checked={prep.checked} onChange={e=>prep.onChecked(e.target.checked)}/>I reviewed this and want it applied to my simulation. Confirm that destination can pay on time and cutoffs allow it.</label>
     <button className="primary" disabled={!prep.checked} onClick={prep.onConfirm}>Confirm simulation</button>
    </div>}
   </>:<button className="primary" onClick={onScenario}>Review in Scenario Lab <ArrowRight size={16}/></button>}
   {prep?.notice&&<p role="status" className="inline-note" onClick={prep.onDismissNotice}>{prep.notice}</p>}
  </div>
 </section>}

 {!compact&&<div className="kpis">
  <Kpi label="Total cash" tip="Total cash" help="The sum of every bank balance you entered. These are your own figures, not read from a bank." value={result.total} note={`${input.positions.length} bank${input.positions.length===1?'':'s'} · entered balances`}/>
  <Kpi label="Available at interruption" tip="Available at interruption" help="Total cash minus the part you assume is temporarily unavailable at the affected bank. This is a user assumption, not a forecast." value={result.accessibleNow} note={`${exact(result.blocked)} temporarily unavailable`} tone="good"/>
  <Kpi label="Essential payments" tip="Essential payments" help="All scheduled obligations in the next 30 days that you entered. They are plans, not completed transactions." value={result.expenses} note={`${input.payments.length} obligation${input.payments.length===1?'':'s'} · next 30 days`}/>
  <Kpi label="Maximum shortfall" tip="Maximum shortfall" help="The largest amount of obligations left unpaid on any day in the scenario. It is $0 when entered cash covers everything. It is not credit and not a bank-failure probability." value={result.maximumShortfall} note={pending?'Add payments to assess':result.firstShortfallDay?`First appears on day ${result.firstShortfallDay}`:'Entered obligations covered'} tone={short?'bad':undefined}/>
 </div>}

 <div className="overview-grid">
 <section className="card liquidity-chart"><div className="section-heading"><div><h2>30-day cash outlook <HelpTip title="Cash outlook">Cash left after each day&apos;s scheduled payments. The solid blue line applies your interruption; the dotted line shows no interruption. Where blue dips below zero, payments would go unpaid. Hover, tap or use the slider to inspect any day.</HelpTip></h2><p>Cash left after scheduled obligations, day by day</p></div>{!compact&&<button className="quiet" onClick={onScenario}>Edit scenario</button>}</div>
 <div className="chart-legend"><span><i className="scenario-dot"/>Selected interruption</span><span><i className="baseline-dot"/>No interruption</span>{comparison&&<span><i className="prepared-dot"/>Proposed allocation</span>}<span><i className="due-mark"/>Payment due</span></div>
 <CashChart daily={result.daily} proposed={comparison?.afterResult.daily} day={day} onDay={setDay} durationDays={input.durationDays} payments={input.payments}/>
 <label className="chart-day">Inspect day <input aria-label="Inspect cash outlook day" type="range" min="1" max="30" value={day} onChange={e=>setDay(Number(e.target.value))}/><strong>{day}</strong></label>
 <div className="day-detail"><span>Due on day {day}<b>{exact(selected.due)}</b></span><span>Cash left (scenario)<b className={selected.stressed<0?'bad-text':''}>{exact(selected.stressed)}</b></span><span>Cash left (no interruption)<b>{exact(selected.baseline)}</b></span>{comparison&&<span>After proposal<b className="good-text">{exact(comparison.afterResult.daily[day-1].stressed)}</b></span>}</div>
 <p className="small muted">Days count from the start of your hypothetical interruption. Negative values are unmet obligations. Future receipts and processing delays are excluded.</p>
 </section>
 <div className="side-stack">
  <section className="card"><div className="section-heading"><h2>Cash vs obligations <HelpTip title="Cash vs obligations">Your total cash split into the part still accessible and the part assumed unavailable, against the total you must pay in 30 days (the marker). If the green bar reaches the marker, accessible cash alone covers everything.</HelpTip></h2></div>
   <Gauge label="Cash versus obligations" parts={[{label:'Accessible',value:result.accessibleNow,tone:'good'},{label:'Unavailable',value:result.blocked,tone:'warn'}]} marker={result.expenses} markerLabel="Obligations"/>
   <div className="stat-grid"><div><span>Lowest cash left <HelpTip title="Lowest cash left">The smallest end-of-day balance across the 30 days in your scenario. Below zero means unmet obligations.</HelpTip></span><b className={minStressed<0?'bad-text':''}>{whole(minStressed)}</b></div><div><span>Funds return</span><b>{input.durationDays<30?`Day ${input.durationDays+1}`:'After day 30'}</b></div></div>
  </section>
  <section className="card"><div className="section-heading"><h2>Cash by bank <HelpTip title="Concentration">Shows how much of your cash sits in each bank. The more is held in one bank, the more a problem there matters. Accounts at the same bank should be combined.</HelpTip></h2><button className="quiet" onClick={()=>onEdit(0)}>Manage banks</button></div>
   <div className="bank-split"><Donut parts={input.positions.map(p=>({label:p.bankName||'Unnamed',value:p.amount}))} center={`${shareOf(largest?.amount??0).toFixed(0)}%`} sub="largest bank"/>
   <div className="bank-list">{input.positions.map((p,i)=><div className="bank-line" key={p.id}><i style={{background:BANK_COLORS[i%BANK_COLORS.length]}}/><span><strong>{p.bankName||'Unnamed bank'}</strong><small>{shareOf(p.amount).toFixed(1)}%{p.id===input.affectedId?' · interruption':''}</small></span><b>{exact(p.amount)}</b></div>)}</div></div>
  </section>
 </div>
 </div>

 {!compact&&<div className="overview-grid lower">
  <section className="card"><div className="section-heading"><h2>Obligations by day <HelpTip title="Obligations by day">Each bar is the total you must pay on that day. Red bars fall on days when cash would run short in your scenario. Click a bar to inspect that day.</HelpTip></h2></div><DueBars daily={result.daily} day={day} onDay={setDay}/></section>
  <section className="card"><div className="section-heading"><h2>Upcoming obligations</h2><button className="quiet" onClick={()=>onEdit(1)}>Manage payments</button></div><p className="small muted">Planned obligations, not completed transactions.</p>{payments.length?payments.slice(0,5).map(p=><div className="scheduled-row" key={p.id}><span className="day-badge"><small>DAY</small><strong>{p.day}</strong></span><div><strong>{p.label||'Payment'}</strong><small className={result.daily[p.day-1].shortfall?'bad-text':''}>{result.daily[p.day-1].shortfall?'Cash gap on this day':'Covered under assumptions'}</small></div><b>{exact(p.amount)}</b></div>):<p>No payments yet. Add your essentials to get a meaningful result.</p>}{payments.length>5&&<button className="quiet" onClick={()=>onEdit(1)}>View all {payments.length} obligations →</button>}</section>
 </div>}
 </div>;
}
