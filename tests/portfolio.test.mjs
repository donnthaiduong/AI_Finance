import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePortfolio,minimumPortfolio,comparePortfolio,confirmPortfolio} from '../work/portfolio.mjs';
import {parsePortfolioSession,serializePortfolioSession} from '../work/portfolio-session.mjs';
const input={positions:[{id:'local-a',bankName:'Local Bank A',cert:null,amount:90000},{id:'local-b',bankName:'Local Bank B',cert:null,amount:90000}],payments:[{id:'p',label:'Payroll',amount:125000,day:15}],affectedId:'local-a',unavailablePercent:80,durationDays:21};
test('named banks without FDIC evidence calculate and preserve stable IDs',()=>{
 assert.equal(calculatePortfolio(input).maximumShortfall,17000);
 const p=minimumPortfolio(input,'local-b');
 assert.equal(p.amount,21250);assert.equal(p.comparison.after.positions[0].id,'local-a');
 assert.equal(p.comparison.after.positions[0].cert,null);
 assert.deepEqual(input.positions.map(p=>p.amount),[90000,90000]);
});
test('reject duplicate IDs, banks and invalid metadata',()=>{
 for(const positions of [
 [{...input.positions[0]}, {...input.positions[1],id:'local-a'}],
 [{...input.positions[0]}, {...input.positions[1],bankName:' local bank a '}],
 [{...input.positions[0],cert:1},{...input.positions[1],cert:1}],
 [{...input.positions[0],cert:0}], [{...input.positions[0],id:'bad id'}], [{...input.positions[0],bankName:''}]
 ])assert.throws(()=>calculatePortfolio({...input,positions}));
});
test('confirmation binds inputs and action parameters; derived output is recomputed',()=>{
 const p=comparePortfolio(input,'local-a','local-b',21250);
 assert.throws(()=>confirmPortfolio(input,p,false));
 assert.throws(()=>confirmPortfolio({...input,durationDays:30},p,true));
 assert.throws(()=>confirmPortfolio(input,{...p,amount:1},true));
 p.after.positions[0].amount=999;
 assert.equal(confirmPortfolio(input,p,true).afterResult.maximumShortfall,0);
});
test('version 2 round trip preserves inputs/history and rejects fabricated history',()=>{
 const p=comparePortfolio(input,'local-a','local-b',21250);
 const activity={at:'2026-10-05T00:00:00Z',from:p.from,to:p.to,amount:p.amount,before:p.before,after:p.after};
 const session=parsePortfolioSession(JSON.parse(serializePortfolioSession(p.after,[activity])));
 assert.deepEqual(session.input,p.after);assert.deepEqual(session.activity,[activity]);
 assert.throws(()=>parsePortfolioSession({...session,activity:[{...activity,after:input}]}));
});
test('legacy migration preserves reviewed and unreviewed history separately',()=>{
 const positions=[{cert:1,amount:90000},{cert:2,amount:90000}];
 const scenario={positions,payments:input.payments,affectedCert:1,unavailablePercent:80,durationDays:21};
 const after=[{cert:1,amount:68750},{cert:2,amount:111250}];
 const record={at:'2026-10-05T00:00:00Z',from:1,to:2,amount:21250,before:positions,after};
 const s=parsePortfolioSession({schemaVersion:1,positions:after,payments:input.payments,scenario:{...scenario,positions:after},audit:[{...record,scenario},record]});
 assert.equal(s.schemaVersion,2);assert.equal(s.input.affectedId,'fdic-1');
 assert.equal(s.activity.length,1);assert.equal(s.legacyActivity.length,1);
 const again=parsePortfolioSession(JSON.parse(serializePortfolioSession(s.input,s.activity,s.legacyActivity)));
 assert.deepEqual(again,s);
});
test('empty new portfolio persists, malformed empty state and future versions reject',()=>{
 const empty={positions:[],payments:[],affectedId:'',unavailablePercent:80,durationDays:21};
 assert.deepEqual(parsePortfolioSession(JSON.parse(serializePortfolioSession(empty,[]))).input,empty);
 assert.throws(()=>parsePortfolioSession({schemaVersion:2,input:{...empty,payments:input.payments},activity:[]}));
 assert.throws(()=>parsePortfolioSession({schemaVersion:3,input,activity:[]}));
});

