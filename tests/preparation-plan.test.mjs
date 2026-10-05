import test from 'node:test';
import assert from 'node:assert/strict';
import {preparationPlan,layoutPreparationPlan,singlePageImagePdf,PLAN_HEIGHT,PLAN_MARGIN} from '../work/preparation-plan.mjs';
import {minimumPortfolio} from '../work/portfolio.mjs';
const input={positions:[{id:'a',bankName:'Synthetic A',cert:null,amount:90000},{id:'b',bankName:'Synthetic B',cert:null,amount:60000},{id:'c',bankName:'Synthetic C',cert:null,amount:30000}],payments:[{id:'p',label:'Payroll',day:5,amount:85000},{id:'s',label:'Suppliers',day:15,amount:40000},{id:'o',label:'Operating',day:25,amount:25000}],affectedId:'a',unavailablePercent:80,durationDays:21};
const date='2026-10-05T00:00:00.000Z';
const text=p=>p.rows.map(r=>r.text).join('\n');
const measure=(s,k)=>Array.from(s).reduce((n,c)=>n+(/[^\x00-\x7f]/.test(c)?20:11),0)*(k==='title'?1.7:k==='heading'?1.15:1);
test('plan numbers are recomputed; unconfirmed preparation is clearly separate from current cash',()=>{
 const c=minimumPortfolio(input,'b').comparison;c.afterResult.maximumShortfall=999;c.beforeResult.total=1;
 const p=preparationPlan(input,{preparedAt:date,comparison:c});
 assert.match(text(p),/Current funds \$180,000.00/);assert.match(text(p),/UNCONFIRMED proposal: \$21,250.00/);assert.match(text(p),/\$17,000.00 before, \$0.00 after/);assert.doesNotMatch(text(p),/\$999/);
 assert.throws(()=>preparationPlan({...input,durationDays:30},{preparedAt:date,comparison:c}));assert.deepEqual(input.positions.map(p=>p.amount),[90000,60000,30000]);
});
test('confirmed plan validates complete before/after and recorded date',()=>{
 const c=minimumPortfolio(input,'b').comparison;const activity={at:date,from:c.from,to:c.to,amount:c.amount,before:c.before,after:c.after};
 const p=preparationPlan(c.after,{preparedAt:date,activity});assert.match(text(p),/CONFIRMED simulation/);assert.match(text(p),/No real money moved/);assert.match(text(p),/maximum cumulative shortfall \$0.00/);
 assert.throws(()=>preparationPlan(input,{preparedAt:date,activity}));assert.throws(()=>preparationPlan(c.after,{preparedAt:date,activity:{...activity,at:'invalid'}}));assert.throws(()=>preparationPlan(c.after,{preparedAt:date,activity:{...activity,amount:1}}));
});
test('longest labels/maximum positions and obligations form bounded one-page summary with explicit omissions',()=>{
 const large={...input,positions:Array.from({length:32},(_,i)=>({id:'p'+i,bankName:i+'-'+'界'.repeat(115),cert:null,amount:1e10})),payments:Array.from({length:100},(_,i)=>({id:'o'+i,label:'界'.repeat(120),day:i%30+1,amount:1e10})),affectedId:'p0',unavailablePercent:100,durationDays:30};
 const p=preparationPlan(large,{preparedAt:date,evidence:{version:'v'.repeat(160),collectedAt:date}});const layout=layoutPreparationPlan(p,measure);
 assert.ok(layout.bottom<PLAN_HEIGHT-PLAN_MARGIN);assert.match(text(p),/26 additional banks/);assert.match(text(p),/92 additional payments/);assert.match(text(p),/Labels may be shortened/);assert.equal(p.rows.filter(r=>r.text.startsWith('Day ')).length,8);assert.ok(layout.lines.every(l=>measure(l.text,l.kind)<=1096));
});
test('missing payments/provenance invalid date reject, missing evidence remains explicit',()=>{
 assert.throws(()=>preparationPlan({...input,payments:[]},{preparedAt:date}));assert.throws(()=>preparationPlan(input,{preparedAt:'bad'}));assert.throws(()=>preparationPlan(input,{preparedAt:date,evidence:{version:'x',collectedAt:'bad'}}));assert.match(text(preparationPlan(input,{preparedAt:date})),/Bank evidence unavailable/);
 assert.throws(()=>layoutPreparationPlan({rows:Array.from({length:100},()=>({kind:'body',text:'overlong'}))},measure));
});
test('PDF encoder produces one A4 page, exact xref byte offsets and no active content',()=>{
 const jpeg=new Uint8Array([255,216,1,2,3,255,217]);const pdf=singlePageImagePdf(jpeg);const s=new TextDecoder('latin1').decode(pdf);
 assert.match(s,/\/Count 1/);assert.match(s,/\/MediaBox \[0 0 595.276 841.89\]/);assert.match(s,/\/Filter \/DCTDecode/);assert.doesNotMatch(s,/\/JavaScript|\/OpenAction|\/EmbeddedFile/);
 const xref=Number(s.match(/startxref\n(\d+)/)[1]);assert.equal(s.slice(xref,xref+4),'xref');
 const rows=s.slice(xref).split('\n').slice(3,8);rows.forEach((row,i)=>{const offset=Number(row.slice(0,10));assert.equal(s.slice(offset,offset+7),`${i+1} 0 obj`);});
 assert.throws(()=>singlePageImagePdf(new Uint8Array([1,2,3])));assert.throws(()=>singlePageImagePdf(jpeg,0,10));
});
