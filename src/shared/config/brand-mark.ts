/**
 * The Mindscape mark — the threshold of a memory palace: a pediment, two columns, and between them a
 * doorway with the light on. The method of loci starts at a door; this is the door, lit.
 *
 * One drawing, read by every renderer: `Threshold` draws it in the app, and `scripts/brand` draws the
 * app icons, the favicon, the iOS launch screens and the page the browser paints before the app has
 * loaded. Change it here and run `npm run brand:assets`. No React, no DOM: the build reads this too.
 *
 * Coordinates are a 200 × 200 box. Hex, because the build renders without a stylesheet.
 */

export const MARK_BOX = 200

export interface Arch {
  /** Left and right edges. The crown is a half circle across them. */
  x0: number
  x1: number
  /** Top of the crown and the sill. */
  top: number
  bottom: number
}

/** An arched outline, closed across the sill. */
export function archPath({ x0, x1, top, bottom }: Arch): string {
  const r = (x1 - x0) / 2
  const spring = top + r
  return `M${x0} ${bottom}V${spring}A${r} ${r} 0 0 1 ${x1} ${spring}V${bottom}Z`
}

export interface Bar {
  x: number
  y: number
  width: number
  height: number
  rx: number
}

export interface Pediment {
  apex: readonly [number, number]
  left: readonly [number, number]
  right: readonly [number, number]
  /** Stroked in its own colour with round joins, which softens the three corners by half of this. */
  round: number
}

export function pedimentPath({ apex, left, right }: Pediment): string {
  return `M${apex.join(' ')}L${right.join(' ')}L${left.join(' ')}Z`
}

export const MARK = {
  pediment: { apex: [100, 29], left: [35, 66], right: [165, 66], round: 6 },
  beam: { x: 36, y: 75, width: 128, height: 11, rx: 2.5 },
  capitals: [
    { x: 44, y: 92, width: 22, height: 7, rx: 2 },
    { x: 134, y: 92, width: 22, height: 7, rx: 2 },
  ],
  columns: [
    { x: 48, y: 102, width: 14, height: 42, rx: 2 },
    { x: 138, y: 102, width: 14, height: 42, rx: 2 },
  ],
  door: { x0: 76, x1: 124, top: 90, bottom: 144 },
  steps: [
    { x: 36, y: 150, width: 128, height: 9, rx: 2 },
    { x: 26, y: 165, width: 148, height: 9, rx: 2 },
  ],
} as const satisfies {
  pediment: Pediment
  beam: Bar
  capitals: readonly Bar[]
  columns: readonly Bar[]
  door: Arch
  steps: readonly [Bar, Bar]
}

/** The middle of the lit doorway, in the box. */
export const MARK_LIGHT_CENTER = { x: 100, y: 117 } as const

export type Stop = readonly [offset: number, color: string, opacity?: number]

export interface RadialPaint {
  cx: number
  cy: number
  r: number
  stops: readonly Stop[]
}

export const MARK_PAINT = {
  stone: '#ffffff',
  /** The warmth the doorway throws onto the air between the columns. */
  glow: {
    cx: 100,
    cy: 121,
    r: 46,
    stops: [
      [0, '#ffd77a', 0.5],
      [1, '#ffd77a', 0],
    ],
  },
  /** Champagne at the heart, honey at the jambs: lamplight, not a warning light. */
  light: {
    cx: 100,
    cy: 142,
    r: 52,
    stops: [
      [0, '#fffcf3'],
      [0.38, '#ffebb5'],
      [1, '#ffd166'],
    ],
  },
} as const satisfies {
  stone: string
  glow: RadialPaint
  light: RadialPaint
}

/** The app icon's box. Its paint is in these units. */
export const TILE_BOX = 1024

/** The app icon's ground: dusk at the top, the blue lifting toward the doorway. */
export const TILE_PAINT = {
  ground: [
    [0, '#091a7a'],
    [0.55, '#14359b'],
    [1, '#2d60cf'],
  ],
  bloom: {
    cx: 512,
    cy: 560,
    r: 470,
    stops: [
      [0, '#4f8eff', 0.5],
      [1, '#4f8eff', 0],
    ],
  },
} as const satisfies { ground: readonly Stop[]; bloom: RadialPaint }

/**
 * The launch frame: the mark on the chrome colour (`STATUS_BAR`), its box `SPLASH_MARK_PX` square at
 * the centre of the screen below the status bar. The iOS launch screens, the page painted before the
 * app loads and the splash's first frame are this one picture, so the hand-offs between them do not
 * show.
 */
export const SPLASH_MARK_PX = 176
