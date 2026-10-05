"""Two-layer mean GraphSAGE in NumPy, with explicit backprop and temporal splits.
This pilot uses current revised FDIC data, not verified historical vintages.
"""
import datetime as dt, hashlib, json, pathlib, re, time
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'outputs/research-runs/manual' 

def quarter_next(p):
    y,m=int(p[:4]),int(p[4:6]); return f'{y+1}0331' if m==12 else f'{y}{m+3:02d}' + ('30' if m+3 in (6,9) else '31')

def county_code(value):
    """Canonical five-digit state/county syntax; not a historical FIPS lookup."""
    if isinstance(value,bool) or value is None: raise ValueError('Missing/invalid branch county code.')
    if isinstance(value,(int,float)):
        if value<0 or value>=100000 or (isinstance(value,float) and (not np.isfinite(value) or value!=int(value))):
            raise ValueError('Branch county code must be an integer in five digits.')
        text=str(int(value))
    elif isinstance(value,str): text=value
    else: raise ValueError('Invalid branch county code type.')
    if not re.fullmatch(r'[0-9]{1,5}',text): raise ValueError('Invalid branch county code syntax.')
    text=text.zfill(5)
    if text[:2]=='00' or text[2:]=='000': raise ValueError('Unknown branch county code; do not group it as a real county.')
    return text

def graph(dataset, certs, year):
    # Conservative annual proxy: use previous-year SOD only. Actual vintage dates unknown.
    available = [int(y) for y,r in dataset['sod'].items() if r and int(y) < year]
    if not available: return np.zeros((len(certs),len(certs)))
    rows=dataset['sod'][str(max(available))]
    indices={c:i for i,c in enumerate(certs)}
    selected=[]
    for r in rows:
        if int(r['CERT']) not in indices: continue
        county=county_code(r.get('STCNTYBR'))
        deposit=r.get('DEPSUMBR')
        if deposit is None or isinstance(deposit,bool) or not np.isfinite(float(deposit)) or float(deposit)<0:
            raise ValueError('Missing or invalid branch deposit; do not replace with zero.')
        selected.append((int(r['CERT']),county,float(deposit)))
    counties=sorted({county for _,county,_ in selected})
    ci={c:i for i,c in enumerate(counties)}
    v=np.zeros((len(certs),len(counties)))
    for cert,county,deposit in selected:
        total=float(v[indices[cert],ci[county]])+deposit
        if not np.isfinite(total): raise ValueError('Branch deposit aggregation overflow.')
        v[indices[cert],ci[county]]=total
    if not np.isfinite(v).all(): raise ValueError('Branch deposit aggregation overflow.')
    # Scaling each bank's vector first keeps its Euclidean norm finite without changing cosine similarity.
    scale=np.max(v,axis=1,keepdims=True) if v.shape[1] else np.zeros((len(certs),1))
    v=v/np.where(scale>0,scale,1)
    norm=np.linalg.norm(v,axis=1,keepdims=True); v=v/np.maximum(norm,1e-12)
    a=v@v.T;np.fill_diagonal(a,0)
    # Five most similar geographic peers; zero vectors yield no neighbours.
    for row in a:
        keep=np.argsort(row)[-5:]; mask=np.ones(len(row),bool);mask[keep]=False;row[mask]=0
    return a/np.maximum(a.sum(axis=1,keepdims=True),1e-12)

def features(current, previous):
    if any(current.get(k) is None for k in ('ASSET','DEP','EQ','ROA')) or previous.get('DEP') is None:
        raise ValueError('Missing observed features; zero imputation is not permitted.')
    asset=float(current['ASSET']); dep=float(current['DEP']); old=float(previous['DEP'])
    if not np.isfinite([asset,dep,old,float(current['EQ']),float(current['ROA'])]).all() or asset<=0 or dep<=0 or old<=0:
        raise ValueError('Feature values must be finite with positive denominators.')
    return [np.log1p(asset),dep/asset,float(current['EQ'])/asset,float(current['ROA'])/100,(dep-old)/old]

