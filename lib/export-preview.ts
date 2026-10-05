// Bound DOM text without truncating the recoverable export. Offsets use UTF-16.
export const EXPORT_SECTION_CHARACTERS = 64 * 1024;

export function exportSection(text: string, requestedIndex: number) {
  const count = Math.max(1, Math.ceil(text.length / EXPORT_SECTION_CHARACTERS));
  const index = Math.max(0, Math.min(count - 1, Number.isFinite(requestedIndex) ? Math.trunc(requestedIndex) : 0));
  function boundary(offset: number) {
    const bounded = Math.min(offset, text.length);
    // Keep surrogate pairs together, including at the last section boundary.
    const before = text.charCodeAt(bounded - 1), after = text.charCodeAt(bounded);
    return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff ? bounded - 1 : bounded;
  }
  const start = boundary(index * EXPORT_SECTION_CHARACTERS);
  const end = boundary((index + 1) * EXPORT_SECTION_CHARACTERS);
  return { index, count, text: text.slice(start, end) };
}
