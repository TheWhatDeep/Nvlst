<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { get } from 'svelte/store'
  import Modal from './Modal.svelte'
  import { I } from '../lib/core/icons.js'
  import { TYPES } from '../lib/core/types.js'
  import { project } from '../lib/state/project.js'
  import { findScene } from '../lib/state/selectors.js'
  import * as A from '../lib/state/actions.js'
  import { extractScene } from '../lib/ai/extract.js'

  export let sceneId

  const dispatch = createEventDispatcher()
  const close = () => dispatch('close')

  let state = 'loading' // loading | done | error
  let errMsg = ''
  let entities = []
  let facts = []
  let added = {}

  const existing = (name) =>
    get(project).entities.find((e) => (e.name || '').toLowerCase() === name.toLowerCase()) || null

  async function run() {
    state = 'loading'; errMsg = ''
    const loc = findScene(get(project), sceneId)
    if (!loc) { state = 'error'; errMsg = 'That scene is no longer open.'; return }
    try {
      const r = await extractScene(loc.scene)
      entities = r.entities; facts = r.facts; state = 'done'
    } catch (e) {
      state = 'error'; errMsg = String((e && e.message) || e)
    }
  }
  function add(ent) {
    const e = A.addEntity({ type: ent.type, name: ent.name, summary: ent.summary })
    A.pinToScene(sceneId, e.id)
    added = { ...added, [ent.name.toLowerCase()]: true }
  }
  onMount(run)

  $: newOnes = entities.filter((e) => !existing(e.name))
  $: knownOnes = entities.filter((e) => existing(e.name))
</script>

<Modal title="Scan scene" on:close={close}>
  {#if state === 'loading'}
    <p class="muted">Reading your scene…</p>
  {:else if state === 'error'}
    <p class="ai-status err">✗ {errMsg}</p>
    <p class="ai-note">Check the AI assistant in Settings — provider, model, and connection.</p>
    <div class="flex" style="margin-top:12px"><button class="btn" on:click={run}>Try again</button></div>
  {:else}
    {#if !entities.length && !facts.length}
      <p class="muted">Nothing detected here yet — write a little more, then scan again.</p>
    {/if}

    {#if newOnes.length}
      <div class="set-section-label">New to your cast</div>
      {#each newOnes as e (e.name + e.type)}
        <div class="xr-row">
          <span class="er-ico icon" style="color:{TYPES[e.type].color}">{@html I[TYPES[e.type].icon]}</span>
          <span class="xr-text"><span class="xr-name">{e.name}</span>{#if e.summary}<span class="xr-sum">{e.summary}</span>{/if}</span>
          {#if added[e.name.toLowerCase()]}
            <span class="xr-added">✓ Added</span>
          {:else}
            <button class="btn sm" on:click={() => add(e)}><span class="icon">{@html I.plus}</span> Add</button>
          {/if}
        </div>
      {/each}
    {/if}

    {#if knownOnes.length}
      <div class="set-section-label">Already in your cast</div>
      {#each knownOnes as e (e.name + e.type)}
        <div class="xr-row">
          <span class="er-ico icon" style="color:{TYPES[e.type].color}">{@html I[TYPES[e.type].icon]}</span>
          <span class="xr-text"><span class="xr-name">{e.name}</span></span>
          <span class="xr-added muted">in cast</span>
        </div>
      {/each}
    {/if}

    {#if facts.length}
      <div class="set-section-label">Details noticed</div>
      <ul class="xr-facts">
        {#each facts as f}<li><b>{f.about}:</b> {f.detail}</li>{/each}
      </ul>
      <p class="ai-note">Suggestions drawn from the text — verify before relying on them.</p>
    {/if}
  {/if}
</Modal>
