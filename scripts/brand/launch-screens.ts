/**
 * The iOS launch screens: what an installed Mindscape shows from the tap until the page paints. iOS
 * takes one only when an `apple-touch-startup-image` matches the screen exactly — size, pixel ratio,
 * orientation — so there is one per screen, per scheme. Phones run the app upright; tablets turn.
 *
 * `statusBar` is the bar's height in points: the web view starts below it (ADR 0007), so each launch
 * screen centres the mark in what is left, where the splash will draw it. A guess a few points off
 * shows as the same few points of drift at the hand-off, nothing worse.
 */

export type LaunchTheme = 'light' | 'dark'
export type Orientation = 'portrait' | 'landscape'

interface Screen {
  /** Portrait points, as `device-width` and `device-height` name them in either orientation. */
  width: number
  height: number
  ratio: 2 | 3
  statusBar: number
  tablet?: true
}

const SCREENS: readonly Screen[] = [
  { width: 375, height: 667, ratio: 2, statusBar: 20 }, // SE 2nd/3rd gen
  { width: 414, height: 896, ratio: 2, statusBar: 48 }, // 11, XR
  { width: 375, height: 812, ratio: 3, statusBar: 44 }, // 11 Pro, 12 mini, 13 mini
  { width: 414, height: 896, ratio: 3, statusBar: 44 }, // 11 Pro Max
  { width: 390, height: 844, ratio: 3, statusBar: 47 }, // 12, 13, 14, 16e
  { width: 428, height: 926, ratio: 3, statusBar: 47 }, // 12/13 Pro Max, 14 Plus
  { width: 393, height: 852, ratio: 3, statusBar: 59 }, // 14 Pro, 15, 15 Pro, 16
  { width: 430, height: 932, ratio: 3, statusBar: 59 }, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  { width: 402, height: 874, ratio: 3, statusBar: 62 }, // 16 Pro, 17, 17 Pro
  { width: 420, height: 912, ratio: 3, statusBar: 62 }, // Air
  { width: 440, height: 956, ratio: 3, statusBar: 62 }, // 16 Pro Max, 17 Pro Max
  { width: 744, height: 1133, ratio: 2, statusBar: 24, tablet: true }, // mini 6th gen+
  { width: 810, height: 1080, ratio: 2, statusBar: 24, tablet: true }, // 10.2″
  { width: 820, height: 1180, ratio: 2, statusBar: 24, tablet: true }, // Air 10.9″, 10th gen
  { width: 834, height: 1194, ratio: 2, statusBar: 24, tablet: true }, // Pro 11″, Air 11″
  { width: 834, height: 1210, ratio: 2, statusBar: 24, tablet: true }, // Pro 11″ M4
  { width: 1024, height: 1366, ratio: 2, statusBar: 24, tablet: true }, // Pro 12.9″, Air 13″
  { width: 1032, height: 1376, ratio: 2, statusBar: 24, tablet: true }, // Pro 13″ M4
]

export interface LaunchScreen {
  /** Path under `public/`, and the URL the page names it by. */
  file: string
  media: string
  theme: LaunchTheme
  /** The image in points, as it stands in this orientation. */
  width: number
  height: number
  ratio: number
  statusBar: number
}

const THEMES: readonly LaunchTheme[] = ['light', 'dark']

export const LAUNCH_SCREENS: readonly LaunchScreen[] = SCREENS.flatMap((screen) =>
  (screen.tablet ? (['portrait', 'landscape'] as const) : (['portrait'] as const)).flatMap(
    (orientation: Orientation) =>
      THEMES.map((theme): LaunchScreen => {
        const width = orientation === 'portrait' ? screen.width : screen.height
        const height = orientation === 'portrait' ? screen.height : screen.width
        return {
          file: `splash/launch-${width * screen.ratio}x${height * screen.ratio}-${theme}.png`,
          media: [
            'screen',
            `(device-width: ${screen.width}px)`,
            `(device-height: ${screen.height}px)`,
            `(-webkit-device-pixel-ratio: ${screen.ratio})`,
            `(orientation: ${orientation})`,
            `(prefers-color-scheme: ${theme})`,
          ].join(' and '),
          theme,
          width,
          height,
          ratio: screen.ratio,
          statusBar: screen.statusBar,
        }
      }),
  ),
)
