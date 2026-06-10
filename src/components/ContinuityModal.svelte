<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import Modal from './Modal.svelte'
  import { I } from '../lib/core/icons.js'
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { runContinuityCheck } from '../lib/continuity/check.js'
  import { applyFix } from '../lib/continuity/fix.js'

  const dispatch = createEventDispatcher()
  const close = () => dispatch('close')

  let result = { issues: [], summary: { error: 0, warn: 0, info: 0 } }
  let scanning = false

  function run() {
    scanning = true
    // microtask so the modal renders its loading state first on big projects
    queueMicrotask(() => {
      result = runContinuityCheck(get(project))
      scanning = false
    })
  }
  onMount(run)

  function jump(loc) {
    if (loc.kind === 'scene') {
      ui.update((u) => ({ ...u, selectedSceneId: loc.sceneId, selectedEntityId: null, leftPaneOpen: true }))
    } else if (loc.kind === 'entity') {
      ui.update((u) => ({ ...u, selectedEntityId: loc.entityId, rightPaneOpen: true }))
    }
    close()
  }

  function fix(iss) {
    applyFix(iss.fix)
    // Re-scan so the fixed issue disappears and any newly-clean state shows.
    run()
  }

  const SEV_LABEL = { error: 'Error', warn: 'Warning', info: 'Note' }
</script>

<Modal title="Continuity check" on:close={close}>
  {#if scanning}
    <p class="muted">Scanning your manuscript…</p>
  {:else if result.issues.length === 0}
    <div class="cont-clear">
      <span class="icon">{@html I.shield}</span>
      <div class="big">All clear</div>
      <p>No structural inconsistencies found. Broken mentions, dangling pins, duplicate names, and orphaned entities all look healthy.</p>
      <button class="btn" style="margin-top:18px" on:click={run}>Scan again</button>
    </div>
  {:else}
    <div class="cont-summary">
      {#if result.summary.error}<span class="cont-tag err">{result.summary.error} error{result.summary.error !== 1 ? 's' : ''}</span>{/if}
      {#if result.summary.warn}<span class="cont-tag warn">{result.summary.warn} warning{result.summary.warn !== 1 ? 's' : ''}</span>{/if}
      {#if result.summary.info}<span class="cont-tag info">{result.summary.info} note{result.summary.info !== 1 ? 's' : ''}</span>{/if}
      <button class="btn sm" on:click={run} style="margin-left:auto">Re-scan</button>
    </div>
    <div class="cont-list">
      {#each result.issues as iss (iss.id)}
        <div class="cont-row sev-{iss.severity}">
          <div class="cont-head">
            <span class="cont-sev cont-sev-{iss.severity}">{SEV_LABEL[iss.severity]}</span>
            <span class="cont-title">{iss.title}</span>
          </div>
          <p class="cont-detail">{iss.detail}</p>
          <div class="cont-foot">
            {#if iss.locations.length}
              <div class="cont-locs">
                {#each iss.locations as loc}
                  <button class="cont-loc" on:click={() => jump(loc)} title={loc.kind === 'scene' ? 'Open scene' : 'Open entity'}>
                    <span class="icon">{@html loc.kind === 'scene' ? I.scene : I.character}</span>
                    <span>{loc.label}</span>
                  </button>
                {/each}
              </div>
            {:else}
              <span></span>
            {/if}
            {#if iss.fix}
              <button class="btn sm cont-fix" on:click={() => fix(iss)} title="One-click fix">{iss.fix.label}</button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    <p class="ai-note" style="margin-top:14px">Continuity is checked against your structured cast — names, pins, mentions, and links. Story-level checks (timeline, location, deaths) need timestamps and state we don't track yet.</p>
  {/if}
</Modal>
