'use client';
import { useEffect, useRef, useState } from 'react';
import { calculatePortfolio, comparePortfolio, confirmPortfolio, coreInput, minimumPortfolio, type PortfolioInput, type Comparison } from '../lib/portfolio';
import type { PortfolioSession } from '../lib/portfolio-session';
import { DeviceSessionStore, readPortfolioFile, portfolioFile, MAX_PORTFOLIO_FILE_BYTES } from '../lib/device-storage';
import { explain } from '../lib/copilot';
import { snapshotSchema } from '../lib/snapshot-validation';
import type { Snapshot } from '../lib/types';
import type { CopilotReply } from '../lib/treasury-copilot';
import { preparationPlan } from '../lib/preparation-plan';
import { renderPlanPdf } from '../lib/render-plan';
import { exportSection } from '../lib/export-preview';
import LiquidityOverview, { bankExposure } from './liquidity-overview';
import QuestionFlow, { type QCard } from './question-flow';
import { HelpTip, tidy } from './ui';
import { ShieldCheck, Landmark, MoreHorizontal, ArrowRight, ArrowLeft } from 'lucide-react';

// One guided flow. Scenario Lab is step 3, the Treasury Workspace results are step 4.
const STEP={cash:0,payments:1,scenario:2,results:3,plan:4} as const;
const STEP_LABELS=['Cash accounts','Payments','Scenario Lab','Results','Plan'];
const STEP_TITLES=['Your cash','Your essential payments','Scenario Lab','Results','Your plan'];
const STEP_SUBS=['Enter what you hold at each bank.','List the payments you must make in the next 30 days.','Model interrupted access to one bank before it affects essential payments.','Know what you can cover. Prepare for what you cannot.','A one-page summary to review with your team.'];

