import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir,rename,readdir} from 'node:fs/promises';
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
test('wrong bank source cannot be imported or replace active evidence',()=>withStore(async(store,directory)=>{
 const original=await readFile(join(directory,'snapshot.json'),'utf8');
 const candidate=structuredClone(fixture);candidate.version+='-wrong-source';
 candidate.banks[0].sourceUrl=candidate.banks[0].sourceUrl.replace(`CERT:${candidate.banks[0].cert}`,`CERT:${candidate.banks[0].cert+1}`);
 await assert.rejects(store.importSnapshot(candidate));
 assert.equal(await readFile(join(directory,'snapshot.json'),'utf8'),original);
 assert.equal((await store.getStatus()).state,'failed');
}));
test('wrong period in active source recovers validated fallback after restart',()=>withStore(async(store,directory)=>{
 await store.getSnapshot();
 const corrupted=structuredClone(fixture);
 corrupted.banks[0].sourceUrl=corrupted.banks[0].sourceUrl.replace(`REPDTE:${corrupted.banks[0].period}`,'REPDTE:20150331');
 await writeFile(join(directory,'snapshot.json'),JSON.stringify(corrupted));
 assert.deepEqual(await new EvidenceStore(directory).getSnapshot(),fixture);
}));
test('backup write failure preserves readable current evidence and cleans temporary files',()=>withStore(async(store,directory)=>{
 await mkdir(join(directory,'last-valid-snapshot.json'));
 const current={...fixture,version:fixture.version+'-readable'};
 await writeFile(join(directory,'snapshot.json'),JSON.stringify(current));
 assert.equal((await store.getSnapshot()).version,current.version);
 assert.match((await store.getStatus()).message,/backup could not be updated/);
 assert.equal((await readdir(directory)).some(name=>name.endsWith('.tmp')),false);
}));
test('fallback remains readable when status persistence fails',()=>withStore(async(store,directory)=>{
 await store.getSnapshot();await writeFile(join(directory,'snapshot.json'),'not json');
 await mkdir(join(directory,'update-status.json'));
 assert.equal((await store.getSnapshot()).version,fixture.version);
 assert.equal((await readdir(directory)).some(name=>name.endsWith('.tmp')),false);
}));
test('both backup and status failures still return valid active evidence',()=>withStore(async(store,directory)=>{
 await mkdir(join(directory,'last-valid-snapshot.json'));await mkdir(join(directory,'update-status.json'));
 assert.deepEqual(await store.getSnapshot(),fixture);
 assert.equal((await readdir(directory)).some(name=>name.endsWith('.tmp')),false);
}));
test('failed rejection status cannot replace the original validation error',()=>withStore(async(store,directory)=>{
 await mkdir(join(directory,'update-status.json'));
 await assert.rejects(store.importSnapshot({...fixture,banks:[]}),error=>error.name==='ZodError');
 assert.equal((await store.getSnapshot()).version,fixture.version);
 assert.equal((await readdir(directory)).some(name=>name.endsWith('.tmp')),false);
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
