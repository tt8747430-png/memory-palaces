import { describe, expect, it } from 'vitest'
import { CHROME_TOKENS } from '@/shared/lib'
import { readStylesheet } from '@/shared/test/stylesheet'
import sessionScreen from '@/shared/ui/SessionScreen.tsx?raw'

/**
 * `CHROME_TOKENS` is only as complete as the chrome that reads it. The other tests check the tables
 * against the list; this one checks the list against the screen — a face that reaches for a role no
 * printed scene repaints keeps the app's own value inside a `night` or `chalk` scene, which is the
 * white-on-white bug one step out (CODE_STYLE §5).
 *
 * Nothing is hand-listed. The roles come from the source of whatever renders inside `<CardScene>`,
 * and what each role resolves to comes from `@theme inline` — `--color-primary: var(--primary)` is
 * what makes `bg-primary` a question about `--primary`.
 */

/**
 * Everything under this folder is inside the scene except the surfaces that portal to the body —
 * sheets and the completion overlay — and the rows that only ever render inside one. Those belong
 * to the app, not the deck, and keep the app's chrome on purpose.
 */
const OUTSIDE_THE_SCENE =
  /\.test\.tsx$|Sheet(Section)?\.tsx$|CompletionOverlay|QuickActionRows|FinishStudySessionButton|StudyFilterChips/

const scanned = Object.entries(
  import.meta.glob('./**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >,
)
  .filter(([path]) => !OUTSIDE_THE_SCENE.test(path))
  // The header is shared, but it is drawn inside the scene like everything else here.
  .concat([['@/shared/ui/SessionScreen.tsx', sessionScreen]])

/** `bg-`, `text-`, `ring-` … the prefixes that paint with a colour role. */
const PAINTS =
  /\b(?:bg|text|border|ring|fill|stroke|divide|outline|placeholder|caret|accent|from|via|to|decoration|shadow)-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g

const roleToken = new Map(
  [...readStylesheet('theme.css').matchAll(/--color-([a-z0-9-]+):\s*var\((--[a-z0-9-]+)\)/g)].map(
    ([, role, token]) => [role, token] as const,
  ),
)

describe('scene chrome', () => {
  it('reads the role map out of the stylesheet', () => {
    expect(roleToken.size).toBeGreaterThan(10)
    expect(roleToken.get('primary')).toBe('--primary')
    expect(scanned.length).toBeGreaterThan(8)
  })

  it('repaints every semantic role the scene subtree paints with', () => {
    const chrome = new Set<string>(CHROME_TOKENS)
    const missing = new Map<string, string>()
    for (const [path, source] of scanned) {
      for (const [, role] of source.matchAll(PAINTS)) {
        const token = roleToken.get(role)
        if (token && !chrome.has(token)) missing.set(`${token} (${role})`, path)
      }
    }
    expect(
      [...missing].map(([token, path]) => `${token} in ${path}`),
      'a printed scene would leave these to the app',
    ).toEqual([])
  })
})
