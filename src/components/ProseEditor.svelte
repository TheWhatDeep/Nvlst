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
  import { createMentionPlugin, MentionView } from '../lib/editor/mention.js'
  import { project, emptyDoc } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { liveWords } from '../lib/state/editor.js'
  import { TYPES } from '../lib/core/types.js'
  import { I } from '../lib/core/icons.js'
  import { countWords, debounce } from '../lib/core/util.js'

  export let sceneId

  let host
  let view = null
  let saveD = null
  let unsub = null
  let menu = { show: false, left: 0, top: 0, bold: false, italic: false }

  // @-mention autocomplete
  let suggest = null
  let suggestItems = []
  let suggestIndex = 0
  let suggestPos = { left: 0, top: 0 }

  const strong = schema.marks.strong
  const em = schema.marks.em

  function sceneRef(p) {
    for (const c of p.manuscript.chapters) { const s = c.scenes.find((s) => s.id === sceneId); if (s) return s }
    return null
  }
  function loadDoc() {
    const s = sceneRef(get(project))
    const json = s && s.body ? s.body : emptyDoc()
    try { return PMNode.fromJSON(schema, json) } catch (e) { return PMNode.fromJSON(schema, emptyDoc()) }
  }
  function wordsOf(doc) {
    const text = doc.textBetween(0, doc.content.size, ' ', (leaf) =>
      leaf.type.name === 'mention' ? String(leaf.attrs.label || 'ref').replace(/\s+/g, '') || 'ref' : ' ')
    return countWords(text)
  }
  function save(doc) {
    const json = doc.toJSON()
    project.update((p) => { const s = sceneRef(p); if (s) { s.body = json; s._t = Date.now() } return p })
  }
  function markActive(state, type) {
    const sel = state.selection
    if (sel.empty) return !!type.isInSet(state.storedMarks || sel.$from.marks())
    return state.doc.rangeHasMark(sel.from, sel.to, type)
  }
  function refreshMenu(state) {
    const sel = state.selection
    if (suggest || sel.empty || !view || !view.hasFocus()) { if (menu.show) menu = { ...menu, show: false }; return }
    try {
      const a = view.coordsAtPos(sel.from), b = view.coordsAtPos(sel.to)
      menu = { show: true, left: (a.left + b.left) / 2, top: Math.min(a.top, b.top), bold: markActive(state, strong), italic: markActive(state, em) }
    } catch (e) { menu = { ...menu, show: false } }
  }
  function toggle(type) { if (view) { toggleMark(type)(view.state, view.dispatch); view.focus() } }

  // ----- mention suggestion -----
  function onSuggestChange(match, v) {
    if (!match) { if (suggest) { suggest = null; suggestItems = [] } return }
    const q = match.query.toLowerCase()
    const all = get(project).entities.filter((e) => e.name && e.name.trim())
    const items = (q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all)
      .sort((a, b) => {
        const as = a.name.toLowerCase().startsWith(q) ? 0 : 1
        const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1
        return as - bs || a.name.localeCompare(b.name)
      })
      .slice(0, 8)
    let pos = suggestPos
    try { const c = v.coordsAtPos(match.from); pos = { left: c.left, top: c.bottom } } catch (e) {}
    const changed = !suggest || suggest.query !== match.query
    suggest = match; suggestItems = items; suggestPos = pos
    suggestIndex = changed ? 0 : Math.min(suggestIndex, Math.max(0, items.length - 1))
  }
  function onSuggestKeyDown(v, event) {
    if (!suggest) return false
    const n = suggestItems.length
    if (event.key === 'ArrowDown') { if (n) suggestIndex = (suggestIndex + 1) % n; return true }
    if (event.key === 'ArrowUp') { if (n) suggestIndex = (suggestIndex - 1 + n) % n; return true }
    if (event.key === 'Enter' || event.key === 'Tab') { if (n) { insertMention(suggestItems[suggestIndex]); return true } return false }
    if (event.key === 'Escape') { suggest = null; suggestItems = []; return true }
    return false
  }
  function insertMention(entity) {
    if (!view || !suggest) return
    const node = schema.nodes.mention.create({ id: entity.id, label: entity.name || '' })
    const tr = view.state.tr.replaceWith(suggest.from, suggest.to, node)
    tr.insertText(' ')
    view.dispatch(tr)
    suggest = null; suggestItems = []
    view.focus()
  }

  onMount(() => {
    saveD = debounce(save, 600)
    const mentionViews = new Set()
    const mentionCtx = {
      getEntity: (id) => get(project).entities.find((e) => e.id === id) || null,
      onOpen: (id) => ui.update((u) => ({ ...u, selectedEntityId: id, rightPaneOpen: true })),
      register: (v) => mentionViews.add(v),
      unregister: (v) => mentionViews.delete(v),
    }
    const state = EditorState.create({
      doc: loadDoc(),
      plugins: [
        createMentionPlugin({ onChange: onSuggestChange, onKeyDown: onSuggestKeyDown }),
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }),
        keymap({ 'Mod-b': toggleMark(strong), 'Mod-i': toggleMark(em) }),
        keymap(baseKeymap),
        placeholderPlugin('Begin writing…'),
      ],
    })
    view = new EditorView(host, {
      state,
      nodeViews: { mention: (node, v, getPos) => new MentionView(node, v, getPos, mentionCtx) },
      dispatchTransaction(tr) {
        const ns = view.state.apply(tr)
        view.updateState(ns)
        if (tr.docChanged) { liveWords.set(wordsOf(ns.doc)); saveD(ns.doc) }
        refreshMenu(ns)
      },
      handleDOMEvents: {
        blur() { if (menu.show) menu = { ...menu, show: false }; if (suggest) { suggest = null; suggestItems = [] } return false },
      },
    })
    liveWords.set(wordsOf(state.doc))
    // keep mention display names in sync with renames / deletions
    unsub = project.subscribe(() => mentionViews.forEach((v) => v.render()))
  })

  onDestroy(() => {
    if (unsub) unsub()
    const doc = view ? view.state.doc : null
    if (saveD) saveD.cancel()
    if (doc) save(doc)
    if (view) { view.destroy(); view = null }
  })
</script>

<div class="pm-host" bind:this={host}></div>

{#if menu.show}
  <div class="pm-bubble" style="left:{menu.left}px; top:{menu.top}px">
    <button class="pm-b" class:on={menu.bold} title="Bold (Ctrl/Cmd+B)" on:mousedown|preventDefault={() => toggle(strong)}><span class="icon">{@html I.bold}</span></button>
    <button class="pm-b" class:on={menu.italic} title="Italic (Ctrl/Cmd+I)" on:mousedown|preventDefault={() => toggle(em)}><span class="icon">{@html I.italic}</span></button>
  </div>
{/if}

{#if suggest}
  <div class="mention-menu" style="left:{suggestPos.left}px; top:{suggestPos.top}px">
    {#if suggestItems.length}
      {#each suggestItems as item, i (item.id)}
        <button class="mention-item" class:on={i === suggestIndex}
          on:mousedown|preventDefault={() => insertMention(item)}
          on:mouseenter={() => (suggestIndex = i)}>
          <span class="mi-ico icon" style="color:{TYPES[item.type].color}">{@html I[TYPES[item.type].icon]}</span>
          <span class="mi-name">{item.name}</span>
          <span class="mi-type">{TYPES[item.type].name}</span>
        </button>
      {/each}
    {:else}
      <div class="mention-empty">No match{suggest.query ? ` for “@${suggest.query}”` : ''} — add it to the cast first.</div>
    {/if}
  </div>
{/if}
