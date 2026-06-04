/* ==========================================================
   MANUSCRIPT ACTIONS — mutate the project store, then notify.
   (CODEX's pattern: act on state + give typed feedback; here
   the re-render is automatic via store reactivity.)
   ========================================================== */
import { get } from 'svelte/store'
import { project, newChapter, newScene } from './project.js'
import { ui } from './ui.js'
import { notify } from '../notify.js'
import { findScene, sceneWords } from './selectors.js'

export function addChapter({ withScene = false } = {}) {
  const ch = newChapter()
  let firstScene = null
  if (withScene) { firstScene = newScene(); ch.scenes.push(firstScene) }
  project.update((p) => { p.manuscript.chapters.push(ch); return p })
  if (firstScene) ui.update((u) => ({ ...u, selectedSceneId: firstScene.id }))
  notify(withScene ? 'New chapter started.' : 'Chapter added.', 'success')
  return ch
}

export function addScene(chapterId) {
  const sc = newScene()
  let ok = false
  project.update((p) => {
    const ch = p.manuscript.chapters.find((c) => c.id === chapterId)
    if (ch) { ch.scenes.push(sc); ok = true }
    return p
  })
  if (!ok) return null
  ui.update((u) => ({ ...u, selectedSceneId: sc.id }))
  notify('Scene added.', 'success')
  return sc
}

export function renameChapter(id, title) {
  project.update((p) => {
    const c = p.manuscript.chapters.find((c) => c.id === id)
    if (c) c.title = (title || '').trim() || 'Untitled Chapter'
    return p
  })
}

export function renameScene(id, title) {
  project.update((p) => {
    for (const c of p.manuscript.chapters) {
      const s = c.scenes.find((s) => s.id === id)
      if (s) { s.title = (title || '').trim() || 'Untitled Scene'; s._t = Date.now(); break }
    }
    return p
  })
}

export function deleteChapter(id) {
  const ch = get(project).manuscript.chapters.find((c) => c.id === id)
  if (!ch) return
  const n = ch.scenes.length
  // confirm only on genuine data loss (a chapter that holds scenes)
  if (n && !confirm(`Delete “${ch.title}” and its ${n} scene${n > 1 ? 's' : ''}? This can't be undone.`)) return
  const selGone = ch.scenes.some((s) => s.id === get(ui).selectedSceneId)
  project.update((p) => { p.manuscript.chapters = p.manuscript.chapters.filter((c) => c.id !== id); return p })
  if (selGone) ui.update((u) => ({ ...u, selectedSceneId: null }))
  notify(`Deleted “${ch.title}”.`, 'info')
}

export function deleteScene(id) {
  const loc = findScene(get(project), id)
  if (!loc) return
  const { scene, chapter } = loc
  const w = sceneWords(scene)
  if (w > 0 && !confirm(`Delete “${scene.title}”? It has ${w} word${w > 1 ? 's' : ''}. This can't be undone.`)) return
  project.update((p) => {
    const c = p.manuscript.chapters.find((c) => c.id === chapter.id)
    if (c) c.scenes = c.scenes.filter((s) => s.id !== id)
    return p
  })
  if (get(ui).selectedSceneId === id) ui.update((u) => ({ ...u, selectedSceneId: null }))
  notify(`Deleted “${scene.title}”.`, 'info')
}

function reorder(arr, id, dir) {
  const i = arr.findIndex((x) => x.id === id)
  if (i < 0) return
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  const [item] = arr.splice(i, 1)
  arr.splice(j, 0, item)
}

export function moveChapter(id, dir) {
  project.update((p) => { reorder(p.manuscript.chapters, id, dir); return p })
}

export function moveScene(chapterId, id, dir) {
  project.update((p) => {
    const c = p.manuscript.chapters.find((c) => c.id === chapterId)
    if (c) reorder(c.scenes, id, dir)
    return p
  })
}

export function selectScene(id) {
  ui.update((u) => ({ ...u, selectedSceneId: id }))
}
