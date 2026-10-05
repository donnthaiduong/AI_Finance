import { readJson, BodyLimitError } from '../../../lib/admin';
import { InputError } from '../../../lib/scenario';
import { MAX_PORTFOLIO_REQUEST_BYTES } from '../../../lib/portfolio';
import { createCopilotLimiter, treasuryCopilot, validateCopilotRequest } from '../../../lib/treasury-copilot';

export const runtime = 'nodejs';
const limit = createCopilotLimiter();
export async function POST(request: Request) {
  try {
    const value=validateCopilotRequest(await readJson(request,MAX_PORTFOLIO_REQUEST_BYTES));
    if(value.useAI && process.env.CASCADEGUARD_GEMINI_API_KEY){
      const budget=limit();
      if(!budget.allowed)return Response.json({error:'AI request limit reached. Use guided explanation or try again shortly.'},{status:429,headers:{'Retry-After':String(budget.retryAfter),'Cache-Control':'no-store'}});
    }
    const reply=await treasuryCopilot(value,{apiKey:process.env.CASCADEGUARD_GEMINI_API_KEY,signal:request.signal});
    return Response.json(reply,{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    if(error instanceof BodyLimitError)return Response.json({error:'Request too large.'},{status:413});
    if(error instanceof InputError || error instanceof SyntaxError || error instanceof TypeError)return Response.json({error:'Invalid question or scenario inputs.'},{status:400});
    return Response.json({error:'Copilot unavailable. Use the guided explanation.'},{status:503});
  }
}
