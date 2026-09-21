# 10 — Card styles ignore the dark theme
Status: resolved
Type: grilling

Presets hardcode light skins; only `plain` follows tokens; `chrome: 'light'` forces light scene chrome. Decide:
per-preset dark skin, or `plain` + picker page only.

## Answer
Decision (the user overruled the CODE_STYLE exception): every printed preset carries a `dark`
rendition — the same material dimmed and re-inked, never a different material — and always lights
its chrome from the dark block. `plain` stays token-driven. `resolveCardStyle` / `resolveCardScene`
/ `cardSceneChrome` take a `ColorScheme`; `CardScene`, `CardFace` and `StylePreview` read it from
`useColorScheme()`, which watches `data-theme` on the document (one MutationObserver for the app).

Two more surfaces were following the OS rather than the app: sonner's `theme="system"` and the
media-matched `<meta name="theme-color">` pair. Both now take the app's own scheme. §5 rewritten.
Tests: `card-style.test.ts` (every preset × both schemes), `color-scheme.test.ts`,
`CardScene.test.tsx`, `CardFace.test.tsx`, `ThemeProvider.test.tsx`.
