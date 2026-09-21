/**
 * How far the `:focus-visible` ring in `theme.css` draws outside a control's box: a 3px outline on a
 * 2px offset. A ring is part of the control's footprint — a sibling closer than this collides with it,
 * and a `clip-path`, `overflow: hidden` or wipe on an ancestor cuts it off unless it insets by this
 * much in the other direction (CODE_STYLE §5).
 */
export const FOCUS_RING_OVERSHOOT = 5
