import {authenticated,readJson,BodyLimitError} from '../../../../lib/admin';
import {saveSnapshot} from '../../../../lib/storage';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!authenticated(request))return Response.json({error:'Unauthorized.'},{status:401});
  try{return Response.json({version:await saveSnapshot(await readJson(request,1000000))});}
  catch(error){return Response.json({error:error instanceof BodyLimitError?'Snapshot too large.':'Update rejected; last valid evidence retained.'},{status:error instanceof BodyLimitError?413:400});}
}
