/* ==========================================================
   CONTINUITY CHECK — zero-AI rules engine over the project.
   Surfaces structural inconsistencies you can fix manually:
   broken @-mentions, dangling cast pins, duplicate names,
   self-referencing relationships, missing reciprocals, orphan
   entities. Pure function; no side effects.
   ==========================================================
   Output shape:
     { issues: Issue[], summary: { error, warn, info } }
   Issue:
     { id, kind, severity:'error'|'warn'|'info', title, detail,
       locations: Location[] }
   Location:
     { kind:'scene', chapterId, sceneId, label }
   | { kind:'entity', entityId, label }
   ========================================================== */
import { INVERSE } from '../core/types.js'
import { collectMentionIds } from '../state/selectors.js'

let _id = 0
const nextId = () => `iss-${++_id}`

const sceneLoc = (chapter, scene) => ({
  kind: 'scene',
  chapterId: chapter.id,
  sceneId: scene.id,
  label: `${chapter.title || 'Untitled chapter'} — ${scene.title || 'Untitled scene'}`,
})

const entityLoc = (entity) => ({
  kind: 'entity',
  entityId: entity.id,
  label: entity.name || 'Unnamed entity',
})

/* Walk a ProseMirror body and return the broken mention nodes
   (those whose entity id is not in the active id set). Keeps each
   broken mention's frozen label so we can name the missing entity. */
function collectBrokenMentions(node, idSet, out = []) {
  if (!node) return out
  if (node.type === 'mention' && node.attrs) {
    const id = node.attrs.id
    if (id && !idSet.has(id)) out.push({ id, label: node.attrs.label || '?' })
  }
  if (Array.isArray(node.content)) for (const c of node.content) collectBrokenMentions(c, idSet, out)
  return out
}

/* ---------- individual checks ---------- */

function checkBrokenMentionsAndDanglingPins(project, idSet) {
  const issues = []
  for (const ch of project.manuscript.chapters) {
    for (const sc of ch.scenes) {
      // Broken @-mentions (mention nodes pointing to deleted entities)
      const broken = collectBrokenMentions(sc.body, idSet)
      if (broken.length) {
        const names = [...new Set(broken.map((b) => `"${b.label}"`))].slice(0, 4)
        const tail = broken.length > 4 ? ` and ${broken.length - 4} more` : ''
        issues.push({
          id: nextId(),
          kind: 'broken_mention',
          severity: 'error',
          title: `${broken.length} broken @-mention${broken.length > 1 ? 's' : ''}`,
          detail: `This scene still references ${names.join(', ')}${tail} — entities that no longer exist. The fix unlinks them and keeps each name as plain text in your prose.`,
          locations: [sceneLoc(ch, sc)],
          fix: { kind: 'remove_broken_mentions', label: 'Remove broken mentions', sceneId: sc.id },
        })
      }
      // Dangling cast pins (scene.cast ids no longer in the entity list)
      const pins = (sc.cast || []).filter((id) => !idSet.has(id))
      if (pins.length) {
        issues.push({
          id: nextId(),
          kind: 'dangling_pin',
          severity: 'error',
          title: `${pins.length} dangling cast pin${pins.length > 1 ? 's' : ''}`,
          detail: 'This scene is pinned to entities that no longer exist.',
          locations: [sceneLoc(ch, sc)],
          fix: { kind: 'clear_dangling_pins', label: 'Clear dangling pins', sceneId: sc.id },
        })
      }
    }
  }
  return issues
}

function checkDuplicateNames(project) {
  const issues = []
  const groups = new Map() // lowercase-trimmed-name → entity[]
  for (const e of project.entities) {
    const key = (e.name || '').trim().toLowerCase()
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(e)
  }
  for (const [, ents] of groups) {
    if (ents.length > 1) {
      issues.push({
        id: nextId(),
        kind: 'duplicate_name',
        severity: 'warn',
        title: `Duplicate name: "${ents[0].name}"`,
        detail: `${ents.length} entities share this name. Rename one to disambiguate, or merge them by moving links and deleting the duplicate.`,
        locations: ents.map(entityLoc),
      })
    }
  }
  return issues
}

