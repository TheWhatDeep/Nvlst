/* ==========================================================
   THEME  (ported from CODEX's notify.js theme manager)
   Light/dark via [data-theme]; the choice is stored in the
   project meta so it travels with the saved file.
   ========================================================== */
import { writable, get } from 'svelte/store'
import { project } from './state/project.js'

export const THEMES = ['dark', 'light']
export const theme = writable('dark')

export function applyTheme(t) {
  const v = THEMES.includes(t) ? t : 'dark'
  document.documentElement.setAttribute('data-theme', v)
  theme.set(v)
  project.update((p) => { if (p.meta) p.meta.theme = v; return p })
}

export function toggleTheme() {
  applyTheme(get(theme) === 'dark' ? 'light' : 'dark')
}
