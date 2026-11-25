// src/app/(authed)/contas-fixas/_lib/money.ts
// Shared BRL input parser for the contas-fixas Sheets.
// Converts a free-typed "1.234,56" string to integer cents. Mirrors the parser
// used in lancamentos/TransactionSheet. Returns 0 (not NaN) for invalid input.

/** Parse a BRL-typed string to integer cents. Non-positive/invalid → 0. */
export function parseBRLInput(raw: string): number {
  const cleaned = raw
    .replace(/[^\d,\.]/g, '')
    .replace(/\.(?=\d{3})/g, '')
    .replace(',', '.')
  const value = parseFloat(cleaned)
  if (isNaN(value) || value < 0) return 0
  return Math.round(value * 100)
}
