<script>
  import { tick } from 'svelte'
  import Modal from './Modal.svelte'
  import { confirmState, resolveConfirm } from '../lib/confirm.js'

  $: state = $confirmState

  // When a confirm opens, focus its confirm button so Enter triggers it
  // and Tab cycles within the dialog. Esc is handled by Modal already
  // (it dispatches 'close' which we treat as Cancel).
  let confirmBtn
  $: if (state) tick().then(() => confirmBtn && confirmBtn.focus())

  const ok = () => resolveConfirm(true)
  const cancel = () => resolveConfirm(false)

  function onKey(e) {
    if (!state || e.key !== 'Enter') return
    // If a button has focus (Confirm, Cancel, or the modal's close icon),
    // let its native Enter-activates-click behavior decide — hijacking
    // here would confirm even when Cancel is the focused button.
    const a = document.activeElement
    if (a && a.tagName === 'BUTTON') return
    e.preventDefault()
    ok()
  }
</script>

<svelte:window on:keydown={onKey} />

{#if state}
  <Modal title={state.title} on:close={cancel}>
    <p class="confirm-msg">{state.message}</p>
    <div class="confirm-actions">
      <button class="btn" on:click={cancel}>{state.cancelLabel}</button>
      <button
        class="btn primary"
        class:danger={state.danger}
        bind:this={confirmBtn}
        on:click={ok}
      >{state.confirmLabel}</button>
    </div>
  </Modal>
{/if}
