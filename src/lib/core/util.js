/* ==========================================================
   Small shared helpers — ported from CODEX's core.js.
   ========================================================== */

/* unique id with an optional prefix (e=entity, ch=chapter, sc=scene, n=note) */
export const uid = (p = 'id') =>
  p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3)

/* escape text for safe insertion into HTML strings */
export const esc = (s) =>
  (s == null ? '' : String(s)).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))

/* filename-safe slug */
export const slug = (s) =>
  (s || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'untitled'

/* trailing-edge debounce with cancel() and flush() */
export function debounce(fn, ms = 1000) {
  let t
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
  d.cancel = () => clearTimeout(t)
  d.flush = (...a) => { clearTimeout(t); fn(...a) }
  return d
}

/* word count for a plain string */
export function countWords(text) {
  const t = (text || '').trim()
  return t ? t.split(/\s+/).length : 0
}

/* extract plain text from a ProseMirror-style JSON doc node */
export function docText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  // an @-mention counts as a single word (collapse any spaces in the label)
  if (node.type === 'mention') {
    const l = node.attrs && node.attrs.label ? String(node.attrs.label).replace(/\s+/g, '') : 'ref'
    return ' ' + (l || 'ref') + ' '
  }
  let s = ''
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      s += docText(child)
      // block-level nodes imply a word boundary
      if (child.type === 'paragraph' || child.type === 'heading') s += ' '
    }
  }
  return s
}

/* word count for a ProseMirror-style JSON doc */
export function docWordCount(doc) {
  return countWords(docText(doc))
}
