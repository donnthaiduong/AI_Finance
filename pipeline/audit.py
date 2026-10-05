"""Offline integrity gate. Verifies bytes/provenance, not truth or release dates."""
import calendar, datetime, hashlib, json, math, pathlib, re, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parents[1]

def audit(root=ROOT,dataset_path=None):
    root=pathlib.Path(root)
    result={'status':'failed','sources':None,'financialRows':None,'datasetSha256':None,'errors':[],
            'scope':'Offline raw-byte and financial-row integrity; historical releases and official API units require separate verification.'}
    try:
        payload=(pathlib.Path(dataset_path) if dataset_path is not None else root/'data/dataset.json').read_bytes()
        result['datasetSha256']=hashlib.sha256(payload).hexdigest()
        data=json.loads(payload)
        if not isinstance(data,dict) or not isinstance(data.get('sources'),list) or not isinstance(data.get('financials'),list):
            raise ValueError('sources and financials must be arrays')
    except (OSError,ValueError,UnicodeError) as exc:
        result['errors'].append(f'Dataset unavailable or invalid: {type(exc).__name__}')
        return result
    errors=[]
    originals={}
    fields=('CERT','REPDTE','ASSET','DEP','EQ','ROA')
    if not data['sources']: errors.append('No source responses')
    if not data['financials']: errors.append('No financial rows')
    for source in data['sources']:
        if not isinstance(source,dict):
            errors.append('Invalid source metadata');continue
        try: url=urllib.parse.urlparse(str(source.get('url','')))
        except ValueError:
            errors.append('Malformed source URL');continue
        if url.scheme != 'https' or url.hostname not in {'api.fdic.gov','home.treasury.gov'}:
            errors.append('Unapproved source URL');continue
        digest=source.get('sha256','')
        if not isinstance(digest,str) or not re.fullmatch(r'[a-f0-9]{64}',digest):
            errors.append('Invalid raw response hash');continue
        raw=root/'data/raw'/f'{digest}.bin'
        if not raw.is_file() or hashlib.sha256(raw.read_bytes()).hexdigest()!=digest:
            errors.append(f'Missing/corrupt raw response {digest}')
            continue
        if not source.get('collectedAt'): errors.append('Missing collection time')
        if url.hostname=='api.fdic.gov' and url.path.rstrip('/')=='/banks/financials':
            try:
                for wrapper in json.loads(raw.read_bytes())['data']:
                    row=wrapper['data']
                    if all(k in row for k in fields):
                        identity=(str(row['CERT']),str(row['REPDTE']))
                        values=tuple(row[k] for k in fields)
                        if identity in originals and originals[identity]!=values:
                            errors.append(f'Conflicting raw observations {identity}')
                        originals[identity]=values
            except (ValueError,KeyError,TypeError,UnicodeError):
                errors.append(f'Invalid financial response {digest}')
    seen=set()
    for row in data['financials']:
        if not isinstance(row,dict) or any(k not in row for k in fields):
            errors.append('Incomplete financial row');continue
        key=(str(row['CERT']),str(row['REPDTE']))
        if key in seen: errors.append(f'Duplicate bank quarter {key}')
        seen.add(key)
        if any(not isinstance(row[k],(int,float)) or isinstance(row[k],bool) or not math.isfinite(row[k]) for k in ('ASSET','DEP','EQ','ROA')):
            errors.append(f'Missing model features {key}; do not replace with zero')
        elif row['ASSET']<=0 or row['DEP']<=0:
            errors.append(f'Nonpositive denominator {key}')
        if key not in originals: errors.append(f'No hashed raw financial observation {key}')
        elif tuple(row[k] for k in fields)!=originals[key]: errors.append(f'Financial row differs from hashed source {key}')
    result.update(status='passed' if not errors else 'failed',sources=len(data['sources']),financialRows=len(data['financials']),errors=errors)
    return result

def previous_quarter(period):
    date=datetime.datetime.strptime(period,'%Y%m%d').date()
    if date.month not in (3,6,9,12) or date.day!=calendar.monthrange(date.year,date.month)[1]:
        raise ValueError('Expected quarter end')
    year,month=(date.year-1,12) if date.month==3 else (date.year,date.month-3)
    return f'{year:04}{month:02}{calendar.monthrange(year,month)[1]:02}'

