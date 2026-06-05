<script>
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { I } from '../lib/core/icons.js'
  import { findScene } from '../lib/state/selectors.js'
  import { renameScene } from '../lib/state/actions.js'
  import { liveWords } from '../lib/state/editor.js'
  import { fade } from 'svelte/transition'
  import ProseEditor from './ProseEditor.svelte'

  $: loc = findScene($project, $ui.selectedSceneId)
  $: scene = loc ? loc.scene : null
  $: chapter = loc ? loc.chapter : null

  function onTitle(e) {
    if (scene) renameScene(scene.id, e.target.value)
  }
</script>

{#if scene}
  {#key scene.id}
    <div class="editor-wrap" in:fade={{ duration: 160 }}>
      <input
        class="editor-scene-title"
        value={scene.title}
        on:change={onTitle}
        placeholder="Scene title"
        aria-label="Scene title"
      />
      <div class="editor-meta">
        {#if chapter}<span>{chapter.title}</span><span aria-hidden="true">·</span>{/if}
        <span>{$liveWords} {$liveWords === 1 ? 'word' : 'words'}</span>
      </div>
      <ProseEditor sceneId={scene.id} />
    </div>
  {/key}
{:else}
  <div class="editor-blank" in:fade={{ duration: 160 }}>
    <span class="icon">{@html I.feather}</span>
    <div class="big">Nothing open yet</div>
    <p>Select a scene from the manuscript — or create one — to start writing. Your prose is the main stage.</p>
  </div>
{/if}
