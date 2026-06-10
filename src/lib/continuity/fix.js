/* ==========================================================
   CONTINUITY FIXES — one-click repairs paired to the issue
   descriptors emitted by check.js. Each fix mutates the
   project store and notifies the user. No confirms: every
   fix here is either additive (add_reciprocal) or strictly
   removes structure that the check has just proven to be
   broken/orphaned/redundant.
   ========================================================== */
import { project } from '../state/project.js'
import { INVERSE } from '../core/types.js'
import { notify } from '../notify.js'

/* ---------- broken @-mentions ----------
   Walk the scene's ProseMirror body and replace every mention
   node whose entity id is no longer present with a plain text
   node containing the mention's frozen label. This unlinks
   the broken @ but preserves the reader-visible name. */
function walkAndRepairMentions(node, idSet, counter) {
  if (!node) return node
  if (!Array.isArray(node.content)) return node
  const newContent = []
  for (const c of node.content) {
    if (c.type === 'mention' && c.attrs && !idSet.has(c.attrs.id)) {
      const label = c.attrs.label || ''
      if (label) {
        // Merge into a preceding unmarked text node if we can, so
        // the prose flows as one continuous run.
        const last = newContent[newContent.length - 1]
        if (last && last.type === 'text' && !last.marks) {
          last.text += label
        } else {
          newContent.push({ type: 'text', text: label })
        }
      }
      counter.n++
    } else {
      newContent.push(walkAndRepairMentions(c, idSet, counter))
    }
  }
  return { ...node, content: newContent }
}

export function repairBrokenMentions(sceneId) {
  const counter = { n: 0 }
  project.update((p) => {
    const idSet = new Set(p.entities.map((e) => e.id))
    for (const ch of p.manuscript.chapters) {
      for (const sc of ch.scenes) {
        if (sc.id !== sceneId) continue
        sc.body = walkAndRepairMentions(sc.body, idSet, counter)
        sc._t = Date.now()
      }
    }
    return p
  })
  if (counter.n) notify(`Removed ${counter.n} broken @-mention${counter.n > 1 ? 's' : ''}.`, 'success')
  return counter.n
}

/* ---------- dangling cast pins ---------- */
export function clearDanglingPins(sceneId) {
  let removed = 0
  project.update((p) => {
    const idSet = new Set(p.entities.map((e) => e.id))
    for (const ch of p.manuscript.chapters) {
      for (const sc of ch.scenes) {
        if (sc.id !== sceneId) continue
        const before = (sc.cast || []).length
        sc.cast = (sc.cast || []).filter((id) => idSet.has(id))
        removed = before - sc.cast.length
      }
    }
    return p
  })
  if (removed) notify(`Cleared ${removed} dangling cast pin${removed > 1 ? 's' : ''}.`, 'success')
  return removed
}

/* ---------- self-referencing relationships ---------- */
export function removeSelfRels(entityId) {
  let removed = 0
  let name = ''
  project.update((p) => {
    const e = p.entities.find((x) => x.id === entityId)
    if (!e || !Array.isArray(e.rels)) return p
    name = e.name || 'entity'
    const before = e.rels.length
    e.rels = e.rels.filter((r) => r.target !== entityId)
    removed = before - e.rels.length
    if (removed) e._t = Date.now()
    return p
  })
  if (removed) notify(`Removed ${removed} self-link${removed > 1 ? 's' : ''} on "${name}".`, 'success')
  return removed
}

/* ---------- missing reciprocal ----------
   The source-side rel must still exist for this to be meaningful;
   if it doesn't, we silently no-op (the issue is already stale). */
export function addReciprocal(sourceId, targetId, relType) {
  const inv = INVERSE[relType]
  if (!inv) return false
  let added = false
  let targetName = ''
  project.update((p) => {
    const source = p.entities.find((x) => x.id === sourceId)
    const target = p.entities.find((x) => x.id === targetId)
    if (!source || !target) return p
    if (!Array.isArray(source.rels) || !source.rels.some((r) => r.type === relType && r.target === targetId)) return p
    target.rels = target.rels || []
    if (target.rels.some((r) => r.type === inv && r.target === sourceId)) return p
    target.rels.push({ type: inv, target: sourceId })
    target._t = Date.now()
    targetName = target.name || 'target'
    added = true
    return p
  })
  if (added) notify(`Added reciprocal "${inv}" on "${targetName}".`, 'success')
  return added
}

/* ---------- delete orphan ----------
   By definition of the orphan check, this entity has zero inbound
   references (no @-mention, no pin, no incoming rel). It MAY have
   outbound rels of its own — clean those targets' inverses on the
   way out, mirroring deleteEntity's cascade. */
export function deleteOrphan(entityId) {
  let deletedName = ''
  project.update((p) => {
    const e = p.entities.find((x) => x.id === entityId)
    if (!e) return p
    deletedName = e.name || 'entity'
    // Drop the entity
    p.entities = p.entities.filter((x) => x.id !== entityId)
    // Cascade: clear any inverse rels other entities may hold pointing here
    // (orphan check guarantees there are none, but staying defensive keeps
    // the data clean if upstream invariants ever drift).
    for (const o of p.entities) if (Array.isArray(o.rels)) o.rels = o.rels.filter((r) => r.target !== entityId)
    return p
  })
  if (deletedName) notify(`Deleted "${deletedName}".`, 'info')
  return true
}

/* ---------- dispatcher ----------
   Single switch so the modal can stay declarative — give it an
   issue.fix object, get the right action. */
export function applyFix(fix) {
  if (!fix) return
  switch (fix.kind) {
    case 'remove_broken_mentions': return repairBrokenMentions(fix.sceneId)
    case 'clear_dangling_pins':    return clearDanglingPins(fix.sceneId)
    case 'remove_self_rels':       return removeSelfRels(fix.entityId)
    case 'add_reciprocal':         return addReciprocal(fix.sourceId, fix.targetId, fix.relType)
    case 'delete_orphan':          return deleteOrphan(fix.entityId)
    default: return null
  }
}
