# One-page plan verification

Recorded 2026-10-05. Synthetic inputs only; no SME trial.

## Implementation

`lib/preparation-plan.ts` builds a validated, recomputed summary. `lib/render-plan.ts` measures and wraps actual browser font text on a 1240 × 1754 canvas. A bounded JPEG is embedded in one A4 PDF page. Layout overflow raises an error; it is not clipped or silently shrunk. Creation stays in the browser.

Up to six current bank balances and eight next payments are shown. Omitted row counts are explicit, totals include every valid input, and JSON retains the full schedule/history. Unconfirmed proposals and confirmed simulation history have different wording. No real money moves.

The PDF is an image, not selectable text or a tagged accessible PDF. This is disclosed next to the download link. HTML text and browser print remain available; browser print pagination is separate and unverified. Changing inputs, destination, proposal, confirmed allocation or refreshing evidence removes the generated PDF link so the user must recreate it.

## Direct evidence

Generated the two artifacts through the actual production workspace and saved the bytes from its download link:

| Artifact | Inputs | Independent check |
|---|---|---|
| `output/pdf/preparation-confirmed-example.pdf` | $180,000 total; confirmed $21,250 A → B; shortfall $17,000 → $0 | One A4 page, 313,698 bytes, 1240 × 1754 image |
| `output/pdf/preparation-maximum-inputs.pdf` | 32 banks, 100 obligations, longest Unicode labels, $10 billion per entry | One A4 page, 594,038 bytes, 1240 × 1754 image; 26 banks/92 payments explicitly omitted from row display |

Both opened with `pypdf.PdfReader(..., strict=True)`, had no OpenAction or annotations, rendered successfully with Poppler, and were visually inspected without clipping, overlap, missing glyphs or unreadable text at the rendered scale. Machine record: `outputs/PLAN_PDF_VERIFICATION.json`.

The complete calculation/comparison/confirmation/PDF journey also passed while both bank evidence snapshots were unavailable. The report explicitly stated no bank evidence was used; server verification matched. Original data files were restored byte-for-byte afterwards.

## Limits

Native browser file-save/download event remains unverified. Link generation and independently readable bytes are verified. No cross-browser, native printer, screen-reader or comprehensive accessibility audit has been completed.

Five pure tests cover recomputation, obsolete/tampered reviewed actions, bounded maximum inputs, rejected provenance/layout overflow and PDF xref/page structure. They complement the actual UI PDFs; the structural encoder test alone does not establish JPEG rendering fidelity.
