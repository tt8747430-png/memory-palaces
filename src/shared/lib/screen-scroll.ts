/**
 * Every screen's scroll surface. Deliberately plain: a scrollport needs no keyboard geometry of its
 * own. The keyboard costs range at the *bottom* (`.pb-keyboard`/`.pb-safe`, from `--kb-range`) and
 * nothing at the top — nothing offsets to survive a pan, because the app reveals its own fields
 * well enough that iOS has no reason to pan. ADR 0002, CODE_STYLE §11.
 *
 * Inner scrollers that are not a screen's scrollport (a preview box, a popup list) are not this.
 */
export const SCREEN_SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide'
