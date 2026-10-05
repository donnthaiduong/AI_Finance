import test from 'node:test';
import assert from 'node:assert/strict';
import {propose, confirm} from '../work/simulation.mjs';
import {calculate, transfer} from '../work/scenario.mjs';
const input={positions:[{cert:1,amount:0.03},{cert:2,amount:0.02}],payments:[{id:'p',label:'Pay',amount:0.04,day:1}],affectedCert:1,unavailablePercent:100,durationDays:1};
test('proposal requires explicit confirmation and rejects changed payments or scenario',()=>{
 const p=propose(input,1,2,0.01);
 assert.throws(()=>confirm(input,p,false));
 assert.throws(()=>confirm({...input,durationDays:2},p,true));
 assert.throws(()=>confirm({...input,payments:[]},p,true));
 const result=confirm(input,p,true);
 assert.equal(calculate(result.input).total,.05);
 assert.deepEqual(result.audit.before,input);
 assert.deepEqual(input.positions,[{cert:1,amount:.03},{cert:2,amount:.02}]);
});
test('confirmation recomputes tampered result and allocation',()=>{
 const p=propose(input,1,2,.01);p.after.positions[0].amount=999;
 assert.equal(confirm(input,p,true).input.positions[0].amount,.02);
});
test('cent transfers preserve funds over repeated changes',()=>{
 let positions=input.positions;
 for(let i=0;i<100;i++){positions=transfer(positions,1,2,.01);positions=transfer(positions,2,1,.01);}
 assert.deepEqual(positions,input.positions);
 assert.equal(calculate(input).daily[1].shortfall,0);
});
test('malformed portfolio entries reject cleanly',()=>{
 for(const positions of [[null],[{cert:1,amount:'5'}]]) assert.throws(()=>calculate({...input,positions}));
 assert.throws(()=>calculate({...input,payments:[{id:{},label:'Pay',amount:1,day:1}]}));
});
