import importlib.util, pathlib, re, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('figures',ROOT/'pipeline/figures.py')
figures=importlib.util.module_from_spec(spec);spec.loader.exec_module(figures)

class FigureTests(unittest.TestCase):
    def test_research_page_table_matches_report_the_figures_read(self):
        _,_,mae,rec,_,_,_=figures.load()
        page=(ROOT/'app/research/page.tsx').read_text(encoding='utf-8')
        rows=re.findall(r"mae: '([\d.]+)', recall: '([\d.]+)'",page)
        self.assertEqual(rows,[(f'{m:.2f}',f'{r:.2f}') for m,r in zip(mae,rec)])
    def test_every_seed_is_plotted(self):
        seeds=figures.load()[5]
        self.assertEqual({k:len(v) for k,v in seeds.items()},{'GraphSAGE':3,'SelfOnlyAblation':3})
