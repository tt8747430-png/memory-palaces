import { STATUS_BAR } from '@/shared/config/status-bar'
import type { ColorScheme } from './color-scheme'

/**
 * The `theme-color` metas: what the app tells a platform about its status bar. iOS paints the
 * installed app's bar from them and Android tints its own (ADR 0007). The build writes one per OS
 * scheme; a theme the learner chose overrides both, so every meta carries the painted scheme's
 * colour, whatever its `media` says.
 */

const themeColorMetas = () => document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')

export function paintStatusBar(scheme: ColorScheme): void {
  for (const meta of themeColorMetas()) meta.content = STATUS_BAR[scheme]
}

/** Every `theme-color` meta's colour, in document order. */
export function readThemeColors(): string[] {
  return [...themeColorMetas()].map((meta) => meta.content.trim())
}
