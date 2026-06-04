/* ==========================================================
   UI STATE  (the CODEX `UI` object, as a Svelte store)
   View/selection state only — never persisted with the project.
   ========================================================== */
import { writable } from 'svelte/store'

export const ui = writable({
  selectedSceneId: null,   // scene open in the editor
  selectedEntityId: null,  // entity open in the inspector
  entityFilter: 'all',     // 'all' | a TYPE key
  entitySearch: '',
  inspectorOpen: false,
  leftPaneOpen: true,
  rightPaneOpen: true,
})
