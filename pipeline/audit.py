"""Offline integrity gate. Verifies bytes/provenance, not truth or release dates."""
import hashlib, json, pathlib, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parents[1]

def audit(root=ROOT):
    data = json.loads((root/'data/dataset.json').read_text(encoding='utf8'))
    errors=[]
    for source in data['sources']:
        url=urllib.parse.urlparse(source['url'])
        if url.scheme != 'https' or url.hostname not in {'api.fdic.gov','home.treasury.gov'}:
            errors.append('Unapproved source URL')
        digest=source['sha256']
        raw=root/'data/raw'/f'{digest}.bin'
        if not raw.is_file() or hashlib.sha256(raw.read_bytes()).hexdigest()!=digest:
            errors.append(f'Missing/corrupt raw response {digest}')
        if not source.get('collectedAt'): errors.append('Missing collection time')
    seen=set()
    for row in data['financials']:
        key=(row['CERT'],row['REPDTE'])
        if key in seen: errors.append(f'Duplicate bank quarter {key}')
        seen.add(key)
        if any(row.get(k) is None for k in ('ASSET','DEP','EQ','ROA')):
            errors.append(f'Missing model features {key}; do not replace with zero')
        if (row.get('ASSET') or 0)<=0 or (row.get('DEP') or 0)<=0:
            errors.append(f'Nonpositive denominator {key}')
    result={'status':'passed' if not errors else 'failed','sources':len(data['sources']),
            'financialRows':len(data['financials']), 'datasetSha256':hashlib.sha256((root/'data/dataset.json').read_bytes()).hexdigest(),
            'errors':errors,'scope':'Offline raw-byte integrity; historical releases and API units require separate verification.'}
    return result

if __name__=='__main__':
    result=audit();print(json.dumps(result,indent=2));raise SystemExit(bool(result['errors']))
