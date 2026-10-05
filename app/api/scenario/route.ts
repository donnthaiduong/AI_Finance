import { calculate, InputError, type ScenarioInput } from '../../../lib/scenario';
import { getSnapshot } from '../../../lib/storage';
import { readJson, BodyLimitError } from '../../../lib/admin';
import { calculatePortfolio, MAX_PORTFOLIO_REQUEST_BYTES, type PortfolioInput } from '../../../lib/portfolio';
export async function POST(request: Request) {
  try {
    const input = await readJson(request, MAX_PORTFOLIO_REQUEST_BYTES) as ScenarioInput | PortfolioInput;
    const result = input && 'affectedId' in input ? calculatePortfolio(input) : calculate(input as ScenarioInput);
    let version: string | null = null, modelVersion: string | null = null;
    let evidenceStatus = 'unavailable';
    // Snapshot metadata does not enter the deterministic liquidity calculation.
    try {
      const snapshot = await getSnapshot();
      version = snapshot.version;
      modelVersion = snapshot.model.version;
      evidenceStatus = input.positions.every(p => snapshot.banks.some(b => b.cert === p.cert)) ? 'available' : 'partial';
    } catch { /* Keep the calculation available when evidence cannot be read. */ }
    return Response.json({ result, version, modelVersion, evidenceStatus });
  } catch (error) {
    if (error instanceof BodyLimitError) return Response.json({ error: 'Request too large.' }, { status: 413 });
    if (error instanceof InputError || error instanceof SyntaxError || error instanceof TypeError)
      return Response.json({ error: 'Invalid scenario: check banks, amounts and payment days.' }, { status: 400 });
    return Response.json({ error: 'Scenario service unavailable.' }, { status: 503 });
  }
}
