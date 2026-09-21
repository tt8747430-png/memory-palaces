import type { CardStylePresetId } from './ids'
import { blades, clouds, contour, grain, granules, RULE_SPACING, stars, veins } from './materials'

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
  // A tinted surface's edge travels with its fill: a `var()` inside a custom property resolves
  // where the property is declared, so a scene that repaints the fill and not the edge keeps the
  // theme's edge over the scene's fill.
  '--info-border',
  '--success-border',
  '--warning-border',
  '--danger-border',
] as const

export type SceneChrome = 'dark' | 'light'

export interface PresetSkin {
  bg: string
  ink: string
  border: string
  scene: string
  chrome?: SceneChrome
  /**
   * The same material at night. Every printed preset has one: a slab of white paper is a lamp in
   * a dark room, and a learner who set the app to dark asked not to be handed one. It is the
   * material dimmed and re-inked, never a different material — chalk stays a blackboard, kraft
   * stays kraft. `plain` has none: it is made of tokens, which the theme already remaps.
   */
  dark?: Omit<PresetSkin, 'dark'>
}

export const PRESETS: Record<CardStylePresetId, PresetSkin> = {
  plain: {
    bg: 'var(--surface)',
    ink: 'var(--text-heading)',
    border: '1px solid var(--border)',
    scene: 'var(--bg-daylight)',
  },
  bold: {
    bg: '#fffdf6',
    ink: '#141416',
    border: '3px solid #141416',
    scene: `${grain(0.09, '0.6')}, radial-gradient(125% 95% at 50% 0%, #ffb84d, #f2951f 52%, #d87208)`,
    chrome: 'light',
    dark: {
      bg: `${grain(0.1, '0.6')}, linear-gradient(170deg, #17140e, #100e0a)`,
      ink: '#f8efd9',
      border: '3px solid #f2951f',
      scene: `${grain(0.1, '0.6')}, radial-gradient(125% 95% at 50% 0%, #4a2c07, #2c1a05 52%, #150d03)`,
      chrome: 'dark',
    },
  },
  frost: {
    // Opaque: the frosted pane is a highlight and grain on solid glass, not a see-through one —
    // the study stack sits behind the face and would show through any alpha (CODE_STYLE §5).
    bg: `${grain(0.06, '0.9')}, radial-gradient(120% 80% at 30% 0%, rgba(255,255,255,0.55), transparent 60%), linear-gradient(155deg, #f6f3ef, #e9e4df 55%, #efebe7)`,
    ink: '#23252a',
    border: '1px solid rgba(255,255,255,0.62)',
    scene: `${grain(0.07, '0.75')}, linear-gradient(200deg, #f7ece0 0%, #d9cfc5 34%, #a7a29c 64%, #6c6b6a 100%)`,
    chrome: 'light',
    dark: {
      bg: `${grain(0.06, '0.9')}, radial-gradient(120% 80% at 30% 0%, rgba(255,255,255,0.08), transparent 60%), linear-gradient(155deg, #2c3037, #22262c 55%, #272b31)`,
      ink: '#e9ebef',
      border: '1px solid rgba(255,255,255,0.14)',
      scene: `${grain(0.07, '0.75')}, linear-gradient(200deg, #2a2621 0%, #211f1d 34%, #191919 64%, #0f0f10 100%)`,
      chrome: 'dark',
    },
  },
  sky: {
    bg: '#ffffff',
    ink: '#1c2430',
    border: '1px solid rgba(255,255,255,0.9)',
    scene: `${clouds(0.9)}, linear-gradient(180deg, #5fb0ea 0%, #8dc8f0 54%, #d2e7f8 100%)`,
    chrome: 'light',
    dark: {
      bg: '#171d28',
      ink: '#dce5f1',
      border: '1px solid rgba(255,255,255,0.12)',
      scene: `${clouds(0.35)}, linear-gradient(180deg, #0f1c2e 0%, #17293f 54%, #22384f 100%)`,
      chrome: 'dark',
    },
  },
  meadow: {
    bg: `${grain(0.07, '0.7')}, linear-gradient(180deg, #fdfbf1, #f6f1e2)`,
    ink: '#2b3526',
    border: '1px solid rgba(255,255,255,0.74)',
    scene: `${blades(0.6)}, linear-gradient(180deg, #6a9744 0%, #467230 58%, #2b4c1f 100%)`,
    chrome: 'light',
    dark: {
      bg: `${grain(0.07, '0.7')}, linear-gradient(180deg, #1d251a, #161c14)`,
      ink: '#e3ebdb',
      border: '1px solid rgba(255,255,255,0.12)',
      scene: `${blades(0.4)}, linear-gradient(180deg, #1c2c13 0%, #12200d 58%, #0a1407 100%)`,
      chrome: 'dark',
    },
  },
  marble: {
    bg: '#ffffff',
    ink: '#1b2a2e',
    border: '1px solid rgba(255,255,255,0.86)',
    scene: `${veins(0.52)}, ${grain(0.08, '0.8')}, linear-gradient(160deg, #82ccbf 0%, #4ea79b 46%, #2d7d74 100%)`,
    chrome: 'light',
    dark: {
      bg: `${veins(0.2)}, ${grain(0.07, '0.8')}, linear-gradient(160deg, #1d2528, #171e20)`,
      ink: '#e5edef',
      border: '1px solid rgba(255,255,255,0.12)',
      scene: `${veins(0.22)}, ${grain(0.08, '0.8')}, linear-gradient(160deg, #123531 0%, #0d2926 46%, #071b19 100%)`,
      chrome: 'dark',
    },
  },
  notebook: {
    bg:
      'linear-gradient(90deg, transparent 2.25rem, rgba(214,90,90,0.38) 2.25rem calc(2.25rem + 1px), transparent calc(2.25rem + 1px)), ' +
      `repeating-linear-gradient(180deg, transparent 0 calc(${RULE_SPACING} - 1px), rgba(80,120,200,0.24) calc(${RULE_SPACING} - 1px) ${RULE_SPACING}), ` +
      `${grain(0.06, '0.72')}, linear-gradient(180deg, #fffdf8, #fdf6ec)`,
    ink: '#28303a',
    border: '1px solid rgba(80,120,200,0.28)',
    scene: `${grain(0.12, '0.62')}, linear-gradient(165deg, #eae3d5, #cec3af)`,
    chrome: 'light',
    dark: {
      bg:
        'linear-gradient(90deg, transparent 2.25rem, rgba(214,90,90,0.45) 2.25rem calc(2.25rem + 1px), transparent calc(2.25rem + 1px)), ' +
        `repeating-linear-gradient(180deg, transparent 0 calc(${RULE_SPACING} - 1px), rgba(130,160,220,0.2) calc(${RULE_SPACING} - 1px) ${RULE_SPACING}), ` +
        `${grain(0.06, '0.72')}, linear-gradient(180deg, #1c2029, #171a21)`,
      ink: '#dee4ee',
      border: '1px solid rgba(130,160,220,0.22)',
      scene: `${grain(0.12, '0.62')}, linear-gradient(165deg, #23211d, #171614)`,
      chrome: 'dark',
    },
  },
  paper: {
    bg: `${grain(0.15, '0.62')}, linear-gradient(170deg, #f7e9cf, #e7d3ae)`,
    ink: '#4a3620',
    border: '1px solid rgba(120,90,50,0.3)',
    scene: `${granules(0.55)}, ${grain(0.16, '0.5')}, linear-gradient(165deg, #ca9c65, #a4753e)`,
    chrome: 'light',
    dark: {
      bg: `${grain(0.15, '0.62')}, linear-gradient(170deg, #2c2318, #221a12)`,
      ink: '#e9dac2',
      border: '1px solid rgba(220,190,140,0.2)',
      scene: `${granules(0.4)}, ${grain(0.16, '0.5')}, linear-gradient(165deg, #3a2a18, #241a0f)`,
      chrome: 'dark',
    },
  },
  parchment: {
    bg: `${grain(0.11, '0.68')}, radial-gradient(118% 96% at 50% 42%, transparent 54%, rgba(120,90,50,0.2)), radial-gradient(130% 110% at 40% 0%, #fbf3e2, #ecdcbe)`,
    ink: '#5a4021',
    border: '2px solid rgba(255,252,242,0.75)',
    scene: `${contour(0.5)}, ${grain(0.13, '0.55')}, radial-gradient(130% 110% at 50% 10%, #ddc79c, #b99a68)`,
    chrome: 'light',
    dark: {
      bg: `${grain(0.11, '0.68')}, radial-gradient(118% 96% at 50% 42%, transparent 54%, rgba(0,0,0,0.35)), radial-gradient(130% 110% at 40% 0%, #2a2114, #1e180e)`,
      ink: '#e7d5b2',
      border: '2px solid rgba(231,213,178,0.22)',
      scene: `${contour(0.35)}, ${grain(0.13, '0.55')}, radial-gradient(130% 110% at 50% 10%, #2e2416, #1a1409)`,
      chrome: 'dark',
    },
  },
  chalk: {
    bg: `${grain(0.22, '0.95')}, radial-gradient(120% 100% at 50% 50%, transparent 50%, rgba(255,255,255,0.06)), radial-gradient(125% 95% at 50% 0%, rgba(255,255,255,0.09), transparent 58%), linear-gradient(160deg, #3b4450, #212832)`,
    ink: '#f4f7f9',
    border: '1px solid rgba(255,255,255,0.16)',
    scene: `${grain(0.18, '0.86')}, linear-gradient(165deg, #2a313b, #13181d)`,
    chrome: 'dark',
    dark: {
      bg: `${grain(0.22, '0.95')}, radial-gradient(120% 100% at 50% 50%, transparent 50%, rgba(255,255,255,0.05)), radial-gradient(125% 95% at 50% 0%, rgba(255,255,255,0.07), transparent 58%), linear-gradient(160deg, #2b323b, #171c22)`,
      ink: '#e6ebee',
      border: '1px solid rgba(255,255,255,0.13)',
      scene: `${grain(0.18, '0.86')}, linear-gradient(165deg, #1e232a, #0c0f12)`,
      chrome: 'dark',
    },
  },
  night: {
    bg: `${grain(0.08, '0.95')}, radial-gradient(125% 95% at 50% 0%, rgba(146,160,255,0.13), transparent 58%), linear-gradient(165deg, #212739, #12151d)`,
    ink: '#e9edf6',
    border: '1px solid rgba(255,255,255,0.13)',
    scene: `${stars(0.9)}, radial-gradient(70% 55% at 22% 18%, rgba(122,88,220,0.4), transparent 70%), radial-gradient(80% 60% at 82% 74%, rgba(34,118,190,0.38), transparent 72%), radial-gradient(125% 95% at 50% 0%, #222a40, #090b12)`,
    chrome: 'dark',
    dark: {
      bg: `${grain(0.08, '0.95')}, radial-gradient(125% 95% at 50% 0%, rgba(146,160,255,0.1), transparent 58%), linear-gradient(165deg, #181d2c, #0b0e14)`,
      ink: '#dfe4ef',
      border: '1px solid rgba(255,255,255,0.11)',
      scene: `${stars(0.75)}, radial-gradient(70% 55% at 22% 18%, rgba(122,88,220,0.3), transparent 70%), radial-gradient(80% 60% at 82% 74%, rgba(34,118,190,0.28), transparent 72%), radial-gradient(125% 95% at 50% 0%, #171d2e, #05070b)`,
      chrome: 'dark',
    },
  },
}
