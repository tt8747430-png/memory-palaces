# 10 — Widgets: App shell (cluster 15)

Type: task
Blocked by: 04
Status: resolved

## Question

Execute handoff §3 Widgets / cluster 15:

- `bottom-nav` / `splash` **keep-domain** (no shadcn nav part).
- Inner controls re-point onto migrated `Button`.
- `WordReveal` kept.

Verify gate green.

## Answer

Landed (no code change). Gate: shell tests **2/2**, full suite **540/540**.

- **bottom-nav/AppNav** — keep-domain: TanStack Router tab bar (motion + lucide), no shadcn nav part,
  no Button candidate (tabs are bespoke nav items).
- **splash/SplashOverlay** — keep-domain: the "Skip" control is an intentional ghost-text link on the
  brand gradient (`text-white/75`), not a filled `Button` — repointing it would look wrong. `WordReveal`
  kept.
- **"Inner controls → migrated Button":** nothing to repoint — no shell component imported an old
  `./button`/`./IconButton`; every real Button/IconButton consumer already resolves through the
  migrated barrel. Un-migrated-usage scan (bottom-nav/splash/RootLayout/SpeedDial) found none.
  **Unblocks 11.**
