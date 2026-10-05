"""Build explicitly derived bank-model data from exact recovered FDIC responses."""
import datetime,hashlib,json,pathlib,re,urllib.parse
from audit import ROOT,audit

def assemble(root=ROOT):
    root=pathlib.Path(root);snapshot=json.loads((root/'data/snapshot.json').read_bytes())
    groups={};sources=[];excluded=[]
    for source in snapshot['sources']:
        url=urllib.parse.urlparse(source['url'])
        if url.hostname=='home.treasury.gov':
            excluded.append(dict(source,reason='Original response unavailable; context is not a model feature'));continue
        if url.scheme!='https' or url.hostname!='api.fdic.gov' or url.username or url.password or url.port:
            raise ValueError('Unapproved FDIC source')
        digest=source['sha256']
        if not re.fullmatch(r'[a-f0-9]{64}',digest):raise ValueError('Invalid raw digest')
        body=(root/'data/raw'/f'{digest}.bin').read_bytes()
        if hashlib.sha256(body).hexdigest()!=digest:raise ValueError('Recovered response hash mismatch')
        parsed=json.loads(body);sources.append(source)
        query=urllib.parse.parse_qs(url.query);endpoint=url.path.rsplit('/',1)[-1]
        if query.get('limit')!=['10000']:continue # latest/selection replies are not training observations
        group=(endpoint,query['filters'][0],query['fields'][0])
        offset=int(query.get('offset',['0'])[0]);rows=[wrapper['data'] for wrapper in parsed['data']]
        groups.setdefault(group,[]).append((offset,parsed['meta']['total'],rows))
    financials=[];institutions=[];sod={}
    for (endpoint,filters,fields),pages in groups.items():
        combined=[];total=pages[0][1]
        for offset,observed_total,rows in sorted(pages,key=lambda p:p[0]):
            if offset!=len(combined) or observed_total!=total:raise ValueError('Incomplete/conflicting page sequence')
            combined.extend(rows)
        if len(combined)!=total:raise ValueError('Missing raw pages')
        if endpoint=='financials' and {'ASSET','DEP','EQ','ROA'}.issubset(fields.split(',')):financials.extend(combined)
        elif endpoint=='institutions':institutions.extend(combined)
        elif endpoint=='sod':
            match=re.search(r'\bYEAR:(\d{4})\b',filters)
            if not match or match[1] in sod:raise ValueError('Missing/duplicate SOD year')
            sod[match[1]]=combined
    if not financials or not institutions or not sod:raise ValueError('Missing model input tables')
    expected={b['cert'] for b in snapshot['banks']}
    if {int(r['CERT']) for r in financials}!=expected or {int(r['CERT']) for r in institutions}!=expected:
        raise ValueError('Model universe differs from inherited snapshot')
    version_inputs={'financials':financials,'sod':sod}
    model_input_version=hashlib.sha256(json.dumps(version_inputs,sort_keys=True).encode()).hexdigest()[:16]
    result={'schemaVersion':1,'financials':financials,'institutions':institutions,'sod':sod,'treasury':None,'sources':sources,
            'collectedAt':snapshot['collectedAt'],'version':'recovered-'+model_input_version,'modelInputVersion':model_input_version,
            'pilotSelection':'Inherited 32-bank surviving-bank pilot; not representative of all SME banks',
            'reconstruction':{'derivedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'kind':'derived-from-exact-FDIC-raw-responses',
                'notOriginalDatasetBytes':True,'collectionTime':'Inherited snapshot/source metadata, not a new collection or verified historical publication time',
                'snapshotSha256':hashlib.sha256((root/'data/snapshot.json').read_bytes()).hexdigest(),'excludedSources':excluded}}
    return result

def run(root=ROOT):
    root=pathlib.Path(root);data=assemble(root)
    run_id=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    folder=root/'outputs/recovered-datasets'/run_id;folder.mkdir(parents=True)
    target=folder/'dataset.json';target.write_text(json.dumps(data,ensure_ascii=False),encoding='utf8')
    integrity=audit(root,dataset_path=target)
    manifest={'recordedAt':data['reconstruction']['derivedAt'],'dataset':str(target.relative_to(root)),'datasetSha256':hashlib.sha256(target.read_bytes()).hexdigest(),
              'originalDatasetRestored':False,'financialRows':len(data['financials']),'institutions':len(data['institutions']),
              'sodRows':sum(len(rows) for rows in data['sod'].values()),'audit':integrity,'reconstruction':data['reconstruction']}
    (folder/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
    print(json.dumps({k:v for k,v in manifest.items() if k!='reconstruction'},indent=2))
    if integrity['errors']:raise ValueError('Derived dataset failed integrity gate')
    return target

if __name__=='__main__':run()
