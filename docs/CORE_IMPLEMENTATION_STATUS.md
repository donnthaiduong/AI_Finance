# Core implementation audit — 2026-10-05

Người dùng đã chốt nghiên cứu trước demo, chạy cục bộ với snapshot có nguồn,
và nhóm thử là chủ SME/người phụ trách tài chính dùng ngân hàng Mỹ. Hosting chốt sau.

| Requirement | Evidence | State |
|---|---|---|
| Cent calculations, invalid inputs, confirmation, conserved funds | 22 JS tests | Passed locally |
| Proposal invalidation and explicit confirmation | Production browser: changed amount removed proposal; apply preserved $180,000 | Passed |
| Persistence and server/client consistency | Reload retained $70,000/$80,000/$30,000 and $1,000 shortfall; Verify matched version | Passed |
| Import/export | Session tests and earlier browser round trip | Passed; round trip not repeated October 5 |
| Last-valid snapshot and update status | evidence-store and storage tests | Passed; single-process design |
| Protected administrative import | HTTP: unauthorized, invalid schema and oversized body rejected; valid snapshot accepted | Passed with ephemeral token; operating token not configured |
| Research reproduction | outputs/verification/20261005T090646972Z/reproduce.log | Selection and test metrics match inherited corpus |
| TypeScript and production build | Same verification report | Passed |
| Source units and historical releases | docs/CORE_SOURCE_LEDGER.json | Full mapping and vintages unresolved |
| Claudable tool | Local startup HTTP 200; Prisma generated; typecheck passed; build compiled but failed packaging with Windows EPERM symlink | Startup verified; standalone packaging unresolved; separate from CascadeGuard |
| Context Mode | No ctx MCP tools available | Concise file reads used |

Eight verification stages exited 0; 7 Python tests passed. Browser proof:
outputs/core-flow-proof-20261005.png. This is local verification, not deployment,
new data collection, independent review or user testing. Ridge remains default.
Rolling-origin, paired uncertainty, broader universe and SME study are future gates.
