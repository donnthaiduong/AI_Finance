'use client';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const exact=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
export const whole=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export const compact=(n:number)=>(n<0?'−':'')+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(Math.abs(n));

const reduced=()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Counts from the previous value to the exact target; the final value is always the exact one. */
export function useCountUp(target:number,ms=900){
 const [value,setValue]=useState(0),from=useRef(0);
 useEffect(()=>{
  if(reduced()||!Number.isFinite(target)){from.current=target;setValue(target);return;}
  const start=performance.now(),origin=from.current;let frame=0;
  const tick=(now:number)=>{
   const t=Math.min(1,(now-start)/ms),eased=1-Math.pow(1-t,3);
   const next=t>=1?target:origin+(target-origin)*eased;
   from.current=next;setValue(next);
   if(t<1)frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  // rAF is paused in background tabs; the exact figure must never stay stale.
  const settle=setTimeout(()=>{cancelAnimationFrame(frame);from.current=target;setValue(target);},ms+120);
  return()=>{cancelAnimationFrame(frame);clearTimeout(settle);};
 },[target,ms]);
 return value;
}
export function Money({value,whole:w=false}:{value:number;whole?:boolean}){
 const v=useCountUp(value);
 return <>{(w?whole:exact)(Math.abs(v)<.005?0:v)}</>;
}

/** Small "?" button that opens a short explanation: what it is, how it works, why it exists. */
export function HelpTip({title,children,label}:{title:string;children:ReactNode;label?:string}){
 const [open,setOpen]=useState(false),[side,setSide]=useState<'left'|'right'>('left');
 const box=useRef<HTMLSpanElement>(null),id=useId();
 useLayoutEffect(()=>{
  if(!open||!box.current)return;
  const r=box.current.getBoundingClientRect();
  setSide(r.left>window.innerWidth/2?'right':'left');
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const down=(e:MouseEvent|TouchEvent)=>{if(box.current&&!box.current.contains(e.target as Node))setOpen(false);};
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};
  document.addEventListener('mousedown',down);document.addEventListener('touchstart',down);document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('mousedown',down);document.removeEventListener('touchstart',down);document.removeEventListener('keydown',key);};
 },[open]);
 return <span className="help" ref={box}>
  <button type="button" className="help-btn" aria-expanded={open} aria-controls={id} aria-label={label??`What is ${title}?`} onClick={()=>setOpen(o=>!o)}>?</button>
  {open&&<span id={id} role="note" className={'help-pop '+side}><strong>{title}</strong><span className="help-body">{children}</span><button type="button" className="help-close" onClick={()=>setOpen(false)}>Got it</button></span>}
 </span>;
}

export function useElementWidth<T extends HTMLElement>(fallback=720){
 const ref=useRef<T>(null),[width,setWidth]=useState(fallback);
 useLayoutEffect(()=>{
  const el=ref.current;if(!el)return;
  const set=()=>setWidth(Math.max(240,Math.round(el.getBoundingClientRect().width)));
  set();
  if(typeof ResizeObserver==='undefined')return;
  const ro=new ResizeObserver(set);ro.observe(el);return()=>ro.disconnect();
 },[]);
 return [ref,width] as const;
}

export function niceTicks(low:number,high:number,target=4){
 const lo=Math.min(low,0),hi=Math.max(high,0),range=hi-lo||1,rough=range/target,pow=Math.pow(10,Math.floor(Math.log10(rough))),f=rough/pow;
 const step=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*pow;
 const start=Math.floor(lo/step)*step,end=Math.ceil(hi/step)*step,ticks:number[]=[];
 for(let v=start;v<=end+step/1000;v+=step)ticks.push(Math.round(v*100)/100);
 return {ticks,min:start,max:end};
}

export const BANK_COLORS=['#2563eb','#0f9d8a','#f59e0b','#8b5cf6','#ec4899','#64748b','#0891b2','#84cc16'];

