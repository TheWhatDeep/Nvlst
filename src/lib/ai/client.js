/* ==========================================================
   AI CLIENT — one OpenAI-compatible chat call, used by every
   provider (BYOK clouds AND local Ollama speak this protocol).
   Asks for JSON and parses defensively.
   ========================================================== */
import { get } from 'svelte/store'
import { aiSettings, PROVIDERS } from './settings.js'

function resolve() {
  const s = get(aiSettings)
  const preset = PROVIDERS[s.provider] || {}
  return {
    provider: s.provider,
    baseUrl: (s.baseUrl || preset.baseUrl || '').replace(/\/+$/, ''),
    model: s.model || preset.model || '',
    apiKey: (s.apiKey || '').trim(),
  }
}

function parseJSON(text) {
  if (!text) throw new Error('Empty response from the model.')
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = (fenced ? fenced[1] : text).trim()
  try { return JSON.parse(body) } catch (e) {
    const m = body.match(/[{[][\s\S]*[}\]]/)
    if (m) { try { return JSON.parse(m[0]) } catch (e2) {} }
    throw new Error('The model did not return valid JSON.')
  }
}

/* Send system+user messages to /chat/completions, return parsed JSON. */
export async function chatJSON({ system, user, signal } = {}) {
  const { baseUrl, model, apiKey } = resolve()
  if (!baseUrl || !model) throw new Error('No AI provider configured.')

  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey

  let res
  try {
    res = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
  } catch (e) {
    // network/CORS failures land here
    throw new Error('Could not reach the endpoint (network or CORS). ' + (e.message || ''))
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${t ? ' — ' + t.slice(0, 240) : ''}`)
  }

  const data = await res.json().catch(() => null)
  const content = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : ''
  return parseJSON(content)
}

/* Quick connectivity + JSON-mode check for the settings panel. */
export async function testConnection() {
  const r = await chatJSON({
    system: 'You are a JSON API. Respond with exactly: {"ok": true}',
    user: 'Respond with {"ok": true}.',
  })
  return !!(r && (r.ok === true || r.ok === 'true' || r.ok === 1))
}
