# Device-local recovery contract

Verified 2026-10-05 in this checkout. No real banking data used.

## Behavior

- Restore validates and recalculates saved v2 or legacy inputs/history. It performs no write. An empty string is damaged data, not an empty portfolio.
- Invalid edits do not replace the last valid save. The UI says to fix inputs before saving.
- Damaged v2 data is archived byte-for-byte before a reviewed replacement. Twenty numbered recovery slots avoid overwriting earlier originals; occupied slots with identical bytes can be reused. If all slots are occupied, replacement is refused.
- Damaged legacy data remains at its legacy key. Creating a valid empty v2 session shadows legacy data without deleting it, so a reset stays empty after reload.
- Failed reads/writes do not clear the existing save. When recovery or persistence cannot complete, a replacement remains pending. The user can cancel or explicitly continue in a temporary tab-only session. This mode leaves device data untouched and displays an export-before-closing reminder.
- A read-before-write check detects a changed saved value from another tab and refuses to overwrite it. This is not an atomic cross-tab transaction or a guarantee against simultaneous writers.
- Imports discard extra fields outside the known input/history contract. Unknown schema versions and forged history reject. Amounts/results are recalculated. Changes made while an import file is being read invalidate that import attempt.
- Export and import share a 32 MiB file ceiling. Domain bounds still limit positions to 32, obligations to 100, reviewed history to 50 and legacy history to 50. The larger byte ceiling allows this supported history to be exported and restored, including Unicode labels. Scenario/Copilot HTTP bodies use a separate 128,000-byte cap; they contain only current inputs, not history.

## Evidence

`tests/device-storage.test.mjs`: eight tests with a faulting storage adapter cover malformed/current/future-version saves, unavailable/full storage, numbered archives, conflicts, legacy migration, invalid drafts and a largest named portfolio with 50 reviewed records. The latter produces more than the former 1 MB import ceiling and round-trips successfully. The complete JS suite currently passes 50 tests.

Browser used the actual Treasury Workspace and `DeviceSessionStore` with a synthetic adapter. Verified:

1. Damaged original plus blocked writes: replacement stays pending; explicit temporary continuation computes the $17,000 example shortfall with zero storage writes.
2. Restored writes: new v2 data saves; recovery slot 1 remains `prior-original`, slot 2 retains `{broken-original`.
3. External saved-data change: local balance edit displays conflict; external empty save remains untouched and the write count does not increase.
4. Blocked reads on remount: visible unavailable notice; explicit temporary continuation still computes the example.

Proof: `outputs/device-storage-proof-20261005.png`. This is an adapter fault test through the real UI, not an actual browser quota-exhaustion test. Browser-native Blob download/export round trip remains unverified in the in-app browser because its download event timed out.

The new export panel supplies full read-only JSON as a fallback. Browser text
export/import round trip passed: 597-character synthetic session exported from
the textarea, saved as a test fixture, then imported after changing a balance.
Reload and server verification restored the $700 day-1 shortfall. The clipboard
write promise resolved and the UI acknowledged it, but the browser tool's
clipboard readback differed; native clipboard fidelity is unverified.

## Repeating the UI check locally

Copy `tests/fixtures/storage-harness.tsx` to temporary `app/verification-storage/page.tsx`, run Next dev on a separate localhost port, and open `/verification-storage`. The harness uses only synthetic memory storage. Its buttons control read/write faults and inspect the saved value and archives. Delete the temporary route, stop dev and rebuild after checking. The route was removed from this checkout; the production build contains no verification controls.

## Subsequent native observation

Native write rejection and explicit temporary continuation were observed in production IAB; server calculation matched. Large export, reload preservation and screenshot were not completed after browser-control failures. See docs/NATIVE_STORAGE_VERIFICATION.md for the narrow scope.
