/* ==========================================================
   ProseMirror schema — deliberately minimal (spec §5.3):
   paragraphs + bold + italic. The restricted schema also IS our
   paste sanitizer: PM parses pasted HTML through these rules and
   drops anything not represented here (scripts, styles, images,
   headings, etc.). The inline @-mention node is added in step 5.
   ========================================================== */
import { Schema } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      group: 'block',
      content: 'inline*',
      parseDOM: [{ tag: 'p' }],
      toDOM() { return ['p', 0] },
    },
    text: { group: 'inline' },
    mention: {
      inline: true,
      group: 'inline',
      atom: true,
      selectable: true,
      draggable: false,
      attrs: { id: {}, label: { default: '' } },
      toDOM(node) {
        return ['span', { class: 'mention', 'data-entity-id': node.attrs.id, 'data-label': node.attrs.label }, '@' + (node.attrs.label || '')]
      },
      parseDOM: [{
        tag: 'span.mention[data-entity-id]',
        getAttrs(dom) {
          return { id: dom.getAttribute('data-entity-id'), label: dom.getAttribute('data-label') || (dom.textContent || '').replace(/^@/, '') }
        },
      }],
    },
  },
  marks: {
    strong: {
      parseDOM: [
        { tag: 'strong' },
        { tag: 'b', getAttrs: (node) => node.style.fontWeight !== 'normal' && null },
        { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null },
      ],
      toDOM() { return ['strong', 0] },
    },
    em: {
      parseDOM: [
        { tag: 'em' },
        { tag: 'i' },
        { style: 'font-style', getAttrs: (value) => value === 'italic' && null },
      ],
      toDOM() { return ['em', 0] },
    },
  },
})

/* show ghost placeholder text while the doc is a single empty paragraph */
export function placeholderPlugin(text) {
  return new Plugin({
    props: {
      decorations(state) {
        const doc = state.doc
        if (doc.childCount === 1 && doc.firstChild.isTextblock && doc.firstChild.content.size === 0) {
          return DecorationSet.create(doc, [
            Decoration.node(0, doc.firstChild.nodeSize, { class: 'is-empty', 'data-placeholder': text }),
          ])
        }
        return DecorationSet.empty
      },
    },
  })
}
