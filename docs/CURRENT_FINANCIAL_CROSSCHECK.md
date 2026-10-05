# Current financial crosscheck — 2026-10-05

## Direct observation

Two new public FDIC financial requests were retrieved separately from the absent inherited corpus. The first checked CERT 14 at 20260630 with ASSET, DEP, EQ, EQR and ROA. The second queried all 32 active snapshot banks for their reporting quarter and the immediately preceding quarter. It returned 64 bank-quarter observations.

All 32 snapshot banks agreed with the newly retrieved observations for displayed assets/deposits (source amount × 1,000), ROA (unchanged percent), equity ratio (EQ / ASSET), and previous-quarter deposit growth. Additionally, EQR agreed with 100 × EQ / ASSET for every bank. Ratios were compared at 1e-12 relative/absolute tolerance, which accommodates numerical representation and does not describe reporting precision.

`outputs/FDIC_CURRENT_FINANCIAL_CROSSCHECK.json` records the exact request URL, retrieval time, immutable response path/hash, checked periods, active snapshot hash, checks and empty error list. The unchanged active snapshot hash is `424ad8f61a86c4e000adf6d0b21f70a1b758d9be6c995838618bdc0297800a42`. The downloaded responses are retained under `outputs/fdic-reference/`; they do not replace `data/dataset.json` or the prior raw corpus.

## EQ interpretation

The official RIS field definition for EQR explicitly uses EQ as numerator and ASSET as denominator in a percentage formula. The workbook identifies EQ as a monetary field. Combined with verified ASSET units, the formula and observed EQR agreement support treating EQ and ASSET as the same numerical scale when computing equity ratio. EQ's thousands scaling is therefore supported by a dimensional inference and the observed ratio check; an independent explicit EQ-unit statement has not been located. CascadeGuard displays the ratio rather than an absolute EQ amount.

## Limits

These are current revised observations. Agreement today does not prove the data were available at historical prediction time or recover the original frozen corpus. Forecast values, peer weights, historical release dates, complete training history and model accuracy were not checked. No active model, snapshot or user assumptions changed. The whole goal remains incomplete.

Sources: [FDIC RIS field definitions](https://api.fdic.gov/banks/docs/risview_properties.yaml), [official financial API](https://api.fdic.gov/banks/docs/), [financial field workbook](https://api.fdic.gov/banks/docs//All%20Financial%20Reports.xlsx). Exact observation URLs are preserved in the report rather than substituted for historical citations.

## Offline rerun

Run `python pipeline/check_current_financials.py`. No network or active data writes occur. The checker validates the receipt's snapshot hash, approved source endpoint, bounded reference-file location and source-byte hash before recomputing the financial comparisons. It rejects incomplete responses, duplicate observations, missing previous quarters, nonfinite values and EQR discrepancies. Receipt counts/status are not accepted as proof.

The actual saved response rerun passed for 32 banks/64 observations. Six synthetic fault tests were added; all 37 Python tests passed with warnings treated as errors. Snapshot/source changes require a new explicit observation receipt; silently reusing a stale receipt fails.