class Sage:
    def __init__(self, f, seed):
        rng=np.random.default_rng(seed)
        self.w=[rng.normal(0,.15,(2*f,12)),np.zeros(12),rng.normal(0,.15,(24,8)),np.zeros(8),rng.normal(0,.1,(8,1)),np.zeros(1)]
    def forward(self,x,a):
        c=np.concatenate([x,a@x],axis=-1);h=np.tanh(c@self.w[0]+self.w[1]);d=np.concatenate([h,a@h],axis=-1);z=np.tanh(d@self.w[2]+self.w[3]);y=(z@self.w[4]+self.w[5])[...,0]
        return y,(c,h,d,z)
    def fit(self,x,a,y,mask,vx,va,vy,vm):
        momentum=[np.zeros_like(w) for w in self.w];variance=[np.zeros_like(w) for w in self.w];best=float('inf');saved=None;stale=0
        for step in range(1,501):
            pred,(c,h,d,z)=self.forward(x,a);dy=(2*(pred-y)*mask/max(mask.sum(),1))[...,None]
            dz=(dy@self.w[4].T)*(1-z*z);dd=dz@self.w[2].T
            dh=dd[...,:12]+np.swapaxes(a,-1,-2)@dd[...,12:];dh*=1-h*h
            grads=[c.reshape(-1,c.shape[-1]).T@dh.reshape(-1,12),dh.sum((0,1)),d.reshape(-1,24).T@dz.reshape(-1,8),dz.sum((0,1)),z.reshape(-1,8).T@dy.reshape(-1,1),dy.sum((0,1))]
            for i,g in enumerate(grads):
                g=np.clip(g,-5,5);momentum[i]=.9*momentum[i]+.1*g;variance[i]=.999*variance[i]+.001*g*g
                self.w[i]-=.005*(momentum[i]/(1-.9**step))/(np.sqrt(variance[i]/(1-.999**step))+1e-8)
            vp,_=self.forward(vx,va);loss=float(np.abs(vp-vy)[vm].mean())
            if loss<best-1e-6: best=loss;saved=[w.copy() for w in self.w];stale=0
            else: stale+=1
            if stale>=60: break
        self.w=saved;return best,step

def metrics(pred,y,mask):
    if pred.shape!=y.shape or mask.shape!=y.shape or not mask.any():
        raise ValueError('Metrics require matching shapes and at least one observed target.')
    if not np.isfinite(pred[mask]).all() or not np.isfinite(y[mask]).all():
        raise ValueError('Observed predictions and targets must be finite.')
    mae=float(np.abs(pred-y)[mask].mean())*100
    recalls=[]
    for p,t,m in zip(pred,y,mask):
        ids=np.flatnonzero(m)
        if not len(ids): continue
        k=max(1,int(np.ceil(len(ids)*.2)))
        actual=set(ids[np.argsort(t[ids])[:k]]); chosen=set(ids[np.argsort(p[ids])[:k]])
        recalls.append(len(actual&chosen)/k)
    return {'maePercentagePoints':mae,'recallWorstQuintile':float(np.mean(recalls)),'observations':int(mask.sum())}

