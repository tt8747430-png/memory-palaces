import type { CardStylePresetId } from './ids'
import { blades, clouds, contour, grain, granules, RULE_SPACING, stars, veins } from './materials'

/**
 * The semantic tokens the study session's chrome paints from. A printed scene remaps them for its
 * own subtree, so `StudySessionHeader`, the flag and speaker buttons, the mode and gear controls — every
 * one of which already reads these — stay legible on slate or on parchment without knowing a scene
 * exists. The values live in `tokens.css`, under `[data-scene='dark']` and `[data-scene='light']`,
 * beside the theme most of them mirror; this is the list they answer to.
 *
 * `--surface` is in the list because `bg-card` resolves to it: the type-answer field and the
 * direction chip sit inside the scene wearing `bg-card` with `text-foreground`, and remapping the
 * ink without the paper under it is how you get white text typed onto white. The tinted pairs are
 * there for the same reason one step out — the study session's grade buttons and the remaining
 * tallies are painted from them. So are the solid roles: the initials keypad is `bg-primary` with
 * `text-primary-foreground`, a wrong answer rings `ring-destructive`, and a starred card is
 * `fill-rating`. `--text-secondary` is in for a rule no utility names: base `p` is painted from it,
 * and the faces are full of paragraphs.
 *
 * `CHROME_TOKENS` is the whole set, and each scene block must answer for all of it —
 * `card-style.test.ts` holds the stylesheet to the list in both directions. The list itself is held
 * to the screen one layer up, by `widgets/study-session/ui/scene-chrome.test.ts`: it walks what
 * renders inside a `<CardScene>` and every semantic colour utility any of it wears has to resolve
 * to something in here, so a face that reaches for a new role fails rather than silently keeping
 * the app's own.
 */
export const CHROME_TOKENS = [
  '--surface',
  '--text-heading',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--surface-glass',
  '--info-surface',
  '--info-foreground',
  '--border',
  '--ring',
  '--primary',
  '--primary-foreground',
  '--accent',
  '--rating',
  '--secondary',
  '--secondary-foreground',
  '--success-surface',
  '--success-on-surface',
  '--warning-surface',
  '--warning-foreground',
  '--danger',
  '--danger-surface',
  '--danger-on-surface',
] as const

/**
 * Which of the two printed-chrome blocks in `tokens.css` a scene hands its subtree. One value, not
 * a table of colours: the colours belong in the stylesheet next to the theme they depart from.
 */
export type SceneChrome = 'dark' | 'light'

interface PresetSkin {
  bg: string
  ink: string
  border: string
  /** The screen the card is studied against. */
  scene: string
  /** Absent for the token-following presets — they inherit the app's own chrome unchanged. */
  chrome?: SceneChrome
}

/**
 * Every preset but `plain` is a printed surface, not app chrome: its colours are intrinsic to the
 * material and stay fixed in both themes — the exception CODE_STYLE §5 grants this file. `plain` is
 * the one that follows the theme's tokens, and its scene is the app's own backdrop.
 *
 * The order is the order of the strip, and it walks from the app's own paper out through daylight
 * to the printed stock and into the dark. `outlined` used to sit second: the theme's ink stroked
 * around the theme's paper, which in dark mode was a white rectangle drawn around a dark card and
 * read as a rendering fault. `bold` is that idea done as a material — a real poster stock with a
 * black keyline on orange — and it replaced it rather than reskinning it, so a deck that stored
 * `outlined` is migrated to `plain` (`deckMigrations[3]`).
 */
