/* ==========================================================
   GLOBAL KEYBOARD SHORTCUTS — modifier combos only, so they're
   not triggered by ordinary typing.
     Ctrl/Cmd + Enter      new scene
     Ctrl/Cmd + K          focus the cast search
     Ctrl/Cmd + Shift + L  toggle light / dark
     Escape                close the inspector (when not typing)
   ========================================================== */
import { get } from 'svelte/store'
import { project } from './state/project.js'
import { ui } from './state/ui.js'
import { toggleTheme } from './theme.js'
import { addChapter, addScene } from './state/actions.js'

function newScene() {
  const chapters = get(project).manuscript.chapters
  if (!chapters.length) { addChapter({ withScene: true }); return }
  // add to the chapter holding the current scene, else the last chapter
  const sel = get(ui).selectedSceneId
  let chId = chapters[chapters.length - 1].id
  if (sel) for (const ch of chapters) if (ch.scenes.some((s) => s.id === sel)) { chId = ch.id; break }
  addScene(chId)
}

function focusSearch() {
  ui.update((u) => ({ ...u, rightPaneOpen: true, selectedEntityId: null }))
  setTimeout(() => { const el = document.querySelector('.ent-search input'); if (el) el.focus() }, 40)
}

export function initShortcuts() {
  const handler = (e) => {
    const mod = e.ctrlKey || e.metaKey
    if (mod && !e.shiftKey && e.key === 'Enter') { e.preventDefault(); newScene(); return }
    if (mod && !e.shiftKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); focusSearch(); return }
    if (mod && e.shiftKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); toggleTheme(); return }
    if (e.key === 'Escape') {
      const t = e.target
      const typing = t && ((t.matches && t.matches('input, textarea, select')) || t.isContentEditable)
      if (!typing && get(ui).selectedEntityId) ui.update((u) => ({ ...u, selectedEntityId: null }))
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}
