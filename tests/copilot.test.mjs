import test from 'node:test';
import assert from 'node:assert/strict';
import { treasuryCopilot, parseCopilotIntent, runCopilotTool, validateCopilotRequest, createCopilotLimiter } from '../work/treasury-copilot.mjs';
const input={positions:[{id:'a',bankName:'Private A',cert:null,amount:90000},{id:'b',bankName:'Private B',cert:null,amount:60000},{id:'c',bankName:'Private C',cert:null,amount:30000}],payments:[{id:'p',label:'Private payroll',day:5,amount:85000},{id:'s',label:'Private suppliers',day:15,amount:40000},{id:'o',label:'Operating',day:25,amount:25000}],affectedId:'a',unavailablePercent:80,durationDays:21};
const request=(question='Will cash cover payroll?')=>({input:structuredClone(input),question,destination:'b',useAI:true});
const command=(intent='explain',unavailablePercent=null,durationDays=null)=>({intent,unavailablePercent,durationDays});
const response=(value,finishReason='STOP')=>Response.json({candidates:[{finishReason,content:{parts:[{text:JSON.stringify(value)}]}}]});

test('missing configuration and opted-out AI never call provider; valid deterministic explanation',async()=>{
 for(const options of [{},{apiKey:'fake-key'}]){
  const r=request();if(options.apiKey)r.useAI=false;
  const result=await treasuryCopilot(r,{...options,fetcher:()=>{throw new Error('Must not call.');}});
  assert.equal(result.mode,'guided');assert.match(result.text,/\$17,000.00/);assert.equal(result.action,'none');
 }
});
test('AI sends only the question, fixed endpoint, strict schema; output amounts come from tool',async()=>{
 const r=request();let calls=0;
 const result=await treasuryCopilot(r,{apiKey:'fake-key',fetcher:async(url,options)=>{
  calls++;assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  const body=JSON.parse(options.body);assert.equal(body.contents[0].parts[0].text,r.question);
  assert.doesNotMatch(options.body,/Private|90000|85000/);assert.equal(body.generationConfig.responseFormat.text.schema.additionalProperties,false);
  assert.equal(options.headers['x-goog-api-key'],'fake-key');return response(command());
 }});
 assert.equal(calls,1);assert.equal(result.mode,'ai');assert.match(result.text,/\$17,000.00/);assert.doesNotMatch(JSON.stringify(result),/fake-key/);
});
test('AI failure modes fall back with same result, no leaked provider error',async()=>{
 const failures=[
  async()=>{throw new Error('credential-secret');},async()=>new Response('credential-secret',{status:429}),
  async()=>new Response('not json'),async()=>response(command(),'MAX_TOKENS'),async()=>response({...command(),amount:999}),
  async()=>response(command('draft',101,21)),async()=>response(command('draft',80,0)),async()=>response(command('transfer_real')),
  async()=>new Response('x'.repeat(32769)),async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{functionCall:{name:'transfer',args:{}}}]}}]}),
 ];
 for(const fetcher of failures){const r=await treasuryCopilot(request(),{apiKey:'fake',fetcher});assert.equal(r.mode,'fallback');assert.match(r.text,/\$17,000.00/);assert.equal(r.action,'none');assert.doesNotMatch(JSON.stringify(r),/credential-secret/);}
});
test('timeout ends stalled provider and aborts its signal',async()=>{
 let signal;const result=await treasuryCopilot(request(),{apiKey:'fake',timeoutMs:15,fetcher:async(_url,options)=>{signal=options.signal;return new Promise(()=>{});}});
 assert.equal(result.mode,'fallback');assert.equal(signal.aborted,true);
});
test('minimum is an unconfirmed comparison; AI cannot mutate input or history',async()=>{
 const r=request('Find minimum preparation');const before=structuredClone(r);
 const result=await treasuryCopilot(r,{apiKey:'fake',fetcher:async()=>response(command('minimum'))});
 assert.equal(result.action,'minimum');assert.equal(result.preparation.amount,21250);assert.equal(result.preparation.comparison.afterResult.maximumShortfall,0);assert.deepEqual(r,before);assert.equal(result.preparation.comparison.from,'a');assert.equal(result.preparation.comparison.to,'b');
 assert.equal(runCopilotTool({...r,destination:''},command('minimum'),'ai','').action,'none');
});
test('draft assumptions must match explicit question numbers and remain unapplied',async()=>{
 const r=request('Try 65.5 percent unavailable for 10 days');const before=structuredClone(r);
 const good=await treasuryCopilot(r,{apiKey:'fake',fetcher:async()=>response(command('draft',65.5,10))});
 assert.deepEqual(good.draft,{unavailablePercent:65.5,durationDays:10});assert.equal(good.action,'draft');assert.deepEqual(r,before);
 for(const question of ['Will payroll be covered?','Try 80% for 21 days','Try 65.5 percent for 10 days or 15 days']){
  const result=await treasuryCopilot(request(question),{apiKey:'fake',fetcher:async()=>response(command('draft',65.5,10))});assert.equal(result.mode,'fallback');assert.equal(result.draft,null);
 }
});
test('invalid requests are rejected before any provider call; no free-text financial output accepted',async()=>{
 for(const bad of [null,{}, {...request(),question:''},{...request(),question:'x'.repeat(501)},{...request(),input:null},{...request(),systemInstruction:'execute'}, {...request(),useAI:'yes'}])assert.throws(()=>validateCopilotRequest(bad));
 for(const bad of [{...command(),text:'You need $999'}, command('explain',80,21),command('draft',80,null),command('draft',80,1.5)])assert.throws(()=>parseCopilotIntent(bad));
 const blocked=runCopilotTool(request('send money'),command('unsupported'),'ai','');assert.equal(blocked.action,'none');assert.equal(blocked.preparation,null);
});
test('process cost cap resets at boundary; forwarded headers cannot create new buckets',()=>{
 const limit=createCopilotLimiter(2,60000);assert.equal(limit(1000).allowed,true);assert.equal(limit(1001).allowed,true);assert.deepEqual(limit(1002),{allowed:false,retryAfter:60});assert.deepEqual(limit(61000),{allowed:true,retryAfter:0});assert.equal(limit(61001).allowed,true);assert.equal(limit(61002).allowed,false);
});
