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
}

/* Flush immediately (used by the Save button). */
export function saveNow() {
  debouncedWrite.cancel()
  return writeLocal(get(project))
}
