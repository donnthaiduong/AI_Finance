"""Synthetic fixtures only; these tests do not establish real FDIC units."""
import hashlib, importlib.util, json, pathlib, tempfile, unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit',ROOT/'pipeline/audit.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class AuditTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=pathlib.Path(self.temp.name)
        (self.root/'data/raw').mkdir(parents=True)
        self.row={'CERT':1,'REPDTE':'20260630','ASSET':100,'DEP':80,'EQ':10,'ROA':1.2}
        body=json.dumps({'data':[{'data':self.row}]}).encode()
        digest=hashlib.sha256(body).hexdigest()
        self.raw=self.root/'data/raw'/f'{digest}.bin';self.raw.write_bytes(body)
        self.data={'sources':[{'url':'https://api.fdic.gov/banks/financials?format=json','sha256':digest,'collectedAt':'2026-10-05T00:00:00Z'}],'financials':[dict(self.row)]}
        self.save()
    def save(self):
        (self.root/'data/dataset.json').write_text(json.dumps(self.data),encoding='utf8')
    def check_failed(self):
        self.save();result=module.audit(self.root)
        self.assertEqual(result['status'],'failed');self.assertTrue(result['errors'])
        return result
    def test_valid_hashed_row(self):
        self.assertEqual(module.audit(self.root)['status'],'passed')
    def test_missing_dataset_is_structured_failure(self):
        (self.root/'data/dataset.json').unlink()
        result=module.audit(self.root)
        self.assertEqual(result['status'],'failed');self.assertIsNone(result['financialRows'])
    def test_invalid_json_and_schema(self):
        for payload in ('{broken','null','[]','{"sources":{},"financials":[]}'):
            (self.root/'data/dataset.json').write_text(payload)
            self.assertEqual(module.audit(self.root)['status'],'failed')
    def test_missing_and_corrupt_raw(self):
        self.raw.unlink();self.check_failed()
        self.raw.write_bytes(b'changed');self.check_failed()
    def test_normalized_row_cannot_diverge_from_raw(self):
        self.data['financials'][0]['DEP']*=1000
        self.assertTrue(any('differs from hashed' in e for e in self.check_failed()['errors']))
    def test_missing_and_nonfinite_features(self):
        for value in (None,float('nan'),float('inf'),True,'80'):
            self.data['financials'][0]['DEP']=value;self.check_failed()
    def test_path_traversal_hash_is_rejected(self):
        self.data['sources'][0]['sha256']='../../snapshot.json';self.check_failed()
    def test_wrong_source_and_duplicate_rows(self):
        self.data['sources'][0]['url']='https://example.com/banks/financials';self.check_failed()
        self.data['sources'][0]['url']='https://api.fdic.gov/banks/financials'
        self.data['financials'].append(dict(self.row));self.check_failed()
    def test_malformed_source_url(self):
        self.data['sources'][0]['url']='https://[broken';self.check_failed()

class SnapshotAuditTests(unittest.TestCase):
    save=AuditTests.save
    def setUp(self):
        AuditTests.setUp(self)
        prior=dict(self.row,REPDTE='20260331',DEP=64)
        body=json.dumps({'data':[{'data':self.row},{'data':prior}]}).encode()
        digest=hashlib.sha256(body).hexdigest()
        self.raw=self.root/'data/raw'/f'{digest}.bin';self.raw.write_bytes(body)
        self.data['sources'][0]['sha256']=digest
        self.data.update(financials=[dict(self.row),prior],version='synthetic-v1',collectedAt='2026-10-05T00:00:00Z')
        self.snapshot={'banks':[{'cert':1,'period':'20260630','assets':100000,'deposits':80000,
                                'equityRatio':.1,'roa':1.2,'depositChange':.25,'publishedAt':None,
                                'sourceUrl':'https://api.fdic.gov/banks/financials?filters=CERT:1%20AND%20REPDTE:20260630&format=json'}],
                       'collectedAt':self.data['collectedAt'],'sources':self.data['sources'],
                       'version':'synthetic-v1-ridge-fixture','model':{'version':'ridge-fixture'}}
        self.save_snapshot()
    def save_snapshot(self):
        self.save()
        (self.root/'data/snapshot.json').write_text(json.dumps(self.snapshot),encoding='utf8')
    def snapshot_fails(self):
        self.save_snapshot();result=module.audit_snapshot(self.root)
        self.assertEqual(result['status'],'failed');self.assertTrue(result['errors'])
        return result
    def test_snapshot_valid_transformations(self):
        result=module.audit_snapshot(self.root)
        self.assertEqual(result['status'],'passed');self.assertEqual(result['snapshotBanksChecked'],1)
    def test_fresh_reproduction_snapshot_path(self):
        target=self.root/'fresh-snapshot.json'
        target.write_text(json.dumps(self.snapshot),encoding='utf8')
        (self.root/'data/snapshot.json').write_text('{damaged')
        self.assertEqual(module.audit_snapshot(self.root,snapshot_path=target)['status'],'passed')
        self.assertEqual(module.audit_snapshot(self.root)['status'],'failed')
    def test_wrong_scaling_and_percentages(self):
        for field in ('assets','deposits','equityRatio','roa','depositChange'):
            original=self.snapshot['banks'][0][field]
            self.snapshot['banks'][0][field]=original/100
            self.assertTrue(any(field in e for e in self.snapshot_fails()['errors']))
            self.snapshot['banks'][0][field]=original
    def test_source_bank_and_period(self):
        original=self.snapshot['banks'][0]['sourceUrl']
        for url in (original.replace('CERT:1','CERT:2'),original.replace('20260630','20260331'),'https://example.com'):
            self.snapshot['banks'][0]['sourceUrl']=url;self.snapshot_fails()
    def test_publication_date_requires_verification(self):
        self.snapshot['banks'][0]['publishedAt']='2026-10-05';self.snapshot_fails()
    def test_snapshot_metadata(self):
        for field in ('version','collectedAt','sources'):
            original=self.snapshot[field];self.snapshot[field]=None;self.snapshot_fails();self.snapshot[field]=original
    def test_missing_previous_quarter(self):
        self.data['financials']=self.data['financials'][:1];self.snapshot_fails()
    def test_stale_or_invalid_period(self):
        for period in ('20260331','20260629','broken'):
            self.snapshot['banks'][0]['period']=period;self.snapshot_fails()
    def test_snapshot_cannot_replace_missing_corpus(self):
        (self.root/'data/dataset.json').unlink()
        result=module.audit_snapshot(self.root)
        self.assertEqual(result['status'],'failed');self.assertEqual(result['snapshotBanksChecked'],0)
    def test_duplicate_banks(self):
        self.snapshot['banks'].append(dict(self.snapshot['banks'][0]));self.snapshot_fails()
    def test_quarter_previous_boundary(self):
        self.assertEqual(module.previous_quarter('20240331'),'20231231')
        self.assertEqual(module.previous_quarter('20241231'),'20240930')

if __name__=='__main__': unittest.main()