export function Donut({parts,center,sub}:{parts:{label:string;value:number}[];center:string;sub:string}){
 const total=parts.reduce((s,p)=>s+Math.max(0,p.value),0);let offset=0;
 return <svg className="donut" viewBox="0 0 120 120" role="img" aria-label={`${sub}: ${center}. ${parts.map(p=>`${p.label} ${total?(p.value/total*100).toFixed(1):0}%`).join(', ')}`}>
  <circle cx="60" cy="60" r="46" pathLength={100} fill="none" stroke="var(--track)" strokeWidth="14"/>
  {total>0&&parts.map((p,i)=>{const share=Math.max(0,p.value)/total*100,gap=parts.length>1?Math.min(1.2,share/3):0,len=Math.max(0,share-gap);const el=<circle key={p.label+i} className="donut-seg" cx="60" cy="60" r="46" pathLength={100} fill="none" stroke={BANK_COLORS[i%BANK_COLORS.length]} strokeWidth="14" style={{strokeDasharray:`${len} ${100-len}`,strokeDashoffset:-offset,animationDelay:`${i*120}ms`}} transform="rotate(-90 60 60)"/>;offset+=share;return el;})}
  <text x="60" y="58" textAnchor="middle" className="donut-center">{center}</text>
  <text x="60" y="74" textAnchor="middle" className="donut-sub">{sub}</text>
 </svg>;
}

