// src/app/(authed)/planejamento/_components/groupColors.ts
// Deterministic categorical colors by grupo (category) name — 03-UI-SPEC §Color.
// Used identically for the table dot, the legend dot and the segmented bar, so
// the eye matches all three. Not brand colors — support tones for category id.

// Fixed palette for the 4 seeded Casa groups (03-UI-SPEC categorical table).
const FIXED: Record<string, string> = {
  Alimentação: '#1E3A8A', // azul-marinho (blue-900)
  Combustível: '#B45309', // laranja-queimado (amber-700)
  Lazer: '#3B82F6', // azul-claro (blue-500)
  Outros: '#64748B', // cinza (slate-500)
}

// Cyclic fallback palette for user-created categories (avoids reusing the 4 fixed
// tones when possible — 03-UI-SPEC rule 2).
const CYCLE = ['#0F766E', '#7C3AED', '#DB2777', '#0891B2', '#CA8A04', '#4338CA']

/** Color of the "Folga" segment / legend line (teto não planejado). */
export const FOLGA_COLOR = '#CBD5E1' // slate-300

/**
 * Deterministic hex color for a grupo name. Fixed names get their spec color;
 * others get a stable color from the cyclic palette by name hash.
 */
export function groupColor(name: string): string {
  if (FIXED[name]) return FIXED[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return CYCLE[hash % CYCLE.length]
}
