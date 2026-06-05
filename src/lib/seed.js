/* ==========================================================
   SEED DEMO — shown on first run so the app isn't empty.
   Deliberately genre-neutral (a contemporary café vignette),
   covering all five entity types, with @-mentions already in the
   prose and one manually-pinned cast member. Keep in sync with
   newProject() in state/project.js when the model changes (§3).
   ========================================================== */
import { SCHEMA_VERSION } from './state/project.js'

const t = (text) => ({ type: 'text', text })
const mention = (id, label) => ({ type: 'mention', attrs: { id, label } })
const p = (...content) => ({ type: 'paragraph', content })
const doc = (...paras) => ({ type: 'doc', content: paras })

export function seedProject() {
  const now = Date.now()
  const ent = (id, type, name, summary, rels = []) => ({ id, type, name, summary, notes: '', fields: {}, rels, tags: [], _t: now })

  return {
    meta: { title: 'Closing Time', created: now, saved: null, schema: SCHEMA_VERSION, theme: 'light' },
    manuscript: {
      chapters: [
        {
          id: 'ch_one',
          title: 'Chapter One',
          scenes: [
            {
              id: 'sc_1',
              title: 'The Last Customer',
              cast: [],
              _t: now,
              body: doc(
                p(
                  t("The bell over the door hadn't rung in an hour. "),
                  mention('e_mara', 'Mara Quinn'),
                  t(' wiped down the counter of '),
                  mention('e_cafe', 'The Blue Heron Café'),
                  t(' one more time and watched the rain blur the harbour lights.')
                ),
                p(t('Closing time, and still no word about the building.'))
              ),
            },
            {
              id: 'sc_2',
              title: 'After Hours',
              cast: ['e_mara'], // present but unnamed in the prose — pinned by hand
              _t: now,
              body: doc(
                p(
                  mention('e_daniel', 'Daniel Reyes'),
                  t(' stayed past close again, nursing the last of the coffee. On the register sat '),
                  mention('e_watch', "Grandmother's pocket watch"),
                  t(', stopped at 4:11, the way it had been for years.')
                ),
                p(t('“You should head home,” she said. He smiled as if he hadn\'t heard.'))
              ),
            },
          ],
        },
      ],
    },
    entities: [
      ent('e_mara', 'character', 'Mara Quinn', 'Owner of the café, six months into running it alone.', [
        { type: 'knows', target: 'e_daniel' },
        { type: 'member of', target: 'e_circle' },
      ]),
      ent('e_daniel', 'character', 'Daniel Reyes', 'A regular who orders the same thing and never quite leaves on time.', [
        { type: 'knows', target: 'e_mara' },
      ]),
      ent('e_cafe', 'place', 'The Blue Heron Café', 'A corner café on Harbour Street — steamed windows, second-hand chairs.'),
      ent('e_watch', 'item', "Grandmother's pocket watch", 'Stopped at 4:11. Mara keeps it in the register drawer.'),
      ent('e_auction', 'event', 'The Closing Auction', 'The week the building changed hands and everything went up for bid.'),
      ent('e_circle', 'group', "The Tuesday Writers' Circle", 'Five people, one urn of coffee, and a standing reservation in the back booth.', [
        { type: 'contains', target: 'e_mara' },
      ]),
    ],
  }
}
