/* ==========================================================
   PERSISTENCE — browser autosave (local-first).
   Debounced writes to localStorage so closing/reopening the tab
   restores everything. A manual Save flushes immediately.
   (File export/import + manuscript text export arrive in step 7.)
   ========================================================== */
import { writable, get } from 'svelte/store'
import { project, setProject } from './state/project.js'
import { debounce } from './core/util.js'

const KEY = 'nvlist:project:v1'

// 'saved' | 'saving' | 'unsaved'
export const saveStatus = writable({ state: 'saved', at: null })

export function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function writeLocal(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
    saveStatus.set({ state: 'saved', at: Date.now() })
    return true
  } catch (e) {
    saveStatus.set({ state: 'unsaved', at: null })
    return false
  }
}

const debouncedWrite = debounce((p) => writeLocal(p), 800)

/* Load any saved project into the store (call before initAutosave). */
export function restoreLocal() {
  const data = loadLocal()
  if (data) { setProject(data); return true }
  return false
}

/* Flush hooks — components holding unsaved state outside the store
   (the ProseMirror editor's pending debounce) register here so that
   ANY full save drains them into the store first. */
const flushHooks = new Set()
export function onFlush(fn) {
  flushHooks.add(fn)
  return () => flushHooks.delete(fn)
}

let started = false
export function initAutosave() {
  if (started) return
  started = true
  let first = true
  project.subscribe((p) => {
    if (first) { first = false; return } // skip the value present at subscribe time
    saveStatus.set({ state: 'saving', at: get(saveStatus).at })
    debouncedWrite(p)
  })
  // Without these, closing the window inside the debounce windows
  // (editor 600ms + store 800ms) silently drops the last keystrokes.
  window.addEventListener('beforeunload', () => saveNow())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveNow()
  })
}

/* Flush immediately (Save button, window close, tab hide). Drains
   editor flush hooks first so in-flight prose reaches the store. */
export function saveNow() {
  for (const fn of flushHooks) { try { fn() } catch (e) {} }
  debouncedWrite.cancel()
  return writeLocal(get(project))
}
