/* ==========================================================
   EXPORT / IMPORT (local-first, no backend)
   - Project: download / open a .nvlist.json (full backup).
   - Manuscript: a print-ready standalone .html (read it, or
     Ctrl/Cmd+P -> "Save as PDF"), and a plain .md text export.
   @-mention links are flattened to the entity's current name.
   ========================================================== */
import { get } from 'svelte/store'
import { project, setProject } from './state/project.js'
import { ui } from './state/ui.js'
import { applyTheme } from './theme.js'
import { notify } from './notify.js'
import { slug } from './core/util.js'
import { manuscriptWords } from './state/selectors.js'

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const esc = (s) =>
  (s == null ? '' : String(s)).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/* ---------- project backup ---------- */
export function exportProjectJSON() {
  project.update((p) => { p.meta.saved = Date.now(); return p })
  const p = get(project)
  download(slug(p.meta.title) + '.nvlist.json', JSON.stringify(p, null, 2), 'application/json')
  notify('Project downloaded — keep the .nvlist.json safe.', 'success')
}

export function importProjectFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json,.nvlist.json'
  input.onchange = () => {
    const f = input.files && input.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data || (!data.manuscript && !data.entities)) throw new Error("this doesn't look like an Nvlist project")
        setProject(data)
        ui.update((u) => ({ ...u, selectedSceneId: null, selectedEntityId: null }))
        applyTheme(get(project).meta.theme || 'light')
        notify(`Opened “${get(project).meta.title}”.`, 'success')
      } catch (e) {
        notify('Could not open that file: ' + e.message, 'error')
      }
    }
    reader.onerror = () => notify('Could not read that file — it may be corrupted.', 'error')
    reader.readAsText(f)
  }
  input.click()
}

/* ---------- doc rendering (flatten @-mentions to current names) ---------- */
function mentionName(node, p) {
  const e = p.entities.find((x) => x.id === node.attrs.id)
  return e ? e.name || node.attrs.label || '' : node.attrs.label || ''
}
function paraText(block, p) {
  return (block.content || [])
    .map((n) => (n.type === 'text' ? n.text || '' : n.type === 'mention' ? mentionName(n, p) : ''))
    .join('')
}
function inlineHTML(node, p) {
  if (node.type === 'text') {
    let t = esc(node.text || '')
    const marks = node.marks || []
    if (marks.some((m) => m.type === 'em')) t = `<em>${t}</em>`
    if (marks.some((m) => m.type === 'strong')) t = `<strong>${t}</strong>`
    return t
  }
  if (node.type === 'mention') return `<span class="ref">${esc(mentionName(node, p))}</span>`
  return ''
}
const paragraphs = (scene) => ((scene.body && scene.body.content) || []).filter((b) => b.type === 'paragraph')

/* ---------- manuscript: plain text (.md) ---------- */
export function exportManuscriptText() {
  const p = get(project)
  const out = ['# ' + (p.meta.title || 'Untitled Manuscript')]
  for (const ch of p.manuscript.chapters) {
    out.push('', '', '## ' + (ch.title || 'Untitled Chapter'))
    ch.scenes.forEach((sc, i) => {
      if (i > 0) out.push('', '* * *')
      const text = paragraphs(sc).map((b) => paraText(b, p)).filter((t) => t.trim()).join('\n\n')
      if (text) out.push('', text)
    })
  }
  download(slug(p.meta.title) + '.md', out.join('\n') + '\n', 'text/markdown')
  notify('Manuscript exported as text (.md).', 'success')
}

/* ---------- manuscript: print-ready HTML ---------- */
export function exportManuscriptHTML() {
  const p = get(project)
  const title = p.meta.title || 'Untitled Manuscript'
  const words = manuscriptWords(p)

  let body = ''
  for (const ch of p.manuscript.chapters) {
    let scenes = ''
    ch.scenes.forEach((sc, i) => {
      if (i > 0) scenes += '<div class="scene-break">⁂</div>\n'
      const paras = paragraphs(sc)
        .map((b) => `<p>${(b.content || []).map((n) => inlineHTML(n, p)).join('') || '<br>'}</p>`)
        .join('\n')
      scenes += paras || '<p><br></p>'
    })
    body += `<section class="chapter"><h2>${esc(ch.title || 'Untitled Chapter')}</h2>\n${scenes}</section>\n`
  }
  if (!body.trim()) body = '<p style="text-align:center;color:#9a8a6a"><em>This manuscript is empty.</em></p>'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#ece8e0;color:#1f1d1a;font-family:'Newsreader',Georgia,serif;line-height:1.7}
  .print-banner{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;background:#1f1d1a;color:#f3efe7;padding:11px 20px;font-size:14px}
  .print-banner svg{width:18px;height:18px;flex-shrink:0}
  .print-banner kbd{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);border-radius:4px;padding:1px 6px;font-family:ui-monospace,Menlo,monospace;font-size:12px}
  .print-banner button{margin-left:auto;background:#f3efe7;color:#1f1d1a;border:none;border-radius:6px;padding:7px 15px;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
  .print-banner button:hover{background:#fff}
  .manuscript{max-width:740px;margin:0 auto;padding:64px 56px 140px;background:#fffefb;box-shadow:0 1px 40px rgba(0,0,0,.08);min-height:100vh}
  .title-page{text-align:center;padding:50px 0 46px;border-bottom:1px solid #e7e1d6;margin-bottom:48px}
  .title-page h1{font-family:'Fraunces',Georgia,serif;font-size:46px;font-weight:600;margin:0;line-height:1.1;letter-spacing:-.01em}
  .title-page .byline{color:#6b5d44;font-style:italic;margin-top:14px;font-size:15px}
  .chapter h2{font-family:'Fraunces',Georgia,serif;font-size:27px;font-weight:600;text-align:center;margin:46px 0 30px}
  .manuscript p{margin:0 0 1.15em;font-size:18px}
  .scene-break{text-align:center;color:#9a8a6a;margin:1.7em 0;letter-spacing:.3em}
  .ref{color:#3f5e8c}
  @media print{
    body{background:#fff}
    .no-print{display:none !important}
    .manuscript{max-width:none;margin:0;padding:0;box-shadow:none;background:#fff}
    @page{margin:1in}
    .title-page{padding:32vh 0 0;border:none;page-break-after:always}
    .chapter{page-break-before:always}
    .chapter h2{margin-top:0}
    .manuscript p{font-size:12pt;line-height:1.55}
    .ref{color:inherit}
    .scene-break{color:#000}
  }
</style>
</head>
<body>
<div class="print-banner no-print">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
  <span>Printer-friendly — press <kbd>Ctrl/Cmd</kbd> + <kbd>P</kbd> and choose &ldquo;Save as PDF.&rdquo;</span>
  <button onclick="window.print()">Save as PDF</button>
</div>
<article class="manuscript">
  <header class="title-page">
    <h1>${esc(title)}</h1>
    <p class="byline">${words.toLocaleString()} ${words === 1 ? 'word' : 'words'}</p>
  </header>
  ${body}
</article>
</body>
</html>`

  download(slug(title) + '.html', html, 'text/html')
  notify('Manuscript exported as a print-ready web page (.html).', 'success')
}
