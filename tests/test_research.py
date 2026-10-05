import importlib.util, pathlib, unittest
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('train',ROOT/'pipeline/train.py')
train=importlib.util.module_from_spec(spec);spec.loader.exec_module(train)

class ResearchTests(unittest.TestCase):
    def test_quarter_boundaries(self):
        self.assertEqual(train.quarter_next('20251231'),'20260331')
        self.assertEqual(train.quarter_next('20250331'),'20250630')
    def test_graph_excludes_same_year_information(self):
        rows=[{'CERT':1,'STCNTYBR':1,'DEPSUMBR':100},{'CERT':2,'STCNTYBR':1,'DEPSUMBR':100}]
        a=train.graph({'sod':{'2025':rows}},[1,2],2025)
        np.testing.assert_array_equal(a,np.zeros((2,2)))
        a=train.graph({'sod':{'2025':rows}},[1,2],2026)
        np.testing.assert_array_equal(a,[[0,1],[1,0]])
    def test_missing_feature_fails_instead_of_zero_imputation(self):
        with self.assertRaises(ValueError):train.features({'ASSET':100,'DEP':20,'EQ':None,'ROA':1},{'DEP':10})
    def test_recall_and_mae_known_case(self):
        m=train.metrics(np.array([[3.,2.,1.,0.,4.]]),np.array([[0.,1.,2.,3.,4.]]),np.ones((1,5),dtype=bool))
        self.assertEqual(m['recallWorstQuintile'],0)
        self.assertAlmostEqual(m['maePercentagePoints'],160)
    def test_empty_quarters_do_not_lower_recall(self):
        y=np.array([[0.,1.],[0.,0.]])
        m=train.metrics(y,y,np.array([[True,True],[False,False]]))
        self.assertEqual(m['recallWorstQuintile'],1)
        with self.assertRaises(ValueError):train.metrics(y,y,np.zeros_like(y,dtype=bool))
    def test_missing_branch_deposit_is_not_zero_imputed(self):
        with self.assertRaises(ValueError):train.graph({'sod':{'2025':[{'CERT':1,'STCNTYBR':1,'DEPSUMBR':None}]}},[1],2026)
    def test_invalid_financial_denominators_rejected(self):
        for value in [0,-1,float('inf')]:
            with self.assertRaises(ValueError):train.features({'ASSET':value,'DEP':20,'EQ':1,'ROA':1},{'DEP':10})

if __name__=='__main__':unittest.main()
