/* ==========================================================
   PROJECT STATE  (Nvlst's DB — the CODEX global-state pattern,
   expressed as a Svelte store)

   Two halves, linked by @-mentions (added in later steps):
     • manuscript — chapters → scenes (the prose)
     • entities   — the supporting cast (five universal types)
   ========================================================== */
import { writable } from 'svelte/store'
import { uid } from '../core/util.js'

export const SCHEMA_VERSION = 1

/* an empty ProseMirror-style document (a single empty paragraph) */
export function emptyDoc() {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

export function newScene(title = 'Untitled Scene') {
  return { id: uid('sc'), title, body: emptyDoc(), cast: [], _t: Date.now() }
}
export function newChapter(title = 'Untitled Chapter') {
  return { id: uid('ch'), title, scenes: [] }
}
export function newEntity(type) {
  return { id: uid('e'), type, name: '', summary: '', notes: '', fields: {}, rels: [], tags: [], _t: Date.now() }
}

/* the "new project" factory — keep in sync with the seed (spec §3/§7) */
export function newProject() {
  return {
    meta: {
      title: 'Untitled Manuscript',
      created: Date.now(),
      saved: null,
      schema: SCHEMA_VERSION,
      theme: 'light',
      font: 'editorial',
    },
    manuscript: { chapters: [] }, // [{ id, title, scenes: [{ id, title, body, cast, _t }] }]
    entities: [],                 // [{ id, type, name, summary, notes, fields, rels, tags, _t }]
  }
}

/* merge loaded/imported data over defaults — back-compat on load,
   mirroring CODEX's Object.assign(newWorld(), data) */
export function migrate(data) {
  const base = newProject()
  if (!data || typeof data !== 'object') return base
  return {
    meta: { ...base.meta, ...(data.meta || {}) },
    manuscript: { chapters: Array.isArray(data?.manuscript?.chapters) ? data.manuscript.chapters : [] },
    entities: Array.isArray(data.entities) ? data.entities : [],
  }
}

/* the global project store — Nvlst's DB */
export const project = writable(newProject())

/* replace the whole project (used by load / import) */
export function setProject(data) {
  project.set(migrate(data))
}
