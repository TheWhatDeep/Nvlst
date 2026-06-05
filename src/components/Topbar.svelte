<script>
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { theme, toggleTheme } from '../lib/theme.js'
  import { I } from '../lib/core/icons.js'
  import { saveStatus } from '../lib/persist.js'
  import ExportModal from './ExportModal.svelte'
  import AboutModal from './AboutModal.svelte'
  import SettingsModal from './SettingsModal.svelte'
  import logoUrl from '../../asset/logo.png'

  let showExport = false
  let showAbout = false
  let showSettings = false

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
    <img class="brand-logo" src={logoUrl} alt="Nvlst" />
    <span class="glyph">Nvlst</span>
    <span class="sub">Workshop</span>
  </div>

  <input class="title-field" value={$project.meta.title} on:change={rename} spellcheck="false" aria-label="Manuscript title" />

  <div class="topbar-spacer"></div>

  <span class="save-status" class:saving={$saveStatus.state === 'saving'} title="Your work autosaves to this browser">{statusLabel}</span>

  <button class="tb-btn" on:click={() => (showExport = true)} title="Export & backup">
    <span class="icon">{@html I.export}</span><span>Export</span>
  </button>

  <button class="tb-btn icon-only" class:on={$ui.leftPaneOpen} on:click={toggleLeft} title="Toggle manuscript panel">
    <span class="icon">{@html I.book}</span>
  </button>
  <button class="tb-btn icon-only" class:on={$ui.rightPaneOpen} on:click={toggleRight} title="Toggle cast panel">
    <span class="icon">{@html I.group}</span>
  </button>
  <button class="tb-btn icon-only" on:click={toggleTheme} title="Toggle light / dark">
    <span class="icon">{@html $theme === 'dark' ? I.sun : I.moon}</span>
  </button>
  <button class="tb-btn icon-only" on:click={() => (showSettings = true)} title="Settings">
    <span class="icon">{@html I.settings}</span>
  </button>
  <button class="tb-btn icon-only" on:click={() => (showAbout = true)} title="About Nvlst">
    <span class="icon">{@html I.info}</span>
  </button>
</header>

{#if showExport}
  <ExportModal on:close={() => (showExport = false)} />
{/if}
{#if showAbout}
  <AboutModal on:close={() => (showAbout = false)} />
{/if}
{#if showSettings}
  <SettingsModal on:close={() => (showSettings = false)} />
{/if}
