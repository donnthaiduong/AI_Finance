import { calculatePortfolio, comparePortfolio, confirmPortfolio, type Comparison, type PortfolioInput } from './portfolio';
import type { PortfolioActivity } from './portfolio-session';

export type PlanRow = { kind:'title'|'heading'|'body'; text:string };
export type PreparationPlan = { rows:PlanRow[]; fingerprint:string };
export type PlanEvidence = { version:string; collectedAt:string } | null;
const usd=(x:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(x);
const short=(text:string)=>{const chars=Array.from(text.replace(/\s+/g,' ').trim());return chars.length>32?chars.slice(0,31).join('')+'…':chars.join('');};

export function preparationPlan(input:PortfolioInput, options:{preparedAt:string;comparison?:Comparison|null;activity?:PortfolioActivity|null;evidence?:PlanEvidence}):PreparationPlan {
  const r=calculatePortfolio(input);
  if(r.coverage==='insufficient-input')throw new Error('Add positive obligations before creating a preparation plan.');
  if(!Number.isFinite(Date.parse(options.preparedAt)))throw new Error('A valid preparation date is required.');
  const bank=(id:string)=>short(input.positions.find(p=>p.id===id)?.bankName??'Unknown bank');
  const rows:PlanRow[]=[];
  const body=(text:string)=>rows.push({kind:'body',text});
  const heading=(text:string)=>rows.push({kind:'heading',text});
  rows.push({kind:'title',text:'CascadeGuard preparation plan'});
  body('Prepared '+options.preparedAt.slice(0,10)+'. USD · 30 days · simulation before interrupted access.');
  body(`Affected bank: ${bank(input.affectedId)}. ${input.unavailablePercent}% unavailable for ${input.durationDays} days. Funds return at start of day ${input.durationDays+1}.`);
  body(`Current funds ${usd(r.total)}; scheduled obligations ${usd(r.expenses)}. First shortfall ${r.firstShortfallDay===null?'none':'day '+r.firstShortfallDay}; maximum cumulative shortfall ${usd(r.maximumShortfall)}.`);
  heading('Current bank balances');
  input.positions.slice(0,6).forEach(p=>body(short(p.bankName)+': '+usd(p.amount)));
  if(input.positions.length>6)body(`${input.positions.length-6} additional banks included in totals. Full inputs are in the JSON export.`);
  heading('Next scheduled payments');
  [...input.payments].sort((a,b)=>a.day-b.day).slice(0,8).forEach(p=>body(`Day ${p.day} · ${short(p.label)}: ${usd(p.amount)}`));
  if(input.payments.length>8)body(`${input.payments.length-8} additional payments included in totals. Full schedule is in the JSON export.`);
  heading('Reviewed preparation');
  const c=options.comparison;
  if(c){
    // Never export derived totals supplied by a caller or an obsolete proposal.
    const reviewed=confirmPortfolio(input,c,true);
    body(`UNCONFIRMED proposal: ${usd(reviewed.amount)} from ${bank(reviewed.from)} to ${bank(reviewed.to)}. Maximum shortfall ${usd(reviewed.beforeResult.maximumShortfall)} before, ${usd(reviewed.afterResult.maximumShortfall)} after. Current funds have not changed.`);
  }else if(options.activity){
    const a=options.activity;
    const reviewed=comparePortfolio(a.before,a.from,a.to,a.amount);
    if(JSON.stringify(reviewed.after)!==JSON.stringify(input) || JSON.stringify(a.after)!==JSON.stringify(input) || !Number.isFinite(Date.parse(a.at)))throw new Error('Confirmed activity does not match the current inputs.');
    body(`CONFIRMED simulation: ${usd(reviewed.amount)} from ${bank(reviewed.from)} to ${bank(reviewed.to)}, recorded ${a.at}. Maximum shortfall ${usd(reviewed.beforeResult.maximumShortfall)} before, ${usd(reviewed.afterResult.maximumShortfall)} after. No real money moved.`);
  }else body('No current reviewed allocation. This plan describes the entered balances and assumptions.');
  heading('Assumptions and evidence');
  body('Existing funds only: future receipts, fees, interest, credit and processing delays are excluded. Accessible funds are assumed usable for scheduled obligations. Shortfalls are unmet obligations, not automatic credit.');
  body('Only this selected bank interruption is evaluated. This is not a bank failure prediction or an instruction to transfer real money.');
  const e=options.evidence;
  if(e){
    if(typeof e.version!=='string'||e.version.length>160||!Number.isFinite(Date.parse(e.collectedAt)))throw new Error('Invalid evidence provenance.');
    body(`Public bank evidence: snapshot ${e.version}, collected ${e.collectedAt.slice(0,10)}. Original publication dates unverified. Evidence is context only; it does not enter the calculation. Sources and reporting periods are in Bank Evidence.`);
  }else body('Bank evidence unavailable. No public bank evidence entered this calculation.');
  body('This one-page summary shows up to 6 banks and 8 payments. Labels may be shortened with “…”. Export JSON for complete inputs and reviewed history.');
  return {rows,fingerprint:JSON.stringify(input)};
}

export type PlanLine={text:string;kind:PlanRow['kind'];y:number};
export const PLAN_WIDTH=1240,PLAN_HEIGHT=1754,PLAN_MARGIN=72;
export function layoutPreparationPlan(plan:PreparationPlan, measure:(text:string,kind:PlanRow['kind'])=>number) {
  const lines:PlanLine[]=[];let y=PLAN_MARGIN;
  const width=PLAN_WIDTH-PLAN_MARGIN*2;
  for(const row of plan.rows){
    if(row.kind==='heading')y+=14;
    const lineHeight=row.kind==='title'?48:row.kind==='heading'?34:28;
    let current='';
    for(const word of row.text.split(/\s+/)){
      if(!word)continue;
      const candidate=current?current+' '+word:word;
      if(measure(candidate,row.kind)<=width){current=candidate;continue;}
      if(current){lines.push({text:current,kind:row.kind,y});y+=lineHeight;current='';}
      // Long unbroken labels/versions wrap at Unicode code points.
      for(const char of Array.from(word)){
        if(current && measure(current+char,row.kind)>width){lines.push({text:current,kind:row.kind,y});y+=lineHeight;current=char;}
        else current+=char;
      }
    }
    if(current){lines.push({text:current,kind:row.kind,y});y+=lineHeight;}
    if(row.kind==='title')y+=8;
  }
  if(y>PLAN_HEIGHT-PLAN_MARGIN)throw new Error('Plan exceeds one page. Reduce labels or export the full JSON instead.');
  return {lines,bottom:y};
}

/** A single RGB JPEG image on one A4 PDF page; no scripts, links or attachments. */
export function singlePageImagePdf(jpeg:Uint8Array,width=PLAN_WIDTH,height=PLAN_HEIGHT):Uint8Array {
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>5000||height>5000||jpeg.length>10000000||jpeg[0]!==255||jpeg[1]!==216||jpeg.at(-2)!==255||jpeg.at(-1)!==217)throw new Error('Invalid plan image.');
  const encode=(text:string)=>new TextEncoder().encode(text);
  const chunks:Uint8Array[]=[];let size=0;
  const append=(bytes:Uint8Array)=>{chunks.push(bytes);size+=bytes.length;};
  const offsets:number[]=[0];
  const object=(number:number,text:string,data?:Uint8Array)=>{
    offsets[number]=size;append(encode(`${number} 0 obj\n${text}`));
    if(data){append(encode('\nstream\n'));append(data);append(encode('\nendstream'));}
    append(encode('\nendobj\n'));
  };
  append(encode('%PDF-1.4\n'));
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.276 841.89] /Resources << /XObject << /Plan 4 0 R >> >> /Contents 5 0 R >>');
  object(4,`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,jpeg);
  const content=encode('q\n595.276 0 0 841.89 0 0 cm\n/Plan Do\nQ\n');
  object(5,`<< /Length ${content.length} >>`,content);
  const xref=size;append(encode('xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  const result=new Uint8Array(size);let at=0;for(const chunk of chunks){result.set(chunk,at);at+=chunk.length;}return result;
}
