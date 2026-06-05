<script>
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { project } from './lib/state/project.js'
  import { ui } from './lib/state/ui.js'
  import { applyTheme, applyFont } from './lib/theme.js'
  import { restoreLocal, initAutosave } from './lib/persist.js'
  import { seedProject } from './lib/seed.js'
  import { initShortcuts } from './lib/shortcuts.js'

  import Topbar from './components/Topbar.svelte'
  import ManuscriptTree from './components/ManuscriptTree.svelte'
  import Editor from './components/Editor.svelte'
  import EntityPane from './components/EntityPane.svelte'
  import Toasts from './components/Toasts.svelte'

  let cleanupShortcuts
  onMount(() => {
    // first run -> seed a small genre-neutral demo; otherwise restore the autosave
    if (!restoreLocal()) project.set(seedProject())
    const saved = get(project).meta.theme
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    applyTheme(saved || (prefersLight ? 'light' : 'dark'))
    applyFont(get(project).meta.font || 'editorial')
    initAutosave()
    cleanupShortcuts = initShortcuts()
  })
  onDestroy(() => cleanupShortcuts && cleanupShortcuts())
</script>

<div class="app-shell">
  <Topbar />
  <div class="workspace">
    <aside class="pane pane-left" class:collapsed={!$ui.leftPaneOpen}>
      <ManuscriptTree />
    </aside>
    <main class="pane-center">
      <Editor />
    </main>
    <aside class="pane pane-right" class:collapsed={!$ui.rightPaneOpen}>
      <EntityPane />
    </aside>
  </div>
</div>

<Toasts />