function checkSelfRels(project) {
  const issues = []
  for (const e of project.entities) {
    if (!Array.isArray(e.rels)) continue
    if (e.rels.some((r) => r.target === e.id)) {
      issues.push({
        id: nextId(),
        kind: 'self_rel',
        severity: 'warn',
        title: `Self-referencing relationship: "${e.name || 'Unnamed'}"`,
        detail: 'This entity is in a relationship with itself.',
        locations: [entityLoc(e)],
        fix: { kind: 'remove_self_rels', label: 'Remove self-link', entityId: e.id },
      })
    }
  }
  return issues
}

function checkMissingInverses(project) {
  const issues = []
  const byId = new Map(project.entities.map((e) => [e.id, e]))
  for (const e of project.entities) {
    if (!Array.isArray(e.rels)) continue
    for (const r of e.rels) {
      const inv = INVERSE[r.type]
      if (!inv) continue
      const target = byId.get(r.target)
      if (!target) continue // dangling target — caught by another check if relevant
      const hasBack = (target.rels || []).some((rr) => rr.type === inv && rr.target === e.id)
      if (!hasBack) {
        issues.push({
          id: nextId(),
          kind: 'missing_inverse',
          severity: 'info',
          title: `Missing reciprocal: "${e.name}" → "${target.name}"`,
          detail: `${e.name || 'This entity'} is recorded as ${r.type} ${target.name || 'the target'}, but the reverse link (${inv}) is missing.`,
          locations: [entityLoc(e), entityLoc(target)],
          fix: { kind: 'add_reciprocal', label: 'Add reciprocal', sourceId: e.id, targetId: target.id, relType: r.type },
        })
      }
    }
  }
  return issues
}

function checkOrphans(project) {
  const issues = []
  // "Used" = mentioned in any scene, pinned to any scene, or targeted by another entity's rel.
  // Outgoing rels do NOT count — an entity with only outgoing connections still has nothing
  // pointing TO it, which is the textbook orphan pattern.
  const used = new Set()
  for (const ch of project.manuscript.chapters) {
    for (const sc of ch.scenes) {
      for (const id of collectMentionIds(sc.body)) used.add(id)
      for (const id of sc.cast || []) used.add(id)
    }
  }
  for (const e of project.entities) {
    if (!Array.isArray(e.rels)) continue
    for (const r of e.rels) used.add(r.target)
  }
  for (const e of project.entities) {
    if (used.has(e.id)) continue
    // Skip nameless newly-created entities — they're WIP, not orphans.
    if (!(e.name || '').trim()) continue
    issues.push({
      id: nextId(),
      kind: 'orphan',
      severity: 'info',
      title: `Unused entity: "${e.name}"`,
      detail: 'This entity is never mentioned in prose, pinned to a scene, or linked from another entity. It may be dead weight you can delete — or one you simply haven\'t woven in yet.',
      locations: [entityLoc(e)],
      fix: { kind: 'delete_orphan', label: 'Delete entity', entityId: e.id },
    })
  }
  return issues
}

/* ---------- entry point ---------- */

const SEVERITY_ORDER = { error: 0, warn: 1, info: 2 }

export function runContinuityCheck(project) {
  _id = 0
  const idSet = new Set(project.entities.map((e) => e.id))
  const issues = [
    ...checkBrokenMentionsAndDanglingPins(project, idSet),
    ...checkDuplicateNames(project),
    ...checkSelfRels(project),
    ...checkMissingInverses(project),
    ...checkOrphans(project),
  ]
  issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
  const summary = { error: 0, warn: 0, info: 0 }
  for (const i of issues) summary[i.severity]++
  return { issues, summary }
}
