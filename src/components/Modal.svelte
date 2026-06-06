<script>
  import { createEventDispatcher } from 'svelte'
  import { I } from '../lib/core/icons.js'
  export let title = ''
  export let size = 'default' // 'default' | 'wide'
  const dispatch = createEventDispatcher()
  const close = () => dispatch('close')
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close() } }
</script>

<svelte:window on:keydown={onKey} />

<div class="modal-overlay" on:click|self={close}>
  <div class="modal" class:modal-wide={size === 'wide'} role="dialog" aria-modal="true">
    <div class="modal-head">
      <h3>{title}</h3>
      <button class="icon-btn" style="margin-left:auto" title="Close" on:click={close}>
        <span class="icon">{@html I.x}</span>
      </button>
    </div>
    <div class="modal-body"><slot /></div>
  </div>
</div>
