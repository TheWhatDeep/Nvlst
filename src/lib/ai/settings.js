/* ==========================================================
   AI SETTINGS — opt-in, bring-your-own-engine.
   Stored in its OWN localStorage key (never in the project file,
   so an API key is never exported). The assistant is off by default.
   ========================================================== */
import { writable, get } from 'svelte/store'

const KEY = 'nvlist:ai:v1'

/* OpenAI-compatible providers. Local (Ollama) keeps everything on the
   user's machine; the BYOK options call the provider directly from the
   browser. "custom" lets advanced users point at any compatible endpoint. */
export const PROVIDERS = {
  off:        { label: 'Off',                      baseUrl: '',                              model: '',                                    needsKey: false },
  ollama:     { label: 'Local · Ollama',           baseUrl: 'http://localhost:11434/v1',     model: 'llama3.2',                            needsKey: false },
  openai:     { label: 'OpenAI',                   baseUrl: 'https://api.openai.com/v1',     model: 'gpt-4o-mini',                         needsKey: true  },
  openrouter: { label: 'OpenRouter',               baseUrl: 'https://openrouter.ai/api/v1',  model: 'meta-llama/llama-3.2-3b-instruct',    needsKey: true  },
  gemini:     { label: 'Gemini · via OpenRouter',  baseUrl: 'https://openrouter.ai/api/v1',  model: 'google/gemini-2.5-flash',             needsKey: true  },
  custom:     { label: 'Custom (compatible)',      baseUrl: '',                              model: '',                                    needsKey: false },
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...defaults(), ...JSON.parse(raw) } } catch (e) {}
  return defaults()
}
function defaults() { return { provider: 'off', baseUrl: '', model: '', apiKey: '' } }

export const aiSettings = writable(load())

// persist on every change (local only)
aiSettings.subscribe((v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch (e) {} })

export function isAiEnabled() { return get(aiSettings).provider !== 'off' }
