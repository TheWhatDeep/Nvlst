/* ==========================================================
   SCENE EXTRACTION — read a scene, return story-bible elements.
   Uses the configured OpenAI-compatible provider (chatJSON).
   Output shape (shared with the continuity engine later):
     { entities: [{ name, type, summary }], facts: [{ about, detail }] }
   ========================================================== */
import { get } from 'svelte/store'
import { project } from '../state/project.js'
import { chatJSON } from './client.js'
import { TYPE_KEYS } from '../core/types.js'
import { docText } from '../core/util.js'

const SYSTEM = `You extract story-bible elements from a single scene of a novel. Reply with ONLY a JSON object of this exact shape:
{"entities":[{"name":"","type":"character|place|event|item|group","summary":""}],"facts":[{"about":"","detail":""}]}
Rules:
- entities: the people, places, events, notable items, and groups that appear in THIS scene. Choose the single best type from the five. summary = one short clause.
- facts: concrete details the text states about those entities (a trait, role, relationship, or what happened). about = the entity's name; detail = one short sentence.
- Only include what is explicitly in the text — never invent. Use names exactly as written.
- If a list has nothing, return it empty.`

export async function extractScene(scene) {
  const p = get(project)
  const text = (docText(scene && scene.body) || '').trim()
  if (!text) return { entities: [], facts: [] }

  const known = p.entities.filter((e) => e.name).map((e) => `${e.name} (${e.type})`).join(', ')
  const user = `Known entities so far: ${known || '(none yet)'}\n\nSCENE:\n${text.slice(0, 8000)}`

  const data = await chatJSON({ system: SYSTEM, user })

  const entities = (Array.isArray(data && data.entities) ? data.entities : [])
    .filter((e) => e && e.name && TYPE_KEYS.includes(e.type))
    .map((e) => ({ name: String(e.name).trim(), type: e.type, summary: String(e.summary || '').trim() }))
  const facts = (Array.isArray(data && data.facts) ? data.facts : [])
    .filter((f) => f && f.about && f.detail)
    .map((f) => ({ about: String(f.about).trim(), detail: String(f.detail).trim() }))

  return { entities, facts }
}
