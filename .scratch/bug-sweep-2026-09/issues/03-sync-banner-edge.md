# 03 — Sync banner blends into the page gradient
Status: resolved
Type: task

**Symptom.** IMG_3548: "Everything is synchronised" banner's right half is invisible against the background.

**Root cause.** `--success-surface` = `--p-green-50` (L 97.9%). `--bg` runs lavender → white; at the right the
two are ~equal luminance. The banner has no border or shadow.

**Fix.** `SyncBanner` gets `border` per tone (`--success-border` etc. — add tokens if missing) so the edge holds on
any stop of the gradient. Rule in CODE_STYLE §5: a surface on the page gradient needs an edge.

## Answer
Four tokens `--info/success/warning/danger-border` (mixed from each tone's ink, so theme/scene remaps carry them) in `tokens.css`; `SyncBanner`, `OfflineNotice`, bible `DuplicatesBanner` wear `border` + tone border. Rule in CODE_STYLE §5. Tests: `SyncBanner.test.tsx`, `OfflineNotice.test.tsx`, `styles/tokens.test.ts`.
