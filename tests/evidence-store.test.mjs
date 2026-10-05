import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir,rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EvidenceStore} from '../work/evidence-store.mjs';
import {authenticated,readJson,BodyLimitError} from '../work/admin.mjs';
const fixture=JSON.parse(await readFile('data/snapshot.json','utf8'));
async function withStore(fn){const directory=await mkdtemp(join(tmpdir(),'cascadeguard-evidence-'));try{await writeFile(join(directory,'snapshot.json'),JSON.stringify(fixture));await fn(new EvidenceStore(directory),directory);}finally{await rm(directory,{recursive:true,force:true});}}
test('schema rejection retains active snapshot and exposes failed status',()=>withStore(async store=>{
 await assert.rejects(store.importSnapshot({...fixture,banks:[]}));
 assert.equal((await store.getSnapshot()).version,fixture.version);assert.equal((await store.getStatus()).state,'failed');
}));
test('validated atomic import and version immutability',()=>withStore(async store=>{
 const next={...fixture,version:fixture.version+'-update'};
 await store.importSnapshot(next);assert.equal((await store.getSnapshot()).version,next.version);
 await assert.rejects(store.importSnapshot({...next,limitations:['different data for the same version']}));
 assert.deepEqual(await store.getSnapshot(),next);
}));
test('damaged active file recovers last valid evidence even after process restart',()=>withStore(async(store,directory)=>{
 await store.getSnapshot();await writeFile(join(directory,'snapshot.json'),'not json');
 const restarted=new EvidenceStore(directory);assert.equal((await restarted.getSnapshot()).version,fixture.version);
 assert.equal((await restarted.getStatus()).state,'failed');
}));
test('failed activation keeps durable fallback',()=>withStore(async(store,directory)=>{
 await store.getSnapshot();await rename(join(directory,'snapshot.json'),join(directory,'original.json'));await mkdir(join(directory,'snapshot.json'));
 await assert.rejects(store.importSnapshot({...fixture,version:fixture.version+'-failed'}));
 assert.equal((await store.getSnapshot()).version,fixture.version);
}));
test('queued updates reject regressions without replacing newer snapshot',()=>withStore(async store=>{
 const newer={...fixture,version:fixture.version+'-new',collectedAt:new Date(Date.parse(fixture.collectedAt)+1000).toISOString()};
 const outcomes=await Promise.allSettled([store.importSnapshot(newer),store.importSnapshot(fixture)]);
 assert.equal(outcomes[0].status,'fulfilled');assert.equal(outcomes[1].status,'rejected');assert.equal((await store.getSnapshot()).version,newer.version);
}));
test('admin token requires configured server secret; source text cannot authenticate',()=>{
 const secret='x'.repeat(32);
 assert.equal(authenticated(new Request('http://localhost'),secret),false);
 assert.equal(authenticated(new Request('http://localhost',{headers:{Authorization:'Bearer '+secret}}),secret),true);
 assert.equal(authenticated(new Request('http://localhost',{headers:{Authorization:'Bearer '+secret}}),'short'),false);
});
test('body reader counts bytes and rejects malformed JSON',async()=>{
 assert.deepEqual(await readJson(new Request('http://localhost',{method:'POST',body:'{"a":1}'}),7),{a:1});
 await assert.rejects(readJson(new Request('http://localhost',{method:'POST',body:'"éé"'}),5),BodyLimitError);
 await assert.rejects(readJson(new Request('http://localhost',{method:'POST',body:'bad'}),10),SyntaxError);
});
