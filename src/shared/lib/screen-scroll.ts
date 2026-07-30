/**
 * Every scroll surface in the app. It is deliberately plain: a scrollport needs no keyboard
 * geometry of its own. The keyboard costs range at the *bottom* (`.pb-keyboard` / `.pb-safe`,
 * from `--kb-range`) and nothing at the top — the app no longer offsets anything to survive an
 * iOS pan, because it reveals its own fields well enough that iOS has no reason to pan. See
 * ADR 0002 and CODE_STYLE §11.
 */
export const SCREEN_SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide'
