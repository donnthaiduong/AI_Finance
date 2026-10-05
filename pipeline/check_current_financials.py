"""Offline recheck of saved revised FDIC observations; not frozen-corpus reproduction."""
import hashlib, json, math, pathlib, re, urllib.parse
from audit import ROOT, previous_quarter

def check(root=ROOT, report_path=None):
    root=pathlib.Path(root).resolve()
    result={'status':'failed','banksChecked':0,'financialObservationsReturned':None,'errors':[],
            'scope':'Saved revised FDIC observations versus unchanged current snapshot; excludes forecasts, peers and historical availability.'}
    errors=result['errors']
    try:
        receipt=json.loads((pathlib.Path(report_path) if report_path else root/'outputs/FDIC_CURRENT_FINANCIAL_CROSSCHECK.json').read_bytes())
        snapshot_bytes=(root/'data/snapshot.json').read_bytes()
        snapshot=json.loads(snapshot_bytes)
        result['snapshotSha256']=hashlib.sha256(snapshot_bytes).hexdigest()
        if result['snapshotSha256']!=receipt['snapshotSha256']: raise ValueError('Snapshot changed since observation receipt')
        source=receipt['source'];url=urllib.parse.urlparse(source['url'])
        if url.scheme!='https' or url.hostname!='api.fdic.gov' or url.path!='/banks/financials' or url.username or url.password or url.port:
            raise ValueError('Unapproved financial observation source')
        digest=source['sha256']
        if not isinstance(digest,str) or not re.fullmatch(r'[a-f0-9]{64}',digest): raise ValueError('Invalid observation hash')
        file=(root/pathlib.Path(source['file'].replace('\\','/'))).resolve()
        if not file.is_relative_to((root/'outputs/fdic-reference').resolve()): raise ValueError('Observation path outside reference directory')
        body=file.read_bytes()
        if hashlib.sha256(body).hexdigest()!=digest: raise ValueError('Observation bytes changed')
        parsed=json.loads(body);rows={}
        if not isinstance(parsed.get('data'),list): raise ValueError('Invalid observation array')
        if parsed['meta']['total']!=len(parsed['data']): raise ValueError('Incomplete observation response')
        for wrapper in parsed['data']:
            row=wrapper['data'];identity=(str(row['CERT']),str(row['REPDTE']))
            if identity in rows: raise ValueError('Duplicate bank-quarter observation')
            previous_quarter(identity[1])
            for field in ('ASSET','DEP','EQ','ROA','EQR'):
                value=row[field]
                if not isinstance(value,(int,float)) or isinstance(value,bool) or not math.isfinite(value): raise ValueError('Invalid observed financial value')
            if row['ASSET']<=0 or row['DEP']<=0: raise ValueError('Nonpositive financial denominator')
            rows[identity]=row
        result['financialObservationsReturned']=len(rows)
        seen=set()
        if not isinstance(snapshot['banks'],list) or not snapshot['banks']: raise ValueError('Missing snapshot banks')
        for bank in snapshot['banks']:
            identity=(str(bank['cert']),str(bank['period']))
            if identity in seen: raise ValueError('Duplicate snapshot bank')
            seen.add(identity)
            row=rows.get(identity);prior=rows.get((identity[0],previous_quarter(identity[1])))
            if row is None or prior is None:
                errors.append(f'Missing current/previous observation {identity}');continue
            expected={'assets':row['ASSET']*1000,'deposits':row['DEP']*1000,'equityRatio':row['EQ']/row['ASSET'],
                      'roa':row['ROA'],'depositChange':(row['DEP']-prior['DEP'])/prior['DEP']}
            for field,value in expected.items():
                actual=bank[field]
                if not isinstance(actual,(int,float)) or isinstance(actual,bool) or not math.isfinite(actual) or not math.isclose(actual,value,rel_tol=1e-12,abs_tol=1e-12):
                    errors.append(f'Snapshot {field} differs from current observation {identity}')
            if not math.isclose(expected['equityRatio']*100,row['EQR'],rel_tol=1e-12,abs_tol=1e-12):
                errors.append(f'EQR differs from EQ/ASSET percentage {identity}')
            result['banksChecked']+=1
        result['sourceSha256']=digest
    except (OSError,ValueError,KeyError,TypeError,AttributeError,UnicodeError,ZeroDivisionError) as exc:
        errors.append(f'Crosscheck failed: {exc}')
    result['status']='failed' if errors else 'passed'
    return result

if __name__=='__main__':
    result=check();print(json.dumps(result,indent=2));raise SystemExit(bool(result['errors']))
