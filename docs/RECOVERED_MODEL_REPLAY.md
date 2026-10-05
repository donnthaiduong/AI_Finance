# Recovered bank-model replay — 2026-10-05

## Dataset provenance

`pipeline/recover_dataset.py` assembled a separately labelled dataset from all 51 exact recovered FDIC responses. It verifies hashes, complete pagination and the inherited bank universe, excludes selector rows from training and records reconstruction lineage. The derived dataset contains 1,344 financial observations, 32 institutions and 392,715 SOD rows. Its byte hash is `55facb085ab0ae1a6b3e566d9184da5ff1eca1d3f5aae96a105bc0f281a7f7c8`.

This is **not the original JSON file**. Its creation date/version and byte hash are new, while source collection metadata is inherited and labelled. Treasury is explicitly `null` because its original bytes were not recovered. The excluded source is recorded; no replacement or fabricated observation was supplied. Treasury is context, not a model feature. The full banking model inputs are recovered from exactly matching raw sources.

Dataset and manifest: `outputs/recovered-datasets/20261005T161509722048Z/`. The large dataset and run outputs are ignored by Git; compact provenance/replay receipts remain in `outputs/`.

## Actual isolated run

Command: `python pipeline/reproduce.py --dataset outputs/recovered-datasets/20261005T161509722048Z/dataset.json`.

The run completed at `outputs/research-runs/20261005T161540264478Z/`. Its raw dataset audit and generated-snapshot reconciliation passed for 32 banks. Ridge selection and the entire held-out test metric dictionary exactly match the inherited model report. Comparing banks by CERT also found exact equality of all bank fields, including forecasts, priorities and peer weights, with the unchanged active snapshot.

| Model/report entry | Test MAE, percentage points | Worst-quintile recall |
|---|---:|---:|
| Lag growth | 3.043575 | 0.267857 |
| Ridge | 3.021199 | 0.214286 |
| GraphSAGE selected seed | 2.706006 | 0.196429 |
| Self-only ablation mean | 2.329314 | 0.261905 |

Selection uses validation: GraphSAGE MAE 4.193852 versus best matched self-only ablation 3.666678, so the network eligibility gate fails. Ridge remains selected. Selected-seed and mean-seed summaries have different aggregation scope; the table must not imply a paired uncertainty estimate.

## Scope and remaining limits

This proves reproducibility of the inherited retrospective bank pilot on recovered raw banking observations through the changed pipeline. It does not prove predictive usefulness, causal contagion, early-warning capability, historical publication availability or relevance to a broader SME bank universe. The source universe still consists of 32 large surviving banks, and historical data may be revised.

No research snapshot or weights were promoted to `data/`. The original dataset JSON, original model weights and Treasury response remain unavailable as archival bytes; model reproduction no longer depends on waiting for those files because all banking inputs are now separately reconstructed and audited. Future temporal/universe experiments still require their existing controlled evaluation plan.

Five reconstruction tests were added; 46 Python tests passed with warnings treated as errors. The initial recorded run preceded the addition of an explicit `datasetOrigin` field to future run manifests; its original dataset-path/hash and paired derived-dataset manifest still establish the lineage. `outputs/RECOVERED_MODEL_REPLAY.json` links these records and preserves the initial observed run rather than editing its manifest retroactively.
