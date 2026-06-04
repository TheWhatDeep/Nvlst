/* ==========================================================
   ENTITY TYPE REGISTRY  (ported from CODEX's TYPES)
   Five universal, genre-neutral types. Hardcoded, exactly the
   way CODEX hardcodes its registry. No fantasy assumptions; no
   custom/user-defined types in v1.
   ========================================================== */
export const TYPES = {
  character: { name: 'Character', plural: 'Characters', icon: 'character', color: '#a86b4c', desc: 'People in the story' },
  place:     { name: 'Place',     plural: 'Places',     icon: 'place',     color: '#5a7d8c', desc: 'Locations' },
  event:     { name: 'Event',     plural: 'Events',     icon: 'event',     color: '#9c5b6b', desc: 'Things that happen' },
  item:      { name: 'Item',      plural: 'Items',      icon: 'item',      color: '#7a6e9c', desc: 'Notable objects' },
  group:     { name: 'Group',     plural: 'Groups',     icon: 'group',     color: '#6b8a5e', desc: 'Organizations, factions, families' },
}
export const TYPE_KEYS = Object.keys(TYPES)

/* genre-neutral relationship vocabulary (typed edges) */
export const REL_TYPES = [
  'knows', 'allied with', 'enemy of', 'member of', 'parent of', 'child of',
  'sibling of', 'partner of', 'works for', 'leads', 'located in', 'contains',
  'owns', 'created', 'related to',
]

/* reciprocal mapping — mark A "parent of" B and B becomes "child of" A.
   Mirrors CODEX's INVERSE map. */
export const INVERSE = {
  'parent of': 'child of', 'child of': 'parent of',
  'allied with': 'allied with', 'enemy of': 'enemy of',
  'sibling of': 'sibling of', 'partner of': 'partner of', 'knows': 'knows',
  'member of': 'contains', 'contains': 'member of',
  'located in': 'contains',
  'leads': 'works for', 'works for': 'leads',
  'related to': 'related to',
}
