<script>
  import { fade } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { I } from '../lib/core/icons.js'
  import { TYPES, TYPE_KEYS } from '../lib/core/types.js'
  import { entityById, typeCounts, findScene, sceneCast, collectMentionIds } from '../lib/state/selectors.js'
  import * as A from '../lib/state/actions.js'
  import Inspector from './Inspector.svelte'
  import Modal from './Modal.svelte'

  let showCreate = false
  let showPin = false
  let pinSearch = ''

  $: selected = entityById($project, $ui.selectedEntityId)
  $: counts = typeCounts($project)
  $: filter = $ui.entityFilter
  $: search = $ui.entitySearch
  $: list = $project.entities
    .filter((e) => filter === 'all' || e.type === filter)
    .filter((e) => !search || (e.name || '').toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  // current scene + its cast
  $: currentLoc = findScene($project, $ui.selectedSceneId)
  $: currentScene = currentLoc ? currentLoc.scene : null
  $: cast = sceneCast($project, currentScene)
  $: castIds = new Set(currentScene ? currentScene.cast || [] : [])
  $: mentionedIds = currentScene ? collectMentionIds(currentScene.body) : new Set()
  $: pinChoices = $project.entities
    .filter((e) => e.name && e.name.trim() && (!pinSearch || e.name.toLowerCase().includes(pinSearch.toLowerCase())))
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  const inCast = (id) => castIds.has(id) || mentionedIds.has(id)
  const setFilter = (f) => ui.update((u) => ({ ...u, entityFilter: f }))
  const onSearch = (ev) => ui.update((u) => ({ ...u, entitySearch: ev.target.value }))
  const openEntity = (id) => ui.update((u) => ({ ...u, selectedEntityId: id }))
  const pick = (type) => { showCreate = false; A.createEntity(type) }
  const pin = (id) => { if (currentScene && !inCast(id)) A.pinToScene(currentScene.id, id) }
  const unpin = (id) => { if (currentScene) A.unpinFromScene(currentScene.id, id) }
</script>

{#if selected}
  {#key selected.id}
    <Inspector id={selected.id} />
  {/key}
{:else}
  <div class="pane-inner" in:fade={{ duration: 130 }}>
    <div class="pane-head">
      <span class="ph-label">Cast &amp; World</span>
      <div class="ph-actions">
        <button class="icon-btn" title="New entity" on:click={() => (showCreate = true)}><span class="icon">{@html I.plus}</span></button>
      </div>
    </div>

    {#if currentScene}
      <div class="scene-cast">
        <div class="sc-cast-head">
          <span class="ph-label">In this scene</span>
          <button class="icon-btn" title="Pin an entity to this scene" on:click={() => (showPin = true)}><span class="icon">{@html I.pin}</span></button>
        </div>
        {#if cast.length}
          <div class="cast-rows">
            {#each cast as c (c.entity.id)}
              <div class="cast-row" on:click={() => openEntity(c.entity.id)} in:fade|local={{ duration: 140 }} animate:flip={{ duration: 160 }}>
                <span class="er-ico icon" style="color:{TYPES[c.entity.type].color}">{@html I[TYPES[c.entity.type].icon]}</span>
                <span class="er-name">{c.entity.name || 'Unnamed'}</span>
                {#if c.mentioned}<span class="cast-badge" title="Mentioned in the prose">@</span>{/if}
                {#if c.pinned}<button class="cast-unpin" title="Unpin from scene" on:click|stopPropagation={() => unpin(c.entity.id)}><span class="icon">{@html I.x}</span></button>{/if}
              </div>
            {/each}
          </div>
        {:else}
          <p class="cast-empty">No one here yet — <kbd>@</kbd>-mention someone in the prose, or pin them.</p>
        {/if}
      </div>
    {/if}

    {#if $project.entities.length}
      <div class="ent-toolbar">
        <div class="ent-search">
          <span class="icon">{@html I.search}</span>
          <input value={search} on:input={onSearch} placeholder="Search the cast…" />
        </div>
        <div class="ent-filters">
          <button class="filter-pill" class:on={filter === 'all'} on:click={() => setFilter('all')}>All <span class="fp-count">{$project.entities.length}</span></button>
          {#each TYPE_KEYS as k}
            <button class="filter-pill" class:on={filter === k} on:click={() => setFilter(k)} title={TYPES[k].plural}>
              <span class="icon" style="color:{TYPES[k].color}">{@html I[TYPES[k].icon]}</span>
              {TYPES[k].name}{#if counts[k]}<span class="fp-count">{counts[k]}</span>{/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="pane-scroll">
        {#if list.length}
          {#each list as e (e.id)}
            <button class="ent-row" in:fade|local={{ duration: 150 }} animate:flip={{ duration: 160 }} on:click={() => openEntity(e.id)}>
              <span class="er-ico icon" style="color:{TYPES[e.type].color}">{@html I[TYPES[e.type].icon]}</span>
              <span class="er-name">{e.name || 'Unnamed ' + TYPES[e.type].name.toLowerCase()}</span>
              <span class="er-sub">{TYPES[e.type].name}</span>
            </button>
          {/each}
        {:else}
          <div class="ent-empty">
            <span class="icon">{@html I.search}</span>
            <div class="big">No matches</div>
            <p>Nothing here for that filter or search.</p>
          </div>
        {/if}
      </div>
    {:else}
      <div class="pane-scroll">
        <div class="ent-empty">
          <span class="icon">{@html I.group}</span>
          <div class="big">No entities yet</div>
          <p>Add the characters, places, events, items, and groups you'll reference while writing.</p>
          <button class="btn" style="margin-top:18px" on:click={() => (showCreate = true)}><span class="icon">{@html I.plus}</span> New entity</button>
        </div>
      </div>
    {/if}
  </div>
{/if}

{#if showCreate}
  <Modal title="New entity" on:close={() => (showCreate = false)}>
    <p class="muted" style="margin-bottom:14px">What are you adding to the cast?</p>
    <div class="type-picker">
      {#each TYPE_KEYS as k}
        <button class="type-opt" style="--to-color:{TYPES[k].color}" on:click={() => pick(k)}>
          <span class="icon">{@html I[TYPES[k].icon]}</span>
          <span class="tn">{TYPES[k].name}</span>
          <span class="td">{TYPES[k].desc}</span>
        </button>
      {/each}
    </div>
  </Modal>
{/if}

{#if showPin && currentScene}
  <Modal title="Pin to this scene" on:close={() => { showPin = false; pinSearch = '' }}>
    <p class="muted" style="margin-bottom:10px">Add someone present but not named in the prose. (Anyone you <kbd>@</kbd>-mention is added automatically.)</p>
    <input class="pin-search" placeholder="Search the cast…" bind:value={pinSearch} />
    <div class="pin-list">
      {#each pinChoices as e (e.id)}
        <button class="pin-row" disabled={inCast(e.id)} on:click={() => pin(e.id)}>
          <span class="er-ico icon" style="color:{TYPES[e.type].color}">{@html I[TYPES[e.type].icon]}</span>
          <span class="pr-name">{e.name}</span>
          <span class="pin-state" class:add={!inCast(e.id)}>{mentionedIds.has(e.id) ? '@ mentioned' : castIds.has(e.id) ? 'pinned' : 'Pin'}</span>
        </button>
      {:else}
        <p class="muted">No entities yet — create some in the cast first.</p>
      {/each}
    </div>
  </Modal>
{/if}
