'use client';
// Copy to app/verification-copilot/page.tsx only for local UI checks, then remove.
import { useRef, useState } from 'react';
import TreasuryWorkspace from '../../app/treasury-workspace';
import { runCopilotTool, type CopilotRequest } from '../../lib/treasury-copilot';

export default function CopilotHarness(){
 const saved=useRef(new Map<string,string>()).current;
 const queue=useRef<{request:CopilotRequest;resolve:(r:Response)=>void}[]>([]).current;
 const [pending,setPending]=useState(0),[released,setReleased]=useState(0);
 const transport:typeof fetch=async(_url,options)=>{
   const request=JSON.parse(String(options?.body)) as CopilotRequest;
   return new Promise<Response>(resolve=>{queue.push({request,resolve});setPending(queue.length);});
 };
 function release(){
   const next=queue.shift();if(!next)return;
   const intent=next.request.question.includes('80%')?'draft':next.request.question.toLowerCase().includes('minimum')?'minimum':'explain';
   const result=runCopilotTool(next.request,{intent,unavailablePercent:intent==='draft'?80:null,durationDays:intent==='draft'?21:null},'guided','Synthetic delayed response.');
   next.resolve(Response.json(result));setPending(queue.length);setReleased(n=>n+1);
 }
 return <><section style={{marginLeft:242,padding:12,background:'#fff6ce'}}><h2>Local verification · delayed Copilot</h2><button onClick={release} disabled={!pending}>Release oldest response</button><p>Queued: {pending}. Released: {released}. Synthetic transport; no AI provider request.</p></section><TreasuryWorkspace storageAccess={()=>({getItem:k=>saved.get(k)??null,setItem:(k,v)=>{saved.set(k,v);}})} copilotFetch={transport}/></>;
}
