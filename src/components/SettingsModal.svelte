<script>
  import { createEventDispatcher } from 'svelte'
  import Modal from './Modal.svelte'
  import { I } from '../lib/core/icons.js'
  import { theme, applyTheme, font, applyFont, FONTS } from '../lib/theme.js'
  import { aiSettings, PROVIDERS } from '../lib/ai/settings.js'
  import { testConnection } from '../lib/ai/client.js'
  import logoUrl from '../../asset/logo.png'

  /* ── About metadata (kept here so settings is the single source) ── */
  const CREATOR = 'TheWhatDeep'
  const REPO_URL = 'https://github.com/TheWhatDeep/Nvlst'
  const SUPPORT_URL = 'https://www.buymeacoffee.com/TheWhatDeep'
  const SUPPORT_IMG =
    'https://img.buymeacoffee.com/button-api/?text=support my code!&emoji=💻&slug=TheWhatDeep&button_colour=4f4f4f&font_colour=ffffff&font_family=Bree&outline_colour=ffffff&coffee_colour=FFDD00'
  const APP_VERSION = '0.1.0'

  const dispatch = createEventDispatcher()
  const close = () => dispatch('close')

  export let initialTab = 'appearance'
  let tab = initialTab

  const TABS = [
    { id: 'appearance', label: 'Appearance', icon: 'sun' },
    { id: 'ai', label: 'AI assistant', icon: 'sparkles' },
    { id: 'about', label: 'About', icon: 'info' },
  ]

  const fontEntries = Object.entries(FONTS)
  const providerEntries = Object.entries(PROVIDERS)

  let testState = 'idle' // idle | testing | ok | error
  let testMsg = ''

  function setProvider(p) {
    const preset = PROVIDERS[p] || {}
    aiSettings.update((a) => ({ ...a, provider: p, baseUrl: preset.baseUrl || '', model: preset.model || '' }))
    testState = 'idle'; testMsg = ''
  }
  function setField(field, value) {
    aiSettings.update((a) => ({ ...a, [field]: value }))
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

<Modal title="Settings" size="wide" on:close={close}>
  <div class="settings-tabs">
    <nav class="set-nav" role="tablist" aria-label="Settings sections">
      {#each TABS as t}
        <button
          class="set-nav-item"
          class:on={tab === t.id}
          role="tab"
          aria-selected={tab === t.id}
          on:click={() => (tab = t.id)}
        >
          <span class="icon">{@html I[t.icon]}</span>
          <span>{t.label}</span>
        </button>
      {/each}
    </nav>

    <div class="set-pane" role="tabpanel">
      <div class="set-tab" class:on={tab === 'appearance'} aria-hidden={tab !== 'appearance'}>
        <div class="set-section-label">Theme</div>
        <div class="set-pills">
          <button class="filter-pill" class:on={$theme === 'light'} on:click={() => applyTheme('light')}>
            <span class="icon">{@html I.sun}</span> Light
          </button>
          <button class="filter-pill" class:on={$theme === 'dark'} on:click={() => applyTheme('dark')}>
            <span class="icon">{@html I.moon}</span> Dark
          </button>
        </div>

        <div class="set-section-label">Font</div>
        <div class="set-pills">
          {#each fontEntries as [key, f]}
            <button class="filter-pill" class:on={$font === key} on:click={() => applyFont(key)} style="font-family:{f.serif}">{f.label}</button>
          {/each}
        </div>

      </div>

      <div class="set-tab" class:on={tab === 'ai'} aria-hidden={tab !== 'ai'}>
        <p class="muted" style="margin:0 0 14px;font-size:12.5px">
          Opt-in, bring-your-own-engine. <b>Local · Ollama</b> keeps everything on your machine; otherwise your
          prose and key stay in your browser and go only to the provider you choose.
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
          {#if s.provider === 'gemini'}
            <p class="ai-note">Gemini can't be called directly from a browser (Google CORS), so this routes through <b>OpenRouter</b> — use an <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">OpenRouter key</a> with a <code>google/…</code> model.</p>
          {/if}
        {/if}

      </div>

      <div class="set-tab" class:on={tab === 'about'} aria-hidden={tab !== 'about'}>
        <div class="about">
          <div class="about-hero">
            <img class="about-logo" src={logoUrl} alt="Nvlst" />
            <div>
              <div class="about-name">Nvlst</div>
              <div class="about-tag">A quiet place to write your novel.</div>
            </div>
          </div>

          <p>
            Nvlst keeps your prose front and center, with a linked cast — characters, places, events,
            items, and groups — right alongside it. Type <kbd>@</kbd> to weave them into your scenes, and
            your story bible builds itself as you write.
          </p>

          <ul class="about-points">
            <li><span class="ap-ico icon">{@html I.book}</span><span><b>Writing first.</b> The editor is the stage; everything else stays out of the way.</span></li>
            <li><span class="ap-ico icon">{@html I.save}</span><span><b>Private &amp; local.</b> Your manuscript lives in your browser — no account, no cloud. It autosaves as you go, and you can export a backup anytime.</span></li>
            <li><span class="ap-ico icon">{@html I.link}</span><span><b>A living cast.</b> @-mention entities in the prose; rename or remove them and the links keep up.</span></li>
            <li><span class="ap-ico icon">{@html I.sparkles}</span><span><b>Optional AI, on your terms.</b> Switch on a private assistant powered by your own local model or API key — opt-in, off by default, and nothing is sent anywhere you didn't choose.</span></li>
          </ul>

          <div class="about-support">
            <p class="as-line">
              Nvlst is built and maintained by <b>{CREATOR}</b>. If it helps your writing, you can support
              its development — it genuinely means a lot. 💛
            </p>
            <a class="donate-bmc" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" aria-label="Support my code on Buy Me a Coffee">
              <img src={SUPPORT_IMG} alt="Support my code — Buy Me a Coffee" />
            </a>
          </div>

          <div class="about-foot">
            {#if REPO_URL}<a href={REPO_URL} target="_blank" rel="noopener noreferrer">Source on GitHub</a><span aria-hidden="true">·</span>{/if}
            <span>v{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</Modal>
