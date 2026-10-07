'use client';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const exact=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
export const whole=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
/** Whole dollars when the cents are zero, otherwise exact to the cent. Never rounds an amount. */
export const tidy=(n:number)=>Math.round(n*100)%100===0?whole(n):exact(n);
export const compact=(n:number)=>(n<0?'−':'')+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(Math.abs(n));

/** Static amount: whole dollars when cents are zero, otherwise exact. No count-up, so a figure is never shown half-formed. */
export function Money({value,whole:w=false}:{value:number;whole?:boolean}){
 const v=Math.abs(value)<.005?0:value;
 return <>{(w||Math.round(v*100)%100===0?whole:exact)(v)}</>;
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

type Row={day:number;due:number;baseline:number;stressed:number;shortfall:number};

/**
 * Cash outlook as a price-and-volume chart: cash left on top, payments due underneath, one shared day axis.
 * Lines are straight steps because the balance only changes on due days. Square marks, 1px grid, no curves.
 */
export function MarketChart({daily,proposed,day,onDay,durationDays,firstShortfallDay}:{daily:Row[];proposed?:Row[];day:number;onDay:(d:number)=>void;durationDays:number;firstShortfallDay:number|null}){
 const [ref,width]=useElementWidth<HTMLDivElement>();
 const [hover,setHover]=useState<number|null>(null);
 const narrow=width<520,left=10,right=narrow?50:64,top=16,priceH=narrow?200:250,gap=24,volH=narrow?56:76,axisH=26;
 const plotW=width-left-right,col=plotW/30,height=top+priceH+gap+volH+axisH;
 const values=[...daily.flatMap(d=>[d.baseline,d.stressed]),...(proposed?.map(d=>d.stressed)??[]),0];
 const {ticks,min,max}=niceTicks(Math.min(...values),Math.max(...values,1));
 const x=(d:number)=>left+(d-1)*col,y=(v:number)=>top+(max-v)/(max-min||1)*priceH,y0=y(0);
 const volTop=top+priceH+gap,volBase=volTop+volH,maxDue=Math.max(...daily.map(d=>d.due),1);
 const step=(rows:Row[],key:'baseline'|'stressed')=>rows.map((d,i)=>`${i?'H '+x(d.day)+' V':'M '+x(d.day)} ${y(d[key])}`).join(' ')+` H ${left+plotW}`;
 const stressedPath=step(daily,'stressed'),area=`${stressedPath} V ${y0} H ${left} Z`;
 const dayTicks=narrow?[1,10,20,30]:[1,5,10,15,20,25,30];
 const clip=useId().replace(/:/g,'');
 const returnDay=durationDays<30?durationDays+1:null;
 const active=hover??day,sel=daily[active-1],cx=x(active)+col/2;
 const pick=(e:React.PointerEvent<SVGRectElement>)=>{const r=e.currentTarget.getBoundingClientRect();return Math.min(30,Math.max(1,Math.floor((e.clientX-r.left)/(r.width/30))+1));};
 const key=(e:React.KeyboardEvent)=>{
  const k=e.key,move=k==='ArrowRight'?1:k==='ArrowLeft'?-1:k==='PageUp'?5:k==='PageDown'?-5:0;
  if(move){e.preventDefault();onDay(Math.min(30,Math.max(1,day+move)));}
  else if(k==='Home'){e.preventDefault();onDay(1);}
  else if(k==='End'){e.preventDefault();onDay(30);}
 };
 return <div className="mchart">
  <dl className="readout" aria-live="polite">
   <div><dt>Day</dt><dd>{active}</dd></div>
   <div><dt>Due</dt><dd>{exact(sel.due)}</dd></div>
   <div><dt>Scenario</dt><dd className={sel.stressed<0?'bad-text':''}>{exact(sel.stressed)}</dd></div>
   <div><dt>No interruption</dt><dd>{exact(sel.baseline)}</dd></div>
   {proposed&&<div><dt>After proposal</dt><dd className="good-text">{exact(proposed[active-1].stressed)}</dd></div>}
  </dl>
  <div ref={ref} className="chart-box" tabIndex={0} role="slider" aria-label="Inspect cash outlook day" aria-valuemin={1} aria-valuemax={30} aria-valuenow={day} aria-valuetext={`Day ${day}, scenario cash left ${exact(daily[day-1].stressed)}`} onKeyDown={key}>
   <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Thirty-day cash outlook with payments due. Lowest scenario balance ${exact(Math.min(...daily.map(d=>d.stressed)))}.`}>
    <defs>
     <clipPath id={clip+'a'}><rect x={left} y={top} width={plotW} height={Math.max(0,y0-top)}/></clipPath>
     <clipPath id={clip+'b'}><rect x={left} y={y0} width={plotW} height={Math.max(0,top+priceH-y0)}/></clipPath>
    </defs>
    <rect x={x(1)} y={top} width={col*Math.min(durationDays,30)} height={priceH} fill="var(--amber-soft)" opacity=".55"/>
    <text x={x(1)+6} y={top+12} className="chart-note">Access limited · days 1–{Math.min(durationDays,30)}</text>
    {dayTicks.map(d=><line key={'v'+d} x1={x(d)+col/2} x2={x(d)+col/2} y1={top} y2={volBase} stroke="var(--grid)" strokeWidth="1" shapeRendering="crispEdges" opacity=".6"/>)}
    {ticks.filter(t=>t!==0).map(t=><g key={t}><line x1={left} x2={left+plotW} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth="1" shapeRendering="crispEdges"/><text x={left+plotW+8} y={y(t)+4} className="axis-label">{compact(t)}</text></g>)}
    <path d={area} fill="#2563eb" opacity=".07" clipPath={`url(#${clip}a)`}/>
    <path d={area} fill="var(--bad)" opacity=".16" clipPath={`url(#${clip}b)`}/>
    <line x1={left} x2={left+plotW} y1={y0} y2={y0} stroke="var(--ink-2)" strokeWidth="1" shapeRendering="crispEdges"/>
    <text x={left+plotW+8} y={y0+4} className="axis-label strong">$0</text>
    <path d={step(daily,'baseline')} fill="none" stroke="var(--slate)" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="butt" strokeLinejoin="miter"/>
    <path d={stressedPath} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter"/>
    {proposed&&<path d={step(proposed,'stressed')} fill="none" stroke="var(--good)" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter"/>}
    {returnDay&&<g><line x1={x(returnDay)} x2={x(returnDay)} y1={top} y2={volBase} stroke="var(--good)" strokeWidth="1" strokeDasharray="4 3" shapeRendering="crispEdges"/><text x={Math.min(x(returnDay)+5,left+plotW-96)} y={top+12} className="chart-note good">Funds return · day {returnDay}</text></g>}
    {firstShortfallDay&&<rect x={x(firstShortfallDay)+col/2-4} y={y(daily[firstShortfallDay-1].stressed)-4} width="8" height="8" fill="var(--bad)" stroke="#fff" strokeWidth="1"><title>{`First shortfall: day ${firstShortfallDay}`}</title></rect>}
    <text x={x(1)+2} y={volTop-3} className="axis-label">Payments due</text>
    <line x1={left} x2={left+plotW} y1={volBase} y2={volBase} stroke="var(--axis)" strokeWidth="1" shapeRendering="crispEdges"/>
    <text x={left+plotW+8} y={volTop+8} className="axis-label">{compact(maxDue)}</text><text x={left+plotW+8} y={volBase+4} className="axis-label">$0</text>
    {daily.map(d=>{if(d.due<=0)return null;const h=Math.max(2,d.due/maxDue*volH);return <rect key={d.day} data-day={d.day} data-short={d.shortfall>0?'true':'false'} x={x(d.day)+col*.2} y={volBase-h} width={Math.max(2,col*.6)} height={h} fill={d.shortfall>0?'var(--bad)':'#94a3b8'} opacity={d.day===active?1:.8} shapeRendering="crispEdges"><title>{`Day ${d.day}: ${exact(d.due)} due`}</title></rect>;})}
    {dayTicks.map(d=><text key={'x'+d} x={x(d)+col/2} y={height-8} textAnchor="middle" className="axis-label">{narrow?d:'Day '+d}</text>)}
    <line x1={cx} x2={cx} y1={top} y2={volBase} stroke="var(--ink)" strokeWidth="1" opacity=".55" shapeRendering="crispEdges"/>
    <rect x={cx-4} y={y(sel.stressed)-4} width="8" height="8" fill="#2563eb" stroke="#fff" strokeWidth="1.5"/>
    <rect x={left} y={top} width={plotW} height={volBase-top} fill="transparent" style={{touchAction:'pan-y',cursor:'crosshair'}}
     onPointerMove={e=>setHover(pick(e))} onPointerLeave={()=>setHover(null)} onPointerDown={e=>{const d=pick(e);setHover(d);onDay(d);}}/>
   </svg>
  </div>
 </div>;
}

type BarRow={key:string;label:string;value:number;text:string;note?:string;tone:'accent'|'muted'|'bad'};
/** Sorted horizontal bars with the value at the end of each bar. One accent for the selected item, grey for the rest. */
export function BarList({rows,ariaLabel}:{rows:BarRow[];ariaLabel:string}){
 const max=Math.max(...rows.map(r=>r.value),1);
 return <ul className="barlist" aria-label={ariaLabel}>{rows.map(r=><li key={r.key}>
  <span className="bl-label">{r.label}</span>
  <span className="bl-track"><i className={'bl-fill '+r.tone} style={{width:`${r.value>0?Math.max(1,r.value/max*100):0}%`}}/></span>
  <span className="bl-value">{r.text}</span>
  {r.note&&<small className="bl-note">{r.note}</small>}
 </li>)}</ul>;
}
