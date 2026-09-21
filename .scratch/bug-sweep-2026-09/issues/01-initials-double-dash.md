# 01 — Initials mode doubles a connector-only token
Status: resolved
Type: task

**Symptom.** Front text `…neamuri – o nebunie,` → initials `…n –– o n,` (IMG_3545/3546).

**Root cause.** `shared/lib/recall.ts` `wordInitial`: for a token with no letter/digit (`–`), the `lead` regex
`^[^\p{L}\p{N}]*` and the `trail` regex `[^\p{L}\p{N}]*$` both match the whole token; `core` is empty, so the
render prints `lead + initial + trail` = `––`.

**Fix.** When the token has no core, it is all lead (or all trail) — never both. Test: `wordInitial('–')`,
`wordInitial('—')`, `wordInitial('...')`.

## Answer
`wordInitial` returns early when the lead regex consumed the whole token. Test: `recall.test.ts` "prints a token with no letters once".
