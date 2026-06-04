<script>
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { project } from './lib/state/project.js'
  import { ui } from './lib/state/ui.js'
  import { applyTheme } from './lib/theme.js'

  import Topbar from './components/Topbar.svelte'
  import ManuscriptTree from './components/ManuscriptTree.svelte'
  import Editor from './components/Editor.svelte'
  import EntityPane from './components/EntityPane.svelte'
  import Toasts from './components/Toasts.svelte'

  onMount(() => {
    // Step 7/8 will load auto-saved state first; for now, apply the
    // project's theme preference (falling back to the OS preference).
    const saved = get(project).meta.theme
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    applyTheme(saved || (prefersLight ? 'light' : 'dark'))
  })
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
