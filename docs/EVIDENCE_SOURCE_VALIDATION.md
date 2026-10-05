# Evidence source consistency — 2026-10-05

## Contract enforced

The shared snapshot schema now requires each bank's FDIC financial source to name that bank's CERT and reporting period in a single `filters` parameter. The endpoint must be `/banks/financials` on `api.fdic.gov`. A different bank, period, endpoint, duplicate filter or URL fragment is rejected. This schema is shared by server storage/import and browser evidence parsing.

Official source URLs cannot contain user credentials or custom ports. Invalid URL strings return validation failures rather than throwing from URL parsing. Reporting periods and supplied publication times cannot follow snapshot collection time. Source collection times cannot be more than five minutes later than snapshot collection time, matching the existing collection clock allowance. Repeated peer certificates are rejected.

The accepted financial-filter form is `CERT:<certificate> AND REPDTE:<YYYYMMDD>` with whitespace allowed at field values and around AND. This deliberately matches the collector contract. Broader FDIC queries belong in the raw source manifest; they are not accepted as an individual bank's evidence link.

These checks establish consistency of metadata, not correctness of the cited financial figures. A matching official link does not establish that figures came from it. Raw-response hashing and snapshot reconciliation are separate gates; the current frozen corpus remains absent. Supplied publication dates still need independent verification, even if their chronology is valid.

## Verification

Six tests added: wrong certificate/period/endpoint/filter/fragment; credential/port URLs; malformed URLs; contradictory dates/duplicate peers; rejected import preserving the active file byte-for-byte; and restart recovery when active metadata cites a wrong period. The complete JavaScript suite passed 65 tests. TypeScript, production build and localhost API smoke passed. The real current snapshot remains schema-valid. No product dataset or model was promoted.
