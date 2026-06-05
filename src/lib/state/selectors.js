/* ==========================================================
   SELECTORS — derived lookups over the project (pure functions).
   ========================================================== */
import { docWordCount } from '../core/util.js'

/* find a scene by id, returning { scene, chapter } or null */
export function findScene(project, id) {
  if (!id || !project) return null
  for (const ch of project.manuscript.chapters) {
    const sc = ch.scenes.find((s) => s.id === id)
    if (sc) return { scene: sc, chapter: ch }
  }
  return null
}

export function sceneWords(scene) {
  return scene ? docWordCount(scene.body) : 0
}

export function chapterWords(chapter) {
  return (chapter?.scenes || []).reduce((n, s) => n + docWordCount(s.body), 0)
}

export function manuscriptWords(project) {
  return (project?.manuscript?.chapters || []).reduce((n, c) => n + chapterWords(c), 0)
}

export function sceneCount(project) {
  return (project?.manuscript?.chapters || []).reduce((n, c) => n + c.scenes.length, 0)
}

/* ---------- entities ---------- */

export function entityById(project, id) {
  if (!id || !project) return null
  return project.entities.find((e) => e.id === id) || null
}

/* walk a ProseMirror JSON doc collecting @-mention entity ids (used from step 5) */
export function collectMentionIds(node, out = new Set()) {
  if (!node) return out
  if (node.type === 'mention' && node.attrs && node.attrs.id) out.add(node.attrs.id)
  if (Array.isArray(node.content)) for (const c of node.content) collectMentionIds(c, out)
  return out
}
export function sceneMentionIds(scene) {
  return [...collectMentionIds(scene && scene.body)]
}

/* count references to an entity: relationship links from other entities,
   and scenes that use it (via cast or @-mention). Drives the delete guard. */
export function entityRefs(project, id) {
  let rels = 0
  for (const e of project.entities) {
    if (e.id === id) continue
    for (const r of e.rels || []) if (r.target === id) rels++
  }
  let scenes = 0
  for (const ch of project.manuscript.chapters) {
    for (const sc of ch.scenes) {
      const inCast = (sc.cast || []).includes(id)
      const inProse = collectMentionIds(sc.body).has(id)
      if (inCast || inProse) scenes++
    }
  }
  return { rels, scenes }
}

export function typeCounts(project) {
  const counts = {}
  for (const e of project.entities) counts[e.type] = (counts[e.type] || 0) + 1
  return counts
}
