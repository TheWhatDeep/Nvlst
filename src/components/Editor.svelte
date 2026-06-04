<script>
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { I } from '../lib/core/icons.js'
  import { findScene, sceneWords } from '../lib/state/selectors.js'
  import { renameScene } from '../lib/state/actions.js'

  $: loc = findScene($project, $ui.selectedSceneId)
  $: scene = loc ? loc.scene : null
  $: chapter = loc ? loc.chapter : null

  function onTitle(e) {
    if (scene) renameScene(scene.id, e.target.value)
  }
</script>

{#if scene}
  <div class="editor-wrap">
    <input
      class="editor-scene-title"
      value={scene.title}
      on:change={onTitle}
      placeholder="Scene title"
      aria-label="Scene title"
    />
    <div class="editor-meta">
      {#if chapter}<span>{chapter.title}</span><span aria-hidden="true">·</span>{/if}
      <span>{sceneWords(scene)} {sceneWords(scene) === 1 ? 'word' : 'words'}</span>
    </div>
    <div class="editor-placeholder">The rich-text editor arrives in the next step — your prose will live right here.</div>
  </div>
{:else}
  <div class="editor-blank">
    <span class="icon">{@html I.feather}</span>
    <div class="big">Nothing open yet</div>
    <p>Select a scene from the manuscript — or create one — to start writing. Your prose is the main stage.</p>
  </div>
{/if}
