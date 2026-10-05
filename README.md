# CascadeGuard / AI_Finance

Local research foundation and lean treasury simulation for SMEs using US banks.
English UI, USD, 30-day horizon. Repository: https://github.com/donnthaiduong/AI_Finance.

## Run locally

Node >=22.13, pnpm, Python >=3.10 with NumPy 2.x:

```sh
pnpm install --frozen-lockfile
python -m pip install -r pipeline/requirements.txt
pnpm test
pnpm typecheck
python -m unittest discover -s tests -p 'test_*.py'
python pipeline/audit.py
python pipeline/reproduce.py
pnpm dev
```

Open http://127.0.0.1:3000. Production check: `pnpm build`, then `pnpm start`.
With the server running, `python tests/api-smoke.py` verifies the local API.
The local adapter reads `data/snapshot.json` and maintains a durable last-valid backup.
There is no remote storage, automatic update schedule or banking connection.
`GET /api/banks`, `GET /api/banks/{cert}`,
`POST /api/scenario` expose read-only evidence and deterministic calculations.
`POST /api/admin/snapshot` and `GET /api/admin/status` require a server-only
`CASCADEGUARD_ADMIN_TOKEN` of at least 32 characters and are disabled without it.
Imports validate schema, immutable versions and collection order before atomic activation.
This file adapter targets one local application process, not distributed hosting.

On Windows, run `./scripts/verify.ps1 -PythonPath <python-executable>` for the complete
automated core/research/build/admin checks. Each stage saves its actual log and exit
status in `outputs/verification/`. Browser interaction and Claudable have separate evidence.

## Data and research provenance

The imported corpus, raw responses and source code come from the earlier local
CascadeGuard workspace described in `docs/IMPORT_PROVENANCE.json`. The dataset and
raw responses are intentionally ignored by Git. Keep them locally for exact reproduction;
copy them from that recorded workspace if rebuilding this checkout. A Git clone alone
supports the UI snapshot but cannot reproduce the research corpus. Do not confuse
recollection with reproducing the frozen corpus.

`python pipeline/collect.py` explicitly fetches public sources and replaces the local
dataset only after collection completes. It is not scheduled. `python pipeline/audit.py`
checks raw hashes, source hosts, duplicate observations and missing model features.
It does not verify original release dates or establish data truth.

`python pipeline/reproduce.py` creates a fresh folder under `outputs/research-runs/`
with a manifest, model report, weights and candidate snapshot. It never promotes a
model into the product snapshot. The inherited pilot uses train targets 2016–2021,
validation 2022–2023 and test 2024–2025; three seeds; Ridge, lag growth, GraphSAGE and
a matched self-only ablation. Current revised data and previous-year SOD are used:
this remains a retrospective experiment. Ridge remains the product default.

## Simulation contract

Full scenario assumptions now persist with the device-local portfolio. Import/export
JSON restores inputs and validates confirmed transfer history; supplied computed
results are recalculated. See `docs/CORE_MATH.md` for the mathematical contract.

Hypothetical balances, payments and unavailable percentages belong to the user.
Calculations use integer cents internally. Days 1 through D are unavailable; funds
return at the start of D+1. There are no inflows, interest, fees or automatic credit.
Negative cumulative cash means unmet obligations. Model predictions do not set the
unavailable percentage and are not failure probabilities.

Comparison requires explicit confirmation and unchanged inputs. Before/after
allocations, scenario and results are recorded locally, with the latest 50 entries
retained. This is an editable device-local activity log, not tamper-proof compliance
storage. Portfolio inputs are stored on the device; clicking Verify calculation sends
the current inputs to the local server for calculation without persistence.

Read `docs/FOUNDATION_DIRECTION_VI.md` for the research-first roadmap, decisions and
open questions. Read `outputs/PROJECT_DIRECTION_VI.md` and `AGENTS.md` before changes.
No deployment, user study or revenue validation is claimed.
