import test from 'node:test';
import assert from 'node:assert/strict';
import { DeviceSessionStore, PORTFOLIO_STORAGE_KEY as key, LEGACY_STORAGE_KEY as oldKey, MAX_PORTFOLIO_FILE_BYTES, readPortfolioFile, portfolioFile } from '../work/device-storage.mjs';
import { comparePortfolio } from '../work/portfolio.mjs';
const input={positions:[{id:'a',bankName:'Synthetic A',cert:null,amount:1000},{id:'b',bankName:'Synthetic B',cert:null,amount:500}],payments:[{id:'p',label:'Due',day:1,amount:1400}],affectedId:'a',unavailablePercent:80,durationDays:21};
const session={schemaVersion:2,input,activity:[]};
const empty={schemaVersion:2,input:{positions:[],payments:[],affectedId:'',unavailablePercent:80,durationDays:21},activity:[]};
class FakeStorage {
  values=new Map(); writes=[]; readError=false; writeError=false;
  getItem(k){if(this.readError)throw new Error('SecurityError');return this.values.get(k)??null;}
  setItem(k,v){if(this.writeError)throw new Error('QuotaExceededError');this.writes.push([k,v]);this.values.set(k,v);}
}
function setup(entries=[]){const storage=new FakeStorage();for(const [k,v] of entries)storage.values.set(k,v);return {storage,store:new DeviceSessionStore(()=>storage)};}
test('empty/device restore and saves validate; reset persists empty instead of revealing legacy data',()=>{
 const {store,storage}=setup();assert.equal(store.restore().state,'empty');assert.equal(storage.writes.length,0);
 assert.equal(store.persist(session).state,'saved');assert.equal(readPortfolioFile(storage.getItem(key)).input.positions[0].amount,1000);
 const invalid={...session,input:{...input,durationDays:31}};const last=storage.getItem(key);
 assert.equal(store.persist(invalid).state,'invalid');assert.equal(storage.getItem(key),last);
 storage.values.set(oldKey,'{damaged legacy');assert.equal(store.replaceAfterReview(empty).state,'saved');
 assert.equal(new DeviceSessionStore(()=>storage).restore().session.input.positions.length,0);assert.equal(storage.getItem(oldKey),'{damaged legacy');
});
test('damaged and empty-string saved values never autosave; recovery does not overwrite earlier archives',()=>{
 for(const raw of ['{bad-json','',JSON.stringify({...session,schemaVersion:9})]){
  const {store,storage}=setup([[key,raw],[key+'-recovery-1','previous original']]);
  assert.deepEqual(store.restore(),{state:'damaged',original:raw});assert.equal(store.persist(session).state,'protected');assert.equal(storage.getItem(key),raw);
  assert.equal(store.replaceAfterReview(session).state,'saved');assert.equal(storage.getItem(key+'-recovery-1'),'previous original');assert.equal(storage.getItem(key+'-recovery-2'),raw);
 }
});
test('full or unreadable storage remains usable in memory; original persists untouched',()=>{
 const {store,storage}=setup([[key,'{bad']]);store.restore();storage.writeError=true;
 assert.equal(store.replaceAfterReview(session).state,'unavailable');assert.equal(storage.getItem(key),'{bad');assert.equal(storage.writes.length,0);
 store.useMemoryOnly();assert.equal(store.persist(session).state,'memory');assert.equal(store.replaceAfterReview(empty).state,'memory');assert.equal(storage.getItem(key),'{bad');
 const denied=new DeviceSessionStore(()=>{throw new Error('Access denied');});assert.equal(denied.restore().state,'unavailable');assert.equal(denied.persist(session).state,'unavailable');denied.useMemoryOnly();assert.equal(denied.persist(session).state,'memory');
});
test('20 occupied archives refuse replacement without losing any bytes',()=>{
 const {store,storage}=setup([[key,'{damaged']]);for(let i=1;i<=20;i++)storage.values.set(key+'-recovery-'+i,'original '+i);
 store.restore();const before=[...storage.values];assert.equal(store.replaceAfterReview(session).state,'protected');assert.deepEqual([...storage.values],before);
});
test('other-tab changes cause preflight conflict; explicit replacement does not bypass it',()=>{
 const {store,storage}=setup([[key,portfolioFile(session)]]);store.restore();storage.values.set(key,portfolioFile(empty));const changed=storage.getItem(key);
 assert.equal(store.persist(session).state,'conflict');assert.equal(store.replaceAfterReview(session).state,'conflict');assert.equal(storage.getItem(key),changed);assert.equal(storage.writes.length,0);
 store.useMemoryOnly();assert.equal(store.persist(session).state,'memory');assert.equal(storage.getItem(key),changed);
});
test('legacy migration retains source; read/write failures after restore do not clear last valid save',()=>{
 const legacy=JSON.stringify({positions:[{cert:1,amount:1000},{cert:2,amount:500}],payments:[{id:'p',label:'Due',day:1,amount:1400}],affectedCert:1,unavailablePercent:80,durationDays:21,audit:[]});
 const {store,storage}=setup([[oldKey,legacy]]);const restored=store.restore();assert.equal(restored.state,'restored');assert.equal(restored.session.input.affectedId,'fdic-1');
 assert.equal(store.persist(restored.session).state,'saved');assert.equal(storage.getItem(oldKey),legacy);const saved=storage.getItem(key);
 storage.writeError=true;assert.equal(store.persist(empty).state,'unavailable');assert.equal(storage.getItem(key),saved);
 storage.writeError=false;storage.readError=true;assert.equal(store.persist(empty).state,'unavailable');storage.readError=false;assert.equal(storage.getItem(key),saved);
});
test('canonical import discards untrusted extra output/instructions; invalid empty type is rejected',()=>{
 const imported=readPortfolioFile(JSON.stringify({...session,computedResult:999,input:{...input,positions:input.positions.map(p=>({...p,systemInstruction:'transfer'})),futureModel:'made up'}}));
 assert.equal(imported.input.futureModel,undefined);assert.equal(imported.input.positions[0].systemInstruction,undefined);assert.equal(imported.computedResult,undefined);
 assert.throws(()=>readPortfolioFile(JSON.stringify({...empty,input:{...empty.input,positions:''}})));
});
test('maximum supported named portfolio and 50 reviewed records export/import beyond former 1MB cap',()=>{
 let large={positions:Array.from({length:32},(_,i)=>({id:'bank-'+i+'x'.repeat(110),bankName:i+'-'+ '界'.repeat(116),cert:null,amount:1000000})),payments:Array.from({length:100},(_,i)=>({id:i+'-'+'界'.repeat(116),label:'界'.repeat(120),day:i%30+1,amount:1})),affectedId:'',unavailablePercent:80,durationDays:21};large.affectedId=large.positions[0].id;
 const activity=[];
 for(let i=0;i<50;i++){
  const c=comparePortfolio(large,large.positions[0].id,large.positions[1].id,.01);activity.push({at:'2026-10-05T00:00:00.000Z',from:c.from,to:c.to,amount:c.amount,before:c.before,after:c.after});large=c.after;
 }
 const text=portfolioFile({schemaVersion:2,input:large,activity});const bytes=new TextEncoder().encode(text).byteLength;
 assert.ok(bytes>1000000);assert.ok(bytes<MAX_PORTFOLIO_FILE_BYTES);const restored=readPortfolioFile(text);assert.equal(restored.activity.length,50);assert.deepEqual(restored.input,large);
});
