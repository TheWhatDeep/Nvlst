<script>
  import { createEventDispatcher } from 'svelte'
  import Modal from './Modal.svelte'
  import { I } from '../lib/core/icons.js'
  import * as X from '../lib/export.js'

  const dispatch = createEventDispatcher()
  const close = () => dispatch('close')
  const run = (fn) => { fn(); close() }
</script>

<Modal title="Export &amp; backup" on:close={close}>
  <div class="exp-section-label">Project</div>
  <button class="exp-opt" on:click={() => run(X.exportProjectJSON)}>
    <span class="icon">{@html I.save}</span>
    <span class="eo-text">
      <span class="eo-title">Download project (.nvlist.json)</span>
      <span class="eo-desc">Your full backup — reopen it later or on another device.</span>
    </span>
  </button>
  <button class="exp-opt" on:click={() => run(X.importProjectFile)}>
    <span class="icon">{@html I.load}</span>
    <span class="eo-text">
      <span class="eo-title">Open a project file…</span>
      <span class="eo-desc">Replace the current project with a .nvlist.json file.</span>
    </span>
  </button>

  <div class="exp-section-label">Manuscript</div>
  <button class="exp-opt" on:click={() => run(X.exportManuscriptHTML)}>
    <span class="icon">{@html I.printer}</span>
    <span class="eo-text">
      <span class="eo-title">Web page — print-ready (.html)</span>
      <span class="eo-desc">A clean page to read, or print to PDF with Ctrl/Cmd + P.</span>
    </span>
  </button>
  <button class="exp-opt" on:click={() => run(X.exportManuscriptText)}>
    <span class="icon">{@html I.scene}</span>
    <span class="eo-text">
      <span class="eo-title">Plain text (.md)</span>
      <span class="eo-desc">Chapters and scenes in order, links flattened to names.</span>
    </span>
  </button>
</Modal>
