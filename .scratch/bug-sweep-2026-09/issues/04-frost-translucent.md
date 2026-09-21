# 04 — `frost` card style is translucent; the stack shows through
Status: resolved
Type: task

**Symptom.** IMG_3537: three cards' text visible at once on the front card.

**Root cause.** `shared/lib/card-style/presets.ts` `frost.bg` is `rgba(255,255,255,0.44–0.74)` — the only
preset with alpha in its face. The study stack draws two cards behind the front one.

**Fix.** Opaque face for `frost` (keep the frosted look via border/highlight); a test asserts no preset face
carries alpha. Rule: card faces are opaque.

## Answer
`frost.bg` is opaque (grain + highlight over solid warm glass). `card-style.test.ts` "paints every face on an opaque base" refuses alpha in any preset's base layer. Rule in CODE_STYLE §5.
