import { createHash, timingSafeEqual } from 'node:crypto';
export function authenticated(request:Request,secret=process.env.CASCADEGUARD_ADMIN_TOKEN) {
  if(!secret || secret.length<32)return false;
  const hash=(s:string)=>createHash('sha256').update(s).digest();
  return timingSafeEqual(hash(request.headers.get('authorization')||''),hash('Bearer '+secret));
}
export class BodyLimitError extends Error {}
export async function readJson(request:Request,limit:number) {
  const reader=request.body?.getReader();if(!reader)throw new SyntaxError('Missing body');
  const decoder=new TextDecoder();let bytes=0,text='';
  try{
    while(true){const item=await reader.read();if(item.done)break;bytes+=item.value.byteLength;
      if(bytes>limit){await reader.cancel();throw new BodyLimitError('Request too large.');}
      text+=decoder.decode(item.value,{stream:true});
    }
    text+=decoder.decode();return JSON.parse(text);
  }finally{reader.releaseLock();}
}
