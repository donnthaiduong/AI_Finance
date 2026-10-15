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
  const set=()=>setWidth(Math.max(160,Math.round(el.getBoundingClientRect().width)));
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
