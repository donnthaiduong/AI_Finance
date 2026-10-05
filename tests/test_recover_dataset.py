import hashlib,json,pathlib,sys,tempfile,unittest,urllib.parse
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'pipeline'))
import recover_dataset
from audit import audit

class RecoverDatasetTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=pathlib.Path(self.temp.name)
        (self.root/'data/raw').mkdir(parents=True)
        self.snapshot={'banks':[{'cert':1}],'collectedAt':'2026-10-02T00:00:00Z','sources':[]}
        self.fin=[{'CERT':1,'REPDTE':p,'ASSET':100,'DEP':80,'EQ':10,'ROA':1} for p in ['20260331','20260630']]
        self.add('financials','CERT:1 AND REPDTE:[20160101 TO *]','CERT,REPDTE,ASSET,DEP,EQ,ROA',self.fin)
        self.add('institutions','CERT:1','CERT,NAME',[{'CERT':1,'NAME':'Synthetic bank'}])
        self.add('sod','CERT:1 AND YEAR:2025','CERT,YEAR,STCNTYBR,DEPSUMBR',[{'CERT':1,'YEAR':2025,'STCNTYBR':1001,'DEPSUMBR':80}])
        self.snapshot['sources'].append({'url':'https://home.treasury.gov/public.xml','sha256':'a'*64,'collectedAt':self.snapshot['collectedAt']})
        self.save()
    def add(self,endpoint,filters,fields,rows,total=None):
        body=json.dumps({'meta':{'total':len(rows) if total is None else total},'data':[{'data':r} for r in rows]}).encode()
        digest=hashlib.sha256(body).hexdigest();(self.root/'data/raw'/f'{digest}.bin').write_bytes(body)
        url='https://api.fdic.gov/banks/'+endpoint+'?'+urllib.parse.urlencode({'filters':filters,'fields':fields,'limit':10000,'offset':0})
        self.snapshot['sources'].append({'url':url,'sha256':digest,'collectedAt':self.snapshot['collectedAt']})
    def save(self):
        (self.root/'data/snapshot.json').write_text(json.dumps(self.snapshot))
    def test_derived_lineage_and_explicit_missing_context(self):
        data=recover_dataset.assemble(self.root)
        self.assertTrue(data['reconstruction']['notOriginalDatasetBytes']);self.assertIsNone(data['treasury'])
        self.assertEqual(len(data['sources']),3);self.assertEqual(len(data['reconstruction']['excludedSources']),1)
        target=self.root/'derived.json';target.write_text(json.dumps(data))
        self.assertEqual(audit(self.root,dataset_path=target)['status'],'passed')
        self.assertFalse((self.root/'data/dataset.json').exists())
    def test_missing_or_corrupt_raw_fails(self):
        source=self.snapshot['sources'][0];path=self.root/'data/raw'/f"{source['sha256']}.bin"
        path.write_text('{}')
        with self.assertRaises(ValueError):recover_dataset.assemble(self.root)
        path.unlink()
        with self.assertRaises(OSError):recover_dataset.assemble(self.root)
    def test_incomplete_page_fails(self):
        self.snapshot['sources']=self.snapshot['sources'][1:]
        self.add('financials','CERT:1 AND REPDTE:[20160101 TO *]','CERT,REPDTE,ASSET,DEP,EQ,ROA',self.fin,total=3)
        self.save()
        with self.assertRaises(ValueError):recover_dataset.assemble(self.root)
    def test_universe_mismatch_fails(self):
        self.snapshot['banks'].append({'cert':2});self.save()
        with self.assertRaises(ValueError):recover_dataset.assemble(self.root)
    def test_selection_rows_are_not_training_samples(self):
        source=self.snapshot['sources'][0]
        self.snapshot['sources'].append(dict(source,url=source['url'].replace('limit=10000','limit=1')));self.save()
        self.assertEqual(len(recover_dataset.assemble(self.root)['financials']),2)

if __name__=='__main__':unittest.main()