export const PRESETS: Record<CardStylePresetId, PresetSkin> = {
  plain: {
    // The card is the theme's own paper, opaque and nothing else — a white wash over it read as a
    // 60% highlight on a dark `--surface` in dark mode, which is the exception this preset is
    // explicitly outside. What separates it from the scene is its border and the card's shadow.
    bg: 'var(--surface)',
    ink: 'var(--text-heading)',
    border: '1px solid var(--border)',
    // The app's own backdrop, untouched. A vignette was drawn over it here for a while, which meant
    // a literal `rgba()` on the one preset whose whole job is to follow the tokens — and the panel
    // test had to be loosened off `toBe` to let it through. The scene is the token.
    scene: 'var(--bg-daylight)',
  },
  bold: {
    bg: '#fffdf6',
    ink: '#141416',
    border: '3px solid #141416',
    scene: `${grain(0.09, '0.6')}, radial-gradient(125% 95% at 50% 0%, #ffb84d, #f2951f 52%, #d87208)`,
    chrome: 'light',
  },
  frost: {
    // Translucent on purpose: the scene under it is one smooth gradient, so letting it through is
    // the frosted panel — no `backdrop-filter`, which would build a containing block inside the
    // study card's flip and is a blur of nothing here anyway.
    bg: 'linear-gradient(155deg, rgba(255,255,255,0.74), rgba(255,255,255,0.44) 55%, rgba(255,255,255,0.6))',
    ink: '#23252a',
    border: '1px solid rgba(255,255,255,0.62)',
    scene: `${grain(0.07, '0.75')}, linear-gradient(200deg, #f7ece0 0%, #d9cfc5 34%, #a7a29c 64%, #6c6b6a 100%)`,
    chrome: 'light',
  },
  sky: {
    bg: '#ffffff',
    ink: '#1c2430',
    border: '1px solid rgba(255,255,255,0.9)',
    scene: `${clouds(0.9)}, linear-gradient(180deg, #5fb0ea 0%, #8dc8f0 54%, #d2e7f8 100%)`,
    chrome: 'light',
  },
  meadow: {
    bg: `${grain(0.07, '0.7')}, linear-gradient(180deg, #fdfbf1, #f6f1e2)`,
    ink: '#2b3526',
    border: '1px solid rgba(255,255,255,0.74)',
    scene: `${blades(0.6)}, linear-gradient(180deg, #6a9744 0%, #467230 58%, #2b4c1f 100%)`,
    chrome: 'light',
  },
  marble: {
    bg: '#ffffff',
    ink: '#1b2a2e',
    border: '1px solid rgba(255,255,255,0.86)',
    scene: `${veins(0.52)}, ${grain(0.08, '0.8')}, linear-gradient(160deg, #82ccbf 0%, #4ea79b 46%, #2d7d74 100%)`,
    chrome: 'light',
  },
  notebook: {
    // The red margin rule a ruled pad actually has, drawn once at 2.25rem in, over blue rules at
    // the pad's own spacing.
    bg:
      'linear-gradient(90deg, transparent 2.25rem, rgba(214,90,90,0.38) 2.25rem calc(2.25rem + 1px), transparent calc(2.25rem + 1px)), ' +
      `repeating-linear-gradient(180deg, transparent 0 calc(${RULE_SPACING} - 1px), rgba(80,120,200,0.24) calc(${RULE_SPACING} - 1px) ${RULE_SPACING}), ` +
      `${grain(0.06, '0.72')}, linear-gradient(180deg, #fffdf8, #fdf6ec)`,
    ink: '#28303a',
    border: '1px solid rgba(80,120,200,0.28)',
    scene: `${grain(0.12, '0.62')}, linear-gradient(165deg, #eae3d5, #cec3af)`,
    chrome: 'light',
  },
  paper: {
    // A kraft index card pinned to a cork board, and the granules behind it are the pressed board
    // it hangs on.
    bg: `${grain(0.15, '0.62')}, linear-gradient(170deg, #f7e9cf, #e7d3ae)`,
    ink: '#4a3620',
    border: '1px solid rgba(120,90,50,0.3)',
    scene: `${granules(0.55)}, ${grain(0.16, '0.5')}, linear-gradient(165deg, #ca9c65, #a4753e)`,
    chrome: 'light',
  },
  parchment: {
    bg: `${grain(0.11, '0.68')}, radial-gradient(118% 96% at 50% 42%, transparent 54%, rgba(120,90,50,0.2)), radial-gradient(130% 110% at 40% 0%, #fbf3e2, #ecdcbe)`,
    ink: '#5a4021',
    border: '2px solid rgba(255,252,242,0.75)',
    scene: `${contour(0.5)}, ${grain(0.13, '0.55')}, radial-gradient(130% 110% at 50% 10%, #ddc79c, #b99a68)`,
    chrome: 'light',
  },
  chalk: {
    // The dust a board keeps in its corners, over a finer tooth than the slate behind it.
    bg: `${grain(0.22, '0.95')}, radial-gradient(120% 100% at 50% 50%, transparent 50%, rgba(255,255,255,0.06)), radial-gradient(125% 95% at 50% 0%, rgba(255,255,255,0.09), transparent 58%), linear-gradient(160deg, #3b4450, #212832)`,
    ink: '#f4f7f9',
    border: '1px solid rgba(255,255,255,0.16)',
    scene: `${grain(0.18, '0.86')}, linear-gradient(165deg, #2a313b, #13181d)`,
    chrome: 'dark',
  },
  night: {
    bg: `${grain(0.08, '0.95')}, radial-gradient(125% 95% at 50% 0%, rgba(146,160,255,0.13), transparent 58%), linear-gradient(165deg, #212739, #12151d)`,
    ink: '#e9edf6',
    border: '1px solid rgba(255,255,255,0.13)',
    // Two nebulae under the starfield, off-centre so the sky has a direction to it.
    scene: `${stars(0.9)}, radial-gradient(70% 55% at 22% 18%, rgba(122,88,220,0.4), transparent 70%), radial-gradient(80% 60% at 82% 74%, rgba(34,118,190,0.38), transparent 72%), radial-gradient(125% 95% at 50% 0%, #222a40, #090b12)`,
    chrome: 'dark',
  },
}