def audit_snapshot(root=ROOT,snapshot_path=None,dataset_path=None):
    """Reconcile displayed fields to verified corpus; does not validate predictions."""
    root=pathlib.Path(root)
    result=audit(root,dataset_path=dataset_path)
    result['snapshotBanksChecked']=0
    result['snapshotSha256']=None
    result['scope']+=' Snapshot checks implemented transformations and provenance, not model accuracy or release availability.'
    # A missing/corrupt source corpus cannot be replaced by a syntactically valid snapshot.
    if result['errors']: return result
    errors=result['errors']
    try:
        data=json.loads((pathlib.Path(dataset_path) if dataset_path is not None else root/'data/dataset.json').read_bytes())
        payload=(pathlib.Path(snapshot_path) if snapshot_path is not None else root/'data/snapshot.json').read_bytes()
        result['snapshotSha256']=hashlib.sha256(payload).hexdigest()
        snapshot=json.loads(payload)
        if not isinstance(snapshot,dict) or not isinstance(snapshot.get('banks'),list) or not snapshot['banks']:
            raise ValueError('Expected nonempty bank array')
        if snapshot.get('collectedAt')!=data.get('collectedAt') or not data.get('collectedAt'):
            errors.append('Snapshot collection time differs from dataset or is missing')
        if snapshot.get('sources')!=data['sources']: errors.append('Snapshot source manifest differs from dataset')
        expected_version=data['version']+'-'+snapshot['model']['version']
        if snapshot.get('version')!=expected_version: errors.append('Snapshot data/model version mismatch')
        rows={(str(r['CERT']),str(r['REPDTE'])):r for r in data['financials']}
        latest=max(k[1] for k in rows)
        prior_period=previous_quarter(latest)
        expected_banks={k for k in rows if k[1]==latest and (k[0],prior_period) in rows}
        seen=set()
        for bank in snapshot['banks']:
            if not isinstance(bank,dict): raise ValueError('Invalid bank object')
            identity=(str(bank['cert']),str(bank['period']))
            if identity in seen: errors.append(f'Duplicate snapshot bank {identity}')
            seen.add(identity)
            if identity[1]!=latest: errors.append(f'Snapshot reporting period is not corpus latest {identity}')
            previous=previous_quarter(identity[1])
            row,prior=rows.get(identity),rows.get((identity[0],previous))
            if row is None or prior is None:
                errors.append(f'Missing current/previous quarter observation {identity}');continue
            expected={'assets':row['ASSET']*1000,'deposits':row['DEP']*1000,
                      'equityRatio':row['EQ']/row['ASSET'],'roa':row['ROA'],
                      'depositChange':(row['DEP']-prior['DEP'])/prior['DEP']}
            for field,value in expected.items():
                actual=bank.get(field)
                if (not isinstance(actual,(int,float)) or isinstance(actual,bool) or not math.isfinite(actual)
                        or not math.isclose(actual,value,rel_tol=1e-12,abs_tol=1e-12)):
                    errors.append(f'Snapshot {field} differs from source transformation {identity}')
            source=urllib.parse.urlparse(bank.get('sourceUrl',''))
            filters=urllib.parse.parse_qs(source.query).get('filters',[])
            if (source.scheme!='https' or source.hostname!='api.fdic.gov' or source.path!='/banks/financials'
                    or filters!=[f'CERT:{identity[0]} AND REPDTE:{identity[1]}']):
                errors.append(f'Snapshot source bank/period mismatch {identity}')
            if 'publishedAt' not in bank or bank['publishedAt'] is not None:
                errors.append(f'Publication date must remain explicitly unverified {identity}')
            result['snapshotBanksChecked']+=1
        if seen!=expected_banks: errors.append('Snapshot bank coverage differs from eligible corpus banks')
    except (OSError,ValueError,KeyError,TypeError,UnicodeError,ZeroDivisionError) as exc:
        errors.append(f'Snapshot unavailable or invalid: {type(exc).__name__}')
    result['status']='failed' if errors else 'passed'
    return result

if __name__=='__main__':
    import sys
    result=audit_snapshot() if '--snapshot' in sys.argv else audit()
    print(json.dumps(result,indent=2));raise SystemExit(bool(result['errors']))
