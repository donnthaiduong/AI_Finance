"""Public FDIC/Treasury collector. Raw responses are immutable, content-addressed."""
import argparse, concurrent.futures, datetime as dt, hashlib, json, pathlib, time
import urllib.parse, urllib.request, xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw'
UA = 'CascadeGuard research prototype (public bank data)'

def fetch(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60) as r:
                body = r.read()
            digest = hashlib.sha256(body).hexdigest()
            RAW.mkdir(parents=True, exist_ok=True)
            target = RAW / (digest + '.bin')
            if not target.exists(): target.write_bytes(body)
            return body, {'url': url, 'sha256': digest, 'collectedAt': dt.datetime.now(dt.timezone.utc).isoformat(), 'rawPath': str(target.relative_to(ROOT))}
        except Exception:
            if attempt == 3: raise
            time.sleep(2 ** attempt)

def fdic(dataset, filters, fields, **extra):
    rows, sources, offset = [], [], 0
    while True:
        query = {'filters': filters, 'fields': fields, 'limit': 10000, 'offset': offset, 'format': 'json', **extra}
        url = 'https://api.fdic.gov/banks/' + dataset + '?' + urllib.parse.urlencode(query)
        body, meta = fetch(url)
        parsed = json.loads(body)
        meta['sourceIndex'] = parsed.get('meta', {}).get('index')
        sources.append(meta)
        batch = [r['data'] for r in parsed['data']]
        rows.extend(batch)
        if 'limit' in extra or len(rows) >= parsed['meta']['total'] or not batch: break
        offset += len(batch)
    return rows, sources

def collect():
    old_path=ROOT/'data/dataset.json'
    old=json.loads(old_path.read_text(encoding='utf-8')) if old_path.exists() else None
    latest, sources = fdic('financials', 'REPDTE:[20250101 TO *]', 'CERT,NAME,REPDTE,ASSET,DEP,EQ,ROA', sort_by='REPDTE', sort_order='DESC', limit=1)
    period = max(r['REPDTE'] for r in latest)
    top, src = fdic('financials', f'REPDTE:{period}', 'CERT,NAME,ASSET', sort_by='ASSET', sort_order='DESC', limit=32)
    # fdic() paginates by default; select the 32 largest banks for a bounded pilot.
    top = sorted(top, key=lambda x: x.get('ASSET', 0), reverse=True)[:32]
    sources += src
    certs = [int(r['CERT']) for r in top]
    selector = 'CERT:(' + ' OR '.join(map(str, certs)) + ')'
    financials, src = fdic('financials', selector + ' AND REPDTE:[20160101 TO *]', 'CERT,NAME,REPDTE,ASSET,DEP,EQ,ROA')
    sources += src
    institutions, src = fdic('institutions', selector, 'CERT,NAME,CITY,STALP,ACTIVE')
    sources += src
    def year_sod(y):
        return y, fdic('sod', selector + f' AND YEAR:{y}', 'CERT,YEAR,STCNTYBR,DEPSUMBR')
    sod = {}; sod_sources=[]
    now=dt.datetime.now(dt.timezone.utc)
    sod_due=not old or not old.get('sodCheckedAt') or (now-dt.datetime.fromisoformat(old['sodCheckedAt'])).days>=7
    if sod_due:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            for year, (rows, src) in pool.map(year_sod, range(2015, dt.date.today().year + 1)):
                sod[str(year)] = rows
                sod_sources += src
        sod_checked=now.isoformat()
    else:
        sod=old['sod'];sod_sources=old.get('sodSources',[]);sod_checked=old['sodCheckedAt']
    sources+=sod_sources
    # Official daily yield XML. Failure is surfaced and leaves the prior dataset intact.
    treasury_url = 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=' + str(dt.date.today().year)
    body, src = fetch(treasury_url)
    sources.append(src)
    tree = ET.fromstring(body)
    entries = []
    for element in tree.iter():
        if element.tag.endswith('properties'):
            entries.append({child.tag.split('}')[-1]: child.text for child in element})
    entries.sort(key=lambda x: x.get('NEW_DATE', ''))
    result = {'schemaVersion': 1, 'financials': financials, 'institutions': institutions, 'sod': sod, 'treasury': entries[-1] if entries else None, 'sources': sources, 'pilotSelection': '32 largest banks by assets in latest available quarter; surviving-bank pilot, not representative of all SME banks', 'collectedAt': dt.datetime.now(dt.timezone.utc).isoformat()}
    payload = json.dumps(result, ensure_ascii=False, sort_keys=True)
    result['version'] = hashlib.sha256(json.dumps({'financials': financials, 'sod': sod, 'treasury': result['treasury']}, sort_keys=True).encode()).hexdigest()[:16]
    result['modelInputVersion']=hashlib.sha256(json.dumps({'financials':financials,'sod':sod},sort_keys=True).encode()).hexdigest()[:16]
    result['sodCheckedAt']=sod_checked;result['sodSources']=sod_sources
    out = ROOT / 'data/dataset.json'
    tmp = out.with_suffix('.tmp'); tmp.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8'); tmp.replace(out)
    print(json.dumps({'version': result['version'], 'banks': len(certs), 'observations': len(financials), 'sodRows': sum(map(len, sod.values())), 'period': period}))

if __name__ == '__main__': collect()