type Row={day:number;due:number;baseline:number;stressed:number;shortfall:number};
export function CashChart({daily,proposed,day,onDay,durationDays,payments}:{daily:Row[];proposed?:Row[];day:number;onDay:(d:number)=>void;durationDays:number;payments:{id:string;label:string;day:number;amount:number}[]}){
 const [ref,width]=useElementWidth<HTMLDivElement>();
 const narrow=width<520,height=narrow?250:320,left=narrow?44:56,right=narrow?10:18,top=36,bottom=34;
 const plotW=width-left-right,plotH=height-top-bottom,col=plotW/30;
 const values=[...daily.flatMap(d=>[d.baseline,d.stressed]),...(proposed?.map(d=>d.stressed)??[]),0];
 const {ticks,min,max}=niceTicks(Math.min(...values),Math.max(...values,1));
 const x=(d:number)=>left+(d-1)*col,y=(v:number)=>top+(max-v)/(max-min||1)*plotH,y0=y(0);
 const step=(rows:Row[],key:'baseline'|'stressed')=>rows.map((d,i)=>`${i?'H '+x(d.day)+' V':'M '+x(d.day)} ${y(d[key])}`).join(' ')+` H ${left+plotW}`;
 const stressedPath=step(daily,'stressed'),area=`${stressedPath} V ${y0} H ${left} Z`;
 const dayTicks=narrow?[1,10,20,30]:[1,5,10,15,20,25,30];
 const clip=useId().replace(/:/g,'');
 const returnDay=durationDays<30?durationDays+1:null;
 const dueDays=[...new Set(payments.filter(p=>p.amount>0).map(p=>p.day))];
 const pick=(e:React.PointerEvent<SVGRectElement>)=>{const r=e.currentTarget.getBoundingClientRect();onDay(Math.min(30,Math.max(1,Math.floor((e.clientX-r.left)/(r.width/30))+1)));};
 const sel=daily[day-1];
 const labelX=Math.min(Math.max(x(day)+col/2,left+54),left+plotW-54);
 return <div ref={ref} className="chart-box">
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Thirty-day cash outlook. Lowest scenario balance ${exact(Math.min(...daily.map(d=>d.stressed)))}. Daily values are in the table in Scenario Lab.`}>
   <defs>
    <clipPath id={clip+'a'}><rect x={left} y={top} width={plotW} height={Math.max(0,y0-top)}/></clipPath>
    <clipPath id={clip+'b'}><rect x={left} y={y0} width={plotW} height={Math.max(0,top+plotH-y0)}/></clipPath>
    <linearGradient id={clip+'g'} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".22"/><stop offset="1" stopColor="#2563eb" stopOpacity=".02"/></linearGradient>
   </defs>
   <rect x={x(1)} y={top} width={col*Math.min(durationDays,30)} height={plotH} fill="var(--amber-soft)" opacity=".7"/>
   <text x={x(1)+6} y={top-12} className="chart-note">Access limited · days 1–{Math.min(durationDays,30)}</text>
   {ticks.map(t=><g key={t}><line x1={left} x2={left+plotW} y1={y(t)} y2={y(t)} stroke={t===0?'var(--axis)':'var(--grid)'} strokeDasharray={t===0?'0':'3 4'}/><text x={left-8} y={y(t)+4} textAnchor="end" className="axis-label">{compact(t)}</text></g>)}
   <path d={area} fill={`url(#${clip}g)`} clipPath={`url(#${clip}a)`} className="fade-in"/>
   <path d={area} fill="var(--bad)" opacity=".2" clipPath={`url(#${clip}b)`} className="fade-in"/>
   <path d={step(daily,'baseline')} fill="none" stroke="var(--slate)" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round"/>
   <path d={stressedPath} pathLength={1} className="draw" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round"/>
   {proposed&&<path d={step(proposed,'stressed')} pathLength={1} className="draw late" fill="none" stroke="var(--good)" strokeWidth="2.5" strokeDasharray="7 4"/>}
   {returnDay&&<g><line x1={x(returnDay)} x2={x(returnDay)} y1={top} y2={top+plotH} stroke="var(--good)" strokeDasharray="4 4"/><text x={Math.min(x(returnDay)+5,left+plotW-90)} y={top+14} className="chart-note good">Funds return · day {returnDay}</text></g>}
   {dueDays.map(d=><path key={d} d={`M ${x(d)+col/2} ${top+plotH+4} l 5 7 h -10 z`} fill="var(--ink-2)"><title>{`Day ${d}: ${payments.filter(p=>p.day===d).map(p=>p.label||'Payment').join(', ')}`}</title></path>)}
   {dayTicks.map(d=><text key={d} x={x(d)+col/2} y={height-6} textAnchor="middle" className="axis-label">{narrow?d:'Day '+d}</text>)}
   <line x1={x(day)+col/2} x2={x(day)+col/2} y1={top} y2={top+plotH} stroke="var(--ink-2)" strokeOpacity=".35"/>
   <circle cx={x(day)+col/2} cy={y(sel.stressed)} r="5.5" fill="#2563eb" stroke="#fff" strokeWidth="2"/>
   <g className="callout" transform={`translate(${labelX},${Math.max(top+4,Math.min(y(sel.stressed)-40,top+plotH-34))})`}><rect x="-54" width="108" height="30" rx="6" fill="var(--ink)"/><text y="13" textAnchor="middle" className="callout-day">Day {day}</text><text y="25" textAnchor="middle" className="callout-val">{whole(sel.stressed)}</text></g>
   <rect x={left} y={top} width={plotW} height={plotH} fill="transparent" style={{touchAction:'pan-y',cursor:'crosshair'}} onPointerDown={pick} onPointerMove={e=>{if(e.pointerType==='mouse'||e.buttons)pick(e);}}/>
  </svg>
 </div>;
}

export function DueBars({daily,day,onDay}:{daily:Row[];day:number;onDay:(d:number)=>void}){
 const [ref,width]=useElementWidth<HTMLDivElement>(),height=96,max=Math.max(...daily.map(d=>d.due),1),w=width/30;
 return <div ref={ref} className="chart-box"><svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Obligations due per day. Largest single day ${exact(max===1&&!daily.some(d=>d.due)?0:max)}.`}>
  <line x1="0" x2={width} y1={height-16} y2={height-16} stroke="var(--axis)"/>
  {daily.map(d=>{const h=d.due?Math.max(3,d.due/max*(height-30)):0;return <g key={d.day} onClick={()=>onDay(d.day)} style={{cursor:'pointer'}}><rect x={(d.day-1)*w} y="0" width={w} height={height-16} fill="transparent"/>{d.due>0&&<rect className="bar" x={(d.day-1)*w+w*.18} y={height-16-h} width={Math.max(2,w*.64)} height={h} rx="2" fill={d.shortfall?'var(--bad)':'#2563eb'} opacity={d.day===day?1:.72} style={{animationDelay:`${d.day*18}ms`}}><title>{`Day ${d.day}: ${exact(d.due)} due`}</title></rect>}</g>;})}
  {[1,10,20,30].map(d=><text key={d} x={(d-1)*w+w/2} y={height-3} textAnchor="middle" className="axis-label">{d}</text>)}
 </svg></div>;
}

export function Gauge({label,parts,marker,markerLabel}:{label:string;parts:{label:string;value:number;tone:'good'|'warn'}[];marker:number;markerLabel:string}){
 const total=parts.reduce((s,p)=>s+p.value,0)||1,scale=Math.max(total,marker)||1;
 return <div className="gauge" role="img" aria-label={`${label}. ${parts.map(p=>`${p.label} ${exact(p.value)}`).join(', ')}. ${markerLabel} ${exact(marker)}.`}>
  <div className="gauge-track">{parts.map(p=><span key={p.label} className={'gauge-seg '+p.tone} style={{width:`${p.value/scale*100}%`}}/>)}<i className="gauge-marker" style={{left:`${Math.min(100,marker/scale*100)}%`}}><b>{markerLabel}</b></i></div>
  <div className="gauge-legend">{parts.map(p=><span key={p.label}><i className={p.tone}/>{p.label} <b>{whole(p.value)}</b></span>)}</div>
 </div>;
}
