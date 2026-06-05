<script>
  import { project } from '../lib/state/project.js'
  import { ui } from '../lib/state/ui.js'
  import { I } from '../lib/core/icons.js'
  import { TYPES, TYPE_KEYS, REL_TYPES } from '../lib/core/types.js'
  import { entityById } from '../lib/state/selectors.js'
  import * as A from '../lib/state/actions.js'
  import { fly } from 'svelte/transition'
  import { saveNow } from '../lib/persist.js'
  import { notify } from '../lib/notify.js'

  export let id

  $: e = entityById($project, id)
  $: meta = e ? TYPES[e.type] : null
  $: relTargets = $project.entities.filter((x) => x.id !== id)
  // other entities that point AT this one
  $: incoming = e
    ? $project.entities
        .filter((o) => o.id !== id)
        .flatMap((o) => (o.rels || []).filter((r) => r.target === id).map((r) => ({ from: o, type: r.type })))
    : []

  let relType = REL_TYPES[0]
  let relTarget = ''
  let newFieldKey = ''
  let tagInput = ''

  const back = () => ui.update((u) => ({ ...u, selectedEntityId: null }))
  function saveEntity() { saveNow(); notify('Saved.', 'success', { ttl: 1400 }); back() }
  const open = (eid) => ui.update((u) => ({ ...u, selectedEntityId: eid }))
  const targetName = (tid) => {
    const t = $project.entities.find((x) => x.id === tid)
    return t ? t.name || '(unnamed)' : 'missing'
  }
  function doAddRel() { if (!relTarget) return; A.addRel(id, relType, relTarget); relTarget = '' }
  function doAddField() { const k = newFieldKey.trim(); if (k && A.addField(id, k)) newFieldKey = '' }
  function doAddTag() { if (A.addTag(id, tagInput)) tagInput = '' }
  function onTagKey(ev) { if (ev.key === 'Enter' || ev.key === ',') { ev.preventDefault(); doAddTag() } }
</script>

{#if e && meta}
  <div class="pane-inner" in:fly={{ x: 14, duration: 170 }}>
    <div class="insp-head">
      <button class="icon-btn" title="Back to the cast" on:click={back}><span class="icon">{@html I.chevronLeft}</span></button>
      <span class="insp-type-ico icon" style="color:{meta.color}">{@html I[meta.icon]}</span>
      <span class="insp-type">{meta.name}</span>
      <button class="btn sm amber insp-save" on:click={saveEntity} title="Save & close"><span class="icon">{@html I.save}</span> Save</button>
    </div>

    <div class="pane-scroll">
      <input class="insp-name" value={e.name} on:input={(ev) => A.updateEntity(id, { name: ev.target.value })} placeholder={meta.name + ' name'} />

      <label>Summary</label>
      <textarea rows="2" value={e.summary} on:input={(ev) => A.updateEntity(id, { summary: ev.target.value })} placeholder="A line or two to recognise them by…"></textarea>

      <label>Notes</label>
      <textarea rows="5" value={e.notes} on:input={(ev) => A.updateEntity(id, { notes: ev.target.value })} placeholder="Longer notes — backstory, description, anything."></textarea>

      <div class="detail-section">
        <h4><span class="icon">{@html I.link}</span> Relationships</h4>
        <div class="rel-list">
          {#each e.rels || [] as r, i}
            <div class="rel-row">
              <span class="rel-type">{r.type}</span>
              <span class="rel-target" on:click={() => open(r.target)}>{targetName(r.target)}</span>
              <span class="rel-x" on:click={() => A.removeRel(id, i)}><span class="icon">{@html I.x}</span></span>
            </div>
          {:else}
            <p class="muted" style="font-size:12.5px">No links yet.</p>
          {/each}
        </div>
        <div class="rel-add">
          <select bind:value={relType} style="flex:0 0 42%">
            {#each REL_TYPES as rt}<option value={rt}>{rt}</option>{/each}
          </select>
          <select bind:value={relTarget} style="flex:1">
            <option value="">— link to —</option>
            {#each TYPE_KEYS as k}
              {#if relTargets.some((x) => x.type === k)}
                <optgroup label={TYPES[k].plural}>
                  {#each relTargets.filter((x) => x.type === k) as x}<option value={x.id}>{x.name || '(unnamed)'}</option>{/each}
                </optgroup>
              {/if}
            {/each}
          </select>
          <button class="btn sm" title="Add link" on:click={doAddRel}><span class="icon">{@html I.plus}</span></button>
        </div>
        {#if incoming.length}
          <div class="insp-incoming">
            <div class="insp-sublabel">Referenced by</div>
            <div class="rel-list">
              {#each incoming as r}
                <div class="rel-row" style="opacity:.85">
                  <span class="rel-target" on:click={() => open(r.from.id)}>{r.from.name || '(unnamed)'}</span>
                  <span class="rel-type" style="min-width:auto;text-align:right;flex:1">{r.type} this</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="detail-section">
        <h4><span class="icon">{@html I.edit}</span> Custom Fields</h4>
        {#each Object.keys(e.fields || {}) as key (key)}
          <div class="custom-field">
            <label>{key}<span class="cf-x" title="Remove field" on:click={() => A.removeField(id, key)}>×</span></label>
            <input value={e.fields[key]} on:input={(ev) => A.setField(id, key, ev.target.value)} />
          </div>
        {:else}
          <p class="muted" style="font-size:12.5px">No custom fields. Add traits like Age, Role, Origin…</p>
        {/each}
        <div class="rel-add">
          <input bind:value={newFieldKey} placeholder="Field name (e.g. Age, Role)" on:keydown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); doAddField() } }} />
          <button class="btn sm" on:click={doAddField}><span class="icon">{@html I.plus}</span> Add</button>
        </div>
      </div>

      <div class="detail-section">
        <h4>Tags</h4>
        <div class="tag-input-wrap">
          {#each e.tags || [] as t, i}
            <span class="tag">{t}<span class="x" on:click={() => A.removeTag(id, i)}>×</span></span>
          {/each}
          <input bind:value={tagInput} placeholder="add tag…" on:keydown={onTagKey} />
        </div>
      </div>

      <div class="divider"></div>
      <div class="flex jcb aic">
        <button class="btn sm danger" on:click={() => A.deleteEntity(id)}><span class="icon">{@html I.trash}</span> Delete</button>
        <button class="btn sm amber" on:click={saveEntity}><span class="icon">{@html I.save}</span> Save changes</button>
      </div>
    </div>
  </div>
{/if}
