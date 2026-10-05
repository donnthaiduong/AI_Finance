"""Local evidence fault injection. Original files restored in finally.

Run only with the local production server idle and no data import in progress.
"""
import json
from pathlib import Path
import urllib.request
import urllib.error
import sys
import time

root = Path(__file__).resolve().parents[1]
paths = [root / 'data' / name for name in ('snapshot.json', 'last-valid-snapshot.json', 'update-status.json')]
original = {p: p.read_bytes() if p.exists() else None for p in paths}
base = 'http://127.0.0.1:3000'
scenario = {'positions':[{'id':'a','bankName':'Synthetic A','cert':None,'amount':90000},{'id':'b','bankName':'Synthetic B','cert':None,'amount':90000}], 'payments':[{'id':'p','label':'Payroll','amount':125000,'day':15}], 'affectedId':'a','unavailablePercent':80,'durationDays':21}

def call(path, body=None):
    req=urllib.request.Request(base+path, data=json.dumps(body).encode() if body else None, headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=15) as r: return r.status,json.load(r)
    except urllib.error.HTTPError as e: return e.code,json.loads(e.read())

try:
    assert original[paths[0]] is not None, 'A snapshot must exist before this test.'
    # Establish a valid durable fallback, then corrupt active evidence only.
    status, baseline=call('/api/banks'); assert status==200
    paths[0].write_text('{corrupt',encoding='utf-8')
    status, fallback=call('/api/banks')
    assert status==200 and fallback['version']==baseline['version']
    assert fallback['updateStatus']['state']=='failed'

    for mode in ('corrupt','missing'):
        for p in paths[:2]:
            if mode=='corrupt': p.write_text('{corrupt',encoding='utf-8')
            elif p.exists(): p.unlink()
        assert call('/api/banks')[0]==503
        status, calculated=call('/api/scenario',scenario)
        assert status==200 and calculated['result']['maximumShortfall']==17000
        assert calculated['evidenceStatus']=='unavailable'
        assert calculated['version'] is None and calculated['modelVersion'] is None
        status, copilot=call('/api/copilot',{'input':scenario,'question':'Will cash cover payroll?','destination':'b','useAI':False})
        assert status==200 and copilot['mode']=='guided' and '$17,000.00' in copilot['text']
        assert copilot['action']=='none'
    if '--ui-hold' in sys.argv:
        done=root / 'work' / 'evidence-ui-finished'
        done.parent.mkdir(exist_ok=True)
        if done.exists(): done.unlink()
        print('Missing evidence active for UI check; restores automatically within 45 seconds.',flush=True)
        deadline=time.monotonic()+45
        while time.monotonic()<deadline and not done.exists(): time.sleep(.2)
        if done.exists(): done.unlink()
finally:
    for p, raw in original.items():
        if raw is None:
            if p.exists(): p.unlink()
        else: p.write_bytes(raw)
    assert all((p.read_bytes() if p.exists() else None)==raw for p,raw in original.items())

print('HTTP evidence faults passed: corrupt active fallback, corrupt/missing all evidence, deterministic scenario and Copilot; original files restored byte-for-byte.')
