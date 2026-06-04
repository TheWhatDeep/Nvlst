<script>
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { EditorState } from 'prosemirror-state'
  import { EditorView } from 'prosemirror-view'
  import { Node as PMNode } from 'prosemirror-model'
  import { keymap } from 'prosemirror-keymap'
  import { baseKeymap, toggleMark } from 'prosemirror-commands'
  import { history, undo, redo } from 'prosemirror-history'
  import { schema, placeholderPlugin } from '../lib/editor/schema.js'
  import { project, emptyDoc } from '../lib/state/project.js'
  import { liveWords } from '../lib/state/editor.js'
  import { I } from '../lib/core/icons.js'
  import { countWords, debounce } from '../lib/core/util.js'

  export let sceneId

  let host
  let view = null
  let saveD = null
  let menu = { show: false, left: 0, top: 0, bold: false, italic: false }

  const strong = schema.marks.strong
  const em = schema.marks.em

  function sceneRef(p) {
    for (const c of p.manuscript.chapters) {
      const s = c.scenes.find((s) => s.id === sceneId)
      if (s) return s
    }
    return null
  }
  function loadDoc() {
    const s = sceneRef(get(project))
    const json = s && s.body ? s.body : emptyDoc()
    try { return PMNode.fromJSON(schema, json) } catch (e) { return PMNode.fromJSON(schema, emptyDoc()) }
  }
  function wordsOf(doc) { return countWords(doc.textBetween(0, doc.content.size, ' ', ' ')) }
  function save(doc) {
    const json = doc.toJSON()
    project.update((p) => {
      const s = sceneRef(p)
      if (s) { s.body = json; s._t = Date.now() }
      return p
    })
  }
  function markActive(state, type) {
    const sel = state.selection
    // NB: access sel.$from as a member — a bare `$from` local would be read
    // by the Svelte compiler as a store auto-subscription.
    if (sel.empty) return !!type.isInSet(state.storedMarks || sel.$from.marks())
    return state.doc.rangeHasMark(sel.from, sel.to, type)
  }
  function refreshMenu(state) {
    const sel = state.selection
    if (sel.empty || !view || !view.hasFocus()) { if (menu.show) menu = { ...menu, show: false }; return }
    try {
      const a = view.coordsAtPos(sel.from)
      const b = view.coordsAtPos(sel.to)
      menu = {
        show: true,
        left: (a.left + b.left) / 2,
        top: Math.min(a.top, b.top),
        bold: markActive(state, strong),
        italic: markActive(state, em),
      }
    } catch (e) { menu = { ...menu, show: false } }
  }
  function toggle(type) {
    if (!view) return
    toggleMark(type)(view.state, view.dispatch)
    view.focus()
  }

  onMount(() => {
    saveD = debounce(save, 600)
    const state = EditorState.create({
      doc: loadDoc(),
      plugins: [
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }),
        keymap({ 'Mod-b': toggleMark(strong), 'Mod-i': toggleMark(em) }),
        keymap(baseKeymap),
        placeholderPlugin('Begin writing…'),
      ],
    })
    view = new EditorView(host, {
      state,
      dispatchTransaction(tr) {
        const ns = view.state.apply(tr)
        view.updateState(ns)
        if (tr.docChanged) { liveWords.set(wordsOf(ns.doc)); saveD(ns.doc) }
        refreshMenu(ns)
      },
      handleDOMEvents: {
        blur() { if (menu.show) menu = { ...menu, show: false }; return false },
      },
    })
    liveWords.set(wordsOf(state.doc))
  })

  onDestroy(() => {
    const doc = view ? view.state.doc : null
    if (saveD) saveD.cancel()
    if (doc) save(doc) // final flush — never lose prose on scene switch / unmount
    if (view) { view.destroy(); view = null }
  })
</script>

<div class="pm-host" bind:this={host}></div>

{#if menu.show}
  <div class="pm-bubble" style="left:{menu.left}px; top:{menu.top}px">
    <button class="pm-b" class:on={menu.bold} title="Bold (Ctrl/Cmd+B)" on:mousedown|preventDefault={() => toggle(strong)}>
      <span class="icon">{@html I.bold}</span>
    </button>
    <button class="pm-b" class:on={menu.italic} title="Italic (Ctrl/Cmd+I)" on:mousedown|preventDefault={() => toggle(em)}>
      <span class="icon">{@html I.italic}</span>
    </button>
  </div>
{/if}
