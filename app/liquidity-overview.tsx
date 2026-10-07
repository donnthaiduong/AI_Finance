'use client';
import { useState } from 'react';
import type { PortfolioInput, Comparison } from '../lib/portfolio';
import { calculatePortfolio } from '../lib/portfolio';

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const exact=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
export default function LiquidityOverview({input,result,comparison,onEdit,onScenario,compact=false}:{compact?:boolean;input:PortfolioInput;result:ReturnType<typeof calculatePortfolio>;comparison:Comparison|null;onEdit:(step:number)=>void;onScenario:()=>void}){
 const [day,setDay]=useState(1);
 const lines=[...result.daily.flatMap(d=>[d.baseline,d.stressed]),...(comparison?.afterResult.daily.map(d=>d.stressed)??[]),0];
 const low=Math.min(...lines),high=Math.max(...lines,1),span=high-low||1;
 const x=(d:number)=>62+(d-1)*650/29,y=(v:number)=>26+(high-v)*210/span;
 const path=(key:'baseline'|'stressed',rows=result.daily)=>rows.map((d,i)=>`${i?'H '+x(d.day)+' V':'M '+x(d.day)} ${y(d[key])}`).join(' ');
 const selected=result.daily[day-1];
 const payments=[...input.payments].sort((a,b)=>a.day-b.day);
 return <div className={compact?"overview-surface compact-outlook":"overview-surface"}>
 <div className="overview-metrics">
 {[["Total cash",exact(result.total),`${input.positions.length} banks · entered balances`],["Available at interruption",exact(result.accessibleNow),`${exact(result.blocked)} temporarily unavailable`],["Essential payments",exact(result.expenses),`${input.payments.length} obligations · next 30 days`],["Maximum shortfall",exact(result.maximumShortfall),result.coverage==='insufficient-input'?'Add payments to assess':result.firstShortfallDay?`First appears on day ${result.firstShortfallDay}`:'Entered obligations covered']].map(([label,value,note],i)=><div className={'overview-metric '+(i===3&&result.maximumShortfall?'at-risk':'')} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}
 </div>
 <div className="overview-grid">
 <section className="card liquidity-chart"><div className="section-heading"><div><h2>30-day cash outlook</h2><p>Cash remaining after scheduled obligations</p></div><button className="quiet" onClick={onScenario}>Edit scenario ↗</button></div>
 <div className="chart-legend"><span><i className="baseline-dot"/>No interruption</span><span><i className="scenario-dot"/>Selected interruption</span>{comparison&&<span><i className="prepared-dot"/>Proposed allocation</span>}</div>
 <svg viewBox="0 0 760 280" role="img" aria-label={`Thirty-day cash outlook. Maximum shortfall ${exact(result.maximumShortfall)}${result.firstShortfallDay?', first on day '+result.firstShortfallDay:''}. Daily values available in Scenario Lab.`}>
 {[0,.5,1].map(t=>{const v=high-span*t;return <g key={t}><line x1="62" x2="712" y1={y(v)} y2={y(v)} stroke="#edf0f4"/><text x="52" y={y(v)+4} textAnchor="end">{money(v)}</text></g>;})}
 <rect x="62" y={y(0)} width="650" height={Math.max(0,236-y(0))} fill="#fff2f0"/>
 <line x1="62" x2="712" y1={y(0)} y2={y(0)} stroke="#bdc5d4" strokeDasharray="4 4"/>
 <path d={path('baseline')} stroke="#a8b3c8" fill="none" strokeWidth="2.5"/>
 <path d={path('stressed')} stroke="#6053c7" fill="none" strokeWidth="3"/>
 {comparison&&<path d={path('stressed',comparison.afterResult.daily)} stroke="#19806a" fill="none" strokeWidth="2.5" strokeDasharray="6 3"/>}
 <line x1={x(day)} x2={x(day)} y1="26" y2="236" stroke="#d4cfee"/><circle cx={x(day)} cy={y(selected.stressed)} r="5" fill="#6053c7"/>
 {[1,5,10,15,20,25,30].map(d=><text key={d} x={x(d)} y="263" textAnchor="middle">Day {d}</text>)}
 </svg>
 <label className="chart-day">Inspect day <input aria-label="Inspect cash outlook day" type="range" min="1" max="30" value={day} onChange={e=>setDay(Number(e.target.value))}/><strong>{day}</strong></label>
 <div className="day-detail"><span>Due <b>{exact(selected.due)}</b></span><span>Scenario remaining <b>{exact(selected.stressed)}</b></span>{comparison&&<span>After proposal <b>{exact(comparison.afterResult.daily[day-1].stressed)}</b></span>}</div>
 <p className="small muted">Days are relative to the start of your hypothetical interruption. Negative values represent unmet obligations. Future receipts and processing delays are excluded.</p>
 </section>
 <section className={'card outcome-card '+(result.maximumShortfall?'needs-attention':'')}><span className="eyebrow">YOUR NEXT STEP</span><h2>{result.coverage==='insufficient-input'?'Build your payment schedule':result.maximumShortfall?'Prepare for a cash gap':'Review payment readiness'}</h2><p>{result.coverage==='insufficient-input'?'Add payroll, suppliers and other essential obligations to assess coverage.':result.maximumShortfall?`${exact(result.maximumShortfall)} in cumulative obligations would be unmet in this scenario, beginning on day ${result.firstShortfallDay}.`:'Your entered cash covers these obligations under the selected assumptions.'}</p><button className="primary" onClick={result.coverage==='insufficient-input'?()=>onEdit(1):onScenario}>{result.coverage==='insufficient-input'?'Add essential payments':'Review preparation →'}</button><div className="scenario-receipt"><small>SELECTED ASSUMPTIONS</small><strong>{input.positions.find(p=>p.id===input.affectedId)?.bankName}</strong><span>{input.unavailablePercent}% unavailable · {input.durationDays} days</span><span>{input.durationDays<30?`Funds return on day ${input.durationDays+1}`:'Funds return after this 30-day window'}</span></div></section>
 <section className="card"><div className="section-heading"><h2>Cash by bank</h2><button className="quiet" onClick={()=>onEdit(0)}>Manage banks</button></div><p className="small muted">Accounts at the same bank should be combined.</p>{input.positions.map((p,i)=><div className="allocation-row" key={p.id}><div><span className="bank-avatar">{String(i+1).padStart(2,'0')}</span><strong>{p.bankName}</strong><b>{exact(p.amount)}</b></div><div className="allocation-track"><span style={{width:`${result.total?p.amount/result.total*100:0}%`}}/></div><small>{result.total?(p.amount/result.total*100).toFixed(1):'0'}% of total cash{p.id===input.affectedId?' · selected interruption':''}</small></div>)}</section>
 <section className="card"><div className="section-heading"><h2>Upcoming obligations</h2><button className="quiet" onClick={()=>onEdit(1)}>Manage payments</button></div><p className="small muted">Planned obligations, not completed transactions.</p>{payments.length?payments.slice(0,5).map(p=><div className="scheduled-row" key={p.id}><span className="day-badge">DAY<strong>{p.day}</strong></span><div><strong>{p.label}</strong><small>{result.daily[p.day-1].shortfall?'Cash gap on this day':'Covered under assumptions'}</small></div><b>{exact(p.amount)}</b></div>):<p>No payments yet. Add your essentials to get a meaningful result.</p>}{payments.length>5&&<button className="quiet" onClick={()=>onEdit(1)}>View all {payments.length} obligations →</button>}</section>
 </div>
 </div>;
}
