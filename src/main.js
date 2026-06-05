import 'prosemirror-view/style/prosemirror.css'
import './app.css'
import App from './App.svelte'
import logoUrl from '../asset/logo.png'

// favicon (Vite bundles the asset → base-safe URL)
const favicon = document.createElement('link')
favicon.rel = 'icon'
favicon.type = 'image/png'
favicon.href = logoUrl
document.head.appendChild(favicon)

const app = new App({
  target: document.getElementById('app'),
})

export default app
