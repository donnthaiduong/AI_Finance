import test from 'node:test';
import assert from 'node:assert/strict';
import {minimumPreparation} from '../work/preparation.mjs';
import {calculate, transfer} from '../work/scenario.mjs';
const example={positions:[{cert:1,amount:90000},{cert:2,amount:90000}],payments:[{id:'a',label:'Payroll',day:5,amount:85000},{id:'b',label:'Suppliers',day:15,amount:40000},{id:'c',label:'Operating',day:25,amount:25000}],affectedCert:1,unavailablePercent:80,durationDays:21};
test('destination balance ceiling bounds search instead of throwing on an extreme valid portfolio',()=>{
 const input={positions:[{cert:1,amount:1000},{cert:2,amount:1e10}],payments:[{id:'p',label:'Due',day:1,amount:1e10},{id:'q',label:'Also due',day:1,amount:100}],affectedCert:1,unavailablePercent:100,durationDays:30};
 assert.equal(minimumPreparation(input,2).status,'infeasible');
 input.positions[1].amount-=200;
 const p=minimumPreparation(input,2);assert.equal(p.status,'infeasible');
 input.payments[1].amount=0;
 const feasible=minimumPreparation(input,2);assert.equal(feasible.status,'feasible');assert.equal(feasible.amount,200);assert.equal(feasible.after.maximumShortfall,0);
 assert.doesNotThrow(()=>calculate({...input,positions:[{cert:1,amount:9999999999.99},{cert:2,amount:1000.01}]}));
 assert.throws(()=>calculate({...input,positions:[{cert:1,amount:9999999999.991},{cert:2,amount:1000}]}));
});
test('minimum preparation covers obligations; one cent less does not',()=>{
 const p=minimumPreparation(example,2);
 assert.equal(p.status,'feasible');assert.equal(p.amount,21250);
 assert.equal(p.after.maximumShortfall,0);assert.equal(p.after.total,p.before.total);
 assert.equal(calculate({...example,positions:transfer(example.positions,1,2,p.amount-.01)}).maximumShortfall,.01);
});
test('empty or zero payments never report complete coverage',()=>{
 for(const payments of [[],[{id:'z',label:'Zero',day:1,amount:0}]]){
 const input={...example,payments};
 assert.equal(calculate(input).coverage,'insufficient-input');
 assert.equal(minimumPreparation(input,2).status,'insufficient-input');
 }
});
test('distinguish unnecessary and impossible preparation',()=>{
 assert.equal(minimumPreparation({...example,unavailablePercent:0},2).status,'not-needed');
 assert.equal(minimumPreparation({...example,payments:[{id:'p',label:'Pay',day:30,amount:180000.01}]},2).status,'infeasible');
 assert.throws(()=>minimumPreparation(example,1));assert.throws(()=>minimumPreparation(example,999));
 assert.throws(()=>calculate(null));
});
test('500 seeded cent cases match an independent exhaustive oracle',()=>{
 let state=52345;
 const next=n=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state%n;};
 for(let i=0;i<500;i++){
 const a=1+next(100),b=next(100),percent=next(101),duration=1+next(30);
 const expenses=[next(100),next(100)],days=[1+next(30),1+next(30)];
 const input={positions:[{cert:1,amount:a/100},{cert:2,amount:b/100}],payments:expenses.map((c,k)=>({id:String(k),label:'Pay',day:days[k],amount:c/100})),affectedCert:1,unavailablePercent:percent,durationDays:duration};
 const covered=x=>{
 for(let d=1;d<=30;d++){
 const due=expenses.reduce((sum,c,k)=>sum+(days[k]<=d?c:0),0);
 if(a+b-due-(d<=duration?Math.round((a-x)*percent/100):0)<0)return false;
 }return true;
 };
 let minimum=null;for(let x=0;x<=a;x++)if(covered(x)){minimum=x;break;}
 const r=minimumPreparation(input,2);
 if(expenses.every(c=>c===0))assert.equal(r.status,'insufficient-input');
 else if(minimum===null)assert.equal(r.status,'infeasible');
 else if(minimum===0)assert.equal(r.status,'not-needed');
 else {assert.equal(r.status,'feasible');assert.equal(Math.round(r.amount*100),minimum);}
 }
});
test('maximum supported inputs preserve safe integer cents',()=>{
 const input={positions:Array.from({length:32},(_,i)=>({cert:i+1,amount:1e10})),payments:Array.from({length:100},(_,i)=>({id:String(i),label:'Pay',day:1,amount:1e10})),affectedCert:1,unavailablePercent:100,durationDays:30};
 const r=calculate(input);assert.equal(r.total,32e10);assert.equal(r.maximumShortfall,69e10);
 assert.ok(Number.isSafeInteger(r.expenses*100));assert.equal(minimumPreparation(input,2).status,'infeasible');
});
