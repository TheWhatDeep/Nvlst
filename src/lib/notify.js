/* ==========================================================
   NOTIFY & GUARD  (ported verbatim in spirit from CODEX)
   All user feedback routes through notify(message, kind).
   guard(condition, message, kind) validates actions and explains
   blocks. Never use alert(). kind = success | warn | error | info.
   ========================================================== */
import { writable } from 'svelte/store'
import { uid } from './core/util.js'

export const notes = writable([]) // [{ id, msg, kind }]

const TTL = { error: 5200, warn: 4200, success: 2600, info: 2200 }

/* Returns false for convenience inside guards. */
export function notify(msg, kind = 'success', opts = {}) {
  const id = uid('n')
  notes.update((list) => {
    const next = [...list, { id, msg, kind }]
    return next.length > 4 ? next.slice(next.length - 4) : next // cap at 4, drop oldest
  })
  const ttl = opts.ttl ?? TTL[kind] ?? 2600
  if (ttl > 0) setTimeout(() => dismiss(id), ttl)
  return false
}

export function dismiss(id) {
  notes.update((list) => list.filter((n) => n.id !== id))
}

/* if condition is falsy, notify and return false:
     if (!guard(name, 'Name it first', 'warn')) return */
export function guard(condition, message, kind = 'warn') {
  if (condition) return true
  notify(message, kind)
  return false
}
