# 06 — SwipeRow gesture-layer rebuild

Type: task (behavior-sensitive — swipe feel)
Blocked by: 02
Status: open

## Question

Execute handoff §3 "Keep-domain, rebuild internals" (cluster 10): keep the `SwipeRow` /
`swipe-actions` domain surface, but move its gesture layer **off raw pointer events onto
`@use-gesture` (`useDrag`)** + the tested `gestures.ts` commit math (zero new dep; retires the inline
`clampOffset`, gives dead `gestures.ts` a consumer).

- Verify swipe-to-action feel is unchanged: arm/commit thresholds, fling velocity, tap-vs-drag
  (`filterTaps`). `gestures.test` covers the commit math it now adopts (handoff §4/§5).
- **Flag for behavior verification.** Verify gate green.
