<script>
  import { createEventDispatcher } from 'svelte'
  import Modal from './Modal.svelte'
  import { I } from '../lib/core/icons.js'
  import logoUrl from '../../asset/logo.png'

  /* ── Customise these ──────────────────────────────────────────
     SUPPORT_URL: paste your donation link (Ko-fi / Buy Me a Coffee /
     GitHub Sponsors / PayPal). Leave '' to show the button disabled. */
  const CREATOR = 'TheWhatDeep'
  const REPO_URL = 'https://github.com/TheWhatDeep/Nvlist'
  const SUPPORT_URL = 'https://www.buymeacoffee.com/TheWhatDeep'
  // Official Buy Me a Coffee button image
  const SUPPORT_IMG =
    'https://img.buymeacoffee.com/button-api/?text=support my code!&emoji=💻&slug=TheWhatDeep&button_colour=4f4f4f&font_colour=ffffff&font_family=Bree&outline_colour=ffffff&coffee_colour=FFDD00'
  const APP_VERSION = '0.1.0'
  /* ─────────────────────────────────────────────────────────────*/

  const dispatch = createEventDispatcher()
  const close = () => dispatch('close')
</script>

<Modal title="About Nvlist" on:close={close}>
  <div class="about">
    <div class="about-hero">
      <img class="about-logo" src={logoUrl} alt="Nvlist" />
      <div>
        <div class="about-name">Nvlist</div>
        <div class="about-tag">A quiet place to write your novel.</div>
      </div>
    </div>

    <p>
      Nvlist keeps your prose front and center, with a linked cast — characters, places, events,
      items, and groups — right alongside it. Type <kbd>@</kbd> to weave them into your scenes, and
      your story bible builds itself as you write.
    </p>

    <ul class="about-points">
      <li><span class="ap-ico icon">{@html I.book}</span><span><b>Writing first.</b> The editor is the stage; everything else stays out of the way.</span></li>
      <li><span class="ap-ico icon">{@html I.save}</span><span><b>Private &amp; local.</b> Your manuscript lives in your browser — no account, no cloud. It autosaves as you go, and you can export a backup anytime.</span></li>
      <li><span class="ap-ico icon">{@html I.link}</span><span><b>A living cast.</b> @-mention entities in the prose; rename or remove them and the links keep up.</span></li>
    </ul>

    <div class="about-support">
      <p class="as-line">
        Nvlist is built and maintained by <b>{CREATOR}</b>. If it helps your writing, you can support
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
</Modal>
