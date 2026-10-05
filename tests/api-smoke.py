"""Integration test against an explicitly started localhost app."""
import json, os, urllib.request, urllib.error
base=os.environ.get('CASCADEGUARD_TEST_URL','http://127.0.0.1:3000')
if not base.startswith('http://127.0.0.1:'): raise ValueError('Tests must target localhost')
def request(path,payload=None):
    req=urllib.request.Request(base+path,data=json.dumps(payload).encode() if payload is not None else None,headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=15) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:
        body=e.read();return e.code,json.loads(body) if body else None
status,snapshot=request('/api/banks');assert status==200 and len(snapshot['banks'])==32
assert request('/api/banks/628')[1]['bank']['cert']==628
assert request('/api/banks/9999999')[0]==404
input={'positions':[{'cert':628,'amount':90000},{'cert':3511,'amount':60000}], 'payments':[{'id':'a','label':'Payroll','amount':125000,'day':15}], 'affectedCert':628,'unavailablePercent':80,'durationDays':21}
status,result=request('/api/scenario',input);assert status==200 and result['result']['maximumShortfall']==47000
assert result['version']==snapshot['version']
for change in ({'durationDays':31},{'positions':[None]},{'positions':[{'cert':9999999,'amount':100}],'affectedCert':9999999}):
    assert request('/api/scenario',{**input,**change})[0]==400
assert request('/api/scenario',None)[0]==405
assert request('/api/admin/snapshot',snapshot)[0]==401
assert request('/api/admin/status')[0]==401
print('API smoke passed: evidence, missing bank, calculation, version and invalid inputs.')
