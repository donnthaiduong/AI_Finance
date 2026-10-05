# Native storage check — 2026-10-05

Scope: actual production CascadeGuard in the Codex in-app browser, isolated origins `127.0.0.1:3001` and `:3002`. Synthetic portfolios only; no injected storage adapter or direct localStorage mutation. Main workspace origin `:3000` was not used.

## Observed

- A validated 10,356,390-byte JSON portfolio with 32 banks, 100 payments and 50 reviewed records imported and saved on `:3001` without a storage warning.
- On `:3002`, Start with my inputs established a valid empty session. Importing a validated 15,433,292-byte JSON portfolio, additionally containing 50 valid legacy records, produced `Device storage is unavailable or full` and `Replacement has not been saved`.
- The working portfolio stayed empty until the explicit `Continue without saving to device` action. After that action, the UI displayed `Temporary tab only. Device data remains untouched. Export JSON before closing.`
- Results showed no shortfall and $100 scheduled obligations. The actual Verify calculation action returned `Calculation matches the local server. Evidence: partial.`

The size-dependent rejection is consistent with native storage quota exhaustion. The browser exception name and precise limit were not captured, so this is evidence of a native write rejection, not measurement of a quota threshold.

## Unfinished checks and tool failure

Clicking Export JSON timed out. Subsequent accessibility and screenshot calls also timed out, and the browser runtime reset. Its next inventory returned no enabled browsers/tabs. The cause could be page responsiveness or the browser control connection; this observation does not establish which failed.

Consequently, large JSON export fidelity, reload restoration of the saved empty session, byte preservation and a screenshot were not verified. Do not report these as passed. Repeat after browser control is available, capture the memory-mode results before export, then inspect the large-export behavior separately. Other browsers, native downloads, clipboard and touch remain open.

No product code changed during this check. Previously recorded automated test counts are historical, not rerun results for this check. Owner again confirmed no SME participants; real-user benefit remains unverified.

## Follow-up — 2026-10-06, bounded export display

The prior timeout did not prove a product root cause. The current UI nevertheless placed the entire multi-megabyte string into one textarea. It now displays at most 65,537 UTF-16 code units per section, retaining Unicode surrogate pairs. Download and clipboard actions still use the complete unchanged string. Small exports retain the complete-text field. Large manual fallback explicitly requires joining every section without added/removed characters; it never presents a section as a valid portfolio.

Actual rebuilt production UI on isolated `:3003`:

1. Valid empty session saved through Start with my inputs; same 15,433,292-byte fixture again caused a native storage write rejection and pending replacement.
2. Explicit memory-only continuation enabled the imported inputs. Export JSON opened successfully and displayed section 1 of 116.
3. Every one of 116 sections was read from its actual textarea while navigating with Next JSON section. The last Next button was disabled. Largest observed section: 65,536 code units; assembled string: 7,556,268 code units.
4. Reassembled UTF-8 export matched the input fixture SHA-256 exactly. The actual import validator accepted 32 banks, 100 payments, 50 reviewed and 50 legacy records.
5. Reload plus completed hydration restored the prior empty working portfolio, with Add bank available and Export JSON/Next: payments disabled. This establishes semantic restoration of the prior empty save; saved-storage byte equality was not inspected.

Screenshot: `outputs/large-export-proof-20261006.png`. Machine record: `outputs/LARGE_EXPORT_VERIFICATION.json`. The file-chooser tool itself took about 18 minutes to return, although the later UI was responsive. This is not an import-performance measurement. Native Blob download and clipboard fidelity remain unverified; the newly established recovery path is complete text through bounded sections. No cross-browser, native-phone or user-benefit claim follows.

Current automated checks: 68 JavaScript tests passed, including section bounds, Unicode byte preservation and a 32 MiB Unicode round trip. TypeScript and production build passed. Python was not rerun for this UI-only change.
