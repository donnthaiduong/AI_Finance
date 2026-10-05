import { z } from 'zod';
const finite = z.number().finite();
const calendarDate=(value:string)=>{const date=new Date(value);return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;};
const period=z.string().regex(/^\d{8}$/).refine(value=>calendarDate(`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`),'Invalid reporting date.');
const metrics=z.object({test:z.record(z.object({maePercentagePoints:finite.nonnegative(),recallWorstQuintile:finite.min(0).max(1),observations:z.number().int().nonnegative().optional()}).passthrough()).optional()}).passthrough();
const sourceUrl = z.string().url().refine(value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.port && ['api.fdic.gov', 'home.treasury.gov'].includes(u.hostname); } catch { return false; } }, 'Only official FDIC and Treasury HTTPS sources without credentials or custom ports are accepted.');
const bank = z.object({ cert: z.number().int().positive(), name: z.string().min(1).max(200), city: z.string().max(100), state: z.string().max(10), period, assets: finite.nonnegative(), deposits: finite.nonnegative(), equityRatio: finite, roa: finite, depositChange: finite.nullable(), prediction: finite.nullable(), priority: z.number().int().positive().nullable(), peers: z.array(z.object({ cert: z.number().int().positive(), weight: finite.min(0).max(1) })).max(5), sourceUrl, publishedAt: z.string().datetime().nullable() }).strict();
export const snapshotSchema = z.object({ schemaVersion: z.literal(1), version: z.string().regex(/^[a-zA-Z0-9-]{8,100}$/), collectedAt: z.string().datetime({ offset: true }), banks: z.array(bank).min(1).max(32), model: z.object({ version: z.string().max(100), selected: z.enum(['GraphSAGE','Ridge','LagGrowth']), status: z.literal('retrospective-pilot'), limitation: z.string().max(1000), metrics }), treasury: z.object({ date: z.string(), tenYear: finite.nullable(), sourceUrl }).nullable(), sources: z.array(z.object({ url: sourceUrl, sha256: z.string().regex(/^[a-f0-9]{64}$/), collectedAt: z.string().datetime({ offset: true }) }).passthrough()).max(200), limitations: z.array(z.string().max(2000)).max(20) }).strict().superRefine((s, ctx) => {
  if (!s.sources.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Evidence must have provenance sources.' });
  const certs = new Set(s.banks.map(b => b.cert));
  if (certs.size !== s.banks.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate certificates.' });
  for (const b of s.banks) if (b.peers.some(p => !certs.has(p.cert) || p.cert === b.cert)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid peer certificate.' });
  for (const [index,b] of s.banks.entries()) {
    let source:URL;
    try { source=new URL(b.sourceUrl); } catch { continue; }
    const filters=source.searchParams.getAll('filters');
    const expected=new RegExp(`^CERT:\\s*${b.cert}\\s+AND\\s+REPDTE:\\s*${b.period}$`);
    if(source.hostname!=='api.fdic.gov' || source.pathname!=='/banks/financials' || source.hash || filters.length!==1 || !expected.test(filters[0])) {
      ctx.addIssue({code:z.ZodIssueCode.custom,path:['banks',index,'sourceUrl'],message:'Financial source must identify this bank and reporting period.'});
    }
    const reportingDate=`${b.period.slice(0,4)}-${b.period.slice(4,6)}-${b.period.slice(6,8)}`;
    if(Date.parse(reportingDate)>Date.parse(s.collectedAt)) {
      ctx.addIssue({code:z.ZodIssueCode.custom,path:['banks',index,'period'],message:'Reporting period cannot follow collection time.'});
    }
    if(b.publishedAt!==null && Date.parse(b.publishedAt)>Date.parse(s.collectedAt)) {
      ctx.addIssue({code:z.ZodIssueCode.custom,path:['banks',index,'publishedAt'],message:'Publication time cannot follow collection time.'});
    }
    if(new Set(b.peers.map(p=>p.cert)).size!==b.peers.length) {
      ctx.addIssue({code:z.ZodIssueCode.custom,path:['banks',index,'peers'],message:'Duplicate peer certificates.'});
    }
  }
  for(const [index,source] of s.sources.entries()) if(Date.parse(source.collectedAt)>Date.parse(s.collectedAt)+300000) {
    ctx.addIssue({code:z.ZodIssueCode.custom,path:['sources',index,'collectedAt'],message:'Source collection time cannot follow snapshot collection time.'});
  }
  if (Date.parse(s.collectedAt) > Date.now() + 300000) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Collection time cannot be in the future.' });
});