def train(dataset_path=None):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    start=time.perf_counter();data=json.loads((pathlib.Path(dataset_path) if dataset_path is not None else ROOT/'data/dataset.json').read_text(encoding='utf-8'))
    certs=sorted(int(r['CERT']) for r in data['institutions']);records={(int(r['CERT']),r['REPDTE']):r for r in data['financials'] if r.get('ASSET') and r.get('DEP')}
    periods=sorted({p for c,p in records});xs=[];ys=[];ms=[];graphs=[];targets=[]
    for j,p in enumerate(periods[1:]):
        prev=periods[j];future=quarter_next(p)
        if future not in periods: continue
        x=np.zeros((len(certs),5));y=np.zeros(len(certs));m=np.zeros(len(certs),bool)
        for i,c in enumerate(certs):
            if (c,p) in records and (c,prev) in records and (c,future) in records and quarter_next(prev)==p:
                x[i]=features(records[c,p],records[c,prev]);y[i]=(float(records[c,future]['DEP'])-float(records[c,p]['DEP']))/float(records[c,p]['DEP']);m[i]=True
        xs.append(x);ys.append(y);ms.append(m);graphs.append(graph(data,certs,int(p[:4])));targets.append(future)
    x,y,mask,a=np.array(xs),np.array(ys),np.array(ms),np.array(graphs)
    tr=np.array([p<'20220101' for p in targets]);va=np.array(['20220101'<=p<'20240101' for p in targets]);te=np.array(['20240101'<=p<'20260101' for p in targets])
    mean=x[tr][mask[tr]].mean(0);std=np.maximum(x[tr][mask[tr]].std(0),1e-6);x=(x-mean)/std;x[~mask]=0
    baseline=y*0
    # Lag growth stored before normalization, for persistence baseline.
    baseline=x[...,4]*std[4]+mean[4]
    X=np.concatenate([np.ones((*x.shape[:2],1)),x],axis=-1);flat=X[tr][mask[tr]];ty=y[tr][mask[tr]]
    ridge_best=None
    for penalty in [.01,.1,1,10,100]:
        reg=np.eye(6)*penalty;reg[0,0]=0
        weights=np.linalg.solve(flat.T@flat+reg,flat.T@ty);vp=X[va]@weights
        loss=metrics(vp,y[va],mask[va])['maePercentagePoints']
        if ridge_best is None or loss<ridge_best[0]:ridge_best=(loss,weights,penalty)
    ridge_pred=X@ridge_best[1]
    models=[];reports=[]
    for name,use_graph in [('GraphSAGE',True),('SelfOnlyAblation',False)]:
        aa=a if use_graph else np.zeros_like(a)
        for seed in [7,19,43]:
            model=Sage(5,seed);loss,epochs=model.fit(x[tr],aa[tr],y[tr],mask[tr],x[va],aa[va],y[va],mask[va])
            pred,_=model.forward(x,aa)
            reports.append({'name':name,'seed':seed,'epochs':epochs,'validationMAEPercentagePoints':loss*100,'test':metrics(pred[te],y[te],mask[te])})
            if use_graph:models.append((loss,model))
    models.sort(key=lambda z:z[0]);sage=models[0][1];gp,_=sage.forward(x,a)
    # Select using validation only, not held-out test performance.
    val={'LagGrowth':metrics(baseline[va],y[va],mask[va])['maePercentagePoints'],'Ridge':ridge_best[0],'GraphSAGE':models[0][0]*100}
    no_graph_val=min(r['validationMAEPercentagePoints'] for r in reports if r['name']=='SelfOnlyAblation')
    selected=min(val,key=val.get)
    # Do not ship graph signals if the matched no-network ablation is better.
    if selected=='GraphSAGE' and no_graph_val<=val['GraphSAGE']:
        selected=min(['LagGrowth','Ridge'],key=val.get)
    summary={name:{'meanMAEPercentagePoints':float(np.mean([r['test']['maePercentagePoints'] for r in reports if r['name']==name])),'stdMAEPercentagePoints':float(np.std([r['test']['maePercentagePoints'] for r in reports if r['name']==name])),'meanRecallWorstQuintile':float(np.mean([r['test']['recallWorstQuintile'] for r in reports if r['name']==name]))} for name in ['GraphSAGE','SelfOnlyAblation']}
    report={'selected':selected,'selectionRule':'Lowest validation MAE, never test MAE','validation':val,'test':{'LagGrowth':metrics(baseline[te],y[te],mask[te]),'Ridge':metrics(ridge_pred[te],y[te],mask[te]),'GraphSAGESelectedSeed':metrics(gp[te],y[te],mask[te])},'seeds':reports,'summary':summary,'split':{'trainTarget':'2016–2021','validationTarget':'2022–2023','testTarget':'2024–2025'},'features':['log assets','deposits/assets','equity/assets','ROA','lag deposit growth'],'runtimeSeconds':time.perf_counter()-start,'limitations':['Current revised data; original publication timestamps/vintages unavailable. Retrospective pilot, not a point-in-time early-warning claim.','32 current large surviving banks; survivorship bias and limited relevance to smaller SME banks.','Previous-year SOD availability proxy; actual historical publication dates unverified.','Geographic overlap is similarity, not proof of causal contagion.','Treasury rates are context only, not model features.']}
    latest=periods[-1];previous=periods[-2];lx=np.zeros((len(certs),5));lm=[]
    for i,c in enumerate(certs):
        ok=(c,latest) in records and (c,previous) in records;lm.append(ok)
        if ok:lx[i]=features(records[c,latest],records[c,previous])
    normalized=(lx-mean)/std;normalized[~np.array(lm)]=0;la=graph(data,certs,int(latest[:4]));sp,_=sage.forward(normalized[None],la[None]);rp=np.column_stack([np.ones(len(certs)),normalized])@ridge_best[1]
    live={'GraphSAGE':sp[0],'Ridge':rp,'LagGrowth':lx[:,4]}[selected]
    report['selectionRule']='Lowest validation MAE among lag and ridge; GraphSAGE eligible only if it also beats the matched self-only ablation. Never select using test MAE.'
    report['validation']['SelfOnlyAblationBest']=no_graph_val
    report['graphIncrementEstablished']=val['GraphSAGE']<no_graph_val
    report['test']['SelfOnlyAblationMean']={'maePercentagePoints':summary['SelfOnlyAblation']['meanMAEPercentagePoints'],'recallWorstQuintile':summary['SelfOnlyAblation']['meanRecallWorstQuintile']}
    model_version='sage-numpy-'+hashlib.sha256(json.dumps({k:v for k,v in report.items() if k!='runtimeSeconds'},sort_keys=True).encode()).hexdigest()[:10]
    banks=[];institutions={int(r['CERT']):r for r in data['institutions']}
    for i,c in enumerate(certs):
        if not lm[i]:continue
        r=records[c,latest];ins=institutions[c]
        peers=[{'cert':certs[k],'weight':round(float(la[i,k]),4)} for k in np.argsort(la[i])[::-1] if la[i,k]>0][:5]
        banks.append({'cert':c,'name':ins['NAME'],'city':ins.get('CITY',''),'state':ins.get('STALP',''),'period':latest,'assets':float(r['ASSET'])*1000,'deposits':float(r['DEP'])*1000,'equityRatio':lx[i,2],'roa':float(r.get('ROA') or 0),'depositChange':lx[i,4],'prediction':float(live[i]),'priority':None,'peers':peers,'sourceUrl':'https://api.fdic.gov/banks/financials?filters=CERT:'+str(c)+'%20AND%20REPDTE:'+latest+'&format=json','publishedAt':None})
    order=sorted(banks,key=lambda b:b['prediction'])
    for rank,b in enumerate(order):b['priority']=rank+1
    treasury=data.get('treasury') or {}
    snapshot={'schemaVersion':1,'version':data['version'],'collectedAt':data['collectedAt'],'banks':banks,'model':{'version':model_version,'selected':selected,'status':'retrospective-pilot','limitation':report['limitations'][0],'metrics':report},'treasury':{'date':treasury.get('NEW_DATE','')[:10],'tenYear':float(treasury['BC_10YEAR']) if treasury.get('BC_10YEAR') else None,'sourceUrl':'https://home.treasury.gov/resource-center/data-chart-center/interest-rates'} if treasury else None,'sources':data['sources'],'limitations':report['limitations']}
    snapshot['version']=data['version']+'-'+model_version
    (OUTPUT/'snapshot.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUTPUT/'model-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    np.savez(OUTPUT/'model-weights.npz',**{f'w{i}':w for i,w in enumerate(sage.w)},mean=mean,std=std,ridge=ridge_best[1],certs=certs)
    print(json.dumps({'selected':selected,'validation':val,'test':report['test'],'seconds':report['runtimeSeconds']}))

if __name__=='__main__':train()
