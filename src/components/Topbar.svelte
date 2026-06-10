<script>
  import { onMount, onDestroy } from 'svelte'
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { I } from '../lib/core/icons.js'
  import { saveStatus, saveNow } from '../lib/persist.js'
  import ExportModal from './ExportModal.svelte'
  import SettingsModal from './SettingsModal.svelte'
  import ContinuityModal from './ContinuityModal.svelte'
  import logoUrl from '../../asset/logo.png'

  let showExport = false
  let showSettings = false
  let showContinuity = false

  /* Detect Tauri so the custom window controls only render in the
     native desktop build (in the browser, the browser chrome stays). */
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

  let tauriWin = null
  let isMaximized = false
  let unlistenResize = null

  onMount(async () => {
    if (!isTauri) return
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    tauriWin = getCurrentWindow()
    isMaximized = await tauriWin.isMaximized()
    // Keep the maximize/restore icon in sync with actual window state.
    unlistenResize = await tauriWin.onResized(async () => {
      isMaximized = await tauriWin.isMaximized()
    })
  })
  onDestroy(() => { if (unlistenResize) unlistenResize() })

  const winMinimize = () => tauriWin && tauriWin.minimize()
  const winToggleMax = () => tauriWin && tauriWin.toggleMaximize()
  // Flush prose + project to localStorage BEFORE closing — the WebView
  // doesn't reliably fire beforeunload when the window is destroyed.
  const winClose = () => { saveNow(); tauriWin && tauriWin.close() }

  /* Explicit drag/maximize handlers. We skip `data-tauri-drag-region`
     because the attribute-based path has been unreliable on some
     Tauri v2 builds — calling startDragging() / toggleMaximize() from
     real DOM events is the same IPC, just with no middleman. */
  const NON_DRAGGABLE = 'button, input, select, textarea, a, label'

  function onTitleMouseDown(e) {
    if (!tauriWin || e.button !== 0) return
    if (e.target.closest && e.target.closest(NON_DRAGGABLE)) return
    tauriWin.startDragging()
  }
  function onTitleDblClick(e) {
    if (!tauriWin) return
    if (e.target.closest && e.target.closest(NON_DRAGGABLE)) return
    tauriWin.toggleMaximize()
  }

  function rename(e) {
    const v = e.target.value.trim() || 'Untitled Manuscript'
    project.update((p) => { p.meta.title = v; return p })
    e.target.value = v
  }
  const toggleLeft = () => ui.update((u) => ({ ...u, leftPaneOpen: !u.leftPaneOpen }))
  const toggleRight = () => ui.update((u) => ({ ...u, rightPaneOpen: !u.rightPaneOpen }))

  $: statusLabel = $saveStatus.state === 'saving' ? 'Saving…' : $saveStatus.state === 'unsaved' ? 'Unsaved' : 'Saved'
</script>

<!--
  Titlebar — slim native-style strip carrying app identity (logo + name) on
  the left, drag handle in the middle, window controls on the right.
  Toolbar below carries document-level info (manuscript title centered) and
  document-level actions (save status, export, panel toggles, etc.).
-->
<div class="titlebar" on:mousedown={onTitleMouseDown} on:dblclick={onTitleDblClick}>
  <div class="titlebar-section titlebar-left">
    <div class="brand">
      <img class="brand-logo" src={logoUrl} alt="Nvlst" />
      <span class="glyph">Nvlst</span>
    </div>
  </div>
  <div class="titlebar-section titlebar-center"></div>
  <div class="titlebar-section titlebar-right">
    {#if isTauri}
      <button class="win-icon" on:click={winMinimize} title="Minimize" aria-label="Minimize">
        <span class="icon">{@html I.winMinimize}</span>
      </button>
      <button class="win-icon" on:click={winToggleMax} title={isMaximized ? 'Restore' : 'Maximize'} aria-label={isMaximized ? 'Restore' : 'Maximize'}>
        <span class="icon">{@html isMaximized ? I.winRestore : I.winMaximize}</span>
      </button>
      <button class="win-icon win-close" on:click={winClose} title="Close" aria-label="Close">
        <span class="icon">{@html I.winClose}</span>
      </button>
    {/if}
  </div>
</div>

<header class="topbar">
  <div class="topbar-section topbar-left">
    <span class="save-status" class:saving={$saveStatus.state === 'saving'} title="Your work autosaves to this browser">{statusLabel}</span>
  </div>

  <div class="topbar-section topbar-center">
    <input class="title-field" value={$project.meta.title} on:change={rename} spellcheck="false" aria-label="Manuscript title" />
  </div>

  <div class="topbar-section topbar-right">
    <button class="tb-btn" on:click={() => (showExport = true)} title="Export & backup">
      <span class="icon">{@html I.export}</span><span>Export</span>
    </button>
    <button class="tb-btn icon-only" class:on={$ui.leftPaneOpen} on:click={toggleLeft} title="Toggle manuscript panel">
      <span class="icon">{@html I.book}</span>
    </button>
    <button class="tb-btn icon-only" class:on={$ui.rightPaneOpen} on:click={toggleRight} title="Toggle cast panel">
      <span class="icon">{@html I.group}</span>
    </button>
    <button class="tb-btn icon-only" on:click={() => (showContinuity = true)} title="Continuity check — broken mentions, duplicates, orphans">
      <span class="icon">{@html I.shield}</span>
    </button>
    <button class="tb-btn icon-only" on:click={() => (showSettings = true)} title="Settings — appearance, AI, about">
      <span class="icon">{@html I.settings}</span>
    </button>
  </div>
</header>

{#if showExport}
  <ExportModal on:close={() => (showExport = false)} />
{/if}
{#if showSettings}
  <SettingsModal on:close={() => (showSettings = false)} />
{/if}
{#if showContinuity}
  <ContinuityModal on:close={() => (showContinuity = false)} />
{/if}
