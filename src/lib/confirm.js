/* ==========================================================
   CONFIRM DIALOG — imperative replacement for window.confirm().
   Renders inside the app's own monochrome Modal for consistency
   with the rest of the UI (and so it actually looks like Nvlst
   inside a Tauri/Electron window, not a default OS dialog).

   Usage from any action / handler:
     import { confirmDialog } from '../confirm.js'
     const ok = await confirmDialog({
       title: 'Delete chapter?',
       message: '"Closing Time" and its 3 scenes will be removed.',
       confirmLabel: 'Delete',
       danger: true,
     })
     if (!ok) return
   ========================================================== */
import { writable, get } from 'svelte/store'

// null when idle. Object { title, message, confirmLabel, cancelLabel, danger, resolve } when open.
export const confirmState = writable(null)

export function confirmDialog(opts = {}) {
  return new Promise((resolve) => {
    confirmState.set({
      title: opts.title || 'Confirm',
      message: opts.message || 'Are you sure?',
      confirmLabel: opts.confirmLabel || 'OK',
      cancelLabel: opts.cancelLabel || 'Cancel',
      danger: !!opts.danger,
      resolve,
    })
  })
}

/* Resolve & close the current dialog. Used by the modal's buttons
   and the Esc/overlay handlers. */
export function resolveConfirm(result) {
  const cur = get(confirmState)
  if (cur && cur.resolve) cur.resolve(result)
  confirmState.set(null)
}
