import path from 'node:path';
import { EvidenceStore } from './evidence-store';

const store=new EvidenceStore(path.join(process.cwd(),'data'));
export const getSnapshot=()=>store.getSnapshot();
export const getUpdateStatus=()=>store.getStatus();
export const saveSnapshot=(value:unknown)=>store.importSnapshot(value);
