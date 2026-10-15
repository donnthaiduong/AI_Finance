"""Draw the Research page figures from outputs/REPRODUCTION_REPORT.json.

Every number plotted is read from the report, never typed in, so the figure cannot drift from the
reproduction run. Run: python pipeline/figures.py  (needs matplotlib; see requirements.txt)
"""
import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
REPORT = ROOT / 'outputs' / 'REPRODUCTION_REPORT.json'
OUT = ROOT / 'public' / 'figures'

INK, MUTED, GRID = '#000000', '#5f5f5f', '#e6e6e6'
ORANGE, SAGE, YELLOW = '#fe7141', '#d1ddd3', '#f0ff1c'
# Same four models, same order and colours in every figure.
MODELS = [('Lag growth', '#bdbdbd'), ('Ridge (default)', SAGE), ('Graph model', ORANGE), ('Same model, no network', INK)]


def load():
    data = json.loads(REPORT.read_text(encoding='utf-8'))
    rep = data['report']
    if rep.get('graphIncrementEstablished') is not False:
        sys.exit('Report no longer says the graph increment is not established; review the figure captions.')
    t, s = rep['test'], rep['summary']
    mae = [t['LagGrowth']['maePercentagePoints'], t['Ridge']['maePercentagePoints'],
           s['GraphSAGE']['meanMAEPercentagePoints'], s['SelfOnlyAblation']['meanMAEPercentagePoints']]
    rec = [t['LagGrowth']['recallWorstQuintile'], t['Ridge']['recallWorstQuintile'],
           s['GraphSAGE']['meanRecallWorstQuintile'], s['SelfOnlyAblation']['meanRecallWorstQuintile']]
    err = [0, 0, s['GraphSAGE']['stdMAEPercentagePoints'], s['SelfOnlyAblation']['stdMAEPercentagePoints']]
    seeds, recalls = {}, {}
    for r in rep['seeds']:
        seeds.setdefault(r['name'], []).append(r['test']['maePercentagePoints'])
        recalls.setdefault(r['name'], []).append(r['test']['recallWorstQuintile'])
    return data['manifest']['runId'], t['Ridge']['observations'], mae, rec, err, seeds, recalls


def style():
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 13, 'axes.edgecolor': GRID, 'axes.labelcolor': INK,
                         'xtick.color': INK, 'ytick.color': MUTED, 'axes.spines.top': False, 'axes.spines.right': False})


def bars(ax, vals, err, title, fmt):
    names = [m for m, _ in MODELS]
    y = range(len(names))[::-1]
    ax.barh(list(y), vals, xerr=err if any(err) else None, color=[c for _, c in MODELS], height=0.62,
            error_kw={'ecolor': INK, 'capsize': 4, 'lw': 1.4})
    for yi, v in zip(y, vals):
        ax.text(v, yi, '  ' + fmt.format(v), va='center', ha='left', fontsize=13, color=INK)
    ax.set_yticks(list(y))
    ax.set_yticklabels(names)
    ax.set_xlim(0, max(vals) * 1.25)
    ax.set_title(title, loc='left', fontsize=14, fontweight='bold', pad=12)
    ax.xaxis.grid(True, color=GRID)
    ax.set_axisbelow(True)


def results(run, n, mae, rec, err):
    fig, axes = plt.subplots(1, 2, figsize=(12, 5.2), sharey=True, layout='constrained')
    bars(axes[0], mae, err, 'Forecast error (MAE, points)\nLower is better', '{:.2f}')
    bars(axes[1], rec, [0] * 4, 'Recall, worst-decline quintile\nHigher is better', '{:.2f}')
    axes[1].tick_params(left=False)
    fig.supxlabel(f'Test split 2024-2025, {n} observations. Graph and no-network rows: mean of 3 seeds; bars show 1 standard deviation.\n'
                  f'Reproduction run {run}. Retrospective, revised data; not an early-warning result.', fontsize=11, color=MUTED, x=0.01, ha='left')
    return fig


def seed_dots(seeds, xlabel, fmt='{:.3f}'):
    fig, ax = plt.subplots(figsize=(11, 3.4))
    rows = [('Graph model', ORANGE, seeds['GraphSAGE']), ('Same model, no network', INK, seeds['SelfOnlyAblation'])]
    for i, (name, colour, vals) in enumerate(rows[::-1]):
        ax.scatter(vals, [i] * len(vals), s=140, color=colour, zorder=3)
        for k, v in enumerate(sorted(vals)):
            # Stagger heights so close seeds keep readable labels.
            ax.text(v, i + 0.2 + 0.28 * (k % 2), fmt.format(v), ha='center', fontsize=12)
    ax.set_yticks([0, 1])
    ax.set_yticklabels([r[0] for r in rows[::-1]])
    ax.set_ylim(-0.6, 1.9)
    ax.set_xlabel(xlabel)
    ax.xaxis.grid(True, color=GRID)
    ax.set_axisbelow(True)
    fig.tight_layout()
    return fig


def main():
    run, n, mae, rec, err, seeds, recalls = load()
    # Reuse the sentence in the xlabel only while it is true.
    worst_ablation, best_graph = max(seeds['SelfOnlyAblation']), min(seeds['GraphSAGE'])
    if worst_ablation >= best_graph:
        sys.exit('Seed ranges overlap; rewrite the seed-figure caption before publishing.')
    g, a = recalls['GraphSAGE'], recalls['SelfOnlyAblation']
    if not (min(g) < max(a) and min(a) < max(g)):
        sys.exit('Recall seed ranges no longer overlap; rewrite the recall caption before publishing.')
    style()
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fig in (('research-results.png', results(run, n, mae, rec, err)), ('research-seeds.png', seed_dots(seeds, 'Test MAE by seed (points). Every no-network seed is below every graph seed here.')),
                      ('research-recall-seeds.png', seed_dots(recalls, 'Recall of the worst-decline quintile, by seed. The two models overlap.'))):
        fig.savefig(OUT / name, dpi=160, facecolor='white', metadata={'Software': None})
        plt.close(fig)
        print('wrote', OUT / name)


if __name__ == '__main__':
    main()
