<script>
  import { createEventDispatcher } from 'svelte'
  import Modal from './Modal.svelte'
  import { aiSettings, PROVIDERS } from '../lib/ai/settings.js'
  import { testConnection } from '../lib/ai/client.js'

  const dispatch = createEventDispatcher()
  const close = () => dispatch('close')

  const providerEntries = Object.entries(PROVIDERS)
  let testState = 'idle' // idle | testing | ok | error
  let testMsg = ''

  function setProvider(p) {
    const preset = PROVIDERS[p] || {}
    aiSettings.update((s) => ({ ...s, provider: p, baseUrl: preset.baseUrl || '', model: preset.model || '' }))
    testState = 'idle'; testMsg = ''
  }
  function setField(field, value) {
    aiSettings.update((s) => ({ ...s, [field]: value }))
    if (field !== 'apiKey') { testState = 'idle'; testMsg = '' }
  }
  async function runTest() {
    testState = 'testing'; testMsg = ''
    try {
      const ok = await testConnection()
      testState = ok ? 'ok' : 'error'
      if (!ok) testMsg = 'Connected, but the model didn’t return valid JSON — try a more capable model.'
    } catch (e) {
      testState = 'error'; testMsg = String(e.message || e)
    }
  }

  $: s = $aiSettings
  $: preset = PROVIDERS[s.provider] || {}
  $: showKey = preset.needsKey || s.provider === 'custom'
</script>

<Modal title="AI assistant" on:close={close}>
  <p class="muted" style="margin-bottom:16px">
    Opt-in and bring-your-own-engine. Pick a <b>local model</b> (fully private — nothing leaves your
    machine) or your <b>own API key</b>. Either way, your prose and key stay in your browser and go
    only to the provider you choose.
  </p>

  <label>Provider</label>
  <div class="ai-providers">
    {#each providerEntries as [key, p]}
      <button class="filter-pill" class:on={s.provider === key} on:click={() => setProvider(key)}>{p.label}</button>
    {/each}
  </div>

  {#if s.provider !== 'off'}
    <label>Endpoint (OpenAI-compatible)</label>
    <input value={s.baseUrl} on:input={(e) => setField('baseUrl', e.target.value)} placeholder="https://…/v1" spellcheck="false" autocomplete="off" />

    <label>Model</label>
    <input value={s.model} on:input={(e) => setField('model', e.target.value)} placeholder="e.g. llama3.2 · gpt-4o-mini" spellcheck="false" autocomplete="off" />

    {#if showKey}
      <label>API key</label>
      <input type="password" value={s.apiKey} on:input={(e) => setField('apiKey', e.target.value)} placeholder="sk-…" spellcheck="false" autocomplete="off" />
      <p class="ai-note">Stored only in this browser — never included in any export.</p>
    {/if}

    <div class="ai-test">
      <button class="btn" on:click={runTest} disabled={testState === 'testing' || !s.baseUrl || !s.model}>
        {testState === 'testing' ? 'Testing…' : 'Test connection'}
      </button>
      {#if testState === 'ok'}<span class="ai-status ok">✓ Connected</span>{/if}
      {#if testState === 'error'}<span class="ai-status err">✗ {testMsg || 'Failed'}</span>{/if}
    </div>

    {#if s.provider === 'ollama'}
      <p class="ai-note">Run <kbd>ollama serve</kbd> and <kbd>ollama pull {s.model || 'llama3.2'}</kbd>. If the browser is blocked by CORS, start Ollama with <code>OLLAMA_ORIGINS=*</code>.</p>
    {/if}
  {/if}
</Modal>
