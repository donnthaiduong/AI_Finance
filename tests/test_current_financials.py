"""Synthetic checker faults; real observed-response checks are a separate command."""
import hashlib, importlib.util, json, pathlib, sys, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'pipeline'))
import check_current_financials as checker

class CurrentFinancialTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=pathlib.Path(self.temp.name);(self.root/'data').mkdir();(self.root/'outputs/fdic-reference').mkdir(parents=True)
        self.row={'CERT':1,'REPDTE':'20260630','ASSET':100,'DEP':80,'EQ':10,'EQR':10,'ROA':1.2}
        self.parsed={'meta':{'total':2},'data':[{'data':self.row},{'data':dict(self.row,REPDTE='20260331',DEP=64)}]}
        self.snapshot={'banks':[{'cert':1,'period':'20260630','assets':100000,'deposits':80000,'equityRatio':.1,'roa':1.2,'depositChange':.25}]}
        self.receipt={'source':{'url':'https://api.fdic.gov/banks/financials?format=json','file':'outputs/fdic-reference/source.json'}}
        self.save()
    def save(self):
        snapshot=json.dumps(self.snapshot).encode();body=json.dumps(self.parsed).encode()
        (self.root/'data/snapshot.json').write_bytes(snapshot);(self.root/'outputs/fdic-reference/source.json').write_bytes(body)
        self.receipt['snapshotSha256']=hashlib.sha256(snapshot).hexdigest();self.receipt['source']['sha256']=hashlib.sha256(body).hexdigest()
        (self.root/'outputs/FDIC_CURRENT_FINANCIAL_CROSSCHECK.json').write_text(json.dumps(self.receipt))
    def test_valid(self):
        self.assertEqual(checker.check(self.root)['status'],'passed')
    def test_changed_bytes_and_stale_snapshot(self):
        for path in ('outputs/fdic-reference/source.json','data/snapshot.json'):
            self.save();(self.root/path).write_text('{}')
            self.assertEqual(checker.check(self.root)['status'],'failed')
    def test_incomplete_and_duplicate_observations(self):
        self.parsed['meta']['total']=3;self.save();self.assertEqual(checker.check(self.root)['status'],'failed')
        self.parsed['meta']['total']=2;self.parsed['data'][1]=self.parsed['data'][0];self.save();self.assertEqual(checker.check(self.root)['status'],'failed')
    def test_changed_values_and_nonfinite_values(self):
        self.row['EQR']=1;self.save();self.assertEqual(checker.check(self.root)['status'],'failed')
        self.row['EQR']=float('nan');self.save();self.assertEqual(checker.check(self.root)['status'],'failed')
    def test_outside_path_and_untrusted_source(self):
        self.receipt['source']['file']='data/snapshot.json';self.save();self.assertEqual(checker.check(self.root)['status'],'failed')
        self.receipt['source']['file']='outputs/fdic-reference/source.json';self.receipt['source']['url']='https://example.com/banks/financials';self.save();self.assertEqual(checker.check(self.root)['status'],'failed')
    def test_missing_previous_quarter(self):
        self.parsed['data']=self.parsed['data'][:1];self.parsed['meta']['total']=1;self.save()
        result=checker.check(self.root);self.assertEqual(result['status'],'failed');self.assertEqual(result['banksChecked'],0)

if __name__=='__main__':unittest.main()
