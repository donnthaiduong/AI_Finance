# Exact raw-response recovery — 2026-10-05

## Observed recovery

The inherited snapshot includes 52 source URLs and SHA-256 digests. A public FDIC financial response containing the full 1,344 bank-quarter observations was retrieved again and matched its original digest byte-for-byte. Recovery was then attempted for all 52 sources.

**51 responses matched** and are restored under the original content-addressed paths in `data/raw/`. They include 32 institution observations and all 392,715 SOD observations. Financial response wrappers total 1,377 because they also contain the one latest-quarter selector and 32 bank-selection observations; the full model-feature response remains 1,344 rows. These selector observations must not be counted as additional training samples.

The Treasury yearly XML returned a different hash and was not written as the original response. Its original source record remains available in the unchanged product snapshot. `outputs/FDIC_RAW_RECOVERY.json` records expected/observed hashes and per-response results. No mismatched response is substituted for the old bytes.

`data/dataset.json` and the original model weights remain absent. Raw-response recovery does not establish byte-identical recovery of the normalized JSON dataset, complete historical publication availability, or model reproduction. The product snapshot/model were not changed.

## Reusable recovery tool

`python pipeline/restore_raw.py` reads recorded public sources from the snapshot. It allows only HTTPS FDIC/Treasury hosts without credentials or custom ports, bounds each response to 32 MiB, and verifies its hash before saving. Existing matching bytes are reused without a request; existing conflicting bytes are refused. A changed response is reported as a mismatch. Four synthetic tests cover these rules; all 41 Python tests passed with warnings treated as errors.

Network recovery is explicit and has no schedule. A successful SHA-256 match proves agreement with recorded bytes; it does not prove the inherited source collection timestamp or data truth independently.

## Next research step

Recover the original JSON dataset from an archive, or construct a separately labelled derived research dataset from the recovered FDIC observations with an explicit reconstruction manifest. The latter must retain a new dataset byte hash and truthful lineage, and must not be described as the original file. Treasury is context rather than a model feature; its missing old bytes must be recorded, not silently filled from today's response. Any model rerun stays isolated until validation and promotion are separately justified.
