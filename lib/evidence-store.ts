import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { snapshotSchema } from './snapshot-validation';
import type { Snapshot } from './types';

type Status={state:'ok'|'failed';checkedAt:string;message:string};
export class EvidenceStore {
  private queue:Promise<unknown>=Promise.resolve();
  constructor(private directory:string) {}
  private async atomic(name:string,value:unknown) {
    await mkdir(this.directory,{recursive:true});
    const temporary=join(this.directory,`${name}.${randomUUID()}.tmp`);
    await writeFile(temporary,JSON.stringify(value,null,2),'utf8');
    await rename(temporary,join(this.directory,name));
  }
  private async read(name:string):Promise<Snapshot> {
    return snapshotSchema.parse(JSON.parse(await readFile(join(this.directory,name),'utf8'))) as Snapshot;
  }
  private async record(state:Status['state'],message:string) {
    await this.atomic('update-status.json',{state,message,checkedAt:new Date().toISOString()});
  }
  private exclusive<T>(operation:()=>Promise<T>):Promise<T> {
    const result=this.queue.then(operation,operation);this.queue=result.catch(()=>{});return result;
  }
  async getSnapshot():Promise<Snapshot> {
    return this.exclusive(async()=>{
      try {
        const current=await this.read('snapshot.json');
        // Durable fallback also supports restarting after a damaged active file.
        await this.atomic('last-valid-snapshot.json',current);
        return current;
      } catch {
        const fallback=await this.read('last-valid-snapshot.json');
        await this.record('failed','Active evidence unavailable; using last valid snapshot.');
        return fallback;
      }
    });
  }
  async getStatus():Promise<Status|null> {
    try{return JSON.parse(await readFile(join(this.directory,'update-status.json'),'utf8'));}catch{return null;}
  }
  async importSnapshot(value:unknown):Promise<string> {
    return this.exclusive(async()=>{
      try{
        const candidate=snapshotSchema.parse(value) as Snapshot;
        let current:Snapshot;
        try{current=await this.read('snapshot.json');}catch{current=await this.read('last-valid-snapshot.json');}
        if(Date.parse(candidate.collectedAt)<Date.parse(current.collectedAt))throw new Error('Older snapshots cannot replace active evidence.');
        const hash=(s:Snapshot)=>createHash('sha256').update(JSON.stringify(s)).digest('hex');
        if(candidate.version===current.version && hash(candidate)!==hash(current))throw new Error('Snapshot version is immutable.');
        await this.atomic('last-valid-snapshot.json',current);
        // The last mutation affecting active evidence is an atomic rename.
        await this.atomic('snapshot.json',candidate);
      }catch(error){await this.record('failed','Update rejected; last valid evidence retained.');throw error;}
      // A status write failure must not turn an activated update into a rejection.
      try{await this.record('ok','Validated snapshot activated.');}catch{}
      return (value as Snapshot).version;
    });
  }
}
