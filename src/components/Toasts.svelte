<script>
  import { notes, dismiss } from '../lib/notify.js'
  import { NOTE_ICON, I } from '../lib/core/icons.js'
  import { fly } from 'svelte/transition'
</script>

<div class="note-stack">
  {#each $notes as n (n.id)}
    <div class="note note-{n.kind}" in:fly={{ x: 140, duration: 280 }} out:fly={{ x: 140, duration: 280 }}>
      <span class="note-ico">{@html NOTE_ICON[n.kind] || NOTE_ICON.info}</span>
      <span class="note-msg">{n.msg}</span>
      <button class="note-close" on:click={() => dismiss(n.id)} aria-label="Dismiss">
        <span class="icon">{@html I.x}</span>
      </button>
    </div>
  {/each}
</div>
