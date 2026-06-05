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

/* ---------- fonts ---------- */
export const FONTS = {
  editorial: { label: 'Editorial', display: "'Fraunces', Georgia, serif",        serif: "'Newsreader', Georgia, serif" },
  literata:  { label: 'Literata',  display: "'Literata', Georgia, serif",         serif: "'Literata', Georgia, serif" },
  lora:      { label: 'Lora',      display: "'Lora', Georgia, serif",             serif: "'Lora', Georgia, serif" },
  garamond:  { label: 'Garamond',  display: "'EB Garamond', Georgia, serif",      serif: "'EB Garamond', Georgia, serif" },
  source:    { label: 'Source',    display: "'Source Serif 4', Georgia, serif",   serif: "'Source Serif 4', Georgia, serif" },
  sans:      { label: 'Sans',      display: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", serif: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
}
export const font = writable('editorial')

export function applyFont(key) {
  const k = FONTS[key] ? key : 'editorial'
  const def = FONTS[k]
  const root = document.documentElement
  root.style.setProperty('--display', def.display)
  root.style.setProperty('--serif', def.serif)
  font.set(k)
  project.update((p) => { if (p.meta) p.meta.font = k; return p })
}
