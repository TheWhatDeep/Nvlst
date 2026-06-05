/* ==========================================================
   MANUSCRIPT ACTIONS — mutate the project store, then notify.
   (CODEX's pattern: act on state + give typed feedback; here
   the re-render is automatic via store reactivity.)
   ========================================================== */
import { get } from 'svelte/store'
import { project, newChapter, newScene, newEntity } from './project.js'
import { ui } from './ui.js'
import { notify, guard } from '../notify.js'
import { findScene, sceneWords, entityRefs } from './selectors.js'
import { TYPES, INVERSE } from '../core/types.js'

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

/* ---------- entities ---------- */

export function createEntity(type) {
  const e = newEntity(type)
  project.update((p) => { p.entities.push(e); return p })
  ui.update((u) => ({ ...u, selectedEntityId: e.id }))
  notify(`New ${TYPES[type].name.toLowerCase()} added — name it on the right.`, 'success')
  return e
}

export function updateEntity(id, patch) {
  project.update((p) => {
    const e = p.entities.find((e) => e.id === id)
    if (e) { Object.assign(e, patch); e._t = Date.now() }
    return p
  })
}

export function setField(id, key, value) {
  project.update((p) => {
    const e = p.entities.find((e) => e.id === id)
    if (e) { e.fields = e.fields || {}; e.fields[key] = value; e._t = Date.now() }
    return p
  })
}
export function addField(id, key) {
  key = (key || '').trim()
  if (!guard(key, 'Name the field first (e.g. Age, Role, Origin).', 'warn')) return false
  let ok = false
  project.update((p) => {
    const e = p.entities.find((e) => e.id === id)
    if (e) { e.fields = e.fields || {}; if (!(key in e.fields)) { e.fields[key] = ''; ok = true } }
    return p
  })
  if (!ok) notify(`“${key}” is already a field here.`, 'warn')
  return ok
}
export function removeField(id, key) {
  project.update((p) => { const e = p.entities.find((e) => e.id === id); if (e && e.fields) delete e.fields[key]; return p })
}

export function addTag(id, tag) {
  tag = (tag || '').trim()
  if (!tag) return false
  let ok = false
  project.update((p) => {
    const e = p.entities.find((e) => e.id === id)
    if (e) { e.tags = e.tags || []; if (!e.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) { e.tags.push(tag); ok = true } }
    return p
  })
  return ok
}
export function removeTag(id, index) {
  project.update((p) => { const e = p.entities.find((e) => e.id === id); if (e && e.tags) e.tags.splice(index, 1); return p })
}

export function addRel(id, type, targetId) {
  if (!guard(targetId, 'Choose an entity to link to first.', 'warn')) return
  project.update((p) => {
    const e = p.entities.find((x) => x.id === id)
    const t = p.entities.find((x) => x.id === targetId)
    if (!e || !t) return p
    e.rels = e.rels || []
    if (e.rels.some((r) => r.type === type && r.target === targetId)) return p
    e.rels.push({ type, target: targetId })
    const inv = INVERSE[type]
    if (inv) { t.rels = t.rels || []; if (!t.rels.some((r) => r.type === inv && r.target === id)) t.rels.push({ type: inv, target: id }) }
    e._t = Date.now()
    return p
  })
}
export function removeRel(id, index) {
  project.update((p) => {
    const e = p.entities.find((x) => x.id === id)
    if (!e || !e.rels) return p
    const r = e.rels[index]
    if (!r) return p
    e.rels.splice(index, 1)
    const inv = INVERSE[r.type]
    if (inv) { const t = p.entities.find((x) => x.id === r.target); if (t && t.rels) t.rels = t.rels.filter((x) => !(x.type === inv && x.target === id)) }
    return p
  })
}

export function deleteEntity(id) {
  const p0 = get(project)
  const e = p0.entities.find((x) => x.id === id)
  if (!e) return
  const { rels, scenes } = entityRefs(p0, id)
  const bits = []
  if (rels) bits.push(`linked from ${rels} ${rels === 1 ? 'entity' : 'entities'}`)
  if (scenes) bits.push(`used in ${scenes} ${scenes === 1 ? 'scene' : 'scenes'}`)
  const tail = bits.length ? ` It's ${bits.join(' and ')} — those references will be cleared.` : ''
  if ((rels || scenes) && !confirm(`Delete “${e.name || 'this entity'}”?${tail}`)) return
  project.update((p) => {
    p.entities = p.entities.filter((x) => x.id !== id)
    for (const o of p.entities) if (o.rels) o.rels = o.rels.filter((r) => r.target !== id)
    for (const ch of p.manuscript.chapters) for (const sc of ch.scenes) if (sc.cast) sc.cast = sc.cast.filter((cid) => cid !== id)
    return p
  })
  if (get(ui).selectedEntityId === id) ui.update((u) => ({ ...u, selectedEntityId: null }))
  notify(`Deleted “${e.name || 'entity'}”.`, 'info')
}