const usd=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const empty=():PortfolioInput=>({positions:[],payments:[],affectedId:'',unavailablePercent:80,durationDays:21});
const example=():PortfolioInput=>({positions:[{id:'demo-a',bankName:'Example bank A',cert:null,amount:90000},{id:'demo-b',bankName:'Example bank B',cert:null,amount:60000},{id:'demo-c',bankName:'Example bank C',cert:null,amount:30000}],payments:[{id:'salary',label:'Payroll',day:5,amount:85000},{id:'supplier',label:'Suppliers',day:15,amount:40000},{id:'operating',label:'Operating costs',day:25,amount:25000}],affectedId:'demo-a',unavailablePercent:80,durationDays:21});
export default function TreasuryWorkspace({storageAccess=()=>window.localStorage,copilotFetch=fetch}:{storageAccess?:()=>Pick<Storage,'getItem'|'setItem'>;copilotFetch?:typeof fetch}={}){
 const [session,setSession]=useState<PortfolioSession>({schemaVersion:2,input:empty(),activity:[]});
 const [hydrated,setHydrated]=useState(false),[storageBlocked,setStorageBlocked]=useState(false),[storageError,setStorageError]=useState('');
 const [view,setView]=useState<'workspace'|'evidence'>('workspace'),[step,setStep]=useState<number>(STEP.results),[snapshot,setSnapshot]=useState<Snapshot|null>(null),[evidenceError,setEvidenceError]=useState(''),[evidenceLoading,setEvidenceLoading]=useState(false),[evidenceQuery,setEvidenceQuery]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[comparison,setComparison]=useState<Comparison|null>(null),[checked,setChecked]=useState(false),[destination,setDestination]=useState(''),[verification,setVerification]=useState('');
 const [assumptionsTouched,setAssumptionsTouched]=useState(false);
 const [listMode,setListMode]=useState(false),[cashIdx,setCashIdx]=useState<number|null>(null),[payIdx,setPayIdx]=useState<number|null>(null),[scnIdx,setScnIdx]=useState<number|null>(null);
 const [question,setQuestion]=useState(''),[reply,setReply]=useState('');
 const [exportData,setExportData]=useState<{text:string;filename:string}|null>(null),[exportStatus,setExportStatus]=useState('');
 const [exportPage,setExportPage]=useState(0),[menuOpen,setMenuOpen]=useState(false),[dialog,setDialog]=useState<{message:string;yes:string;onYes:()=>void}|null>(null);
 const exportPreview=exportData?exportSection(exportData.text,exportPage):null;
 const [planPdf,setPlanPdf]=useState<ReturnType<typeof renderPlanPdf>|null>(null);
 const [useAI,setUseAI]=useState(false),[copilotBusy,setCopilotBusy]=useState(false),[copilotDraft,setCopilotDraft]=useState<CopilotReply['draft']>(null);
 const copilotCurrent=useRef(''),copilotSequence=useRef(0);
 const importFile=useRef<HTMLInputElement>(null),savedRaw=useRef(''),current=useRef('');
 const deviceStore=useRef<DeviceSessionStore|null>(null);
 if(!deviceStore.current)deviceStore.current=new DeviceSessionStore(storageAccess);
 const [pendingReplacement,setPendingReplacement]=useState<{session:PortfolioSession;notice:string}|null>(null);
 const input=session.input;current.current=JSON.stringify(input);
 const unaffectedBanks=input.positions.filter(p=>p.id!==input.affectedId);
 const defaultDestination=unaffectedBanks.length?unaffectedBanks.reduce((m,p)=>p.amount>m.amount?p:m,unaffectedBanks[0]).id:'';
 const activeDestination=unaffectedBanks.some(p=>p.id===destination)?destination:defaultDestination;
 copilotCurrent.current=JSON.stringify({input,destination:activeDestination,question:question.trim(),useAI});
 let result:ReturnType<typeof calculatePortfolio>|null=null,validation='';
 try{if(input.positions.length)result=calculatePortfolio(input);}catch(e){validation=(e as Error).message;}
 const isExample=JSON.stringify(input)===JSON.stringify(example());
 const bankName=(id:string)=>input.positions.find(p=>p.id===id)?.bankName||'Removed bank';
 const liveComparison=comparison && comparison.fingerprint===JSON.stringify({input,from:comparison.from,to:comparison.to,amount:comparison.amount})?comparison:null;
 const latest=session.activity.at(-1);
 const confirmedAction=latest && JSON.stringify(latest.after)===current.current?latest:null;
 async function loadEvidence(){
   setEvidenceLoading(true);setPlanPdf(null);
   try{const r=await fetch('/api/banks',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Evidence unavailable. Cash planning still works.');const {updateStatus,...raw}=await r.json();const data=snapshotSchema.parse(raw);setSnapshot(data);setEvidenceError(updateStatus?.state==='failed'?'Latest evidence update failed. Showing the last valid snapshot.':'');}
   catch{setEvidenceError('Bank evidence is unavailable. Continue planning with your own balances and assumptions.');}
   finally{setEvidenceLoading(false);setPlanPdf(null);}
 }
 useEffect(()=>{
   void loadEvidence();
   const restored=deviceStore.current!.restore();savedRaw.current=restored.original??'';
   if(restored.session){setSession(restored.session);const r=restored.session.input;if(r.unavailablePercent!==80||r.durationDays!==21||restored.session.activity.length)setAssumptionsTouched(true);}
   if(restored.state==='damaged'){setStorageBlocked(true);setStorageError('Saved data is damaged. It has not been overwritten. Export the original before replacing it.');}
   if(restored.state==='unavailable'){setStorageBlocked(true);setStorageError('Device storage could not be read. Use a temporary session and export JSON before closing.');}
   setHydrated(true);
 },[]);
 useEffect(()=>{
   if(!hydrated||storageBlocked)return;
   const saved=deviceStore.current!.persist(session);setStorageError(saved.message);
 },[session,hydrated,storageBlocked]);
 function useReplacement(next:PortfolioSession,message:string){
   setPlanPdf(null);
   setExportData(null);setExportStatus('');
   resetCopilot();setSession(next);setStorageBlocked(false);setPendingReplacement(null);setComparison(null);setChecked(false);setDestination('');setAssumptionsTouched(next.input.positions.length>0);setStep(next.input.positions.length?STEP.results:STEP.cash);setView('workspace');setVerification('');setError('');setNotice(message);
 }
 function requestReplacement(next:PortfolioSession,message:string){
   const saved=deviceStore.current!.replaceAfterReview(next);
   setStorageError(saved.message);
   if(saved.state==='saved'||saved.state==='memory')useReplacement(next,message);
   else if(saved.state!=='invalid')setPendingReplacement({session:next,notice:message});
 }

 function edit(next:PortfolioInput){
   if(next.affectedId!==input.affectedId||next.unavailablePercent!==input.unavailablePercent||next.durationDays!==input.durationDays)setAssumptionsTouched(true);
   setPlanPdf(null);
   setExportData(null);setExportStatus('');
   setPendingReplacement(null);
   copilotSequence.current++;setCopilotDraft(null);setCopilotBusy(false);
   setSession(s=>({...s,input:next}));setComparison(null);setChecked(false);setVerification('');setReply('');setError('');setNotice('');
 }
 function begin(demo:boolean){
   const go=()=>requestReplacement({schemaVersion:2,input:demo?example():empty(),activity:[]},demo?'Example assumptions loaded. These are not observed business balances.':'New blank plan. Add your banks and scheduled obligations.');
   setMenuOpen(false);
   if(input.positions.length)setDialog({message:'Replace the current working plan? Save a plan file first if you want to keep it.',yes:demo?'Load example':'Start blank plan',onYes:go});else go();
 }
 function download(text:string,filename:string){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function showExport(text:string,filename:string){setExportPage(0);setExportData({text,filename});setExportStatus('Download JSON or use Copy JSON to save the complete file. This snapshot stays on this device.');}
 function exportJson(){try{showExport(portfolioFile(session),'cascadeguard-portfolio.json');}catch(e){setError((e as Error).message);}}
 async function copyExport(){if(!exportData)return;try{await navigator.clipboard.writeText(exportData.text);setExportStatus('JSON copied to your clipboard. Save it as a .json file to restore later.');}catch{setExportStatus('Clipboard is unavailable. Download JSON, or copy every displayed section in order without adding characters.');}}
 async function importJson(file:File){
   const submitted=current.current;
   try{
     if(file.size>MAX_PORTFOLIO_FILE_BYTES)throw new Error('Portfolio file exceeds 32 MB.');
     const next=readPortfolioFile(await file.text());
     if(current.current!==submitted)throw new Error('Inputs changed while the file was being read. Choose the file again to review the replacement.');
     const go=()=>requestReplacement(next,'Imported inputs validated; financial results recalculated.');
     if(input.positions.length)setDialog({message:'Replace the working plan with this validated file?',yes:'Replace plan',onYes:go});else go();
   }catch(e){setError((e as Error).message);}finally{if(importFile.current)importFile.current.value='';}
 }
 function prepare(to:string=activeDestination){
   setPlanPdf(null);
   if(to!==destination){resetCopilot();setDestination(to);}
   try{const p=minimumPortfolio(input,to);if(p.status==='feasible'){setComparison(p.comparison);setChecked(false);setPlanPdf(null);setNotice('Review the minimum preparation for this selected interruption.');}
   else{setComparison(null);setNotice(p.status==='insufficient-input'?'Add positive obligations first.':p.status==='not-needed'?'Existing allocations cover this selected scenario.':p.reason);}}
   catch(e){setError((e as Error).message);}
 }
 function apply(){
   setPlanPdf(null);
   setExportData(null);setExportStatus('');
   setPendingReplacement(null);
   resetCopilot();
   try{if(!liveComparison)throw new Error('Compare the current inputs first.');const c=confirmPortfolio(input,liveComparison,checked);setSession(s=>({...s,input:c.after,activity:[...s.activity,{at:new Date().toISOString(),from:c.from,to:c.to,amount:c.amount,before:c.before,after:c.after}].slice(-50)}));setComparison(null);setChecked(false);setReply('');setVerification('');setNotice('Simulation updated. No real money moved.');}
   catch(e){setError((e as Error).message);}
 }
 async function verify(){
   const submitted=current.current;
   try{const r=await fetch('/api/scenario',{method:'POST',headers:{'Content-Type':'application/json'},body:submitted,signal:AbortSignal.timeout(10000)});const data=await r.json();if(!r.ok)throw new Error(data.error||'Verification failed.');if(JSON.stringify(data.result)!==JSON.stringify(calculatePortfolio(input)))throw new Error('Server and local calculation differ.');if(current.current===submitted)setVerification('Calculation matches the local server. Evidence: '+data.evidenceStatus+'.');}
   catch(e){if(current.current===submitted)setError((e as Error).message);}
 }
 function createPlanPdf(){
   try{const plan=preparationPlan(input,{preparedAt:new Date().toISOString(),comparison:liveComparison,activity:confirmedAction,evidence:snapshot?{version:snapshot.version,collectedAt:snapshot.collectedAt}:null});setPlanPdf(renderPlanPdf(plan));setError('');}
   catch(e){setError((e as Error).message);setPlanPdf(null);}
 }
 function chooseDestination(id:string){resetCopilot();setDestination(id);setComparison(null);setChecked(false);setPlanPdf(null);}
 function resetCopilot(){copilotSequence.current++;setCopilotBusy(false);setReply('');setCopilotDraft(null);}
 async function askCopilot(){
   if(!question.trim()){setReply('Enter a question first, or read the guided explanation above.');return;}
   const request={input,destination:activeDestination,question:question.trim(),useAI},submitted=copilotCurrent.current,sequence=++copilotSequence.current;
   setCopilotBusy(true);setReply('');setCopilotDraft(null);
   const isCurrent=()=>copilotCurrent.current===submitted && copilotSequence.current===sequence;
   try{
     const response=await copilotFetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(10000)});
     const data=await response.json() as CopilotReply;
     if(!response.ok)throw new Error('Copilot unavailable.');
     if(data.fingerprint!==submitted || !['ai','guided','fallback'].includes(data.mode) || typeof data.text!=='string' || data.text.length>2000 || typeof data.reason!=='string' || data.reason.length>300 || !['none','minimum','draft'].includes(data.action))throw new Error('Invalid copilot response.');
     if(!isCurrent())return;
     if(data.action==='minimum'){
       setPlanPdf(null);
       // Recompute on this tab before showing a proposal; server output cannot apply it.
       const p=minimumPortfolio(input,activeDestination);
       if(p.status!=='feasible' || JSON.stringify(p)!==JSON.stringify(data.preparation))throw new Error('Comparison could not be verified.');
       setComparison(p.comparison);setChecked(false);setStep(STEP.results);setView('workspace');
     }
     if(data.action==='draft'){
       if(!data.draft)throw new Error('Missing draft.');
       calculatePortfolio({...input,...data.draft});setCopilotDraft(data.draft);
     }
     setReply((data.mode==='ai'?'AI interpretation · ':data.mode==='fallback'?'AI fallback · ':'Guided mode · ')+data.reason+' '+data.text);
   }catch{if(isCurrent())setReply('Guided fallback · Copilot unavailable. '+explain(coreInput(input)));}
   finally{if(isCurrent())setCopilotBusy(false);}
 }
 useEffect(()=>{if(view==='workspace'&&step===STEP.scenario)setAssumptionsTouched(true);},[view,step]);
 const num=(v:string)=>v===''?NaN:Number(v);
 function addBank(){const id=crypto.randomUUID();edit({...input,positions:[...input.positions,{id,bankName:'',cert:null,amount:0}],affectedId:input.affectedId||id});setCashIdx(input.positions.length);}
 function removeBank(id:string){const positions=input.positions.filter(x=>x.id!==id);edit({...input,positions,affectedId:input.affectedId===id?(positions[0]?.id||''):input.affectedId});setCashIdx(null);}
 function addPayment(){edit({...input,payments:[...input.payments,{id:crypto.randomUUID(),label:'',day:1,amount:0}]});setPayIdx(input.payments.length);}
 const cashCards:QCard[]=input.positions.length===0?[{key:'cash-intro',label:'Start',valid:true,content:<>
   <h2>Let&apos;s start with your cash</h2><p>Add the banks where you hold operating cash. One bank at a time, about a minute in total.</p>
   <button type="button" className="primary" onClick={addBank}>Add my first bank <ArrowRight size={16}/></button>
   <button type="button" className="quiet" onClick={()=>begin(true)}>Or explore an example portfolio</button></>}]
 :[...input.positions.map((p,i)=>({key:'bank-'+p.id,label:'Bank '+(i+1),valid:p.bankName.trim().length>0&&Number.isFinite(p.amount)&&p.amount>=0,hint:'Enter a bank name and a balance to continue.',content:<>
   <p className="qkicker">BANK {i+1} OF {input.positions.length}</p><h2>Where do you hold cash, and how much?</h2>
   <p className="small muted">Combine accounts at the same bank. Use hypothetical figures if you prefer; nothing is read from your bank.</p>
   <label className="field">Bank name<input placeholder="e.g. Operating bank" value={p.bankName} maxLength={120} onChange={e=>edit({...input,positions:input.positions.map(x=>x.id===p.id?{...x,bankName:e.target.value,cert:null}:x)})}/></label>
   <label className="field">Balance · USD<input type="number" inputMode="decimal" onFocus={e=>e.target.select()} min="0" step=".01" value={Number.isFinite(p.amount)?p.amount:''} onChange={e=>edit({...input,positions:input.positions.map(x=>x.id===p.id?{...x,amount:num(e.target.value)}:x)})}/></label>
   {snapshot&&<label className="field">Link public evidence (optional)<select value={p.cert??''} onChange={e=>{const cert=e.target.value?Number(e.target.value):null;const b=snapshot.banks.find(b=>b.cert===cert);edit({...input,positions:input.positions.map(x=>x.id===p.id?{...x,cert,bankName:x.bankName.trim()?x.bankName:(b?.name??x.bankName)}:x)});}}><option value="">No linked evidence</option>{snapshot.banks.map(b=><option key={b.cert} value={b.cert}>{b.name}</option>)}</select></label>}
   <button type="button" className="quiet" onClick={()=>removeBank(p.id)}>Remove this bank</button></>})),
  {key:'cash-summary',label:'Review cash',valid:true,content:<>
   <h2>Your cash</h2><p>{result?<>Total <b>{usd(result.total)}</b> across {input.positions.length} bank{input.positions.length===1?'':'s'}.</>:(validation||'Complete each bank to see the total.')}</p>
   <ul className="qlist">{input.positions.map((p,i)=><li key={p.id}><span>{p.bankName||'Unnamed bank'}</span><b>{Number.isFinite(p.amount)?usd(p.amount):'—'}</b><button type="button" className="quiet" onClick={()=>setCashIdx(i)}>Edit</button></li>)}</ul>
   <div className="qactions"><button type="button" className="secondary" disabled={input.positions.length>=32} onClick={addBank}>Add another bank</button>
   <button type="button" className="primary" disabled={!result} onClick={()=>setStep(STEP.payments)}>Continue to payments <ArrowRight size={16}/></button></div></>}];
 const paymentCards:QCard[]=input.payments.length===0?[{key:'pay-intro',label:'Start',valid:true,content:<>
   <h2>What must you pay in the next 30 days?</h2><p>Payroll, suppliers and rent are the usual essentials. Add them one at a time.</p>
   <button type="button" className="primary" onClick={addPayment}>Add my first payment <ArrowRight size={16}/></button></>}]
 :[...input.payments.map((p,i)=>({key:'pay-'+p.id,label:'Payment '+(i+1),valid:Number.isFinite(p.amount)&&p.amount>0&&Number.isInteger(p.day)&&p.day>=1&&p.day<=30,hint:'Enter an amount above $0 and a due day from 1 to 30.',content:<>
   <p className="qkicker">PAYMENT {i+1} OF {input.payments.length}</p><h2>What is it, how much, and when is it due?</h2>
   <p className="small muted">Day 1 is the first day of the hypothetical interruption. Future receipts are not counted.</p>
   <label className="field">Description<input placeholder="e.g. Payroll" value={p.label} maxLength={120} onChange={e=>edit({...input,payments:input.payments.map(x=>x.id===p.id?{...x,label:e.target.value}:x)})}/></label>
   <div className="qrow"><label className="field">Amount · USD<input type="number" inputMode="decimal" onFocus={e=>e.target.select()} min="0" step=".01" value={Number.isFinite(p.amount)?p.amount:''} onChange={e=>edit({...input,payments:input.payments.map(x=>x.id===p.id?{...x,amount:num(e.target.value)}:x)})}/></label>
   <label className="field">Due day (1–30)<input type="number" inputMode="numeric" min="1" max="30" value={Number.isFinite(p.day)?p.day:''} onChange={e=>edit({...input,payments:input.payments.map(x=>x.id===p.id?{...x,day:num(e.target.value)}:x)})}/></label></div>
   <button type="button" className="quiet" onClick={()=>{edit({...input,payments:input.payments.filter(x=>x.id!==p.id)});setPayIdx(null);}}>Remove this payment</button></>})),
  {key:'pay-summary',label:'Review payments',valid:true,content:<>
   <h2>Your essential payments</h2><p>{result&&result.coverage!=='insufficient-input'?<>Total <b>{usd(result.expenses)}</b> across {input.payments.length} payment{input.payments.length===1?'':'s'} in 30 days.</>:'Complete each payment to see the total.'}</p>
   <ul className="qlist">{[...input.payments].sort((a,b)=>a.day-b.day).map(p=><li key={p.id}><span>Day {Number.isFinite(p.day)?p.day:'—'} · {p.label||'Payment'}</span><b>{Number.isFinite(p.amount)?usd(p.amount):'—'}</b><button type="button" className="quiet" onClick={()=>setPayIdx(input.payments.findIndex(x=>x.id===p.id))}>Edit</button></li>)}</ul>
   <div className="qactions"><button type="button" className="secondary" disabled={input.payments.length>=100} onClick={addPayment}>Add another payment</button>
   <button type="button" className="primary" disabled={!result||result.coverage==='insufficient-input'} onClick={()=>{setScnIdx(0);setStep(STEP.scenario);}}>Continue to Scenario Lab <ArrowRight size={16}/></button></div></>}];
 const scenarioCards:QCard[]=input.positions.length===0?[{key:'scn-empty',label:'Start',valid:true,content:<>
   <h2>Add a bank first</h2><p>The scenario needs at least one bank balance.</p><button type="button" className="primary" onClick={()=>setStep(STEP.cash)}>Go to cash accounts</button></>}]
 :[{key:'scn-bank',label:'Which bank',valid:input.positions.some(p=>p.id===input.affectedId),hint:'Choose the bank to test.',content:<>
   <p className="qkicker">QUESTION 1 OF 3</p><h2>Which bank might become unavailable?</h2><p className="small muted">A what-if, not a forecast. You choose; nothing here estimates the chance of a real freeze.</p>
   <div className="choices" role="radiogroup" aria-label="Affected bank">{input.positions.map(p=><button type="button" role="radio" aria-checked={p.id===input.affectedId} key={p.id} className={'choice'+(p.id===input.affectedId?' on':'')} onClick={()=>edit({...input,affectedId:p.id})}><strong>{p.bankName||'Unnamed bank'}</strong><span>{Number.isFinite(p.amount)?usd(p.amount):'—'}</span></button>)}</div></>},
  {key:'scn-percent',label:'How much',valid:Number.isFinite(input.unavailablePercent)&&input.unavailablePercent>=0&&input.unavailablePercent<=100,hint:'Enter a share from 0 to 100.',content:<>
   <p className="qkicker">QUESTION 2 OF 3</p><h2>How much of its balance could you not use?</h2><p className="small muted">Your assumption for {bankName(input.affectedId)}.</p>
   <div className="chip-row">{[25,50,80,100].map(v=><button type="button" key={v} className={'qchip'+(input.unavailablePercent===v?' on':'')} onClick={()=>edit({...input,unavailablePercent:v})}>{v}%</button>)}</div>
   <label className="field">Temporarily unavailable · %<input type="number" inputMode="decimal" min="0" max="100" step=".1" value={Number.isFinite(input.unavailablePercent)?input.unavailablePercent:''} onChange={e=>edit({...input,unavailablePercent:num(e.target.value)})}/></label></>},
  {key:'scn-days',label:'How long',valid:Number.isInteger(input.durationDays)&&input.durationDays>=1&&input.durationDays<=30,hint:'Enter a whole number of days from 1 to 30.',content:<>
   <p className="qkicker">QUESTION 3 OF 3</p><h2>For how many days?</h2><p className="small muted">Funds return at the start of day {Number.isFinite(input.durationDays)?input.durationDays+1:'—'}. Accessible funds are assumed usable to pay all entered obligations.</p>
   <div className="chip-row">{[7,14,21,30].map(v=><button type="button" key={v} className={'qchip'+(input.durationDays===v?' on':'')} onClick={()=>edit({...input,durationDays:v})}>{v} days</button>)}</div>
   <label className="field">Duration · days<input type="number" inputMode="numeric" min="1" max="30" value={Number.isFinite(input.durationDays)?input.durationDays:''} onChange={e=>edit({...input,durationDays:num(e.target.value)})}/></label></>},
  {key:'scn-summary',label:'Review scenario',valid:true,content:<>
   <h2>Your scenario</h2><p>{bankName(input.affectedId)} is {input.unavailablePercent}% unavailable for {input.durationDays} days, with funds back at the start of day {input.durationDays+1}.</p>
   <div className="qactions"><button type="button" className="secondary" onClick={()=>setScnIdx(0)}>Change answers</button>
   <button type="button" className="primary" disabled={!result||result.coverage==='insufficient-input'} onClick={()=>setStep(STEP.results)}>See results <ArrowRight size={16}/></button></div></>}];
 const scnAtEnd=scnIdx===null||scnIdx>=scenarioCards.length-1;
 const selection=(value:string,change:(id:string)=>void,label:string,exclude?:string)=><label className="field">{label}<select aria-label={label} value={value} onChange={e=>change(e.target.value)}><option value="">Choose bank</option>{input.positions.filter(p=>p.id!==exclude).map(p=><option key={p.id} value={p.id}>{p.bankName||'Unnamed bank'}</option>)}</select></label>;
 return <div className="shell treasury-workspace">
 <header className="toolbar"><span className="toolname"><ShieldCheck size={20}/>Liquidity Check</span>
 <nav className="steps" aria-label="Guided steps">{STEP_LABELS.map((label,i)=><button key={label} type="button" className={'stepbtn'+(view==='workspace'&&step===i?' active':'')+(view==='workspace'&&i<step?' done':'')} aria-current={view==='workspace'&&step===i?'step':undefined} onClick={()=>{setNotice('');setCashIdx(null);setPayIdx(null);setScnIdx(null);setView('workspace');setStep(i);}}><span className="step-no">{i+1}</span>{label}</button>)}</nav>
 <div className="toolbar-right"><button type="button" className={'navlink'+(view==='evidence'?' active':'')} aria-current={view==='evidence'?'page':undefined} onClick={()=>{setNotice('');setView('evidence');}}><Landmark size={16}/> Bank Evidence</button><div className="simulation-actions"><div className="menu"><button className="menu-btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(o=>!o)}><MoreHorizontal size={16}/> File</button>{menuOpen&&<div className="menu-list" role="menu" onMouseLeave={()=>setMenuOpen(false)}><button role="menuitem" onClick={()=>begin(true)}>Try an example</button><button role="menuitem" onClick={()=>begin(false)}>New blank plan</button><hr/><button role="menuitem" onClick={()=>{setMenuOpen(false);importFile.current?.click();}}>Open plan file (JSON)</button><button role="menuitem" disabled={!result} onClick={()=>{setMenuOpen(false);exportJson();}}>Save plan file (JSON)</button></div>}</div><input ref={importFile} hidden type="file" accept=".json" aria-label="Import portfolio JSON" onChange={e=>{const f=e.target.files?.[0];if(f)void importJson(f);}}/></div></div></header>
 <div className="main-shell">
 <main>
 {error&&<div role="alert" className="alert error">{error}<button onClick={()=>setError('')} aria-label="Dismiss error">×</button></div>}
 {storageError&&<div role="alert" className="alert error">{storageError}{savedRaw.current&&<button onClick={()=>showExport(savedRaw.current,'cascadeguard-original.json')}>Export original</button>}</div>}
 {exportData&&exportPreview&&<section className="card" aria-label="Portfolio export"><h2>Save your portfolio JSON</h2><p>{exportData.filename==='cascadeguard-original.json'?'Original saved text, without validation. Keep this for recovery; it may not be a valid portfolio.':'Validated input and reviewed history. Results are recalculated on import.'}</p><p role="status">{exportStatus}</p><button onClick={()=>{download(exportData.text,exportData.filename);setExportStatus('Download requested. If no file appears, use Copy JSON or copy every section in order.');}}>Download JSON</button><button onClick={()=>void copyExport()}>Copy JSON</button><button onClick={()=>setExportData(null)}>Close export</button>{exportPreview.count>1&&<><p>Large file: the text is shown in sections to keep this page responsive. Download JSON and Copy JSON include the complete file. A section alone is not a valid portfolio. For manual recovery, join all sections in order without adding or removing characters.</p><p role="status">JSON section {exportPreview.index+1} of {exportPreview.count}</p><button disabled={exportPreview.index===0} onClick={()=>setExportPage(exportPreview.index-1)}>Previous JSON section</button><button disabled={exportPreview.index===exportPreview.count-1} onClick={()=>setExportPage(exportPreview.index+1)}>Next JSON section</button></>}<label className="field">{exportPreview.count===1?'Complete JSON for local export':`JSON section ${exportPreview.index+1} for local export`}<textarea readOnly rows={8} value={exportPreview.text} spellCheck={false} wrap="off"/></label></section>}
 {pendingReplacement&&<div role="alert" className="alert error"><span>Replacement has not been saved. Continue in this tab only to keep existing device data untouched; export JSON before closing.</span><button onClick={()=>{deviceStore.current!.useMemoryOnly();useReplacement(pendingReplacement.session,pendingReplacement.notice);}}>Continue without saving to device</button><button onClick={()=>setPendingReplacement(null)}>Cancel replacement</button></div>}
 {notice&&<div role="status" className="alert">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice">×</button></div>}
 {!hydrated?<p>Restoring device-local inputs…</p>:<>
 <div className="page-heading"><div><p className="eyebrow">{view==='evidence'?'OPERATING LIQUIDITY · 30 DAYS':`STEP ${step+1} OF ${STEP_LABELS.length} · OPERATING LIQUIDITY · 30 DAYS`}</p><h1>{view==='evidence'?'Bank evidence':STEP_TITLES[step]}</h1><p>{view==='evidence'?'Public reporting, with sources and limitations you can inspect.':STEP_SUBS[step]}</p></div><div className="badges">{isExample&&<span className="mode-badge warn">Example data</span>}<span className="mode-badge">Simulation only</span></div></div>
 {view==='evidence'?<section className="card"><h2>Bank evidence <HelpTip title="Bank evidence">Public FDIC reporting for banks you can link to your balances. It is context only: it never changes your result, and it is not a prediction that any bank will fail.</HelpTip></h2><p>Optional public evidence. Your disruption assumptions remain yours.</p><button onClick={()=>void loadEvidence()} disabled={evidenceLoading}>{evidenceLoading?'Loading evidence…':'Refresh evidence'}</button>{evidenceError&&<p role="status">{evidenceError}</p>}{snapshot?<><p>Collected {snapshot.collectedAt.slice(0,10)}. Original publication dates unverified. Snapshot {snapshot.version}.</p><label className="field">Find public bank evidence<input type="search" value={evidenceQuery} placeholder="Bank name or FDIC certificate" onChange={e=>setEvidenceQuery(e.target.value)}/></label><p className="small muted">{snapshot.banks.filter(b=>(b.name+' '+b.cert).toLowerCase().includes(evidenceQuery.trim().toLowerCase())).length} matching banks</p>{snapshot.banks.filter(b=>(b.name+' '+b.cert).toLowerCase().includes(evidenceQuery.trim().toLowerCase())).map(b=><details key={b.cert}><summary>{b.name} · FDIC {b.cert}</summary><p>Reporting period {b.period}. Deposits {usd(b.deposits)}. Assets {usd(b.assets)}.</p><a href={b.sourceUrl} target="_blank" rel="noreferrer">Open FDIC source</a><p>Next-quarter deposit growth estimate {b.prediction===null?'unavailable':(b.prediction*100).toFixed(2)+'%'}. This is not a failure probability.</p></details>)}<details><summary>Research pilot and limitations</summary><p>Model {snapshot.model.selected}. Retrospective validation; no demonstrated causal contagion.</p><ul>{snapshot.limitations.map(l=><li key={l}>{l}</li>)}</ul></details></>:<p>Cash planning remains available in Treasury Workspace.</p>}</section>:<>
 {view==='workspace'&&(step===STEP.results||step===STEP.plan)&&!result&&<section className="card empty-workspace"><span className="empty-symbol"><Landmark size={30}/></span><h2>Your cash plan starts here</h2><p>Add your bank balances and essential payments. Then see where an interruption could leave a gap.</p><div className="empty-steps"><span>01 · Enter cash by bank</span><span>02 · Schedule essentials</span><span>03 · Compare preparation</span></div><button className="primary" onClick={()=>setStep(STEP.cash)}>Add my bank balances</button><button className="quiet" onClick={()=>begin(true)}>Explore example portfolio →</button></section>}
 {view==='workspace'&&step===STEP.results&&confirmedAction&&<div className="alert">Latest confirmed simulation: {usd(confirmedAction.amount)} allocated from {bankName(confirmedAction.from)} to {bankName(confirmedAction.to)}. No real money moved.</div>}
 {view==='workspace'&&step===STEP.results&&result&&<><LiquidityOverview assumptionsReviewed={assumptionsTouched} input={input} result={result} comparison={liveComparison} onEdit={i=>{setCashIdx(null);setPayIdx(null);setStep(i);}} onScenario={()=>{setScnIdx(0);setStep(STEP.scenario);}} onPlan={()=>setStep(STEP.plan)} prep={{destination:activeDestination,options:input.positions.filter(p=>p.id!==input.affectedId).map(p=>({id:p.id,name:p.bankName})),onFind:prepare,onDestination:chooseDestination,checked,onChecked:setChecked,onConfirm:apply,notice,onDismissNotice:()=>setNotice('')}}/><div className="step-nav"><button type="button" className="secondary" onClick={()=>setStep(STEP.scenario)}><ArrowLeft size={16}/> Back to Scenario Lab</button><button type="button" className="primary" disabled={result.coverage==='insufficient-input'} onClick={()=>setStep(STEP.plan)}>Continue to plan <ArrowRight size={16}/></button></div></>}
 {validation&&<p role="alert" className="alert error">{validation}</p>}
 {view==='workspace'&&step<=STEP.scenario&&<div className="mode-toggle"><button type="button" className="quiet" onClick={()=>setListMode(m=>!m)}>{listMode?'Switch to guided questions':'Edit everything as a list'}</button></div>}
 {view==='workspace'&&step===STEP.cash&&!listMode&&<section className="card qsection"><QuestionFlow ariaLabel="Cash accounts questions" cards={cashCards} index={cashIdx} onIndex={setCashIdx}/></section>}
 {view==='workspace'&&step===STEP.payments&&!listMode&&<section className="card qsection"><QuestionFlow ariaLabel="Essential payments questions" cards={paymentCards} index={payIdx} onIndex={setPayIdx}/></section>}
 {view==='workspace'&&step===STEP.scenario&&!listMode&&<section className="card qsection"><QuestionFlow ariaLabel="Interruption scenario questions" cards={scenarioCards} index={scnIdx} onIndex={setScnIdx}/></section>}
 {view==='workspace'&&step===STEP.cash&&listMode&&<section className="card"><h2>Your cash <HelpTip title="Your cash">Enter one balance per bank (combine accounts at the same bank). These are your own figures or hypothetical ones; CascadeGuard does not connect to accounts.</HelpTip></h2><p>Combine accounts at each bank. Use hypothetical figures if preferred.</p>{input.positions.map(p=><div className="bank-input-row" key={p.id}><label>Bank name<input placeholder="e.g. Operating bank" value={p.bankName} maxLength={120} onChange={e=>edit({...input,positions:input.positions.map(x=>x.id===p.id?{...x,bankName:e.target.value,cert:null}:x)})}/></label><label>Balance · USD<input type="number" inputMode="decimal" onFocus={e=>e.target.select()} min="0" step=".01" value={Number.isFinite(p.amount)?p.amount:''} onChange={e=>edit({...input,positions:input.positions.map(x=>x.id===p.id?{...x,amount:e.target.value===''?NaN:Number(e.target.value)}:x)})}/></label><button onClick={()=>{const positions=input.positions.filter(x=>x.id!==p.id);edit({...input,positions,affectedId:input.affectedId===p.id?(positions[0]?.id||''):input.affectedId});}} aria-label={'Remove '+p.bankName}>Remove</button>{snapshot&&<label>Optional evidence link<select value={p.cert??''} onChange={e=>{const cert=e.target.value?Number(e.target.value):null;const b=snapshot.banks.find(b=>b.cert===cert);edit({...input,positions:input.positions.map(x=>x.id===p.id?{...x,cert,bankName:x.bankName.trim()?x.bankName:(b?.name??x.bankName)}:x)});}}><option value="">No linked evidence</option>{snapshot.banks.map(b=><option key={b.cert} value={b.cert}>{b.name}</option>)}</select></label>}</div>)}<button className="secondary" disabled={input.positions.length>=32} onClick={()=>{const id=crypto.randomUUID();edit({...input,positions:[...input.positions,{id,bankName:'',cert:null,amount:0}],affectedId:input.affectedId||id});}}>Add bank</button><button className="primary" disabled={!result} onClick={()=>setStep(STEP.payments)}>Next: payments <ArrowRight size={16}/></button>{!result&&<p className="small muted">{validation||'Enter a bank name and a balance to continue.'}</p>}{evidenceError&&<p>{evidenceError}</p>}</section>}
 {view==='workspace'&&step===STEP.payments&&listMode&&<section className="card"><h2>Your essential payments <HelpTip title="Essential payments">Payments you must make in the next 30 days, such as payroll, suppliers or rent. Day 1 is the first day of the hypothetical interruption. Future receipts are not counted.</HelpTip></h2><p>Enter all essential obligations you want to cover. Future receipts are excluded.</p>{input.payments.map(p=><div className="payment-row" key={p.id}><label>Description<input placeholder="e.g. Payroll" value={p.label} maxLength={120} onChange={e=>edit({...input,payments:input.payments.map(x=>x.id===p.id?{...x,label:e.target.value}:x)})}/></label><label>USD<input type="number" inputMode="decimal" onFocus={e=>e.target.select()} min="0" step=".01" value={Number.isFinite(p.amount)?p.amount:''} onChange={e=>edit({...input,payments:input.payments.map(x=>x.id===p.id?{...x,amount:e.target.value===''?NaN:Number(e.target.value)}:x)})}/></label><label>Day<input type="number" min="1" max="30" value={Number.isFinite(p.day)?p.day:''} onChange={e=>edit({...input,payments:input.payments.map(x=>x.id===p.id?{...x,day:e.target.value===''?NaN:Number(e.target.value)}:x)})}/></label><button aria-label={'Remove '+p.label} onClick={()=>edit({...input,payments:input.payments.filter(x=>x.id!==p.id)})}>×</button></div>)}<button className="secondary" disabled={input.payments.length>=100} onClick={()=>edit({...input,payments:[...input.payments,{id:crypto.randomUUID(),label:'',day:1,amount:0}]})}>Add payment</button><button className="primary" disabled={!result||result.coverage==='insufficient-input'} onClick={()=>setStep(STEP.scenario)}>Continue to Scenario Lab <ArrowRight size={16}/></button><button type="button" className="quiet" onClick={()=>setStep(STEP.cash)}><ArrowLeft size={16}/> Back</button></section>}
 {view==='workspace'&&step===STEP.scenario&&(listMode||scnAtEnd)&&result&&<section className={'card scenario-result '+(result.coverage==='insufficient-input'?'pending':result.maximumShortfall?'risk':'ok')} aria-label="Current result" aria-live="polite"><p className="eyebrow">CURRENT RESULT</p><h2>{result.coverage==='insufficient-input'?'Add positive obligations to assess coverage.':result.maximumShortfall?<>You are <em>{tidy(result.maximumShortfall)}</em> short{result.firstShortfallDay?<> from <em>day {result.firstShortfallDay}</em></>:''} if {bankName(input.affectedId)} is {input.unavailablePercent}% unavailable for {input.durationDays} days.</>:<>Entered cash covers every scheduled payment if {bankName(input.affectedId)} is {input.unavailablePercent}% unavailable for {input.durationDays} days.</>}</h2><p className="small muted">Updates as you change the assumptions below. One hypothetical interruption, not a prediction.</p></section>}
 {view==='workspace'&&step===STEP.scenario&&listMode&&<section className="card scenario-editor"><div className="section-heading"><div><h2>Interruption assumptions <HelpTip title="Interruption assumptions">A what-if, not a forecast: pick one bank, the share of its balance you cannot use, and for how many days. They are your assumptions; nothing here estimates the chance of a real freeze.</HelpTip></h2><p>Adjust a hypothetical loss of access to one bank.</p></div><span className="mode-badge">User assumptions</span></div>{selection(input.affectedId,id=>edit({...input,affectedId:id}),'Affected bank')}<label className="field">Temporarily unavailable · %<input type="number" min="0" max="100" step=".1" value={Number.isFinite(input.unavailablePercent)?input.unavailablePercent:''} onChange={e=>edit({...input,unavailablePercent:e.target.value===''?NaN:Number(e.target.value)})}/></label><label className="field">Duration · days<input type="number" min="1" max="30" value={Number.isFinite(input.durationDays)?input.durationDays:''} onChange={e=>edit({...input,durationDays:e.target.value===''?NaN:Number(e.target.value)})}/></label><p>Funds return at the start of day {Number.isFinite(input.durationDays)?input.durationDays+1:'—'}. Accessible funds are assumed usable to pay all entered obligations.</p><button className="primary" disabled={!result||result.coverage==='insufficient-input'} onClick={()=>setStep(STEP.results)}>See results <ArrowRight size={16}/></button><button type="button" className="quiet" onClick={()=>setStep(STEP.payments)}><ArrowLeft size={16}/> Back</button></section>}
{view==='workspace'&&step===STEP.scenario&&(listMode||scnAtEnd)&&result&&<section className="card" aria-label="Each bank under the same assumptions"><div className="section-heading"><div><h2>If a different bank were the one interrupted <HelpTip title="Each bank in turn">Your {input.unavailablePercent}% and {input.durationDays} days are applied to each bank in turn. These are your assumptions, not a forecast, and nothing here draws on public bank data.</HelpTip></h2><p>Same {input.unavailablePercent}% unavailable for {input.durationDays} days, applied to each bank in turn.</p></div></div><div className="table-scroll" role="region" aria-label="Shortfall by interrupted bank" tabIndex={0}><table className="exposure"><thead><tr><th>Bank</th><th>Balance</th><th>Shortfall if interrupted</th><th>First short day</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{bankExposure(input).map(r=>{const picked=r.id===input.affectedId;return <tr key={r.id} className={picked?'selected':''}><td>{r.name}</td><td>{usd(r.amount)}</td><td className={r.shortfall>0?'bad-text':'good-text'}>{r.shortfall>0?usd(r.shortfall):'Covered'}</td><td>{r.firstDay?'Day '+r.firstDay:'—'}</td><td><button type="button" className="quiet" disabled={picked} onClick={()=>edit({...input,affectedId:r.id})}>{picked?'Selected':'Use as affected bank'}</button></td></tr>;})}</tbody></table></div><p className="source-note">Source: balances and payments you entered. Preparation in the Results step is calculated for the selected bank only.</p></section>}
{view==='workspace'&&step===STEP.scenario&&(listMode||scnAtEnd)&&result&&<section className="card"><h2>Calculation details</h2><p>{result.assumptions}</p><details><summary>Daily calculation</summary><p className="small muted">The exact figures behind the chart: what is due each day, your balance with no interruption (baseline) and with your interruption (scenario).</p><div className="table-scroll" role="region" aria-label="Daily cash calculation" tabIndex={0}><table><thead><tr><th>Day</th><th>Due</th><th>Baseline</th><th>Scenario</th></tr></thead><tbody>{result.daily.map(d=><tr key={d.day}><td>{d.day}</td><td>{usd(d.due)}</td><td>{usd(d.baseline)}</td><td>{usd(d.stressed)}</td></tr>)}</tbody></table></div></details><button className="secondary" onClick={()=>void verify()}>Verify calculation</button><HelpTip title="Verify calculation">Runs the same calculation on the local server and checks both give identical numbers.</HelpTip>{verification&&<p role="status">{verification}</p>}
 <details className="copilot-panel"><summary>Treasury Copilot · explain or draft assumptions</summary><h3>Treasury Copilot <HelpTip title="Treasury Copilot">Explains your result in words and can draft assumptions from a sentence. Every amount comes from the deterministic calculation, never from the AI, and it cannot apply changes.</HelpTip></h3><p>{explain(coreInput(input))}</p><p className="small muted">Ask about coverage, minimum preparation, or draft assumptions such as “80% unavailable for 21 days”. Every amount is calculated from your inputs.</p><label className="confirm"><input type="checkbox" checked={useAI} onChange={e=>{resetCopilot();setUseAI(e.target.checked);}}/>Use optional AI to interpret my question</label><p className="small muted">If configured, only the text you type is sent to Google Gemini through this server. Do not include account numbers or secrets. Portfolio balances, payment schedules and bank evidence are not sent to the AI provider. AI cannot confirm or apply allocations. Without AI, guided mode stays available.</p><label className="field">Question about this scenario<textarea value={question} maxLength={500} onChange={e=>{resetCopilot();setQuestion(e.target.value);}}/></label><button className="secondary" disabled={copilotBusy} onClick={()=>void askCopilot()}>{copilotBusy?'Interpreting question…':'Ask Copilot'}</button>{reply&&<p role="status">{reply}</p>}{copilotDraft&&<div className="proposal"><h4>Review draft assumptions</h4><p>{copilotDraft.unavailablePercent}% unavailable for {copilotDraft.durationDays} days. Your current scenario has not changed.</p><button className="secondary" onClick={()=>edit({...input,...copilotDraft})}>Use these assumptions in simulation</button></div>}
 </details></section>}
 </>}
 {view==='workspace'&&step===STEP.plan&&result&&<section className="card printable-plan"><div className="no-print"><button onClick={createPlanPdf}>Create one-page PDF</button><button onClick={()=>window.print()}>Print text / browser PDF</button><button onClick={()=>setStep(STEP.results)}>Back to results</button></div><h2>CascadeGuard preparation plan</h2>{planPdf&&<div className="no-print"><a href={planPdf.pdfUrl} download="cascadeguard-preparation-plan.pdf">Download one-page PDF</a><p className="small muted">This PDF is a single-page image. Use the text view below or browser print for selectable text; export JSON for complete inputs/history.</p><img src={planPdf.previewUrl} alt="Preview of the one-page preparation plan; the same assumptions and results are in the text below." style={{width:420,maxWidth:'100%',height:'auto'}}/></div>}<p>Prepared {new Date().toLocaleDateString('en-US')}. USD · simulation before interrupted access.</p><p>Affected bank: {bankName(input.affectedId)}. {input.unavailablePercent}% unavailable for {input.durationDays} days. Funds return at start of day {input.durationDays+1}.</p><p>Total funds {usd(result.total)}; scheduled obligations {usd(result.expenses)}. First shortfall {result.firstShortfallDay?'day '+result.firstShortfallDay:'none'}; maximum cumulative shortfall {usd(result.maximumShortfall)}.</p><h3>Current bank balances</h3><ul>{input.positions.slice(0,6).map(p=><li key={p.id}>{p.bankName}: {usd(p.amount)}</li>)}</ul>{input.positions.length>6&&<p>{input.positions.length-6} additional banks. Export JSON for full inputs.</p>}<h3>Next scheduled payments</h3><ul>{[...input.payments].sort((a,b)=>a.day-b.day).slice(0,8).map(p=><li key={p.id}>Day {p.day} · {p.label}: {usd(p.amount)}</li>)}</ul>{input.payments.length>8&&<p>{input.payments.length-8} additional payments included in totals; export JSON for full inputs.</p>}
 {liveComparison?<p>Unconfirmed proposal: {usd(liveComparison.amount)} from {bankName(liveComparison.from)} to {bankName(liveComparison.to)}. Maximum shortfall before {usd(liveComparison.beforeResult.maximumShortfall)}, after {usd(liveComparison.afterResult.maximumShortfall)}.</p>:confirmedAction?<p>Confirmed simulation: {usd(confirmedAction.amount)} from {bankName(confirmedAction.from)} to {bankName(confirmedAction.to)}, recorded {confirmedAction.at}. Maximum shortfall before {usd(calculatePortfolio(confirmedAction.before).maximumShortfall)}, after {usd(calculatePortfolio(confirmedAction.after).maximumShortfall)}.</p>:<p>No current reviewed allocation. Historical simulated changes: {session.activity.length}. See exported JSON for full before/after history.</p>}<p>{result.assumptions} This evaluates one selected bank interruption; it is not a bank failure prediction or instruction to transfer real money.</p><p>Bank evidence: {snapshot?'snapshot '+snapshot.version+' collected '+snapshot.collectedAt.slice(0,10):'unavailable; no bank evidence used in calculation'}.</p><div className="readiness-note"><h3>Before relying on this preparation</h3><p>Confirm the destination account can pay your obligations, payroll instructions are ready, and transfer limits, cutoffs and approvals allow funds to arrive in time. These operational checks are not verified by this simulation.</p></div></section>}
 {session.legacyActivity?.length? <p>Preserved {session.legacyActivity.length} legacy allocation records without original scenario assumptions. They are not reclassified as reviewed preparation plans.</p>:null}
 </>}
 {dialog&&<div className="modal-back" onClick={()=>setDialog(null)}><div role="dialog" aria-modal="true" aria-label="Confirm" className="modal" onClick={e=>e.stopPropagation()}><p>{dialog.message}</p><div className="modal-actions"><button autoFocus onClick={()=>setDialog(null)}>Cancel</button><button className="primary" onClick={()=>{const y=dialog.onYes;setDialog(null);y();}}>{dialog.yes}</button></div></div></div>}
 </main></div></div>;
}
