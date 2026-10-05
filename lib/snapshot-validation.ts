import { z } from 'zod';
const finite = z.number().finite();
const calendarDate=(value:string)=>{const date=new Date(value);return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;};
const period=z.string().regex(/^\d{8}$/).refine(value=>calendarDate(`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`),'Invalid reporting date.');
const metrics=z.object({test:z.record(z.object({maePercentagePoints:finite.nonnegative(),recallWorstQuintile:finite.min(0).max(1),observations:z.number().int().nonnegative().optional()}).passthrough()).optional()}).passthrough();
const sourceUrl = z.string().url().refine(value => { const u = new URL(value); return u.protocol === 'https:' && ['api.fdic.gov', 'home.treasury.gov'].includes(u.hostname); }, 'Only official FDIC and Treasury HTTPS sources are accepted.');
const bank = z.object({ cert: z.number().int().positive(), name: z.string().min(1).max(200), city: z.string().max(100), state: z.string().max(10), period, assets: finite.nonnegative(), deposits: finite.nonnegative(), equityRatio: finite, roa: finite, depositChange: finite.nullable(), prediction: finite.nullable(), priority: z.number().int().positive().nullable(), peers: z.array(z.object({ cert: z.number().int().positive(), weight: finite.min(0).max(1) })).max(5), sourceUrl, publishedAt: z.string().datetime().nullable() }).strict();
export const snapshotSchema = z.object({ schemaVersion: z.literal(1), version: z.string().regex(/^[a-zA-Z0-9-]{8,100}$/), collectedAt: z.string().datetime({ offset: true }), banks: z.array(bank).min(1).max(32), model: z.object({ version: z.string().max(100), selected: z.enum(['GraphSAGE','Ridge','LagGrowth']), status: z.literal('retrospective-pilot'), limitation: z.string().max(1000), metrics }), treasury: z.object({ date: z.string(), tenYear: finite.nullable(), sourceUrl }).nullable(), sources: z.array(z.object({ url: sourceUrl, sha256: z.string().regex(/^[a-f0-9]{64}$/), collectedAt: z.string().datetime({ offset: true }) }).passthrough()).max(200), limitations: z.array(z.string().max(2000)).max(20) }).strict().superRefine((s, ctx) => {
  if (!s.sources.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Evidence must have provenance sources.' });
  const certs = new Set(s.banks.map(b => b.cert));
  if (certs.size !== s.banks.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate certificates.' });
  for (const b of s.banks) if (b.peers.some(p => !certs.has(p.cert) || p.cert === b.cert)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid peer certificate.' });
  if (Date.parse(s.collectedAt) > Date.now() + 300000) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Collection time cannot be in the future.' });
});
