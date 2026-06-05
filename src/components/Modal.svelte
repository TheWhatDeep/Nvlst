<script>
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  import { I } from '../lib/core/icons.js'
  export let title = ''
  const dispatch = createEventDispatcher()
  const close = () => dispatch('close')
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close() } }
</script>

<svelte:window on:keydown={onKey} />

<div class="modal-overlay" on:click|self={close} out:fade={{ duration: 130 }}>
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-head">
      <h3>{title}</h3>
      <button class="icon-btn" style="margin-left:auto" title="Close" on:click={close}>
        <span class="icon">{@html I.x}</span>
      </button>
    </div>
    <div class="modal-body"><slot /></div>
  </div>
</div>
