import hashlib,pathlib,sys,tempfile,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'pipeline'))
import restore_raw

class RestoreRawTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=pathlib.Path(self.temp.name)
        self.body=b'original public source';self.digest=hashlib.sha256(self.body).hexdigest()
        self.source={'url':'https://api.fdic.gov/banks/financials','sha256':self.digest}
    def test_exact_bytes_only_and_no_repeat_fetch(self):
        self.assertEqual(restore_raw.recover(self.source,self.root,lambda url:self.body)['status'],'restored')
        self.assertEqual(restore_raw.recover(self.source,self.root,lambda url:self.fail('Must not refetch'))['status'],'already-present')
    def test_mismatch_never_writes_as_original(self):
        self.assertEqual(restore_raw.recover(self.source,self.root,lambda url:b'revised')['status'],'hash-mismatch')
        self.assertFalse((self.root/'data/raw'/f'{self.digest}.bin').exists())
    def test_existing_conflict_is_not_overwritten(self):
        path=self.root/'data/raw'/f'{self.digest}.bin';path.parent.mkdir(parents=True);path.write_bytes(b'broken')
        with self.assertRaises(ValueError):restore_raw.recover(self.source,self.root,lambda url:self.body)
        self.assertEqual(path.read_bytes(),b'broken')
    def test_untrusted_host_and_hash_rejected_before_fetch(self):
        for change in ({'url':'https://example.com'},{'sha256':'../../file'},{'url':'https://user:pass@api.fdic.gov'}):
            with self.assertRaises(ValueError):restore_raw.recover(dict(self.source,**change),self.root,lambda url:self.fail('Must not fetch'))

if __name__=='__main__':unittest.main()
