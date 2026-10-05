# Evidence read/write resilience — 2026-10-05

## Fault found and fixed

`EvidenceStore.getSnapshot()` previously grouped active-file reading and durable-backup writing in one try block. A failed backup write could therefore discard successfully read evidence, returning an older fallback or rejecting the request when fallback was absent. A failed status write could also make a readable fallback unavailable. These are independent filesystem failures.

The implementation now returns a validated active snapshot when its backup/status write fails. It uses fallback only when active reading or validation fails. Fallback remains readable even if failure status cannot be persisted. Import rejection retains its original error when writing rejection status fails. Atomic operations clean up only their own unique temporary file after a failed write/rename.

Durable backup is still required before an imported candidate is activated. This fix does not weaken the import activation gate or claim that failed persistence succeeded. If both the active file and fallback are unreadable, evidence remains unavailable; deterministic cash planning has its existing independent behavior.

## Verification scope

Four filesystem fault tests create directories at specific expected file paths to force rename failures: active evidence with failed backup; readable fallback with failed status; active evidence with both backup/status failures; and invalid import with failed status. They check returned evidence/errors and that no operation-owned `.tmp` files remain. Existing tests cover fallback after restart, failed activation, ordering and version immutability.

This verifies actual filesystem failure handling in temporary directories. It does not establish every operating-system permission/quota behavior, process-crash durability or distributed storage semantics. No product data was replaced by the tests.

The inherited corpus location recorded in `docs/IMPORT_PROVENANCE.json` was checked and is not present on this host. No frozen corpus was restored or recollected.
