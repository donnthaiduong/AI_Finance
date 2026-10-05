'use client';
// Copy to app/verification-storage/page.tsx for a temporary local UI check.
// Remove that route after the check; these controls are not part of the product.
import { useRef, useState } from 'react';
import TreasuryWorkspace from '../../app/treasury-workspace';
import { PORTFOLIO_STORAGE_KEY as key } from '../../lib/device-storage';

class FaultStorage {
  values=new Map([[key,'{broken-original'],[key+'-recovery-1','prior-original']]);
  readBlocked=false;writeBlocked=true;writes=0;
  getItem(k:string){if(this.readBlocked)throw new Error('SecurityError');return this.values.get(k)??null;}
  setItem(k:string,v:string){if(this.writeBlocked)throw new Error('QuotaExceededError');this.writes++;this.values.set(k,v);}
}
export default function StorageHarness(){
 const storage=useRef(new FaultStorage()).current;
 const [mount,setMount]=useState(0),[observed,setObserved]=useState('Inspect device data to view the fake storage.');
 function inspect(){const raw=storage.values.get(key);let summary=raw;try{const s=JSON.parse(raw!);summary=`Valid portfolio: ${s.input.positions.length} banks; ${s.activity.length} reviewed records.`;}catch{}setObserved(`Saved: ${summary}. Recovery 1: ${storage.values.get(key+'-recovery-1')??'none'}. Recovery 2: ${storage.values.get(key+'-recovery-2')??'none'}. Writes: ${storage.writes}.`);}
 return <><div style={{position:'relative',zIndex:5,marginLeft:242,padding:12,background:'#fff6ce'}}><h2>Local verification harness · synthetic storage</h2><button onClick={()=>{storage.writeBlocked=false;inspect();}}>Allow storage writes</button><button onClick={()=>{storage.readBlocked=true;inspect();}}>Block storage reads</button><button onClick={()=>{storage.readBlocked=false;storage.writeBlocked=false;inspect();}}>Clear storage faults</button><button onClick={()=>setMount(m=>m+1)}>Reload workspace component</button><button onClick={inspect}>Inspect device data</button><button onClick={()=>{storage.values.set(key,JSON.stringify({schemaVersion:2,input:{positions:[],payments:[],affectedId:'',unavailablePercent:80,durationDays:21},activity:[]}));inspect();}}>Change device data externally</button><p role="status">{observed}</p></div><TreasuryWorkspace key={mount} storageAccess={()=>storage}/></>;
}
