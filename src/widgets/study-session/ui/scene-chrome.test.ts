import { dirname, join } from 'node:path/posix'
import { describe, expect, it } from 'vitest'
import { CHROME_TOKENS } from '@/shared/lib'
import { readStylesheet } from '@/shared/test/stylesheet'

/**
 * `CHROME_TOKENS` is only as complete as the chrome that reads it. The other tests check the tables
 * against the list; this one checks the list against the screen — a face that reaches for a role no
 * printed scene repaints keeps the app's own value inside a `night` or `chalk` scene, which is the
 * white-on-white bug one step out (CODE_STYLE §5).
 *
 * Nothing is hand-listed. The subtree is walked from the sources that render inside a `<CardScene>`
 * through their imports, so a shared component pulled into a face counts as scene chrome the moment
 * it is imported. What each role resolves to comes from the stylesheet: `--color-primary:
 * var(--primary)` is what makes `bg-primary` a question about `--primary`, and the hand-written
 * utilities (`.bg-glass`, `.bg-card-glass`) name their token the same way.
 */

const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * What a scene never paints, wherever it lives: the surfaces that portal to the body — sheets,
 * dialogs and the completion overlay — and the rows that only ever render inside one. Those belong
 * to the app, not the deck, and keep the app's chrome on purpose.
 */
const OUTSIDE_THE_SCENE =
  /\.test\.tsx?$|Sheet(Section)?\.tsx$|Drawer|Dialog|CompletionOverlay|QuickActionRows|FinishStudySessionButton|StudyFilterChips/

/**
 * How far the subtree reaches. A face renders the study session's own components and the shared
 * design system; an import that leaves for another slice is a type or a command, not chrome, and
 * following it would judge screens no scene ever covers.
 */
const INSIDE_THE_SCENE = [
  '/src/widgets/study-session/',
  '/src/pages/deck-card-style/',
  '/src/shared/ui/',
  '/src/shared/lib/',
]

const paintsInScene = (path: string) =>
  INSIDE_THE_SCENE.some((prefix) => path.startsWith(prefix)) && !OUTSIDE_THE_SCENE.test(path)

/** The roots of the scene: what the three `<CardScene>` callers put inside one. */
const ROOTS = [
  ...Object.keys(sources).filter(
    (path) => path.startsWith('/src/widgets/study-session/ui/') && paintsInScene(path),
  ),
  // The header is shared, but it is drawn inside the scene like everything else here.
  '/src/shared/ui/SessionScreen.tsx',
  // The style page's preview pane and every preset thumbnail render this one component.
  '/src/pages/deck-card-style/ui/StylePreview.tsx',
]

const IMPORT = /import\s+(?:[\s\S]*?)\s+from\s+'([^']+)'/g
const NAMED = /\{([^}]*)\}/
const REEXPORT = /export\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'/g

/** Which file a specifier lands in — `@/` is `src/`, and a folder is its `index`. */
function fileFor(spec: string, from: string): string | null {
  const base = spec.startsWith('@/')
    ? `/src/${spec.slice(2)}`
    : spec.startsWith('.')
      ? join(dirname(from), spec)
      : null
  if (base === null) return null
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (candidate in sources) return candidate
  }
  return null
}

const isBarrel = (path: string) => path.endsWith('/index.ts')

/** Names in an import or re-export clause, stripped of `type` and `as` aliases. */
function clauseNames(clause: string): string[] {
  return clause
    .split(',')
    .map(
      (name) =>
        name
          .trim()
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)[0]
          ?.trim() ?? '',
    )
    .filter(Boolean)
}

/**
 * A barrel is the slice's public API, not a module: following it wholesale would drag in the whole
 * design system. Only the modules behind the names actually imported are part of the subtree.
 */
function through(barrel: string, names: string[]): string[] {
  const found: string[] = []
  for (const [, clause, spec] of (sources[barrel] ?? '').matchAll(REEXPORT)) {
    if (!clauseNames(clause ?? '').some((name) => names.includes(name))) continue
    const target = fileFor(spec ?? '', barrel)
    if (target === null) continue
    found.push(...(isBarrel(target) ? through(target, names) : [target]))
  }
  return found
}

