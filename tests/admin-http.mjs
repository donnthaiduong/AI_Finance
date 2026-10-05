// Production API check. Test credential exists in memory only; never printed.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
const secret=randomBytes(32).toString('hex');
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3106'],{env:{...process.env,CASCADEGUARD_ADMIN_TOKEN:secret},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Local test server did not become ready.')),20000);
   server.once('exit',()=>{clearTimeout(timer);reject(new Error('Local test server exited before ready.'));});
   server.stdout.on('data',bytes=>{if(bytes.toString().includes('Ready')){clearTimeout(timer);resolve();}});
 });
 const base='http://127.0.0.1:3106';
 const headers={'Content-Type':'application/json',Authorization:'Bearer '+secret};
 const snapshot=await (await fetch(base+'/api/banks')).json();
 // Strip API-only status before importing the validated snapshot itself.
 delete snapshot.updateStatus;
 const scenario={positions:[{cert:snapshot.banks[0].cert,amount:100},{cert:snapshot.banks[1].cert,amount:200}],payments:[{id:'p',label:'Test obligation',amount:250,day:1}],affectedCert:snapshot.banks[0].cert,unavailablePercent:100,durationDays:1};
 const calculation=await fetch(base+'/api/scenario',{method:'POST',headers,body:JSON.stringify(scenario)});
 assert.equal(calculation.status,200);const calculated=await calculation.json();
 assert.equal(calculated.result.maximumShortfall,50);assert.equal(calculated.version,snapshot.version);
 assert.equal((await fetch(base+'/api/scenario',{method:'POST',headers,body:JSON.stringify({...scenario,durationDays:31})})).status,400);
 assert.equal((await fetch(base+'/api/banks/9999999')).status,404);
 assert.equal((await fetch(base+'/api/admin/snapshot',{method:'POST',body:JSON.stringify(snapshot)})).status,401);
 assert.equal((await fetch(base+'/api/admin/snapshot',{method:'POST',headers,body:JSON.stringify({...snapshot,banks:[]})})).status,400);
 assert.equal((await fetch(base+'/api/admin/snapshot',{method:'POST',headers,body:'x'.repeat(1000001)})).status,413);
 const response=await fetch(base+'/api/admin/snapshot',{method:'POST',headers,body:JSON.stringify(snapshot)});
 assert.equal(response.status,200);assert.equal((await response.json()).version,snapshot.version);
 const state=await (await fetch(base+'/api/admin/status',{headers})).json();
 assert.equal(state.status.state,'ok');
 assert.equal((await (await fetch(base+'/api/banks')).json()).version,snapshot.version);
 console.log('Production API passed: scenario, version, invalid input, missing bank, admin authorization, schema rejection, byte limit and activation.');
}finally{server.kill();}
