<script>
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { theme, toggleTheme } from '../lib/theme.js'
  import { I } from '../lib/core/icons.js'
  import { saveStatus } from '../lib/persist.js'

  function rename(e) {
    const v = e.target.value.trim() || 'Untitled Manuscript'
    project.update((p) => { p.meta.title = v; return p })
    e.target.value = v
  }
  const toggleLeft = () => ui.update((u) => ({ ...u, leftPaneOpen: !u.leftPaneOpen }))
  const toggleRight = () => ui.update((u) => ({ ...u, rightPaneOpen: !u.rightPaneOpen }))

  $: statusLabel = $saveStatus.state === 'saving' ? 'Saving…' : $saveStatus.state === 'unsaved' ? 'Unsaved' : 'Saved'
</script>

<header class="topbar">
  <div class="brand">
    <span class="mark icon">{@html I.feather}</span>
    <span class="glyph">Nvlist</span>
    <span class="sub">Workshop</span>
  </div>

  <input class="title-field" value={$project.meta.title} on:change={rename} spellcheck="false" aria-label="Manuscript title" />

  <div class="topbar-spacer"></div>

  <span class="save-status" class:saving={$saveStatus.state === 'saving'} title="Your work autosaves to this browser">{statusLabel}</span>

  <button class="tb-btn icon-only" class:on={$ui.leftPaneOpen} on:click={toggleLeft} title="Toggle manuscript panel">
    <span class="icon">{@html I.book}</span>
  </button>
  <button class="tb-btn icon-only" class:on={$ui.rightPaneOpen} on:click={toggleRight} title="Toggle cast panel">
    <span class="icon">{@html I.group}</span>
  </button>
  <button class="tb-btn icon-only" on:click={toggleTheme} title="Toggle light / dark">
    <span class="icon">{@html $theme === 'dark' ? I.sun : I.moon}</span>
  </button>
</header>
