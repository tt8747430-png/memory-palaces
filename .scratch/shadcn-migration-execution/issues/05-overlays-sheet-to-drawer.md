# 05 — Overlays: Sheet family → Base UI Drawer

Type: task (behavior-sensitive — iOS verification)
Blocked by: 03
Status: open

## Question

Execute handoff §3 overlays (cluster 07):

- Rebuild `Sheet` / `PromptSheet` / `ActionSheet` on **Base UI `Drawer`** (native swipe + snap +
  `VirtualKeyboardProvider`).
- **Delete `use-drag-to-dismiss`** (`shared/ui/use-drag-to-dismiss.ts`) — replaced by Drawer native
  swipe (10). Remove its barrel export + any imports.
- iOS: `Drawer.VirtualKeyboardProvider` must preserve the keyboard behavior `vaul`'s
  `repositionInputs` gave (handoff §4 risk) — **flag for on-device iOS verification**.

⚠ Do **not** remove `vaul` from `package.json` yet — that happens in ticket 11 after all Sheet call
sites (widgets 07/08) are off it. Verify gate green.
