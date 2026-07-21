# Cluster: Shell widgets rework

Type: grilling
Status: resolved
Blocked by: 04, 07, 08

## Question

Per-widget rework plan for app-shell chrome (kept domain per 08 app-shell verdict — no shadcn nav
equivalent — with inner controls rebuilt on migrated primitives):

- `bottom-nav` — keep domain; rebuild inner buttons on migrated `Button`; safe areas + thumb-zone
  (`MOBILE_DESIGN`).
- `splash` — keep domain; token/motion compliance only.

For each: primitives composed, domain markup retained, safe-area/`MOBILE_DESIGN` + PWA notes,
test impact.

## Answer

- `bottom-nav` (`AppNav`) → **keep (domain)** — no shadcn nav equivalent; rebuild inner tab buttons
  on migrated `Button`; honor safe-area + thumb-zone (`MOBILE_DESIGN`) and the PWA install/SW caveats.
  Only imports `cn` today, so the rebuild is light.
- `splash` (`SplashOverlay`) → **keep (domain)** — composes `WordReveal` (kept, 09, motion); token/
  motion compliance only, no shadcn part.

App-shell chrome stays domain; nothing new introduced. Tests (if any) updated.
