# Geographic feature validation — 2026-10-05

The official SOD variables CSV defines STCNTYBR as the state/county FIPS code for the specific branch. Missing values cannot identify a real county. Decimal codes must not be truncated into a different code.

`pipeline/train.py` now canonicalizes integer numeric and digit-string codes to five digits. For example, 1001 and `01001` identify the same code. It rejects missing values, booleans, fractions, malformed strings and unknown all-zero state/county components. Only rows for selected banks are validated. This is syntactic validation; it does not establish that every code existed in every historical period. Historical FIPS lookup and changed boundaries remain unresolved.

Selected branch deposits must be finite and nonnegative. Aggregation overflow raises an error. Each bank's county vector is scaled by its largest component before Euclidean normalization, keeping large finite inputs from overflowing the norm. Positive scaling leaves cosine similarity unchanged: `(av · bw)/(||av|| ||bw||) = (v · w)/(||v|| ||w||)` for positive a,b. Thus converting every branch deposit from thousands to dollars must not change geographic similarity. Zero vectors retain no neighbours.

Four additional synthetic tests verify invalid codes, numeric/padded-code equivalence, common monetary-scale invariance, and extreme vector/aggregation handling. All 31 Python tests passed with warnings treated as errors. No frozen corpus was available to rerun training, and no active snapshot/model was changed. The previous reproduction manifests retain their recorded historical training-code hashes; they are not evidence for this changed implementation.

This change does not establish network improvement, bank failure probability or causal contagion. A valid reported geographic allocation remains a similarity feature with the SOD allocation limitations.
