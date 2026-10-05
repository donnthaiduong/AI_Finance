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
for change in ({'durationDays':31},{'positions':[None]}):
    assert request('/api/scenario',{**input,**change})[0]==400
status,partial=request('/api/scenario',{**input,'positions':[{'cert':9999999,'amount':100}],'affectedCert':9999999})
assert status==200 and partial['evidenceStatus']=='partial'
assert partial['result']['maximumShortfall']==124980
v2={'positions':[{'id':'user-a','bankName':'Unlinked A','cert':None,'amount':90000},{'id':'user-b','bankName':'Unlinked B','cert':None,'amount':90000}], 'payments':[{'id':'p','label':'Payroll','amount':125000,'day':15}], 'affectedId':'user-a','unavailablePercent':80,'durationDays':21}
status,v2result=request('/api/scenario',v2)
assert status==200 and v2result['evidenceStatus']=='partial'
assert v2result['result']['maximumShortfall']==17000
assert request('/api/scenario',{**v2,'affectedId':'missing'})[0]==400
assert request('/api/scenario',{**v2,'positions':[v2['positions'][0],v2['positions'][0]]})[0]==400
assert request('/api/scenario',None)[0]==405
assert request('/api/admin/snapshot',snapshot)[0]==401
assert request('/api/admin/status')[0]==401
copilot={'input':v2,'question':'Will cash cover payroll?','destination':'user-b','useAI':False}
status,guided=request('/api/copilot',copilot)
assert status==200 and guided['mode']=='guided' and '$17,000.00' in guided['text']
assert guided['action']=='none'
assert request('/api/copilot',{**copilot,'question':''})[0]==400
assert request('/api/copilot',{**copilot,'input':{**v2,'durationDays':31}})[0]==400
assert request('/api/copilot',{**copilot,'question':'x'*128001})[0]==413
# The longest permitted Unicode labels must not exceed the streaming body cap.
large={'positions':[{'id':'bank-'+str(i)+'x'*110,'bankName':str(i)+'-'+'界'*116,'cert':None,'amount':1000000} for i in range(32)],'payments':[{'id':str(i)+'-'+'界'*116,'label':'界'*120,'amount':1,'day':i%30+1} for i in range(100)],'affectedId':'bank-0'+'x'*110,'unavailablePercent':80,'durationDays':21}
utf8=json.dumps(large,ensure_ascii=False).encode()
assert len(utf8)<128000
for path,body in [('/api/scenario',large),('/api/copilot',{'input':large,'question':'Will cash cover payroll?','destination':large['positions'][1]['id'],'useAI':False})]:
    req=urllib.request.Request(base+path,data=json.dumps(body,ensure_ascii=False).encode(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=15) as r: assert r.status==200
print('API smoke passed: evidence, missing bank, calculations, versions, guided Copilot and invalid/oversized inputs.')
