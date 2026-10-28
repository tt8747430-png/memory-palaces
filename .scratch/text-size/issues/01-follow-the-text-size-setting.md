# 01 — Follow the device's text-size setting

Status: needs-triage
Type: task

`PRODUCT.md` once promised that type follows the OS text-size setting. It doesn't: the type scale is fixed in pixels
(`--p-text-*` in `src/styles/tokens.css`), so a larger system text size changes nothing.

To build:

1. Express the type scale in `rem`, so the browser's text size (Android, desktop) scales it.
2. On iOS, a home-screen app gets Dynamic Type only through `font: -apple-system-body` on the root. Decide whether to
   adopt it, and cap the scale so fixed-height chrome (header, bottom nav, the study footer) still fits.
3. Check every screen at the largest size on an iPhone and at 200% browser text: nothing clipped, the header height
   unchanged (ADR 0002).
