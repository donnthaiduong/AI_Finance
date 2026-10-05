import {authenticated} from '../../../../lib/admin';
import {getUpdateStatus} from '../../../../lib/storage';
export const runtime='nodejs';
export async function GET(request:Request) {
  if(!authenticated(request))return Response.json({error:'Unauthorized.'},{status:401});
  return Response.json({status:await getUpdateStatus()},{headers:{'Cache-Control':'no-store'}});
}
