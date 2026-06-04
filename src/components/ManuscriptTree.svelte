<script>
  import { tick } from 'svelte'
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { I } from '../lib/core/icons.js'
  import { chapterWords, sceneWords } from '../lib/state/selectors.js'
  import * as A from '../lib/state/actions.js'

  let collapsed = {} // chapterId -> true if collapsed
  let editingId = null
  let editingValue = ''

  $: chapters = $project.manuscript.chapters

  const toggle = (id) => (collapsed = { ...collapsed, [id]: !collapsed[id] })

  async function startRename(id, current) {
    editingId = id
    editingValue = current
    await tick()
    const el = document.getElementById('rename-' + id)
    if (el) { el.focus(); el.select() }
  }
  function commitRename(kind) {
    if (editingId == null) return
    if (kind === 'chapter') A.renameChapter(editingId, editingValue)
    else A.renameScene(editingId, editingValue)
    editingId = null
    editingValue = ''
  }
  const cancelRename = () => { editingId = null; editingValue = '' }
  function onRenameKey(e, kind) {
    if (e.key === 'Enter') { e.preventDefault(); commitRename(kind) }
    else if (e.key === 'Escape') { e.preventDefault(); cancelRename() }
  }

  function addSceneTo(chId) {
    A.addScene(chId)
    collapsed = { ...collapsed, [chId]: false }
  }
  function begin() {
    const ch = A.addChapter({ withScene: true })
    collapsed = { ...collapsed, [ch.id]: false }
  }
</script>

<div class="pane-inner">
  <div class="pane-head">
    <span class="ph-label">Manuscript</span>
    {#if chapters.length}
      <div class="ph-actions">
        <button class="icon-btn" title="Add chapter" on:click={() => A.addChapter()}>
          <span class="icon">{@html I.plus}</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="pane-scroll">
    {#if !chapters.length}
      <div class="ms-empty">
        <span class="icon">{@html I.book}</span>
        <div class="big">No chapters yet</div>
        <p>Add your first chapter to start writing.</p>
        <button class="btn" style="margin-top:18px" on:click={begin}>
          <span class="icon">{@html I.plus}</span> New chapter
        </button>
      </div>
    {:else}
      <div class="tree">
        {#each chapters as ch, ci (ch.id)}
          <div class="ch-block">
            <div class="ch-row">
              <button class="ch-disc" on:click={() => toggle(ch.id)} title={collapsed[ch.id] ? 'Expand' : 'Collapse'} aria-label="Toggle chapter">
                <span class="icon">{@html collapsed[ch.id] ? I.chevronRight : I.chevronDown}</span>
              </button>

              {#if editingId === ch.id}
                <input id={'rename-' + ch.id} class="tree-rename" bind:value={editingValue}
                  on:blur={() => commitRename('chapter')} on:keydown={(e) => onRenameKey(e, 'chapter')} />
              {:else}
                <button class="ch-title" on:click={() => toggle(ch.id)} on:dblclick={() => startRename(ch.id, ch.title)} title={ch.title}>{ch.title}</button>
              {/if}

              <span class="ch-words">{chapterWords(ch)}</span>
              <div class="row-actions">
                <button class="ra" title="Add scene" on:click={() => addSceneTo(ch.id)}><span class="icon">{@html I.plus}</span></button>
                <button class="ra" title="Rename" on:click={() => startRename(ch.id, ch.title)}><span class="icon">{@html I.edit}</span></button>
                <button class="ra" title="Move up" disabled={ci === 0} on:click={() => A.moveChapter(ch.id, -1)}><span class="icon">{@html I.chevronUp}</span></button>
                <button class="ra" title="Move down" disabled={ci === chapters.length - 1} on:click={() => A.moveChapter(ch.id, 1)}><span class="icon">{@html I.chevronDown}</span></button>
                <button class="ra danger" title="Delete chapter" on:click={() => A.deleteChapter(ch.id)}><span class="icon">{@html I.trash}</span></button>
              </div>
            </div>

            {#if !collapsed[ch.id]}
              <div class="sc-list">
                {#each ch.scenes as sc, si (sc.id)}
                  <div class="sc-row" class:active={$ui.selectedSceneId === sc.id}>
                    {#if editingId === sc.id}
                      <input id={'rename-' + sc.id} class="tree-rename" bind:value={editingValue}
                        on:blur={() => commitRename('scene')} on:keydown={(e) => onRenameKey(e, 'scene')} />
                    {:else}
                      <button class="sc-title" on:click={() => A.selectScene(sc.id)} on:dblclick={() => startRename(sc.id, sc.title)} title={sc.title}>
                        <span class="sc-ico icon">{@html I.scene}</span>
                        <span class="sc-name">{sc.title}</span>
                      </button>
                    {/if}
                    <span class="sc-words">{sceneWords(sc)}</span>
                    <div class="row-actions">
                      <button class="ra" title="Rename" on:click={() => startRename(sc.id, sc.title)}><span class="icon">{@html I.edit}</span></button>
                      <button class="ra" title="Move up" disabled={si === 0} on:click={() => A.moveScene(ch.id, sc.id, -1)}><span class="icon">{@html I.chevronUp}</span></button>
                      <button class="ra" title="Move down" disabled={si === ch.scenes.length - 1} on:click={() => A.moveScene(ch.id, sc.id, 1)}><span class="icon">{@html I.chevronDown}</span></button>
                      <button class="ra danger" title="Delete scene" on:click={() => A.deleteScene(sc.id)}><span class="icon">{@html I.trash}</span></button>
                    </div>
                  </div>
                {/each}
                <button class="sc-add" on:click={() => addSceneTo(ch.id)}>
                  <span class="icon">{@html I.plus}</span> Scene
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
