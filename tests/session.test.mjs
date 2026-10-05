import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSession,serializeSession} from '../work/session.mjs';
import {propose,confirm} from '../work/simulation.mjs';
const input={positions:[{cert:1,amount:100},{cert:2,amount:200}],payments:[{id:'p',label:'Payroll',amount:250,day:2}],affectedCert:2,unavailablePercent:37,durationDays:7};
test('export and restore retain full scenario and recompute activity',()=>{
 const p=propose(input,2,1,50),c=confirm(input,p,true);
 const a={at:c.audit.at,from:2,to:1,amount:50,before:input.positions,after:c.input.positions,scenario:input};
 const loaded=parseSession(JSON.parse(serializeSession(c.input,[a])));
 assert.deepEqual(loaded.scenario,c.input);assert.equal(loaded.audit[0].afterResult.total,300);
});
test('legacy device save migrates with explicit defaults',()=>{
 const s=parseSession({positions:input.positions,payments:input.payments,audit:[]});
 assert.equal(s.scenario.affectedCert,1);assert.equal(s.scenario.durationDays,21);
});
test('reject malformed files and fabricated allocation history',()=>{
 for(const value of [null,{}, {schemaVersion:99,...input}, {positions:input.positions,payments:input.payments,scenario:{...input,durationDays:31}}]) assert.throws(()=>parseSession(value));
 assert.throws(()=>parseSession({positions:input.positions,payments:input.payments,audit:[{at:new Date().toISOString(),from:1,to:2,amount:10,before:input.positions,after:input.positions}]}));
});
