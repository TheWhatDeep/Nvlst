/* ==========================================================
   @-mention support for the ProseMirror editor.
   - getMentionMatch: detect a trailing "@query" at the cursor.
   - createMentionPlugin: notifies the component of suggestion
     state and lets it intercept arrow/enter/escape keys.
   - MentionView: a NodeView that resolves the entity's *current*
     name at render time (so renames update) and degrades to a
     "broken" state if the entity was deleted.
   ========================================================== */
import { Plugin, PluginKey } from 'prosemirror-state'

export const mentionKey = new PluginKey('mentionSuggest')

/* Trailing "@query" where query has no spaces and @ sits at a word
   boundary. Returns { from, to, query } or null. */
export function getMentionMatch(state) {
  const sel = state.selection
  if (!sel.empty) return null
  const $from = sel.$from
  if (!$from.parent.isTextblock) return null
  const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼')
  const m = /(?:^|\s)@([^\s@]*)$/.exec(textBefore)
  if (!m) return null
  const query = m[1]
  return { from: sel.from - query.length - 1, to: sel.from, query }
}

export function createMentionPlugin({ onChange, onKeyDown }) {
  return new Plugin({
    key: mentionKey,
    view() {
      return {
        update(view) { onChange(getMentionMatch(view.state), view) },
        destroy() { onChange(null, null) },
      }
    },
    props: {
      handleKeyDown(view, event) { return onKeyDown(view, event) },
    },
  })
}

export class MentionView {
  constructor(node, view, getPos, ctx) {
    this.node = node
    this.ctx = ctx // { getEntity, onOpen, register, unregister }
    const dom = document.createElement('span')
    dom.className = 'mention'
    dom.setAttribute('data-entity-id', node.attrs.id)
    dom.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      ctx.onOpen(node.attrs.id)
    })
    this.dom = dom
    this.render()
    ctx.register(this)
  }
  render() {
    const ent = this.ctx.getEntity(this.node.attrs.id)
    const name = ent ? ent.name || '(unnamed)' : this.node.attrs.label || 'unknown'
    this.dom.textContent = '@' + name
    this.dom.classList.toggle('broken', !ent)
    this.dom.title = ent ? `${name} — open in the cast` : 'This entity was deleted'
  }
  update(node) {
    if (node.type !== this.node.type) return false
    this.node = node
    this.render()
    return true
  }
  selectNode() { this.dom.classList.add('sel') }
  deselectNode() { this.dom.classList.remove('sel') }
  ignoreMutation() { return true }
  destroy() { this.ctx.unregister(this) }
}
