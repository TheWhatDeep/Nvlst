# Tauri v2 Spike — Run Instructions

This is a **throwaway evaluation setup**: the existing Nvlst Svelte/Vite app wrapped in a Tauri v2 native window so you can hand-test the ProseMirror editor across macOS WebKit and Windows WebView2 before committing to Tauri vs Electron.

**No app code was modified.** Persistence is still localStorage. The shell is close-to-default Tauri config pointing at the existing Vite dev server and `dist/` build output.

---

## What got added

| Path | Purpose |
|---|---|
| `src-tauri/` (entire directory) | Tauri v2 scaffold — Rust shell, config, default icons |
| `src-tauri/tauri.conf.json` | Wired to `http://localhost:5173` (Vite dev) and `../dist` (Vite build). Window 1200×800, min 720×480, centered. Identifier `com.thewhatdeep.nvlst` |
| `src-tauri/Cargo.toml` | Rust deps — `tauri@2.11.2`, `tauri-build@2.6.2`, default plugin-log |
| `src-tauri/src/{main,lib}.rs` | Default Tauri entry point. Untouched. No custom commands. |
| `src-tauri/capabilities/default.json` | Default permissions (`core:default`) |
| `package.json` → `devDependencies` | Added `@tauri-apps/cli@^2.11.2` |
| `package.json` → `scripts` | Added `tauri:dev` and `tauri:build` |
| `package-lock.json` | Updated by the install |

**Existing app source: zero changes.** No Svelte components, ProseMirror code, stores, or persistence touched.

---

## Prerequisites

### macOS

1. **Xcode Command Line Tools** — `xcode-select --install`
2. **Rust** (via rustup) — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`, then restart your shell so `cargo`/`rustc` are on `PATH`.

WebKit is built into macOS, no extra install needed.

### Windows (PowerShell)

Confirmed on your machine: **WebView2 148.x is already installed** ✓. You still need:

1. **Visual Studio Build Tools** with the *Desktop development with C++* workload (provides MSVC + Windows SDK that Rust needs to link binaries). Download:

   ```powershell
   Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_BuildTools.exe" -OutFile "$env:TEMP\vs_BuildTools.exe"
   Start-Process -Wait -FilePath "$env:TEMP\vs_BuildTools.exe"
   ```

   In the installer, check **Desktop development with C++**, then Install.

2. **Rust** (via rustup):

   ```powershell
   Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
   & "$env:TEMP\rustup-init.exe"
   ```

   Accept the default install. After it finishes, **open a new PowerShell window** so `cargo`/`rustc` are on `PATH`.

Sanity-check from this project's directory:

```powershell
npx tauri info
```

You should see `✔ WebView2`, `✔ rustc`, `✔ Cargo` (and no `✘` rows under Environment).

---

## Run

From the project root (`S:\Coding Projects\Nvlist`):

### Dev (hot-reload, DevTools enabled)

```powershell
npm run tauri:dev
```

What this does:
1. Tauri runs `npm run dev` (Vite dev server on `http://localhost:5173`).
2. Tauri compiles the Rust shell. **First build is slow** — ~3–5 min while Cargo fetches and compiles ~200 crates. Subsequent runs are seconds.
3. A native window opens loading the Vite dev server. Save a file → HMR works just like in the browser.
4. **DevTools**: right-click in the window → *Inspect Element*, or press `F12` (Windows) / `Cmd+Opt+I` (macOS). Available in dev builds by default; **off** in release.

### Production-bundle build

```powershell
npm run tauri:build
```

Produces native installers under `src-tauri\target\release\bundle\`:
- **macOS**: `.app` + `.dmg`
- **Windows**: `.msi` and `.exe` (NSIS)

No code signing or notarization — installers will trigger OS warnings on download. That's expected for a spike; signing comes in a separate task only if the go/no-go is PASS.

---

## Boot confirmation

I did not visually confirm the window opens — Rust + VS Build Tools aren't installed yet, and `tauri dev` is blocking with a 3-5 min first compile that I can't observe through. Pre-flight checks I *was* able to do:

- ✅ `npx tauri info` reports correct `frontendDist`, `devUrl`, framework (Svelte), bundler (Vite)
- ✅ WebView2 detected
- ✅ Tauri CLI 2.11.2 installed and wired
- ✅ `tauri.conf.json` schema-valid
- ✅ No app source modified (verified by diff scope)

Once you've installed Rust + VS Build Tools, run `npm run tauri:dev`. **The whole point of this spike is for you to torture-test the editor in the native WebView yourself** — my pre-flight isn't a substitute for your judgment in the checklist.

---

## Reversibility — clean removal

If the editor fails the go/no-go and you want to delete the spike:

```powershell
# 1. Remove the Tauri shell
Remove-Item -Recurse -Force src-tauri

# 2. Remove the SPIKE_RUN.md (this file)
Remove-Item SPIKE_RUN.md

# 3. Strip the Tauri scripts from package.json — open it and delete these lines:
#    "tauri:dev": "tauri dev",
#    "tauri:build": "tauri build"
#    Then delete: "@tauri-apps/cli": "^2.11.2"  from devDependencies

# 4. Refresh node_modules so the CLI is actually gone
npm install
```

That's it. The original Svelte/Vite app is exactly as it was before the spike.

---

## What's deliberately NOT in this spike

(All listed in the spike prompt — repeated here for clarity)

- ❌ No filesystem persistence migration (still localStorage)
- ❌ No code signing / notarization / auto-update
- ❌ No Linux target
- ❌ No custom Rust commands
- ❌ No app feature changes
- ❌ No bundler/build-system changes beyond what Tauri strictly needs

All of the above are separate tasks if the spike PASSES.
