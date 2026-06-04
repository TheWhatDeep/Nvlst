# Nvlist

A **prose-forward novel-writing app**. The manuscript editor is the main stage; a linked cast of characters, places, events, items, and groups lives alongside the prose to be referenced while drafting.

Nvlist is a standalone sibling of **CODEX** (a worldbuilding tool): it reuses CODEX's engine and visual language — the entity/relationship model, the inspector, `notify`/`guard`, theming, and export patterns — but it is its own application with its own data. There is no connection to CODEX world data.

## Stack

- **Svelte + Vite** — the app shell, state (Svelte stores are Nvlist's port of CODEX's global `DB`/`UI`), and rendering.
- **ProseMirror** *(added in a later build step)* — the rich-text scene editor and the signature `@`-mention links.
- **Local-first, no backend** — auto-save to the browser (IndexedDB) plus `.nvlist.json` export/import. The static build hosts anywhere (Cloudflare Pages, GitHub Pages, or a self-hosted box).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build      # → dist/ (static; host anywhere)
npm run preview    # serve the production build locally
```

## Project layout

```
index.html            entry; loads /src/main.js, sets fonts + default theme
src/
  main.js             mounts App.svelte
  app.css             ported CODEX design system (variables, themes, components)
  App.svelte          three-pane shell (manuscript | editor | cast)
  components/         Topbar, ManuscriptTree, Editor, EntityPane, Toasts
  lib/
    core/             types (5-type registry), icons, shared helpers
    state/            project store (the DB) + ui store
    notify.js         notify() / guard()
    theme.js          light / dark
```

## Data model (in brief)

- **manuscript** → ordered **chapters** → ordered **scenes** (title + rich-text body + per-scene cast)
- **entities** — a flat list, each one of five universal, genre-neutral types: **Character, Place, Event, Item, Group**
- linked by `@`-mentions inside the prose (stored by entity id; the display name resolves at render time, so renames never leave stale text)
