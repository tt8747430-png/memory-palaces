/**
 * A flow element that grows the scroll surface by the on-screen keyboard's height (`--kb-inset`,
 * published by `useKeyboardInset`). Place it as the last child of a scroll container so its lower
 * content can be scrolled up clear of the keyboard.
 *
 * Preferred over a bottom `padding` on the scroller: a scroll container that is also a flex
 * container does not reliably include its bottom padding in the scrollable area (a long-standing
 * Safari/Chromium quirk), whereas a real child with an explicit height always counts. The height
 * already includes the native form accessory bar, since it comes from the visual viewport.
 */
export function KeyboardSpacer() {
  return <div aria-hidden className="shrink-0" style={{ height: 'var(--kb-inset, 0px)' }} />
}
