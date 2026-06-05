# Nvlst

A **prose-forward novel-writing app**. The manuscript editor is the main stage; a linked cast of characters, places, events, items, and groups lives alongside the prose to be referenced while drafting.

Nvlst is a standalone sibling of **CODEX** (a worldbuilding tool): it reuses CODEX's engine and visual language — the entity/relationship model, the inspector, `notify`/`guard`, theming, and export patterns — but it is its own application with its own data. There is no connection to CODEX world data.

## Features

- **Three-pane workspace** — manuscript outline · editor · cast.
- **Manuscript tree** — chapters → scenes; add / rename / delete / reorder, with live word counts.
- **Rich-text editor** (ProseMirror) — paragraphs, **bold**/*italic*, a live word count, and a selection bubble.
- **`@`-mention linking** — type `@` to drop an entity into the prose; links carry the entity id (so renames update everywhere and deletions degrade gracefully), and clicking one opens its inspector.
- **Cast & world** — five genre-neutral entity types (Character, Place, Event, Item, Group) with summary, notes, custom fields, tags, and typed relationships (with automatic reciprocals).
- **Per-scene cast** — the union of who's `@`-mentioned in a scene plus anyone you pin by hand.
- **Local-first persistence** — autosaves to the browser; **Save** in the inspector; export / import a `.nvlst.json` backup; export the manuscript as **print-ready HTML** (open in a tab → Ctrl/Cmd+P → Save as PDF) or plain `.md` text.
- **Light / dark** themes; subtle, reduced-motion-aware animations.

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

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + Enter` | New scene |
| `Ctrl/Cmd + K` | Focus the cast search |
| `Ctrl/Cmd + Shift + L` | Toggle light / dark |
| `Esc` | Close the inspector / a menu |

## Stack

- **Svelte + Vite** — the app shell, state (Svelte stores are Nvlst's port of CODEX's global `DB`/`UI`), and rendering.
- **ProseMirror** — the rich-text scene editor and the `@`-mention links (a custom inline node + suggestion plugin).
- **Local-first, no backend** — autosave to the browser (localStorage) plus file export/import. The static build hosts anywhere (Cloudflare Pages, GitHub Pages, or a self-hosted box).

## Project layout

```
index.html              entry; loads /src/main.js, sets fonts + default theme
src/
  main.js               mounts App.svelte
  app.css               design system (variables, light/dark themes, components)
  App.svelte            three-pane shell + boot (restore/seed, theme, autosave, shortcuts)
  components/           Topbar, ManuscriptTree, Editor, ProseEditor, EntityPane,
                        Inspector, Modal, ExportModal, Toasts
  lib/
    core/               types (5-type registry), icons, shared helpers
    editor/             ProseMirror schema + @-mention node/plugin
    state/              project store (the DB), ui store, actions, selectors
    notify.js           notify() / guard()
    theme.js            light / dark
    persist.js          browser autosave + restore
    export.js           .nvlst.json + print-ready HTML + .md
    shortcuts.js        global keyboard combos
    seed.js             first-run genre-neutral demo
```

## Data model (in brief)

- **manuscript** → ordered **chapters** → ordered **scenes** (title + rich-text body + per-scene cast)
- **entities** — a flat list, each one of five universal, genre-neutral types: **Character, Place, Event, Item, Group**
- linked by `@`-mentions inside the prose (stored by entity id; the display name resolves at render time, so renames never leave stale text)
