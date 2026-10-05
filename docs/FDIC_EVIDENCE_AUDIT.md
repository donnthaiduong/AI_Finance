# FDIC evidence audit — 2026-10-05

## Current checkout

The product snapshot and model report exist. The frozen `data/dataset.json`, raw responses under `data/raw/`, and model weights are absent from this checkout at the current inspection. Their absence does not establish when or why they were removed. The audit now returns a structured failed result instead of a missing-file traceback. Counts are unknown (`null`), not zero.

Subsequent update: `pipeline/restore_raw.py` recovered 51/52 responses with exact recorded hashes, including every FDIC response. The old Treasury XML did not match and was refused. The frozen JSON dataset remains absent, so the dataset audit is still failed. This supersedes the initial raw-directory absence, without claiming full corpus restoration. See `docs/RAW_CORPUS_RECOVERY.md`.

A separate current financial crosscheck has now passed for all 32 snapshot banks using 64 newly retrieved FDIC bank-quarter observations. This verifies current displayed financial fields against revised observations, without restoring or replacing the frozen corpus. It excludes forecasts, peer weights and historical publication availability. See `docs/CURRENT_FINANCIAL_CROSSCHECK.md` and `outputs/FDIC_CURRENT_FINANCIAL_CROSSCHECK.json`.

`outputs/REPRODUCTION_REPORT.json` and the earlier verification logs record successful local reproduction on their recorded dates. Those records do not establish that the source corpus is available now. No recollection, restoration, model training or snapshot promotion occurred in this audit.

Restore the original frozen corpus from an available archive and check its hashes before reproducing again. If recollection becomes necessary, record a new collection/version and compare it separately; do not label new revised data as the old corpus.

## Stronger offline gate

`pipeline/audit.py` checks approved HTTPS source hosts, a 64-character SHA-256 before constructing a raw path, raw response hashes, finite model features, positive denominators and duplicate bank-quarter rows. Each processed financial row must also match a complete observation inside a hashed FDIC financial response. Valid response hashes alone no longer establish that the processed dataset retained the original values. Incomplete selection responses are not used as full financial observations.

Synthetic tests cover valid provenance, missing dataset, corrupt JSON/schema, missing/corrupt raw bytes, altered deposits, nonfinite/missing features, traversal hashes, duplicate rows, wrong and malformed source URLs. They establish software behavior only.

## Field definitions and unit gate

Three official FDIC API definition files and the 2025 SOD reporting instructions were retrieved on 2026-10-05. Original bytes, retrieval times, URLs and hashes are preserved in `outputs/fdic-reference/manifest.json`. The live BankFind financial report was also inspected through its rendered browser DOM; this observation is recorded separately from downloaded source bytes.

| Field | Implemented treatment | Current verification |
|---|---|---|
| ASSET / DEP | Multiply by 1,000 for displayed USD | Live official BankFind table says values are in thousands USD; rendered search options map Total Assets to ASSET and Total Deposits to DEP |
| EQ / ASSET | Divide to obtain a fraction | Formula is implemented; corpus reconciliation unavailable |
| ROA | Raw percentage displayed; divide by 100 for model feature | Official RIS definition explicitly says annualized net income as a percent of average total assets |
| REPDTE | Reporting-period identifier | Must not substitute for publication date |
| DEPSUMBR | Branch deposit weights for geographic similarity | SOD definition identifies domestic branch deposits; 2025 instructions PDF page 6 (printed page 2) specifies thousands of USD, rounded to nearest thousand; PDF page 8 (printed page 4) applies this to each branch |
| STCNTYBR | Geographic grouping | Official SOD CSV defines the branch state/county FIPS code; pipeline now canonicalizes five-digit syntax and rejects missing/fractional/zero-component codes; historical code membership remains unverified |

Definitions: [FDIC API documentation](https://api.fdic.gov/banks/docs/), [RIS fields](https://api.fdic.gov/banks/docs/risview_properties.yaml), [SOD fields](https://api.fdic.gov/banks/docs/sod_properties.yaml). Definitions support field semantics; they do not verify historical release availability, model accuracy or bank-failure probabilities.

Monetary units: [BankFind financial reporting](https://banks.data.fdic.gov/bankfind-suite/financialreporting/report), [2025 SOD instructions](https://fdic.gov/bank-financial-reports/2025-sod-instructions.pdf). The table's deposits footnote describes domestic offices; the API RIS definition of DEP also includes foreign-office deposits. Do not treat that table footnote as a definition of the full API DEP scope. The RIS definition supplies that distinction.

The SOD instructions allow branch allocation using banks' existing internal records and describe estimated/consolidated/non-deposit offices. Consequently geographic overlap remains a reported allocation similarity, not a direct map of depositor relationships or causal contagion. This inspection covers the 2025 instructions; it does not establish unchanged rules across every historical vintage.

Verified mappings: ASSET/DEP monetary scaling, ROA percentage semantics, 2025 SOD branch deposit units and STCNTYBR state/county FIPS semantics. The official financial reports workbook's variables sheet identifies EQ as a monetary measure; it does not itself establish the thousands multiplier. Still open: explicit EQ scaling, historical geographic-code validity, actual corpus reconciliation and historical data availability. `outputs/FDIC_UNIT_VERIFICATION.json` records the scope and unresolved fields.

Additional sources were followed from the live official bulk-download page: [SOD field definitions](https://api.fdic.gov/banks/docs//sod_variables_definitions.csv) and [Financial reports workbook](https://api.fdic.gov/banks/docs//All%20Financial%20Reports.xlsx). Bytes and hashes are retained. The workbook was read as ZIP/XML; no formulas or macros were executed.

## Snapshot reconciliation implemented

Run `python pipeline/audit.py --snapshot` to check the active snapshot after the raw-corpus gate passes. Checks include ASSET/DEP scaling, unchanged percentage ROA, EQ/ASSET fraction, deposit growth from the immediately previous quarter, latest reporting period, eligible bank coverage, source CERT/REPDTE, collection time, full source manifest, combined data/model version and explicitly unverified publication dates. Numeric comparisons use a 1e-12 relative/absolute tolerance for floating-point ratios; this is not a claim of measurement precision.

`pipeline/reproduce.py` now checks its newly generated snapshot against the source corpus before writing a successful reproduction manifest. It does not replace the product snapshot. A supplied snapshot path is checked independently from the active product file.

Twenty synthetic audit tests passed. These establish the checks' behavior, not the current real snapshot's consistency. The current real reconciliation returns failed with zero banks checked because the frozen corpus is absent. Result: `outputs/FDIC_SNAPSHOT_AUDIT.json`.

Model predictions and historical publication dates are not verified by this audit. Explicit EQ scaling and historical geographic-code validity remain separate source-verification gates. Ridge remains the inherited default. The full data gate remains open.
