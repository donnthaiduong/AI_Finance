"""Recover missing public responses only when their recorded SHA-256 matches exactly."""
import concurrent.futures, datetime, hashlib, json, pathlib, re, urllib.parse, urllib.request
from audit import ROOT

def recover(source,root=ROOT,fetch=None):
    root=pathlib.Path(root);digest=source['sha256'];url=urllib.parse.urlparse(source['url'])
    if not re.fullmatch(r'[a-f0-9]{64}',digest): raise ValueError('Invalid source hash')
    if url.scheme!='https' or url.hostname not in {'api.fdic.gov','home.treasury.gov'} or url.username or url.password or url.port:
        raise ValueError('Unapproved public source')
    path=root/'data/raw'/f'{digest}.bin'
    record={'url':source['url'],'expectedSha256':digest}
    if path.exists():
        if hashlib.sha256(path.read_bytes()).hexdigest()!=digest: raise ValueError('Existing raw file conflicts with recorded hash')
        return dict(record,status='already-present',file=str(path.relative_to(root)))
    if fetch is None:
        with urllib.request.urlopen(source['url'],timeout=25) as response:
            # Do not accept a redirect outside the same approved source policy.
            final=urllib.parse.urlparse(response.url)
            if final.scheme!='https' or final.hostname not in {'api.fdic.gov','home.treasury.gov'}: raise ValueError('Unapproved redirect')
            body=response.read(32*1024*1024+1)
    else: body=fetch(source['url'])
    if len(body)>32*1024*1024: raise ValueError('Response exceeds recovery limit')
    observed=hashlib.sha256(body).hexdigest()
    if observed!=digest:
        return dict(record,status='hash-mismatch',observedSha256=observed)
    path.parent.mkdir(parents=True,exist_ok=True)
    # Exclusive creation never replaces a prior file. Concurrent duplicates are checked.
    try:
        with path.open('xb') as handle:handle.write(body)
    except FileExistsError:
        if hashlib.sha256(path.read_bytes()).hexdigest()!=digest: raise ValueError('Concurrent raw-file conflict')
    return dict(record,status='restored',file=str(path.relative_to(root)),bytes=len(body))

def run(root=ROOT):
    root=pathlib.Path(root);snapshot=json.loads((root/'data/snapshot.json').read_bytes())
    sources=snapshot['sources'];results=[]
    def task(source):
        try:return recover(source,root)
        except Exception as exc:return {'url':source.get('url'),'expectedSha256':source.get('sha256'),'status':'failed','error':str(exc)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(task,sources):
            results.append(result);print(f"{len(results)}/{len(sources)} {result['status']}",flush=True)
    report={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'passed' if all(r['status'] in {'restored','already-present'} for r in results) else 'partial',
            'sourceResponses':len(sources),'matchedResponses':sum(r['status'] in {'restored','already-present'} for r in results),'responses':results,
            'datasetRestored':False,'productSnapshotChanged':False,'scope':'Exact recorded raw bytes only; no dataset reconstruction, model training or publication-date verification.'}
    (root/'outputs/FDIC_RAW_RECOVERY.json').write_text(json.dumps(report,indent=2),encoding='utf8')
    return report

if __name__=='__main__':
    report=run();print(json.dumps({k:v for k,v in report.items() if k!='responses'},indent=2));raise SystemExit(report['status']!='passed')
