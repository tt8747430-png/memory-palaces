import { THEME_COLOR_METAS } from '@/shared/config/status-bar'

/** The `theme-color` metas the build writes ahead of `index.html`'s boot script, in the document. */
export function writeBuiltThemeColors(): HTMLMetaElement[] {
  return THEME_COLOR_METAS.map((attrs) => {
    const meta = document.createElement('meta')
    for (const [name, value] of Object.entries(attrs)) meta.setAttribute(name, value)
    document.head.append(meta)
    return meta
  })
}

export function removeThemeColors(): void {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove())
}
