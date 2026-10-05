import { layoutPreparationPlan, singlePageImagePdf, PLAN_WIDTH, PLAN_HEIGHT, PLAN_MARGIN, type PreparationPlan, type PlanRow } from './preparation-plan';

export function renderPlanPdf(plan:PreparationPlan){
  const canvas=document.createElement('canvas');canvas.width=PLAN_WIDTH;canvas.height=PLAN_HEIGHT;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PDF rendering is unavailable. Use browser print or JSON export.');
  const font=(kind:PlanRow['kind'])=>(kind==='title'?'bold 34':kind==='heading'?'bold 23':'20')+'px Arial, sans-serif';
  const layout=layoutPreparationPlan(plan,(text,kind)=>{ctx.font=font(kind);return ctx.measureText(text).width;});
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textBaseline='top';
  for(const line of layout.lines){ctx.font=font(line.kind);ctx.fillStyle=line.kind==='body'?'#1b2c3d':'#076b65';ctx.fillText(line.text,PLAN_MARGIN,line.y);}
  const jpegUrl=canvas.toDataURL('image/jpeg',.98),binary=atob(jpegUrl.split(',')[1]);
  const jpeg=Uint8Array.from(binary,c=>c.charCodeAt(0));
  const pdf=singlePageImagePdf(jpeg);
  let pdfBinary='';for(let i=0;i<pdf.length;i+=8192)pdfBinary+=String.fromCharCode(...pdf.subarray(i,i+8192));
  return {pdfUrl:'data:application/pdf;base64,'+btoa(pdfBinary),previewUrl:jpegUrl,bottom:layout.bottom};
}
