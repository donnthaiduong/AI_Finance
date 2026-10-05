import { parsePortfolioSession, serializePortfolioSession, type PortfolioSession } from './portfolio-session';

export const PORTFOLIO_STORAGE_KEY='cascadeguard-portfolio-v2';
export const LEGACY_STORAGE_KEY='cascadeguard-simulation-v1';
export const MAX_PORTFOLIO_FILE_BYTES=32*1024*1024;
type DeviceStorage = Pick<Storage,'getItem'|'setItem'>;
export type RestoreResult = { state:'empty'|'restored'|'damaged'|'unavailable'; session?:PortfolioSession; original:string|null };
export type SaveResult = { state:'saved'|'invalid'|'protected'|'conflict'|'unavailable'|'memory'; message:string };
const unavailable='Device storage is unavailable or full. Changes work in this tab; export JSON to keep them.';
export function readPortfolioFile(text:string) {
  if(new TextEncoder().encode(text).byteLength>MAX_PORTFOLIO_FILE_BYTES)throw new Error('Portfolio file exceeds 32 MB.');
  return parsePortfolioSession(JSON.parse(text));
}
export function portfolioFile(session:PortfolioSession) {
  const text=serializePortfolioSession(session.input,session.activity,session.legacyActivity);
  if(new TextEncoder().encode(text).byteLength>MAX_PORTFOLIO_FILE_BYTES)throw new Error('Portfolio file exceeds 32 MB.');
  return text;
}

/** Device-local persistence with read-before-write conflict detection.
 * This is not an atomic multi-tab transaction; no real financial action uses it.
 */
export class DeviceSessionStore {
  private expected:string|null=null;
  private initialized=false;
  private damaged=false;
  private memoryOnly=false;
  constructor(private access:()=>DeviceStorage) {}
  restore():RestoreResult {
    this.initialized=false;
    let raw:string|null;
    try {
      const storage=this.access();
      this.expected=storage.getItem(PORTFOLIO_STORAGE_KEY);
      raw=this.expected??storage.getItem(LEGACY_STORAGE_KEY);
      this.initialized=true;
    } catch { return {state:'unavailable',original:null}; }
    if(raw===null){this.damaged=false;return {state:'empty',original:null};}
    try { const session=readPortfolioFile(raw);this.damaged=false;return {state:'restored',session,original:raw}; }
    catch { this.damaged=true;return {state:'damaged',original:raw}; }
  }
  useMemoryOnly() { this.memoryOnly=true; }
  persist(session:PortfolioSession):SaveResult {
    if(this.memoryOnly)return {state:'memory',message:'Temporary tab only. Device data remains untouched. Export JSON before closing.'};
    if(!this.initialized)return {state:'unavailable',message:unavailable};
    if(this.damaged)return {state:'protected',message:'Saved data is damaged and has not been overwritten. Export the original or start a temporary session.'};
    let text:string;
    try{text=portfolioFile(session);}catch{return {state:'invalid',message:'Fix invalid inputs to save. The last valid device session remains unchanged.'};}
    try {
      const storage=this.access();
      if(storage.getItem(PORTFOLIO_STORAGE_KEY)!==this.expected)return {state:'conflict',message:'Device data changed in another tab. This tab has not overwritten it. Export your work, then reload to review saved data.'};
      storage.setItem(PORTFOLIO_STORAGE_KEY,text);this.expected=text;
      return {state:'saved',message:''};
    }catch{return {state:'unavailable',message:unavailable};}
  }
  replaceAfterReview(session:PortfolioSession):SaveResult {
    // Validate before archiving or mutating any saved data.
    try{portfolioFile(session);}catch{return {state:'invalid',message:'Replacement inputs are invalid.'};}
    if(this.memoryOnly)return this.persist(session);
    if(!this.initialized)return {state:'unavailable',message:unavailable};
    try {
      const storage=this.access();
      if(storage.getItem(PORTFOLIO_STORAGE_KEY)!==this.expected)return {state:'conflict',message:'Saved data changed since this tab opened. Export your work or use a temporary session; reload to review device data.'};
      if(this.damaged && this.expected!==null){
        let archived=false;
        for(let i=1;i<=20;i++){
          const archiveKey=PORTFOLIO_STORAGE_KEY+'-recovery-'+i, old=storage.getItem(archiveKey);
          if(old===this.expected){archived=true;break;}
          if(old===null){storage.setItem(archiveKey,this.expected);archived=true;break;}
        }
        if(!archived)return {state:'protected',message:'Recovery slots are full. Export the original or use a temporary session; device data is untouched.'};
      }
      // A damaged legacy value remains at its legacy key, never deleted.
      const wasDamaged=this.damaged;this.damaged=false;
      const saved=this.persist(session);
      if(saved.state!=='saved')this.damaged=wasDamaged;
      return saved;
    }catch{return {state:'unavailable',message:'The original could not be archived. Device data is untouched. Export the original or use a temporary session.'};}
  }
}