/** Every source that can paint inside a scene: the roots and everything they import. */
function sceneSubtree(): Map<string, string> {
  const scanned = new Map<string, string>()
  const queue = [...ROOTS]
  while (queue.length > 0) {
    const path = queue.pop()
    if (path === undefined || scanned.has(path) || !paintsInScene(path)) continue
    const source = sources[path]
    if (source === undefined) continue
    scanned.set(path, source)
    for (const [statement, spec] of source.matchAll(IMPORT)) {
      const target = fileFor(spec ?? '', path)
      if (target === null) continue
      const names = clauseNames(NAMED.exec(statement)?.[1] ?? '')
      queue.push(...(isBarrel(target) ? through(target, names) : [target]))
    }
  }
  return scanned
}

const scanned = sceneSubtree()

/**
 * `bg-`, `text-`, `ring-` … the prefixes that paint with a colour role. The lookbehind keeps the
 * match to a class name: `--text-heading` inside a token table is the token, not a utility.
 */
const PAINTS =
  /(?<![-\w])(?:bg|text|border|ring|fill|stroke|divide|outline|placeholder|caret|accent|from|via|to|decoration)-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g

const theme = readStylesheet('theme.css')

const roleToken = new Map<string, string>([
  // `@theme inline` — the aliases Tailwind generates a utility for.
  ...[...theme.matchAll(/--color-([a-z0-9-]+):\s*var\((--[a-z0-9-]+)\)/g)].map(
    ([, role, token]) => [role ?? '', token ?? ''] as const,
  ),
  // The hand-written ones. A utility Tailwind never saw still paints from a token, and skipping it
  // is how `.bg-glass` would ride into a printed scene wearing the app's own colour.
  ...[...theme.matchAll(/\.([a-z][a-z0-9-]*)\s*\{([^}]*)\}/g)].flatMap(([, name, body]) => {
    const token =
      /(?:^|;)\s*(?:background|background-color|color|border-color|fill|stroke):[^;]*var\((--[a-z0-9-]+)/.exec(
        body ?? '',
      )?.[1]
    const role = name?.replace(/^(?:bg|text|border|ring|fill|stroke)-/, '')
    return token !== undefined && role !== undefined ? [[role, token] as const] : []
  }),
])

describe('scene chrome', () => {
  it('reads the role map out of the stylesheet', () => {
    expect(roleToken.size).toBeGreaterThan(10)
    expect(roleToken.get('primary')).toBe('--primary')
    // The hand-written utilities, which `@theme inline` knows nothing about.
    expect(roleToken.get('card-glass')).toBe('--surface-glass')
    expect(roleToken.get('glass')).toBe('--surface-glass-sky')
  })

  it('walks the whole scene subtree, not one folder', () => {
    const paths = [...scanned.keys()]
    expect(paths.length).toBeGreaterThan(20)
    // The roots…
    expect(paths).toContain('/src/widgets/study-session/ui/FlashcardsPanel.tsx')
    expect(paths).toContain('/src/pages/deck-card-style/ui/StylePreview.tsx')
    // …and the shared chrome they render, which lives outside every root's folder.
    expect(paths).toContain('/src/shared/ui/primitives/pill.ts')
    expect(paths).toContain('/src/shared/ui/GradeButtons.tsx')
    // Never a sheet: those portal to the body and keep the app's chrome.
    expect(paths).not.toContain('/src/widgets/study-session/ui/GearSheet.tsx')
  })

  it('repaints every semantic role the scene subtree paints with', () => {
    const chrome = new Set<string>(CHROME_TOKENS)
    const missing = new Map<string, string>()
    for (const [path, source] of scanned) {
      for (const [, role] of source.matchAll(PAINTS)) {
        const token = roleToken.get(role ?? '')
        if (token !== undefined && !chrome.has(token)) missing.set(`${token} (${role})`, path)
      }
    }
    expect(
      [...missing].map(([token, path]) => `${token} in ${path}`),
      'a printed scene would leave these to the app',
    ).toEqual([])
  })
})
