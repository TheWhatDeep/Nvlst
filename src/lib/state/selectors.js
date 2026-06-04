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
