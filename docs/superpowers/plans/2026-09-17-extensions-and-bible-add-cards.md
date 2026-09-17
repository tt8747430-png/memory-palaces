# Extensions and Bible Add-Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an extension mechanism that core code cannot see, and the Bible extension's first feature — picking a verse range and turning it into cards.

**Architecture:** A new top-level FSD layer `src/extensions/<id>/` that only `app` may import, enforced by `eslint-plugin-boundaries`. Extensions publish _contributions_ (import-sheet rows, routes, RxDB collections, i18n bundles) through a manifest; host surfaces read them from a React context declared in `shared/lib`, so no core file ever names an extension. Enablement lives in `preferences.extensions` and syncs.

**Tech Stack:** React 19, TypeScript (strict, `verbatimModuleSyntax`), Vite, TanStack Router, zustand, RxDB + Dexie, Supabase replication, i18next, Tailwind v4, Vitest + jsdom + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-17-extensions-and-bible-add-cards-design.md`

## Global Constraints

- **Answer style for any docs you touch:** terse. No preamble, no recaps.
- **Zero legacy in code.** No polyfills, no fallback branches, no deprecated APIs, no dead shims.
- **Persisted data is the exception:** every RxDB schema change needs a migration in `src/app/persistence/database.ts` _and_ a read-side twin in the entity (`completeX`), because replication writes pulled rows unmigrated.
- **Prettier:** no semicolons, single quotes, trailing comma `all`, printWidth 100. Never run `npm run format`; run `npx prettier --write <files you touched>`.
- **Vitest runs with `globals: false`** — every test file imports `describe`, `it`, `expect`, `vi` from `vitest` explicitly.
- **Tests are colocated** as `*.test.ts(x)` beside the file they cover.
- **Strict TS:** `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`. Type-only imports must use `import type`.
- **Imports cross slices via the slice's `index.ts` barrel only.** Alias `@` → `src`.
- **Card shape, non-negotiable:** front carries the reference (`Genesis 1:1`), back carries verse text only. A back that repeats the reference breaks the Match game.
- **Verification before claiming done:** `npm run typecheck && npm run lint && npm run test`. After Task 3 and Task 8, also `npm run build && npm run check:entry-graph`.
- **Every new surface handles loading, error, empty and offline** (`docs/CODE_STYLE.md`).

## File Structure

**New — the mechanism (core, extension-agnostic):**

| File                                               | Responsibility                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/shared/lib/extension-manifest.ts`             | The manifest and contribution _types_. No behaviour.                            |
| `src/shared/lib/extension-points-context.tsx`      | Context holding live contributions + `useExtensionPoint`.                       |
| `src/shared/lib/extension-collections-context.tsx` | Context handing an extension its own RxDB collections.                          |
| `src/app/extensions/registry.ts`                   | The static list of known manifests. The only core file that names an extension. |
| `src/app/extensions/ExtensionsProvider.tsx`        | Reads enabled ids, mounts enabled extensions, publishes contributions.          |
| `src/pages/settings-extensions/`                   | The Settings → Extensions screen.                                               |

**New — the Bible extension:**

| File                                                                             | Responsibility                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/extensions/bible/manifest.ts`                                               | Ids, lazy loaders, contributions. Stays tiny — it is in the entry graph. |
| `src/extensions/bible/model/canon.ts`                                            | 66 books, chapters per book, verses per chapter.                         |
| `src/extensions/bible/model/reference.ts`                                        | `VerseRef` + format/parse/expand.                                        |
| `src/extensions/bible/model/parse-verses.ts`                                     | The verse parser moved out of `shared/lib`, back without the reference.  |
| `src/extensions/bible/model/strip-reference.ts`                                  | Removes a leading reference from a card back.                            |
| `src/extensions/bible/model/verse.ts`                                            | The `BibleVerse` entity + `makeBibleVerse` / `completeBibleVerse`.       |
| `src/extensions/bible/model/store.ts`                                            | `createBibleVerseStore` + context.                                       |
| `src/extensions/bible/model/verse-text.ts`                                       | The `VerseTextSource` port + the deck-source adapter.                    |
| `src/extensions/bible/api/verse-schema.ts`                                       | RxDB schema + collection spec.                                           |
| `src/extensions/bible/features/add-verse-cards.ts`                               | Reference + text + target → import draft.                                |
| `src/extensions/bible/features/publish-source.ts`                                | Deck or pasted text → verse records.                                     |
| `src/extensions/bible/features/clean-reference-backs.ts`                         | Opt-in repair of existing cards.                                         |
| `src/extensions/bible/ui/BibleProvider.tsx`                                      | Starts/stops the verse store with the extension.                         |
| `src/extensions/bible/ui/BibleImportPage.tsx`                                    | The add-cards flow.                                                      |
| `src/extensions/bible/ui/BookPicker.tsx`, `NumberGrid.tsx`, `VerseTextPanel.tsx` | Flow pieces.                                                             |
| `src/extensions/bible/ui/BibleLibraryPage.tsx`                                   | Dev-mode admin screen.                                                   |
| `src/extensions/bible/i18n/en.ts`                                                | The `bible` namespace.                                                   |

**Modified:** `eslint.config.js`, `src/shared/lib/index.ts`, `src/shared/ui/ImportSheet.tsx`, `src/entities/preferences/model/{types,selectors}.ts`, `src/features/preferences/set-preferences.ts`, `src/app/persistence/{schemas,database}.ts`, `src/app/composition-root.ts`, `src/app/router.tsx`, `src/app/providers/AppProviders.tsx`, `src/app/routes/settings-screens.tsx`, `src/pages/settings/ui/SettingsPage.tsx`, `src/pages/deck-library/ui/DeckLibraryPage.tsx`, `src/pages/deck-detail/ui/DeckDetailPage.tsx`, `src/widgets/content-editor/ui/DeckContentEditor.tsx`, `src/widgets/content-editor/model/import-draft.ts`, `src/features/sync/divergence.ts`, `src/shared/config/sync-tables.ts`, `src/shared/lib/content-transfer.ts`, `src/pages/paste-notes/**`, `src/shared/i18n/locales/en/settings.ts`, `docs/UBIQUITOUS_LANGUAGE.md`.

---

### Task 1: Contribution types and the extension-points context

**Files:**

- Create: `src/shared/lib/extension-manifest.ts`
- Create: `src/shared/lib/extension-points-context.tsx`
- Create: `src/shared/lib/extension-collections-context.tsx`
- Test: `src/shared/lib/extension-points-context.test.tsx`
- Modify: `src/shared/lib/index.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `type ExtensionId`, `interface ExtensionManifest`, `interface ImportOptionContribution`, `interface ExtensionContributions`, `ExtensionPointsContext`, `useExtensionPoint(point)`, `ExtensionCollectionsContext`, `useExtensionCollections()`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/shared/lib/extension-points-context.test.tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExtensionPointsContext, useExtensionPoint } from './extension-points-context'
import type { ImportOptionContribution } from './extension-manifest'

const bibleRow: ImportOptionContribution = {
  id: 'bible',
  icon: null,
  title: 'Bible',
  subtitle: 'Pick a passage',
  to: '/import/bible',
}

function Host() {
  const options = useExtensionPoint('importOptions')
  return (
    <ul>
      {options.map((option) => (
        <li key={option.id}>{option.title}</li>
      ))}
    </ul>
  )
}

describe('useExtensionPoint', () => {
  it('returns nothing when no extension has contributed', () => {
    render(<Host />)
    expect(screen.queryByText('Bible')).not.toBeInTheDocument()
  })

  it('returns what the enabled extensions contributed', () => {
    render(
      <ExtensionPointsContext value={{ importOptions: [bibleRow] }}>
        <Host />
      </ExtensionPointsContext>,
    )
    expect(screen.getByText('Bible')).toBeInTheDocument()
  })

  it('is stable when the point has no contributions, so hosts can render it directly', () => {
    render(
      <ExtensionPointsContext value={{}}>
        <Host />
      </ExtensionPointsContext>,
    )
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `npx vitest run src/shared/lib/extension-points-context.test.tsx`
Expected: FAIL — `Failed to resolve import "./extension-points-context"`.

- [ ] **Step 3: Write the manifest types**

```ts
// src/shared/lib/extension-manifest.ts
import type { ReactNode } from 'react'
import type { RxCollectionCreator } from 'rxdb'

/** The id an extension is known by, in the registry and in `preferences.extensions`. */
export type ExtensionId = string

/** A row an extension adds to the import sheet. `to` is a route path. */
export interface ImportOptionContribution {
  id: string
  icon: ReactNode
  title: string
  subtitle: string
  to: string
  tone?: 'brand' | 'accent' | 'positive' | 'warning' | 'danger' | 'neutral'
  badge?: ReactNode
}

/** Everything the enabled extensions are currently offering, merged. */
export interface ExtensionContributions {
  importOptions?: ImportOptionContribution[]
}

export type ExtensionPoint = keyof ExtensionContributions

/** A screen an extension owns. Always lazy — extension UI must stay off the entry graph. */
export interface ExtensionRoute {
  path: string
  load: () => Promise<Record<string, unknown>>
  export: string
}

/**
 * An RxDB collection an extension owns. `table` names its Supabase table, or is null
 * when the collection never leaves the device.
 */
export interface ExtensionCollectionSpec {
  key: string
  table: string | null
  creator: RxCollectionCreator
}

export interface ExtensionManifest {
  id: ExtensionId
  icon: ReactNode
  /** Keys inside the extension's own i18n namespace. */
  labelKey: string
  descriptionKey: string
  namespace: string
  loadMessages: () => Promise<Record<string, unknown>>
  routes: ExtensionRoute[]
  collections: ExtensionCollectionSpec[]
  contributions: ExtensionContributions
  /** Mounted only while the extension is enabled — this is where its stores start and stop. */
  loadProvider?: () => Promise<{
    ExtensionProvider: (props: { children: ReactNode }) => ReactNode
  }>
}
```

- [ ] **Step 4: Write the two contexts**

```tsx
// src/shared/lib/extension-points-context.tsx
import { createContext, use } from 'react'
import type { ExtensionContributions, ExtensionPoint } from './extension-manifest'

const EMPTY: ExtensionContributions = {}

export const ExtensionPointsContext = createContext<ExtensionContributions>(EMPTY)

const NONE: never[] = []

export function useExtensionPoint<Point extends ExtensionPoint>(
  point: Point,
): NonNullable<ExtensionContributions[Point]> {
  const contributions = use(ExtensionPointsContext)
  return (contributions[point] ?? NONE) as NonNullable<ExtensionContributions[Point]>
}
```

```tsx
// src/shared/lib/extension-collections-context.tsx
import { createContext, use } from 'react'

/** RxDB collections keyed by the manifest's collection key. Typed loosely so `shared` stays free of entity types. */
export type ExtensionCollections = Record<string, unknown>

const EMPTY: ExtensionCollections = {}

export const ExtensionCollectionsContext = createContext<ExtensionCollections>(EMPTY)

export function useExtensionCollections(): ExtensionCollections {
  return use(ExtensionCollectionsContext)
}
```

- [ ] **Step 5: Export from the barrel**

Add to `src/shared/lib/index.ts`, beside the other context exports:

```ts
export type {
  ExtensionCollectionSpec,
  ExtensionContributions,
  ExtensionId,
  ExtensionManifest,
  ExtensionPoint,
  ExtensionRoute,
  ImportOptionContribution,
} from './extension-manifest'
export { ExtensionPointsContext, useExtensionPoint } from './extension-points-context'
export {
  type ExtensionCollections,
  ExtensionCollectionsContext,
  useExtensionCollections,
} from './extension-collections-context'
```

- [ ] **Step 6: Run the test and watch it pass**

Run: `npx vitest run src/shared/lib/extension-points-context.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 7: Verify and commit**

```bash
npm run typecheck && npm run lint
npx prettier --write src/shared/lib/extension-manifest.ts src/shared/lib/extension-points-context.tsx src/shared/lib/extension-collections-context.tsx src/shared/lib/extension-points-context.test.tsx src/shared/lib/index.ts
git add src/shared/lib
git commit -m "feat(extensions): contribution types and the extension-points context"
```

---

### Task 2: Enablement lives in preferences, and survives an older build

**Files:**

- Modify: `src/entities/preferences/model/types.ts`
- Modify: `src/entities/preferences/model/selectors.ts`
- Modify: `src/entities/preferences/index.ts`
- Modify: `src/app/persistence/schemas.ts` (the `preferencesSchema`, currently `version: 2`)
- Modify: `src/app/persistence/database.ts` (`preferencesMigrations`)
- Modify: `src/features/preferences/set-preferences.ts`
- Test: `src/entities/preferences/model/types.test.ts` (exists — add cases)
- Test: `src/features/preferences/preferences-commands.test.ts` (exists — add cases)

**Interfaces:**

- Consumes: `ExtensionId` from Task 1.
- Produces: `Preferences.extensions: ExtensionId[]`, `isExtensionEnabled(prefs, id): boolean`, `setExtensionEnabled(store, id, enabled): Promise<Preferences>`.

- [ ] **Step 1: Write the failing entity tests**

Append to `src/entities/preferences/model/types.test.ts`:

```ts
describe('extensions', () => {
  it('defaults to none enabled', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() })
    expect(prefs.extensions).toEqual([])
  })

  it('keeps ids this build has never heard of — an older build must not switch them off', () => {
    const stored = {
      ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
      extensions: ['bible', 'something-from-the-future'],
    }
    expect(completePreferences(stored).extensions).toEqual(['bible', 'something-from-the-future'])
  })

  it('reports whether one extension is on', () => {
    const prefs = {
      ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
      extensions: ['bible'],
    }
    expect(isExtensionEnabled(prefs, 'bible')).toBe(true)
    expect(isExtensionEnabled(prefs, 'atlas')).toBe(false)
  })
})
```

Add `completePreferences` and `isExtensionEnabled` to that file's imports from `./types`.

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/entities/preferences/model/types.test.ts`
Expected: FAIL — `extensions` is undefined and `isExtensionEnabled` is not exported.

- [ ] **Step 3: Add the field to the entity**

In `src/entities/preferences/model/types.ts`:

```ts
import type { ExtensionId } from '@/shared/lib'
```

Add to `interface Preferences`:

```ts
  extensions: ExtensionId[]
```

Add to `DEFAULT_PREFERENCES`:

```ts
  extensions: [] as ExtensionId[],
```

Add to `MakePreferencesInput`:

```ts
  extensions?: ExtensionId[]
```

Add inside `makePreferences`'s returned object:

```ts
    extensions: [...(input.extensions ?? [])],
```

Add `'extensions'` to the `PreferencesChanges` `Pick<...>` union, and export the selector:

```ts
export function isExtensionEnabled(
  preferences: Pick<Preferences, 'extensions'>,
  id: ExtensionId,
): boolean {
  return preferences.extensions.includes(id)
}
```

Export `isExtensionEnabled` from `src/entities/preferences/index.ts`.

- [ ] **Step 4: Run the entity tests and watch them pass**

Run: `npx vitest run src/entities/preferences/model/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing command test**

Append to `src/features/preferences/preferences-commands.test.ts`:

```ts
describe('setExtensionEnabled', () => {
  it('turns one on without disturbing the others', async () => {
    const store = startedPreferencesStore({ extensions: ['atlas'] })
    const saved = await setExtensionEnabled(store, 'bible', true)
    expect(saved.extensions.sort()).toEqual(['atlas', 'bible'])
  })

  it('turns one off and leaves ids this build does not know', async () => {
    const store = startedPreferencesStore({ extensions: ['bible', 'from-the-future'] })
    const saved = await setExtensionEnabled(store, 'bible', false)
    expect(saved.extensions).toEqual(['from-the-future'])
  })

  it('enabling twice does not duplicate the id', async () => {
    const store = startedPreferencesStore({ extensions: ['bible'] })
    const saved = await setExtensionEnabled(store, 'bible', true)
    expect(saved.extensions).toEqual(['bible'])
  })
})
```

Follow the helper already used by that file for building a started preferences store; if it has none, add:

```ts
function startedPreferencesStore(over: Partial<Preferences> = {}): PreferencesStore {
  const base = makePreferences({ id: PREFERENCES_ID, createdAt: new Date(0).toISOString() })
  return started(
    createPreferencesStore(new InMemoryRepository<Preferences>([{ ...base, ...over }])),
  )
}
```

- [ ] **Step 6: Run it and watch it fail**

Run: `npx vitest run src/features/preferences/preferences-commands.test.ts`
Expected: FAIL — `setExtensionEnabled` is not exported.

- [ ] **Step 7: Write the command**

Create `src/features/preferences/set-extension-enabled.ts`:

```ts
import type { ExtensionId } from '@/shared/lib'
import { isExtensionEnabled, type Preferences, type PreferencesStore } from '@/entities/preferences'
import { setPreferences } from './set-preferences'

/**
 * Adds or removes one id. Every other id is carried through untouched, including ones
 * this build does not recognise — dropping those would switch off an extension a newer
 * build enabled on another device.
 */
export async function setExtensionEnabled(
  store: PreferencesStore,
  id: ExtensionId,
  enabled: boolean,
  now: number = Date.now(),
): Promise<Preferences> {
  const current = store.getState().preferences?.extensions ?? []
  if (enabled && current.includes(id)) return setPreferences(store, {}, now)
  const extensions = enabled ? [...current, id] : current.filter((held) => held !== id)
  return setPreferences(store, { extensions }, now)
}

export { isExtensionEnabled }
```

Export `setExtensionEnabled` from `src/features/preferences/index.ts`.

- [ ] **Step 8: Run it and watch it pass**

Run: `npx vitest run src/features/preferences/preferences-commands.test.ts`
Expected: PASS.

- [ ] **Step 9: Migrate the stored schema**

In `src/app/persistence/schemas.ts`, `preferencesSchema`: bump `version: 2` → `version: 3`, add to `properties`:

```ts
    extensions: { type: 'array', items: { type: 'string' } },
```

and add `'extensions'` to its `required` array.

In `src/app/persistence/database.ts`, add to `preferencesMigrations`:

```ts
  3: (doc: Preferences) => ({ ...doc, extensions: doc.extensions ?? [] }),
```

- [ ] **Step 10: Run the persistence tests**

Run: `npx vitest run src/app/persistence`
Expected: PASS. If a schema test asserts the version, update it to 3.

- [ ] **Step 11: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/entities/preferences src/features/preferences src/app/persistence/schemas.ts src/app/persistence/database.ts
git add src/entities/preferences src/features/preferences src/app/persistence
git commit -m "feat(extensions): store which extensions are enabled in preferences"
```

---

### Task 3: The registry and the provider

**Files:**

- Create: `src/app/extensions/registry.ts`
- Create: `src/app/extensions/ExtensionsProvider.tsx`
- Create: `src/app/extensions/collections.ts`
- Test: `src/app/extensions/ExtensionsProvider.test.tsx`
- Modify: `src/app/providers/AppProviders.tsx`
- Modify: `src/app/composition-root.ts`

**Interfaces:**

- Consumes: `ExtensionManifest`, `ExtensionPointsContext`, `ExtensionCollectionsContext` (Task 1); `isExtensionEnabled` (Task 2).
- Produces: `EXTENSIONS: ExtensionManifest[]`, `<ExtensionsProvider manifests={…}>`, `Services.extensionCollections`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/extensions/ExtensionsProvider.test.tsx
import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  createPreferencesStore,
  makePreferences,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import type { ExtensionManifest } from '@/shared/lib'
import { useExtensionPoint } from '@/shared/lib'
import { ExtensionsProvider } from './ExtensionsProvider'

const manifest: ExtensionManifest = {
  id: 'fake',
  icon: null,
  labelKey: 'label',
  descriptionKey: 'description',
  namespace: 'fake',
  loadMessages: () => Promise.resolve({ label: 'Fake', description: 'A fake extension' }),
  routes: [],
  collections: [],
  contributions: {
    importOptions: [
      {
        id: 'fake',
        icon: null,
        title: 'Fake import',
        subtitle: 'From the fake',
        to: '/import/fake',
      },
    ],
  },
}

function Host() {
  const options = useExtensionPoint('importOptions')
  return <span>{options.length === 0 ? 'no contributions' : options[0]!.title}</span>
}

function renderWith(extensions: string[]) {
  const stored: Preferences = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    extensions,
  }
  const store = started(createPreferencesStore(new InMemoryRepository<Preferences>([stored])))
  return renderWithProviders(
    <PreferencesStoreContext value={store}>
      <ExtensionsProvider manifests={[manifest]}>
        <Host />
      </ExtensionsProvider>
    </PreferencesStoreContext>,
  )
}

describe('ExtensionsProvider', () => {
  it('publishes nothing while the extension is off', () => {
    renderWith([])
    expect(screen.getByText('no contributions')).toBeInTheDocument()
  })

  it('publishes the enabled extension contributions', async () => {
    renderWith(['fake'])
    await waitFor(() => expect(screen.getByText('Fake import')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/app/extensions/ExtensionsProvider.test.tsx`
Expected: FAIL — cannot resolve `./ExtensionsProvider`.

- [ ] **Step 3: Write the registry**

```ts
// src/app/extensions/registry.ts
import type { ExtensionManifest } from '@/shared/lib'

/**
 * Every extension this build knows about. The one core file that names them — everything
 * downstream reads contributions from context instead.
 */
export const EXTENSIONS: ExtensionManifest[] = []
```

- [ ] **Step 4: Write the provider**

```tsx
// src/app/extensions/ExtensionsProvider.tsx
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { i18n } from '@/shared/i18n'
import {
  type ExtensionContributions,
  type ExtensionManifest,
  ExtensionPointsContext,
} from '@/shared/lib'
import { isExtensionEnabled, usePreferencesStore } from '@/entities/preferences'

function mergeContributions(manifests: ExtensionManifest[]): ExtensionContributions {
  return {
    importOptions: manifests.flatMap((manifest) => manifest.contributions.importOptions ?? []),
  }
}

/** Mounts one enabled extension: its messages, then its own provider, which owns its stores. */
function MountedExtension({
  manifest,
  children,
}: {
  manifest: ExtensionManifest
  children: ReactNode
}) {
  const [Provider, setProvider] = useState<((props: { children: ReactNode }) => ReactNode) | null>(
    null,
  )

  useEffect(() => {
    let live = true
    void manifest.loadMessages().then((messages) => {
      if (live) i18n.addResourceBundle('en', manifest.namespace, messages, true, false)
    })
    if (manifest.loadProvider) {
      void manifest.loadProvider().then((module) => {
        if (live) setProvider(() => module.ExtensionProvider)
      })
    }
    return () => {
      live = false
    }
  }, [manifest])

  return Provider ? <Provider>{children}</Provider> : children
}

export function ExtensionsProvider({
  manifests,
  children,
}: {
  manifests: ExtensionManifest[]
  children: ReactNode
}) {
  const enabledIds = usePreferencesStore((state) =>
    manifests
      .filter((manifest) =>
        state.preferences ? isExtensionEnabled(state.preferences, manifest.id) : false,
      )
      .map((manifest) => manifest.id)
      .join(','),
  )

  const enabled = useMemo(
    () => manifests.filter((manifest) => enabledIds.split(',').includes(manifest.id)),
    [manifests, enabledIds],
  )

  const contributions = useMemo(() => mergeContributions(enabled), [enabled])

  return (
    <ExtensionPointsContext value={contributions}>
      {enabled.reduceRight<ReactNode>(
        (inner, manifest) => (
          <MountedExtension key={manifest.id} manifest={manifest}>
            {inner}
          </MountedExtension>
        ),
        children,
      )}
    </ExtensionPointsContext>
  )
}
```

The `join(',')` in the selector is deliberate: zustand compares selector output by reference, so returning a fresh array every render would loop.

- [ ] **Step 5: Run it and watch it pass**

Run: `npx vitest run src/app/extensions/ExtensionsProvider.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Mount it in the app**

In `src/app/providers/AppProviders.tsx`, wrap the children _inside_ `ServicesProvider` (it reads preferences) with:

```tsx
<ExtensionsProvider manifests={EXTENSIONS}>{children}</ExtensionsProvider>
```

importing `EXTENSIONS` from `../extensions/registry` and `ExtensionsProvider` from `../extensions/ExtensionsProvider`.

- [ ] **Step 7: Carry extension collections through services**

In `src/app/composition-root.ts` add to `interface Services`:

```ts
extensionCollections: Record<string, unknown>
```

and, in `createServices`, after `collections` is awaited into the other repos, populate it from the registry's manifests (empty for now — Task 6 fills it):

```ts
const extensionCollections = await buildExtensionCollections(EXTENSIONS, collections)
```

Create that helper in `src/app/extensions/collections.ts`:

```ts
import type { ExtensionManifest } from '@/shared/lib'
import type { AppCollections } from '../persistence/database'

/** Hands each extension the RxDB collections its manifest declared, keyed as the manifest named them. */
export async function buildExtensionCollections(
  manifests: ExtensionManifest[],
  collections: Promise<AppCollections>,
): Promise<Record<string, unknown>> {
  const held = (await collections) as unknown as Record<string, unknown>
  return Object.fromEntries(
    manifests.flatMap((manifest) =>
      manifest.collections.map((spec) => [spec.key, held[spec.key]] as const),
    ),
  )
}
```

Provide it in `ServicesProvider` with `<ExtensionCollectionsContext value={services.extensionCollections}>`.

- [ ] **Step 8: Verify the entry graph is still clean**

```bash
npm run typecheck && npm run lint && npm run test
npm run build && npm run check:entry-graph
```

Expected: `check:entry-graph — ok`.

- [ ] **Step 9: Commit**

```bash
npx prettier --write src/app/extensions src/app/providers/AppProviders.tsx src/app/providers/ServicesProvider.tsx src/app/composition-root.ts
git add src/app
git commit -m "feat(extensions): registry and the provider that mounts enabled extensions"
```

---

### Task 4: The Settings → Extensions screen

**Files:**

- Create: `src/pages/settings-extensions/index.ts`
- Create: `src/pages/settings-extensions/ui/SettingsExtensionsPage.tsx`
- Test: `src/pages/settings-extensions/ui/SettingsExtensionsPage.test.tsx`
- Modify: `src/shared/config/routes.ts`, `src/app/router.tsx`, `src/app/routes/settings-screens.tsx`
- Modify: `src/pages/settings/ui/SettingsPage.tsx`
- Modify: `src/shared/i18n/locales/en/settings.ts`

**Interfaces:**

- Consumes: `setExtensionEnabled`, `isExtensionEnabled` (Task 2); `ExtensionManifest` (Task 1).
- Produces: `<SettingsExtensionsPage manifests={…} onBack={…} />`, `ROUTES.settingsExtensions`.

The page takes its manifests as a prop so the test can pass fakes and core never depends on the registry.

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/settings-extensions/ui/SettingsExtensionsPage.test.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  createPreferencesStore,
  makePreferences,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import type { ExtensionManifest } from '@/shared/lib'
import { SettingsExtensionsPage } from './SettingsExtensionsPage'

afterEach(cleanup)

const manifest: ExtensionManifest = {
  id: 'fake',
  icon: null,
  labelKey: 'fake:label',
  descriptionKey: 'fake:description',
  namespace: 'fake',
  loadMessages: () => Promise.resolve({}),
  routes: [],
  collections: [],
  contributions: {},
}

function renderPage(manifests: ExtensionManifest[], extensions: string[] = []) {
  const stored: Preferences = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    extensions,
  }
  const store = started(createPreferencesStore(new InMemoryRepository<Preferences>([stored])))
  renderWithProviders(
    <PreferencesStoreContext value={store}>
      <SettingsExtensionsPage manifests={manifests} onBack={vi.fn()} />
    </PreferencesStoreContext>,
  )
  return store
}

describe('SettingsExtensionsPage', () => {
  it('says so when the build carries no extensions', () => {
    renderPage([])
    expect(screen.getByText('No extensions yet')).toBeInTheDocument()
  })

  it('shows a switch per extension, off by default', () => {
    renderPage([manifest])
    expect(screen.getByRole('switch', { name: 'fake:label' })).not.toBeChecked()
  })

  it('turning one on writes it to preferences', async () => {
    const user = userEvent.setup()
    const store = renderPage([manifest])
    await user.click(screen.getByRole('switch', { name: 'fake:label' }))
    expect(store.getState().preferences?.extensions).toEqual(['fake'])
  })

  it('turning one off leaves the rest alone', async () => {
    const user = userEvent.setup()
    const store = renderPage([manifest], ['fake', 'from-the-future'])
    await user.click(screen.getByRole('switch', { name: 'fake:label' }))
    expect(store.getState().preferences?.extensions).toEqual(['from-the-future'])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/pages/settings-extensions`
Expected: FAIL — cannot resolve `./SettingsExtensionsPage`.

- [ ] **Step 3: Write the page**

```tsx
// src/pages/settings-extensions/ui/SettingsExtensionsPage.tsx
import { useTranslation } from 'react-i18next'
import { Blocks } from 'lucide-react'
import {
  isExtensionEnabled,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setExtensionEnabled } from '@/features/preferences'
import { type ExtensionManifest, selectIsReady } from '@/shared/lib'
import { AppScreen, ScreenHeader, ScreenLoading, SettingsRow, SettingsSection } from '@/shared/ui'

export interface SettingsExtensionsPageProps {
  manifests: ExtensionManifest[]
  onBack: () => void
}

export function SettingsExtensionsPage({ manifests, onBack }: SettingsExtensionsPageProps) {
  const { t } = useTranslation()
  const ready = usePreferencesStore(selectIsReady)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const store = usePreferencesStoreApi()

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t('settings.extensions')}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
    >
      {!ready ? (
        <ScreenLoading />
      ) : manifests.length === 0 ? (
        <p className="mt-6 rounded-card bg-card-glass p-6 text-center text-body text-muted-foreground shadow-rest">
          {t('settings.extensionsEmpty')}
        </p>
      ) : (
        <SettingsSection title={t('settings.extensionsSection')}>
          {manifests.map((manifest) => (
            <SettingsRow
              key={manifest.id}
              kind="toggle"
              icon={manifest.icon ?? <Blocks />}
              label={t(manifest.labelKey as never)}
              description={t(manifest.descriptionKey as never)}
              checked={isExtensionEnabled(prefs, manifest.id)}
              onCheckedChange={(value) => void setExtensionEnabled(store, manifest.id, value)}
            />
          ))}
        </SettingsSection>
      )}
    </AppScreen>
  )
}
```

`src/pages/settings-extensions/index.ts`:

```ts
export { SettingsExtensionsPage } from './ui/SettingsExtensionsPage'
export type { SettingsExtensionsPageProps } from './ui/SettingsExtensionsPage'
```

- [ ] **Step 4: Add the copy**

In `src/shared/i18n/locales/en/settings.ts`, inside the `settings` object:

```ts
  extensions: 'Extensions',
  extensionsHint: 'Switch features on and off',
  extensionsSection: 'Available',
  extensionsEmpty: 'No extensions yet',
```

- [ ] **Step 5: Run the tests and watch them pass**

Run: `npx vitest run src/pages/settings-extensions`
Expected: PASS, 4 tests.

The four states are covered: loading via `selectIsReady`, empty via the no-manifests branch, error by
the store's own status. There is deliberately **no** offline branch — the toggle is a local write that
works offline, and a network notice here would be a lie. Note that in a comment above the component so
the next reader does not "fix" it.

- [ ] **Step 6: Route it**

`src/shared/config/routes.ts` — add beside the other settings routes:

```ts
  settingsExtensions: '/settings/extensions',
```

`src/app/routes/settings-screens.tsx`:

```tsx
import { SettingsExtensionsPage } from '@/pages/settings-extensions'
import { EXTENSIONS } from '../extensions/registry'

export function SettingsExtensionsScreen() {
  return <SettingsExtensionsPage manifests={EXTENSIONS} onBack={useBackTo(ROUTES.settings)} />
}
```

`src/app/router.tsx` — add beside the other settings routes:

```ts
  route(ROUTES.settingsExtensions, settings('SettingsExtensionsScreen')),
```

`src/pages/settings/ui/SettingsPage.tsx` — add an `onExtensions?: () => void` prop and a row in the same section as Privacy:

```tsx
<SettingsRow
  kind="nav"
  icon={<Blocks />}
  label={t('settings.extensions')}
  description={t('settings.extensionsHint')}
  onClick={() => onExtensions?.()}
/>
```

importing `Blocks` from `lucide-react`, and wire `onExtensions` in `SettingsScreen` to `navigate({ to: ROUTES.settingsExtensions })`.

- [ ] **Step 7: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/pages/settings-extensions src/pages/settings src/app/routes/settings-screens.tsx src/app/router.tsx src/shared/config/routes.ts src/shared/i18n/locales/en/settings.ts
git add src/pages src/app src/shared
git commit -m "feat(extensions): a settings screen for switching extensions on and off"
```

---

### Task 5: The Bible canon and references

**Files:**

- Create: `src/extensions/bible/model/canon.ts`
- Create: `src/extensions/bible/model/canon.test.ts`
- Create: `src/extensions/bible/model/reference.ts`
- Create: `src/extensions/bible/model/reference.test.ts`
- Modify: `eslint.config.js`

**Interfaces:**

- Consumes: nothing.
- Produces: `BOOKS: readonly BibleBook[]`, `type BibleBook = { name: string; verses: readonly number[] }`, `chapterCount(book)`, `verseCount(book, chapter)`, `type VerseRef = { book: string; chapter: number; from: number; to: number }`, `formatRef(ref)`, `parseRef(text)`, `expandRange(ref)`, `refKey(book, chapter, verse)`.

- [ ] **Step 1: Teach ESLint about the layer**

In `eslint.config.js`, add to `boundaries/elements` **above** the `shared` entry:

```js
        { type: 'extensions', pattern: 'src/extensions/*' },
```

and replace the `boundaries/dependencies` rule value with:

```js
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            ...fsdDependencyRules,
            // only the app may reach an extension
            { from: { type: 'app' }, allow: [{ to: { type: 'extensions' } }] },
            // an extension reaches down like a page does, and never sideways
            {
              from: { type: 'extensions' },
              allow: [
                { to: { type: 'widgets' } },
                { to: { type: 'features' } },
                { to: { type: 'entities' } },
                { to: { type: 'shared' } },
              ],
            },
          ],
        },
      ],
```

- [ ] **Step 2: Write the failing canon test**

```ts
// src/extensions/bible/model/canon.test.ts
import { describe, expect, it } from 'vitest'
import { BOOKS, chapterCount, verseCount } from './canon'

describe('the canon', () => {
  it('holds 66 books in order', () => {
    expect(BOOKS).toHaveLength(66)
    expect(BOOKS[0]?.name).toBe('Genesis')
    expect(BOOKS[65]?.name).toBe('Revelation')
  })

  it('holds 1189 chapters altogether', () => {
    expect(BOOKS.reduce((total, book) => total + book.verses.length, 0)).toBe(1189)
  })

  it('knows how many chapters a book has', () => {
    expect(chapterCount('Genesis')).toBe(50)
    expect(chapterCount('Jude')).toBe(1)
    expect(chapterCount('Nowhere')).toBe(0)
  })

  it('knows how many verses a chapter has', () => {
    expect(verseCount('Genesis', 1)).toBe(31)
    expect(verseCount('Psalms', 117)).toBe(2)
    expect(verseCount('Genesis', 99)).toBe(0)
  })
})
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/model/canon.test.ts`
Expected: FAIL — cannot resolve `./canon`.

- [ ] **Step 4: Write the canon**

Each book is a name plus verse counts per chapter, source: the standard Protestant canon. Encode compactly and expand at module load:

```ts
// src/extensions/bible/model/canon.ts
export interface BibleBook {
  name: string
  /** Verse count per chapter, index 0 = chapter 1. */
  verses: readonly number[]
}

/** name|verse counts, comma separated. One line per book keeps diffs readable. */
const RAW: readonly string[] = [
  'Genesis|31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26',
  // …the remaining 65 books, same shape
]

export const BOOKS: readonly BibleBook[] = RAW.map((line) => {
  const [name = '', counts = ''] = line.split('|')
  return { name, verses: counts.split(',').map(Number) }
})

const BY_NAME = new Map(BOOKS.map((book) => [book.name.toLowerCase(), book]))

export function findBook(name: string): BibleBook | undefined {
  return BY_NAME.get(name.trim().toLowerCase())
}

export function chapterCount(name: string): number {
  return findBook(name)?.verses.length ?? 0
}

export function verseCount(name: string, chapter: number): number {
  return findBook(name)?.verses[chapter - 1] ?? 0
}
```

Fill `RAW` with all 66 books before running the test — the test asserts 66 books and 1189 chapters, so a partial table fails loudly. Do not invent counts: take them from a public-domain canon table and check the four assertions in the test.

- [ ] **Step 5: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/canon.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Write the failing reference test**

```ts
// src/extensions/bible/model/reference.test.ts
import { describe, expect, it } from 'vitest'
import { expandRange, formatRef, parseRef, refKey } from './reference'

describe('formatRef', () => {
  it('renders a single verse without a range', () => {
    expect(formatRef({ book: 'Genesis', chapter: 1, from: 1, to: 1 })).toBe('Genesis 1:1')
  })

  it('renders a range', () => {
    expect(formatRef({ book: 'Genesis', chapter: 1, from: 1, to: 31 })).toBe('Genesis 1:1-31')
  })
})

describe('parseRef', () => {
  it('reads a single verse', () => {
    expect(parseRef('Genesis 1:1')).toEqual({ book: 'Genesis', chapter: 1, from: 1, to: 1 })
  })

  it('reads a range, hyphen or en dash', () => {
    expect(parseRef('1 John 2:3-5')).toEqual({ book: '1 John', chapter: 2, from: 3, to: 5 })
    expect(parseRef('1 John 2:3–5')).toEqual({ book: '1 John', chapter: 2, from: 3, to: 5 })
  })

  it('returns null for anything else', () => {
    expect(parseRef('Zeus, King of the gods')).toBeNull()
  })
})

describe('expandRange', () => {
  it('lists every verse number in the range', () => {
    expect(expandRange({ book: 'Genesis', chapter: 1, from: 2, to: 4 })).toEqual([2, 3, 4])
  })

  it('handles a single verse', () => {
    expect(expandRange({ book: 'Jude', chapter: 1, from: 3, to: 3 })).toEqual([3])
  })
})

describe('refKey', () => {
  it('keys a verse so republishing updates in place', () => {
    expect(refKey('web', 'Genesis', 1, 1)).toBe('web:Genesis:1:1')
  })
})
```

- [ ] **Step 7: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/model/reference.test.ts`
Expected: FAIL — cannot resolve `./reference`.

- [ ] **Step 8: Write it**

```ts
// src/extensions/bible/model/reference.ts
export interface VerseRef {
  book: string
  chapter: number
  from: number
  to: number
}

const REF = /^(.+?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$/

export function formatRef({ book, chapter, from, to }: VerseRef): string {
  return to > from ? `${book} ${chapter}:${from}-${to}` : `${book} ${chapter}:${from}`
}

export function parseRef(text: string): VerseRef | null {
  const match = REF.exec(text.trim())
  if (!match) return null
  const [, book = '', chapter = '', from = '', to] = match
  return {
    book: book.trim(),
    chapter: Number(chapter),
    from: Number(from),
    to: Number(to ?? from),
  }
}

export function expandRange({ from, to }: VerseRef): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}

export function refKey(translation: string, book: string, chapter: number, verse: number): string {
  return `${translation}:${book}:${chapter}:${verse}`
}
```

- [ ] **Step 9: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/reference.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 10: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions eslint.config.js
git add src/extensions eslint.config.js
git commit -m "feat(bible): the canon skeleton and verse references"
```

---

### Task 6: The verse collection, its schema, and syncing it

**Files:**

- Create: `src/extensions/bible/model/verse.ts`
- Create: `src/extensions/bible/model/verse.test.ts`
- Create: `src/extensions/bible/model/store.ts`
- Create: `src/extensions/bible/api/verse-schema.ts`
- Create: `src/extensions/bible/api/verse-repository.ts`
- Create: `supabase/migrations/20260917120000_bible_verses.sql`
- Modify: `src/app/persistence/database.ts`, `src/app/composition-root.ts`
- Modify: `src/shared/config/sync-tables.ts`, `src/features/sync/divergence.ts`
- Modify: `src/app/persistence/synced-tables.test.ts`

**Interfaces:**

- Consumes: `refKey` (Task 5); `ExtensionCollectionSpec` (Task 1).
- Produces: `interface BibleVerse extends Entity`, `makeBibleVerse(input)`, `completeBibleVerse(verse)`, `createBibleVerseStore(repo)`, `useBibleVerseStore`, `useBibleVerseStoreApi`, `bibleVerseCollection: ExtensionCollectionSpec`.

- [ ] **Step 1: Write the failing entity test**

```ts
// src/extensions/bible/model/verse.test.ts
import { describe, expect, it } from 'vitest'
import { completeBibleVerse, makeBibleVerse } from './verse'

const at = new Date(0).toISOString()

describe('makeBibleVerse', () => {
  it('keys itself by translation, book, chapter and verse', () => {
    const verse = makeBibleVerse({
      createdAt: at,
      translation: 'web',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: 'In the beginning God created the heavens and the earth.',
    })
    expect(verse.id).toBe('web:Genesis:1:1')
  })

  it('trims the text', () => {
    const verse = makeBibleVerse({
      createdAt: at,
      translation: 'web',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: '  In the beginning  ',
    })
    expect(verse.text).toBe('In the beginning')
  })

  it('throws on empty text — an empty verse is not a verse', () => {
    expect(() =>
      makeBibleVerse({
        createdAt: at,
        translation: 'web',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: '   ',
      }),
    ).toThrow()
  })

  it('throws when the chapter or verse is not positive', () => {
    expect(() =>
      makeBibleVerse({
        createdAt: at,
        translation: 'web',
        book: 'Genesis',
        chapter: 0,
        verse: 1,
        text: 'x',
      }),
    ).toThrow()
  })
})

describe('completeBibleVerse', () => {
  it('fills a row pulled from the cloud that predates a field', () => {
    const pulled = {
      id: 'web:Genesis:1:1',
      createdAt: at,
      updatedAt: at,
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: 'In the beginning',
    } as never
    expect(completeBibleVerse(pulled).translation).toBe('web')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/model/verse.test.ts`
Expected: FAIL — cannot resolve `./verse`.

- [ ] **Step 3: Write the entity**

```ts
// src/extensions/bible/model/verse.ts
import type { Entity } from '@/shared/lib'
import { refKey } from './reference'

export const DEFAULT_TRANSLATION = 'web'

export interface BibleVerse extends Entity {
  translation: string
  book: string
  chapter: number
  verse: number
  /** Verse text only. The reference lives on the card front, never in here. */
  text: string
}

export interface MakeBibleVerseInput {
  createdAt: string
  translation?: string
  book: string
  chapter: number
  verse: number
  text: string
}

export function makeBibleVerse(input: MakeBibleVerseInput): BibleVerse {
  const translation = (input.translation ?? DEFAULT_TRANSLATION).trim()
  const book = input.book.trim()
  const text = input.text.trim()
  if (!book) throw new Error('A verse needs a book')
  if (!text) throw new Error('A verse needs text')
  if (!Number.isInteger(input.chapter) || input.chapter < 1) {
    throw new Error(`Chapter must be a positive whole number: ${input.chapter}`)
  }
  if (!Number.isInteger(input.verse) || input.verse < 1) {
    throw new Error(`Verse must be a positive whole number: ${input.verse}`)
  }
  return {
    id: refKey(translation, book, input.chapter, input.verse),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    translation,
    book,
    chapter: input.chapter,
    verse: input.verse,
    text,
  }
}

/** Read-side twin: rows arrive from replication unmigrated. */
export function completeBibleVerse(verse: BibleVerse): BibleVerse {
  return { ...verse, translation: verse.translation ?? DEFAULT_TRANSLATION }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/verse.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the store and its context**

```ts
// src/extensions/bible/model/store.ts
import type { StoreApi } from 'zustand/vanilla'
import type { Repository } from '@/shared/api'
import { type CollectionState, createCollectionStore, createStoreContext } from '@/shared/lib'
import { type BibleVerse, completeBibleVerse } from './verse'

export type BibleVerseState = CollectionState<'verses', BibleVerse>
export type BibleVerseStore = StoreApi<BibleVerseState>

const byPosition = (a: BibleVerse, b: BibleVerse): number =>
  a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse

export function createBibleVerseStore(repo: Repository<BibleVerse>): BibleVerseStore {
  return createCollectionStore('verses', repo, byPosition, { complete: completeBibleVerse })
}

const { StoreContext, useSelector, useStoreApi } = createStoreContext<BibleVerseState>('BibleVerse')

export const BibleVerseStoreContext = StoreContext
export const useBibleVerseStore = useSelector
export const useBibleVerseStoreApi = useStoreApi
```

- [ ] **Step 6: Write the schema and the collection spec**

```ts
// src/extensions/bible/api/verse-schema.ts
import type { RxJsonSchema } from 'rxdb'
import type { ExtensionCollectionSpec } from '@/shared/lib'
import type { BibleVerse } from '../model/verse'

export const bibleVerseSchema: RxJsonSchema<BibleVerse> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    translation: { type: 'string' },
    book: { type: 'string' },
    chapter: { type: 'number' },
    verse: { type: 'number' },
    text: { type: 'string' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'translation', 'book', 'chapter', 'verse', 'text'],
}

export const bibleVerseCollection: ExtensionCollectionSpec = {
  key: 'bibleVerses',
  table: 'bible_verses',
  creator: { schema: bibleVerseSchema },
}
```

- [ ] **Step 7: Register extension collections in the database**

In `src/app/persistence/database.ts`, give `createAppDatabase` a second parameter and merge the specs in:

```ts
export async function createAppDatabase<Internals, InstanceCreationOptions>(
  storage: RxStorage<Internals, InstanceCreationOptions>,
  extensionCollections: ExtensionCollectionSpec[] = [],
): Promise<AppCollections> {
```

and inside, after the core collection map is built, add:

```ts
    ...Object.fromEntries(
      extensionCollections.map((spec) => [spec.key, spec.creator] as const),
    ),
```

Extension collections are registered whether or not the extension is enabled — a schema the database does not know is a schema replication can orphan rows against.

- [ ] **Step 8: Compose the synced-table list**

`src/shared/config/sync-tables.ts` — leave `SYNCED_TABLES` as the core list and add:

```ts
export interface SyncTableSpec {
  table: string
  collectionKey: string
}

export const CORE_SYNC_TABLES: readonly SyncTableSpec[] = SYNCED_TABLES.map((table) => ({
  table,
  collectionKey: table,
}))
```

`src/app/composition-root.ts` — build `syncTargets` from the composed list rather than `SYNCED_TABLES`:

```ts
const syncTableSpecs: SyncTableSpec[] = [
  ...CORE_SYNC_TABLES,
  ...EXTENSIONS.flatMap((manifest) =>
    manifest.collections.flatMap((spec) =>
      spec.table ? [{ table: spec.table, collectionKey: spec.key }] : [],
    ),
  ),
]
const syncTargets: Promise<SyncTarget[]> = collections.then((c) =>
  syncTableSpecs.map(({ table, collectionKey }) => ({
    table,
    collection: (c as unknown as Record<string, RxCollection<Identifiable>>)[collectionKey]!,
  })),
)
```

`src/features/sync/divergence.ts` — take the table list from its deps instead of importing the const. Add `tables: readonly string[]` to its deps type and replace the two `SYNCED_TABLES` uses with `deps.tables`; pass `syncTableSpecs.map((spec) => spec.table)` from the composition root.

- [ ] **Step 8b: Make replication follow the toggle**

Composing the target list at startup is not enough: the spec says an extension's table joins the sync
set **only while the extension is enabled**. Filter at cycle time rather than at startup, because
preferences have not loaded when `createServices()` runs.

Give `SyncManager.fromSupabase` a third argument — a predicate — and apply it where it enumerates
targets:

```ts
const extensionTables = new Map(
  EXTENSIONS.flatMap((manifest) =>
    manifest.collections.flatMap((spec) =>
      spec.table ? [[spec.table, manifest.id] as const] : [],
    ),
  ),
)
const tableIsActive = (table: string): boolean => {
  const owner = extensionTables.get(table)
  if (!owner) return true
  const prefs = services.preferencesStore.getState().preferences
  return prefs ? isExtensionEnabled(prefs, owner) : false
}
```

Test it in `src/shared/api/supabase/sync-manager.test.ts`: a cycle with the predicate rejecting
`bible_verses` pushes and pulls every core table and never touches that one; with it accepting, the
table is included. Re-enabling resumes from the stored checkpoint, so nothing is lost in between —
assert that the checkpoint is untouched while the table is skipped.

- [ ] **Step 9: Write the Supabase migration**

```sql
-- supabase/migrations/20260917120000_bible_verses.sql
create table if not exists public.bible_verses (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists bible_verses_user_updated_idx
  on public.bible_verses (user_id, updated_at, id);

alter table public.bible_verses enable row level security;

create policy "bible_verses are private to their owner"
  on public.bible_verses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.bible_verses;
```

Then copy the most recent `push_documents` function definition from `supabase/migrations/` and re-declare it with `'bible_verses'` added to its `if p_table not in (…)` allow-list. `synced-tables.test.ts` reads the newest allow-list in the directory, so the new file must contain the whole function, not a fragment.

- [ ] **Step 10: Point the allow-list test at the composed list**

In `src/app/persistence/synced-tables.test.ts`, compare the allow-list against core tables plus every table the registry's manifests declare, so a manifest without a SQL grant fails:

```ts
const expected = [
  ...SYNCED_TABLES,
  ...EXTENSIONS.flatMap((manifest) =>
    manifest.collections.flatMap((spec) => (spec.table ? [spec.table] : [])),
  ),
]
expect([...latestAllowList()].sort()).toEqual([...expected].sort())
```

- [ ] **Step 11: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions src/app src/shared/config/sync-tables.ts src/features/sync/divergence.ts
git add src/extensions src/app src/shared src/features supabase
git commit -m "feat(bible): the verse collection, its schema and its Supabase table"
```

---

### Task 7: Verse text behind a port, and stripping references

**Files:**

- Create: `src/extensions/bible/model/strip-reference.ts`
- Create: `src/extensions/bible/model/strip-reference.test.ts`
- Create: `src/extensions/bible/model/verse-text.ts`
- Create: `src/extensions/bible/model/verse-text.test.ts`

**Interfaces:**

- Consumes: `VerseRef`, `expandRange` (Task 5); `BibleVerse` (Task 6).
- Produces: `stripReference(back, ref?): string`, `interface VerseTextSource { read(ref): Promise<StoredVerse[]> }`, `type StoredVerse = { verse: number; text: string }`, `createStoredVerseSource(verses)`.

- [ ] **Step 1: Write the failing strip test**

```ts
// src/extensions/bible/model/strip-reference.test.ts
import { describe, expect, it } from 'vitest'
import { stripReference } from './strip-reference'

describe('stripReference', () => {
  it('removes a leading book chapter:verse', () => {
    expect(stripReference('Genesis 1:1 In the beginning God created.')).toBe(
      'In the beginning God created.',
    )
  })

  it('removes a leading chapter:verse without a book', () => {
    expect(stripReference('1:1 In the beginning')).toBe('In the beginning')
  })

  it('removes a bracketed reference', () => {
    expect(stripReference('(1:1) In the beginning')).toBe('In the beginning')
  })

  it('removes a numbered book reference', () => {
    expect(stripReference('1 John 2:3 And hereby we know')).toBe('And hereby we know')
  })

  it('leaves a back that never had one', () => {
    expect(stripReference('In the beginning God created.')).toBe('In the beginning God created.')
  })

  it('leaves a back whose text merely starts with a number', () => {
    expect(stripReference('40 days and 40 nights')).toBe('40 days and 40 nights')
  })

  it('trims what it leaves behind', () => {
    expect(stripReference('Genesis 1:1   In the beginning  ')).toBe('In the beginning')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/model/strip-reference.test.ts`
Expected: FAIL — cannot resolve `./strip-reference`.

- [ ] **Step 3: Write it**

```ts
// src/extensions/bible/model/strip-reference.ts
/**
 * Removes a reference that a card back opens with. `40 days and 40 nights` keeps its
 * number: only `chapter:verse` shapes count, optionally bracketed and optionally
 * preceded by a book name (which may itself start with a number, as in `1 John`).
 */
const LEADING = /^\(?\s*(?:\d?\s*[\p{L}][\p{L}.\s]*?\s+)?(\d+):(\d+)\s*\)?[\s.:–-]*/u

export function stripReference(back: string): string {
  return back.replace(LEADING, '').trim()
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/strip-reference.test.ts`
Expected: PASS, 7 tests. If the "merely starts with a number" case fails, the pattern is matching too greedily — it must require a `digits:digits` group.

- [ ] **Step 5: Write the failing source test**

```ts
// src/extensions/bible/model/verse-text.test.ts
import { describe, expect, it } from 'vitest'
import { createStoredVerseSource } from './verse-text'
import { makeBibleVerse } from './verse'

const at = new Date(0).toISOString()
const verse = (chapter: number, number: number, text: string) =>
  makeBibleVerse({ createdAt: at, book: 'Genesis', chapter, verse: number, text })

describe('createStoredVerseSource', () => {
  it('reads a range in verse order', async () => {
    const source = createStoredVerseSource([verse(1, 2, 'second'), verse(1, 1, 'first')])
    expect(await source.read({ book: 'Genesis', chapter: 1, from: 1, to: 2 })).toEqual([
      { verse: 1, text: 'first' },
      { verse: 2, text: 'second' },
    ])
  })

  it('returns nothing for a range it does not hold — an absent passage is not an error', async () => {
    const source = createStoredVerseSource([verse(1, 1, 'first')])
    expect(await source.read({ book: 'Exodus', chapter: 1, from: 1, to: 3 })).toEqual([])
  })

  it('returns only the verses it holds inside the range', async () => {
    const source = createStoredVerseSource([verse(1, 1, 'first'), verse(1, 3, 'third')])
    expect(await source.read({ book: 'Genesis', chapter: 1, from: 1, to: 3 })).toEqual([
      { verse: 1, text: 'first' },
      { verse: 3, text: 'third' },
    ])
  })
})
```

- [ ] **Step 6: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/model/verse-text.test.ts`
Expected: FAIL — cannot resolve `./verse-text`.

- [ ] **Step 7: Write the port and its first adapter**

```ts
// src/extensions/bible/model/verse-text.ts
import type { VerseRef } from './reference'
import { type BibleVerse, DEFAULT_TRANSLATION } from './verse'

export interface StoredVerse {
  verse: number
  text: string
}

/**
 * Where verse text comes from. Today: what the reader published into the library.
 * Later: a bundled translation, implementing this same port with nothing above it changing.
 */
export interface VerseTextSource {
  read(ref: VerseRef): Promise<StoredVerse[]>
}

export function createStoredVerseSource(
  verses: readonly BibleVerse[],
  translation: string = DEFAULT_TRANSLATION,
): VerseTextSource {
  return {
    read({ book, chapter, from, to }) {
      const found = verses
        .filter(
          (held) =>
            held.translation === translation &&
            held.book === book &&
            held.chapter === chapter &&
            held.verse >= from &&
            held.verse <= to,
        )
        .sort((a, b) => a.verse - b.verse)
        .map(({ verse, text }) => ({ verse, text }))
      return Promise.resolve(found)
    },
  }
}
```

- [ ] **Step 8: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/verse-text.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 9: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions/bible/model
git add src/extensions/bible/model
git commit -m "feat(bible): verse text behind a port, and reference stripping"
```

---

### Task 8: The manifest, the route, and the Bible row in the import sheet

**Files:**

- Create: `src/extensions/bible/manifest.tsx` (`.tsx` — it holds JSX)
- Create: `src/extensions/bible/i18n/en.ts`
- Create: `src/extensions/bible/ui/BibleProvider.tsx`
- Create: `src/extensions/bible/ui/BibleImportPage.tsx` (a stub screen this task, filled in Tasks 9–10)
- Create: `src/extensions/bible/index.ts`
- Test: `src/shared/ui/ImportSheet.test.tsx`
- Modify: `src/shared/ui/ImportSheet.tsx`
- Modify: `src/pages/deck-library/ui/DeckLibraryPage.tsx`, `src/pages/deck-detail/ui/DeckDetailPage.tsx`, `src/widgets/content-editor/ui/DeckContentEditor.tsx`
- Modify: `src/app/extensions/registry.ts`, `src/app/router.tsx`

**Interfaces:**

- Consumes: everything from Tasks 1–7.
- Produces: `bibleManifest: ExtensionManifest`, `BIBLE_IMPORT_PATH = '/import/bible'`, `ImportSheet`'s `extraOptions` prop.

- [ ] **Step 1: Write the failing import-sheet test**

```tsx
// src/shared/ui/ImportSheet.test.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ImportSheet } from './ImportSheet'

afterEach(cleanup)

function renderSheet(extraOptions: Parameters<typeof ImportSheet>[0]['extraOptions'] = []) {
  const onSelect = vi.fn()
  renderWithProviders(
    <ImportSheet
      open
      onOpenChange={vi.fn()}
      title="Add cards"
      description="Bring cards in"
      onPasteNotes={vi.fn()}
      onPickFile={vi.fn()}
      extraOptions={extraOptions}
      onSelectExtra={onSelect}
    />,
  )
  return onSelect
}

describe('ImportSheet', () => {
  it('offers paste and file when nothing is contributed', () => {
    renderSheet()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('appends a contributed row after the built-in ones', () => {
    renderSheet([
      { id: 'bible', icon: null, title: 'Bible', subtitle: 'Pick a passage', to: '/import/bible' },
    ])
    const rows = screen.getAllByRole('button')
    expect(rows).toHaveLength(3)
    expect(rows[2]).toHaveTextContent('Bible')
  })

  it('reports which contributed row was chosen', async () => {
    const user = userEvent.setup()
    const onSelect = renderSheet([
      { id: 'bible', icon: null, title: 'Bible', subtitle: 'Pick a passage', to: '/import/bible' },
    ])
    await user.click(screen.getByText('Bible'))
    expect(onSelect).toHaveBeenCalledWith('/import/bible')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/shared/ui/ImportSheet.test.tsx`
Expected: FAIL — `extraOptions` is not a prop.

- [ ] **Step 3: Widen ImportSheet**

In `src/shared/ui/ImportSheet.tsx`, add to `ImportSheetProps`:

```ts
  extraOptions?: ImportOptionContribution[]
  onSelectExtra?: (to: string) => void
```

importing `type ImportOptionContribution` from `@/shared/lib`, and append after the two built-in options:

```ts
          ...(extraOptions ?? []).map((option) => ({
            id: option.id,
            icon: option.icon,
            tone: option.tone ?? ('brand' as const),
            badge: option.badge,
            title: option.title,
            subtitle: option.subtitle,
            onSelect: () => onSelectExtra?.(option.to),
          })),
```

The sheet stays prop-driven; it never reads a context.

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/shared/ui/ImportSheet.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Feed the sheet from its hosts**

In each of `DeckLibraryPage.tsx`, `DeckDetailPage.tsx` and `DeckContentEditor.tsx`, where `ImportSheet` is rendered, read the point and pass it down:

```tsx
const extensionImports = useExtensionPoint('importOptions')
```

```tsx
  extraOptions={extensionImports}
  onSelectExtra={(to) => onExtensionImport?.(to)}
```

Add `onExtensionImport?: (to: string) => void` to each component's props and let the route screens navigate: `onExtensionImport={(to) => navigate({ to })}` in `library-screens.tsx` and `deck-screens.tsx`. From a deck, append the deck id: `navigate({ to, search: { deckId } })`.

- [ ] **Step 6: Write the extension's copy**

```ts
// src/extensions/bible/i18n/en.ts
export const bibleMessages = {
  label: 'Bible',
  description: 'Add verses as cards, straight from a reference',
  importTitle: 'Add a passage',
  importSubtitle: 'Pick a book, chapter and verses',
  pickBook: 'Pick a Bible book',
  pickChapter: 'Pick a chapter',
  pickStart: 'Pick a starting verse',
  pickEnd: 'Pick an ending verse',
  justVerse: 'Just verse {{verse}}',
  searchBooks: 'Search books',
  startOver: 'Start over',
  changeVerses: 'Change verses',
  verseText: 'Verse text',
  textImported: 'Text brought in from your Bible library.',
  textMissing: 'This passage is not in your Bible library yet — paste it in below.',
  pasteInstead: 'Paste text instead',
  translation: 'Translation',
  target: 'Include in decks',
  targetExisting: 'Existing deck',
  targetNew: 'New deck',
  pickDeck: 'Choose a deck',
  newDeckTitle: 'Name the deck',
  duplicates: 'You already have {{refs}} here',
  duplicatesSkip: 'Skipped. Add them anyway?',
  addCount_one: 'Add {{count}} card',
  addCount_other: 'Add {{count}} cards',
  empty: 'Nothing to add yet',
  offline: 'Everything here works offline.',
  libraryTitle: 'Bible library',
  librarySubtitle: 'What this device can prefill',
  publishFromDeck: 'Publish a deck',
  publishText: 'Keep this text',
  cleanBacks: 'Clean references from backs',
  cleanBacksCount_one: '{{count}} card would change',
  cleanBacksCount_other: '{{count}} cards would change',
  published_one: '{{count}} verse',
  published_other: '{{count}} verses',
} as const
```

- [ ] **Step 7: Write the provider that owns the store**

```tsx
// src/extensions/bible/ui/BibleProvider.tsx
import { type ReactNode, useEffect, useMemo } from 'react'
import type { RxCollection } from 'rxdb'
import { RxdbRepository } from '@/shared/api/rxdb'
import { useExtensionCollections } from '@/shared/lib'
import { BibleVerseStoreContext, createBibleVerseStore } from '../model/store'
import type { BibleVerse } from '../model/verse'

/** Mounted only while the extension is on: the store starts here and stops when it unmounts. */
export function ExtensionProvider({ children }: { children: ReactNode }) {
  const collections = useExtensionCollections()
  const store = useMemo(
    () =>
      createBibleVerseStore(
        new RxdbRepository<BibleVerse>(
          Promise.resolve(collections.bibleVerses as RxCollection<BibleVerse>),
        ),
      ),
    [collections],
  )

  useEffect(() => {
    store.getState().start()
    return () => store.getState().stop()
  }, [store])

  return <BibleVerseStoreContext value={store}>{children}</BibleVerseStoreContext>
}
```

- [ ] **Step 8: Write the manifest**

```tsx
// src/extensions/bible/manifest.tsx
import { BookOpen } from 'lucide-react'
import type { ExtensionManifest } from '@/shared/lib'
import { bibleVerseCollection } from './api/verse-schema'

export const BIBLE_ID = 'bible'
export const BIBLE_IMPORT_PATH = '/import/bible'
export const BIBLE_LIBRARY_PATH = '/settings/extensions/bible'

export const bibleManifest: ExtensionManifest = {
  id: BIBLE_ID,
  icon: <BookOpen />,
  labelKey: 'bible:label',
  descriptionKey: 'bible:description',
  namespace: 'bible',
  loadMessages: () => import('./i18n/en').then((module) => module.bibleMessages),
  routes: [
    {
      path: BIBLE_IMPORT_PATH,
      load: () => import('./ui/BibleImportPage'),
      export: 'BibleImportScreen',
    },
    {
      path: BIBLE_LIBRARY_PATH,
      load: () => import('./ui/BibleLibraryPage'),
      export: 'BibleLibraryScreen',
    },
  ],
  collections: [bibleVerseCollection],
  contributions: {
    importOptions: [
      {
        id: 'bible',
        icon: <BookOpen className="size-5" aria-hidden />,
        tone: 'brand',
        title: 'Bible',
        subtitle: 'Pick a book, chapter and verses',
        to: BIBLE_IMPORT_PATH,
      },
    ],
  },
  loadProvider: () => import('./ui/BibleProvider'),
}
```

Keep it this small: it is imported by the registry and therefore lives in the entry graph — the screens behind `load` do not.

The import row's title and subtitle are literal English here rather than `t(…)` because the sheet renders before the namespace resolves; they are the one exception, and Task 11's review should confirm nothing else in the manifest hardcodes copy.

- [ ] **Step 9: Stub the screen so the route resolves**

```tsx
// src/extensions/bible/ui/BibleImportPage.tsx
import { useTranslation } from 'react-i18next'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export function BibleImportScreen() {
  const { t } = useTranslation('bible')
  return (
    <AppScreen header={<ScreenHeader title={t('importTitle')} />}>
      <p className="mt-6 text-body text-muted-foreground">{t('empty')}</p>
    </AppScreen>
  )
}
```

- [ ] **Step 10: Register and route**

`src/app/extensions/registry.ts`:

```ts
import { bibleManifest } from '@/extensions/bible/manifest'

export const EXTENSIONS: ExtensionManifest[] = [bibleManifest]
```

`src/app/router.tsx` — add the extension routes to `routeTree`, each guarded:

```ts
const extensionRoutes = EXTENSIONS.flatMap((manifest) =>
  manifest.routes.map((extensionRoute) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: extensionRoute.path,
      component: lazyScreen(extensionRoute.load)(extensionRoute.export),
      beforeLoad: ({ context }) => {
        const prefs = context.services.preferencesStore.getState().preferences
        if (!prefs || !isExtensionEnabled(prefs, manifest.id)) {
          throw redirect({ to: ROUTES.settingsExtensions })
        }
      },
    }),
  ),
)
```

and spread `...extensionRoutes` into `rootRoute.addChildren([...])`.

- [ ] **Step 11: Verify, including the entry graph**

```bash
npm run typecheck && npm run lint && npm run test
npm run build && npm run check:entry-graph
```

Expected: `check:entry-graph — ok`. If a `bible-*` chunk is preloaded, something in `manifest.tsx` imports a screen eagerly.

- [ ] **Step 12: Commit**

```bash
npx prettier --write src/extensions src/shared/ui/ImportSheet.tsx src/shared/ui/ImportSheet.test.tsx src/pages src/widgets src/app
git add src/extensions src/shared src/pages src/widgets src/app
git commit -m "feat(bible): the manifest, its guarded route and the import sheet row"
```

---

### Task 9: The picker — book, chapter, verse range

**Files:**

- Create: `src/extensions/bible/ui/BookPicker.tsx`
- Create: `src/extensions/bible/ui/NumberGrid.tsx`
- Create: `src/extensions/bible/model/use-passage-picker.ts`
- Test: `src/extensions/bible/model/use-passage-picker.test.ts`
- Test: `src/extensions/bible/ui/BibleImportPage.test.tsx`
- Modify: `src/extensions/bible/ui/BibleImportPage.tsx`

**Interfaces:**

- Consumes: `BOOKS`, `chapterCount`, `verseCount` (Task 5); `formatRef` (Task 5).
- Produces: `usePassagePicker(): { step, book, chapter, from, to, ref, pickBook, pickChapter, pickFrom, pickTo, startOver, changeVerses }` where `step` is `'book' | 'chapter' | 'from' | 'to' | 'done'`.

- [ ] **Step 1: Write the failing picker test**

```ts
// src/extensions/bible/model/use-passage-picker.test.ts
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePassagePicker } from './use-passage-picker'

describe('usePassagePicker', () => {
  it('starts on the book step with no reference', () => {
    const { result } = renderHook(() => usePassagePicker())
    expect(result.current.step).toBe('book')
    expect(result.current.ref).toBeNull()
  })

  it('walks book, chapter, start, end', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    expect(result.current.step).toBe('chapter')
    act(() => result.current.pickChapter(1))
    expect(result.current.step).toBe('from')
    act(() => result.current.pickFrom(1))
    expect(result.current.step).toBe('to')
    act(() => result.current.pickTo(31))
    expect(result.current.step).toBe('done')
    expect(result.current.ref).toEqual({ book: 'Genesis', chapter: 1, from: 1, to: 31 })
  })

  it('offers only verses at or after the start as an ending', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    act(() => result.current.pickChapter(1))
    act(() => result.current.pickFrom(30))
    expect(result.current.endOptions).toEqual([30, 31])
  })

  it('start over clears everything', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    act(() => result.current.pickChapter(1))
    act(() => result.current.startOver())
    expect(result.current.step).toBe('book')
    expect(result.current.book).toBeNull()
  })

  it('change verses returns to the start step, keeping book and chapter', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    act(() => result.current.pickChapter(1))
    act(() => result.current.pickFrom(1))
    act(() => result.current.pickTo(5))
    act(() => result.current.changeVerses())
    expect(result.current.step).toBe('from')
    expect(result.current.book).toBe('Genesis')
    expect(result.current.chapter).toBe(1)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/model/use-passage-picker.test.ts`
Expected: FAIL — cannot resolve `./use-passage-picker`.

- [ ] **Step 3: Write the hook**

```ts
// src/extensions/bible/model/use-passage-picker.ts
import { useMemo, useState } from 'react'
import { chapterCount, verseCount } from './canon'
import type { VerseRef } from './reference'

export type PickerStep = 'book' | 'chapter' | 'from' | 'to' | 'done'

export interface PassagePicker {
  step: PickerStep
  book: string | null
  chapter: number | null
  from: number | null
  to: number | null
  ref: VerseRef | null
  chapterOptions: number[]
  startOptions: number[]
  endOptions: number[]
  pickBook: (book: string) => void
  pickChapter: (chapter: number) => void
  pickFrom: (verse: number) => void
  pickTo: (verse: number) => void
  startOver: () => void
  changeVerses: () => void
}

const upTo = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1)

export function usePassagePicker(): PassagePicker {
  const [book, setBook] = useState<string | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [from, setFrom] = useState<number | null>(null)
  const [to, setTo] = useState<number | null>(null)

  const chapterOptions = useMemo(() => (book ? upTo(chapterCount(book)) : []), [book])
  const startOptions = useMemo(
    () => (book && chapter ? upTo(verseCount(book, chapter)) : []),
    [book, chapter],
  )
  const endOptions = useMemo(
    () => (from ? startOptions.filter((verse) => verse >= from) : []),
    [startOptions, from],
  )

  const step: PickerStep = !book
    ? 'book'
    : !chapter
      ? 'chapter'
      : !from
        ? 'from'
        : !to
          ? 'to'
          : 'done'

  return {
    step,
    book,
    chapter,
    from,
    to,
    ref: book && chapter && from && to ? { book, chapter, from, to } : null,
    chapterOptions,
    startOptions,
    endOptions,
    pickBook: (next) => {
      setBook(next)
      setChapter(null)
      setFrom(null)
      setTo(null)
    },
    pickChapter: (next) => {
      setChapter(next)
      setFrom(null)
      setTo(null)
    },
    pickFrom: (next) => {
      setFrom(next)
      setTo(null)
    },
    pickTo: setTo,
    startOver: () => {
      setBook(null)
      setChapter(null)
      setFrom(null)
      setTo(null)
    },
    changeVerses: () => {
      setFrom(null)
      setTo(null)
    },
  }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/use-passage-picker.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the two view pieces**

```tsx
// src/extensions/bible/ui/NumberGrid.tsx
export function NumberGrid({
  label,
  values,
  onPick,
  lead,
}: {
  label: string
  values: number[]
  onPick: (value: number) => void
  lead?: { label: string; onPick: () => void }
}) {
  return (
    <section>
      <h2 className="mb-3 text-center text-body font-bold text-heading">{label}</h2>
      {lead ? (
        <button
          type="button"
          onClick={lead.onPick}
          className="mx-auto mb-3 block rounded-control bg-info-surface px-5 py-2.5 text-body font-semibold text-heading shadow-rest transition-transform active:scale-[0.97]"
        >
          {lead.label}
        </button>
      ) : null}
      <div className="grid grid-cols-4 gap-2.5">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className="grid aspect-square place-items-center rounded-full border border-border bg-card text-body font-semibold tabular-nums text-heading shadow-rest transition-transform active:scale-[0.94]"
          >
            {value}
          </button>
        ))}
      </div>
    </section>
  )
}
```

```tsx
// src/extensions/bible/ui/BookPicker.tsx
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchField } from '@/shared/ui'
import { BOOKS } from '../model/canon'

export function BookPicker({ onPick }: { onPick: (book: string) => void }) {
  const { t } = useTranslation('bible')
  const [query, setQuery] = useState('')
  const books = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? BOOKS.filter((book) => book.name.toLowerCase().includes(needle)) : BOOKS
  }, [query])

  return (
    <section>
      <h2 className="mb-3 text-body font-bold text-heading">{t('pickBook')}</h2>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder={t('searchBooks')}
        aria-label={t('searchBooks')}
      />
      <ul className="mt-3 flex flex-col gap-2">
        {books.map((book) => (
          <li key={book.name}>
            <button
              type="button"
              onClick={() => onPick(book.name)}
              className="w-full rounded-control bg-secondary/40 px-4 py-3 text-left text-body font-semibold text-heading transition-transform active:scale-[0.99]"
            >
              {book.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

Check `SearchField`'s actual props in `src/shared/ui/SearchField.tsx` before writing this — match them rather than the shape assumed here.

- [ ] **Step 6: Write the failing screen test**

```tsx
// src/extensions/bible/ui/BibleImportPage.test.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { i18n } from '@/shared/i18n'
import { bibleMessages } from '../i18n/en'
import { BibleImportPage } from './BibleImportPage'

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

afterEach(cleanup)

describe('BibleImportPage picker', () => {
  it('starts by asking for a book', () => {
    renderWithProviders(<BibleImportPage />)
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
  })

  it('walks to the chapter grid, then the verse grids', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    expect(screen.getByText('Pick a chapter')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByText('Pick a starting verse')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByText('Pick an ending verse')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Just verse 1' })).toBeInTheDocument()
  })

  it('shows the reference as it is built', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '31' }))
    expect(screen.getByText('Genesis 1:1-31')).toBeInTheDocument()
  })

  it('start over returns to the book list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
  })
})
```

Export a plain `BibleImportPage` component beside the routed `BibleImportScreen`, so the test renders the page without the router.

- [ ] **Step 7: Run it and watch it fail, then build the screen**

Run: `npx vitest run src/extensions/bible/ui/BibleImportPage.test.tsx`
Expected: FAIL — the page still renders the Task 8 stub.

Replace the stub with the picker: breadcrumb (`formatRef` of whatever is chosen so far), **Start over** always, **Change verses** once `step === 'done'`, then `BookPicker`, `NumberGrid` for chapters, `NumberGrid` for the start verse, and `NumberGrid` for the end verse with `lead={{ label: t('justVerse', { verse: from }), onPick: () => pickTo(from) }}`.

- [ ] **Step 8: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/ui/BibleImportPage.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 9: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions/bible
git add src/extensions/bible
git commit -m "feat(bible): pick a book, a chapter and a verse range"
```

---

### Task 10: Text, target deck, and the handoff to import review

**Files:**

- Create: `src/extensions/bible/features/build-verse-cards.ts`
- Test: `src/extensions/bible/features/build-verse-cards.test.ts`
- Create: `src/extensions/bible/ui/VerseTextPanel.tsx`
- Create: `src/extensions/bible/ui/TargetPicker.tsx`
- Modify: `src/extensions/bible/ui/BibleImportPage.tsx` (+ its test)
- Modify: `src/widgets/content-editor/model/import-draft.ts`

**Interfaces:**

- Consumes: `VerseRef`, `formatRef`, `expandRange` (Task 5); `VerseTextSource` (Task 7); `useImportDraft`, `MoveSheet`, `PromptSheet`.
- Produces: `buildVerseCards(ref, text): ParsedCard[]`, `findDuplicateRefs(cards, existing): string[]`.

- [ ] **Step 1: Write the failing card-building test**

```ts
// src/extensions/bible/features/build-verse-cards.test.ts
import { describe, expect, it } from 'vitest'
import { buildVerseCards, findDuplicateRefs } from './build-verse-cards'

const ref = { book: 'Genesis', chapter: 1, from: 1, to: 2 }

describe('buildVerseCards', () => {
  it('puts the reference on the front and only the text on the back', () => {
    const cards = buildVerseCards(
      { book: 'Genesis', chapter: 1, from: 1, to: 1 },
      'In the beginning.',
    )
    expect(cards).toEqual([{ front: 'Genesis 1:1', back: 'In the beginning.' }])
  })

  it('splits numbered verses into one card each', () => {
    const cards = buildVerseCards(ref, '1) In the beginning. 2) The earth was without form.')
    expect(cards).toEqual([
      { front: 'Genesis 1:1', back: 'In the beginning.' },
      { front: 'Genesis 1:2', back: 'The earth was without form.' },
    ])
  })

  it('splits bracketed chapter:verse markers too', () => {
    const cards = buildVerseCards(ref, '(1:1) In the beginning.\n(1:2) The earth was without form.')
    expect(cards).toEqual([
      { front: 'Genesis 1:1', back: 'In the beginning.' },
      { front: 'Genesis 1:2', back: 'The earth was without form.' },
    ])
  })

  it('makes one card for the whole range when the text carries no markers', () => {
    const cards = buildVerseCards(ref, 'In the beginning the earth was without form.')
    expect(cards).toEqual([
      { front: 'Genesis 1:1-2', back: 'In the beginning the earth was without form.' },
    ])
  })

  it('makes nothing from empty text', () => {
    expect(buildVerseCards(ref, '   ')).toEqual([])
  })

  it('never leaves a reference on a back', () => {
    const cards = buildVerseCards(ref, '1) Genesis 1:1 In the beginning. 2) The earth.')
    expect(cards[0]?.back).toBe('In the beginning.')
  })
})

describe('findDuplicateRefs', () => {
  it('names the fronts the deck already holds', () => {
    const cards = [
      { front: 'Genesis 1:1', back: 'a' },
      { front: 'Genesis 1:2', back: 'b' },
    ]
    expect(findDuplicateRefs(cards, ['Genesis 1:1'])).toEqual(['Genesis 1:1'])
  })

  it('finds none in an empty deck', () => {
    expect(findDuplicateRefs([{ front: 'Genesis 1:1', back: 'a' }], [])).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/features/build-verse-cards.test.ts`
Expected: FAIL — cannot resolve `./build-verse-cards`.

- [ ] **Step 3: Write it**

```ts
// src/extensions/bible/features/build-verse-cards.ts
import type { ParsedCard } from '@/shared/lib'
import { formatRef, type VerseRef } from '../model/reference'
import { stripReference } from '../model/strip-reference'

/** `1)` or `(1:1)` — the two shapes verse text arrives in. */
const MARKER = /(?:\((\d+):(\d+)\)|(?:^|\s)(\d+)\))\s*/g

interface Segment {
  verse: number
  text: string
}

function splitByMarkers(text: string): Segment[] {
  const segments: Segment[] = []
  const matches = [...text.matchAll(MARKER)]
  matches.forEach((match, index) => {
    const verse = Number(match[2] ?? match[3])
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? text.length
    const body = stripReference(text.slice(start, end).trim())
    if (verse > 0 && body) segments.push({ verse, text: body })
  })
  return segments
}

export function buildVerseCards(ref: VerseRef, text: string): ParsedCard[] {
  const body = text.trim()
  if (!body) return []

  const segments = splitByMarkers(body)
  if (segments.length > 0) {
    return segments.map(({ verse, text: verseText }) => ({
      front: formatRef({ ...ref, from: verse, to: verse }),
      back: verseText,
    }))
  }

  return [{ front: formatRef(ref), back: stripReference(body) }]
}

export function findDuplicateRefs(
  cards: readonly ParsedCard[],
  existingFronts: readonly string[],
): string[] {
  const held = new Set(existingFronts.map((front) => front.trim().toLowerCase()))
  return cards.map((card) => card.front).filter((front) => held.has(front.trim().toLowerCase()))
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/features/build-verse-cards.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Widen the import draft by one neutral source**

In `src/widgets/content-editor/model/import-draft.ts`:

```ts
export type ImportSource = 'paste' | 'mindscape' | 'anki' | 'extension'
```

`'extension'`, never `'bible'` — the word does not belong in a core file. `ImportReviewPage` branches only on `'mindscape'`, so nothing else changes.

- [ ] **Step 6: Write the text panel and the target picker**

`VerseTextPanel.tsx` — a labelled `Textarea` plus one line of status: `t('textImported')` when the source filled it, `t('textMissing')` when it opened empty. Props: `{ value, onChange, prefilled }`. Reuse `Textarea` from `@/shared/ui`.

`TargetPicker.tsx` — a `SegmentedControl` of `t('targetExisting')` / `t('targetNew')`. Choosing _existing_ opens `MoveSheet` with `targets="deck"`, `decks` and `folders` read from `useDeckStore(selectDecks)` / `useFolderStore`, and `excludeIds={new Set()}`. Choosing _new_ opens `PromptSheet` with the chapter as its initial value. Props: `{ suggestedName, onPickDeck, onNameDeck }`.

- [ ] **Step 7: Write the failing flow test**

Append to `src/extensions/bible/ui/BibleImportPage.test.tsx`:

```tsx
describe('BibleImportPage text and target', () => {
  it('opens the text box empty when the library holds nothing, and says so', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: 'Just verse 1' }))
    expect(screen.getByLabelText('Verse text')).toHaveValue('')
    expect(
      screen.getByText('This passage is not in your Bible library yet — paste it in below.'),
    ).toBeInTheDocument()
  })

  it('counts the cards it would add as the text is typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('1) In the beginning. 2) The earth was without form.')
    expect(screen.getByRole('button', { name: 'Add 2 cards' })).toBeEnabled()
  })

  it('cannot add while the text box is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: 'Just verse 1' }))
    expect(screen.getByRole('button', { name: /^Add/ })).toBeDisabled()
  })
})
```

- [ ] **Step 8: Finish the screen**

Wire the pieces: on `step === 'done'`, read the source (`createStoredVerseSource(useBibleVerseStore((s) => s.verses))`), prefill the box by joining its verses, render `VerseTextPanel`, `TargetPicker`, the duplicate banner from `findDuplicateRefs`, and a `FooterBar` button labelled `t('addCount', { count })`.

The button writes the draft and navigates, mirroring `NewPasteScreen`:

```ts
const add = async () => {
  const cards = buildVerseCards(ref, text).filter(
    (card) => keepDuplicates || !duplicates.includes(card.front),
  )
  setDraft('extension', cards)
  const deckId =
    target.kind === 'existing'
      ? target.deckId
      : (await createDeck(deckStore, { name: target.name })).id
  await navigate({ to: ROUTES.deckImport, params: { deckId }, replace: true })
}
```

Render the translation as a static label under the text box — `t('translation')` and the one
translation's name. No selector exists until there is a second translation.

Add the **Paste text instead** entry at the top: it hides the picker, shows only the text box, and builds cards with `parseVerses` (Task 11 moves that parser in).

- [ ] **Step 9: Run the whole file and watch it pass**

Run: `npx vitest run src/extensions/bible/ui/BibleImportPage.test.tsx`
Expected: PASS, 7 tests.

- [ ] **Step 10: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions/bible src/widgets/content-editor/model/import-draft.ts
git add src/extensions/bible src/widgets
git commit -m "feat(bible): verse text, the target deck, and the handoff to import review"
```

---

### Task 11: Move the verse parser out of core, and make Paste Notes notes-only

**Files:**

- Create: `src/extensions/bible/model/parse-verses.ts` (moved)
- Create: `src/extensions/bible/model/parse-verses.test.ts` (moved and rewritten)
- Modify: `src/shared/lib/content-transfer.ts`, `src/shared/lib/content-transfer.test.ts`, `src/shared/lib/index.ts`
- Modify: `src/pages/paste-notes/model/use-paste-parsing.ts`
- Delete: `src/pages/paste-notes/ui/FormatToggle.tsx`
- Modify: `src/pages/paste-notes/ui/PasteNotesPage.tsx`, `src/pages/paste-notes/ui/PasteNotesPage.test.tsx`
- Modify: `src/app/routes/deck-screens.tsx` (`NewPasteScreen`)
- Modify: `src/shared/i18n/locales/en/` (the file holding `cards.paste.*`)

**Interfaces:**

- Consumes: `stripReference` (Task 7).
- Produces: `parseVerses(text): ParsedCard[]`, `parseVerseChapters(text): VerseChapter[]`, `verseChapterTitles(text): string[]` — all from the extension. `PasteFormat` and `detectPasteFormat` cease to exist.

- [ ] **Step 1: Write the moved test first, with the new back**

```ts
// src/extensions/bible/model/parse-verses.test.ts
import { describe, expect, it } from 'vitest'
import { parseVerseChapters, parseVerses, verseChapterTitles } from './parse-verses'

const CHAPTER = `3 John 1
(1:1) The elder, to Gaius
(1:2) Beloved, I pray`

describe('parseVerses', () => {
  it('puts the reference on the front and only the text on the back', () => {
    expect(parseVerses(CHAPTER)).toEqual([
      { front: '3 John 1:1', back: 'The elder, to Gaius' },
      { front: '3 John 1:2', back: 'Beloved, I pray' },
    ])
  })

  it('joins a verse that wraps onto the next line', () => {
    const wrapped = '3 John 1\n(1:1) The elder,\nto Gaius'
    expect(parseVerses(wrapped)[0]?.back).toBe('The elder, to Gaius')
  })

  it('parses verses with no book header at all', () => {
    expect(parseVerses('(1:1) In the beginning')).toEqual([
      { front: '1:1', back: 'In the beginning' },
    ])
  })

  it('finds nothing in ordinary notes', () => {
    expect(parseVerses('Zeus, King of the gods')).toEqual([])
  })
})

describe('verseChapterTitles', () => {
  it('names the chapters it found', () => {
    expect(verseChapterTitles(CHAPTER)).toEqual(['3 John 1'])
  })
})

describe('parseVerseChapters', () => {
  it('groups verses under their chapter', () => {
    const chapters = parseVerseChapters(CHAPTER)
    expect(chapters).toHaveLength(1)
    expect(chapters[0]?.cards).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/model/parse-verses.test.ts`
Expected: FAIL — cannot resolve `./parse-verses`.

- [ ] **Step 3: Move the parser and change its back**

Cut `UNTITLED_CHAPTER`, `VerseChapter`, `parseVerseChapters`, `parseVerses` and `verseChapterTitles` out of `src/shared/lib/content-transfer.ts` into `src/extensions/bible/model/parse-verses.ts`, importing `ParsedCard` from `@/shared/lib`. Change the one line that builds a card:

```ts
const card: ParsedCard = { front: ref, back: bodyText.trim() }
```

was `back: bodyText ? `${ref} ${bodyText}`.trim() : ref`. The back now holds verse text alone. Drop verses whose body is empty rather than emitting a card whose back repeats the front.

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/parse-verses.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Delete bible from core**

- `src/shared/lib/content-transfer.ts`: also delete `PasteFormat` and `detectPasteFormat`. Delete their cases from `content-transfer.test.ts`.
- `src/shared/lib/index.ts`: stop exporting `parseVerses`, `parseVerseChapters`, `verseChapterTitles`, `detectPasteFormat`, `PasteFormat`.
- `src/pages/paste-notes/model/use-paste-parsing.ts`: delete `format`, `auto`, `setFormat`, `resetFormat`, `suggestedName` and every bible branch. Parsing is always `parseDelimitedNotes`.
- Delete `src/pages/paste-notes/ui/FormatToggle.tsx`.
- `PasteNotesPage.tsx`: delete the `FormatToggle` and `BibleHint` renders and the bible placeholder branch; `SeparatorSettings` always shows. The deck name falls back to `defaultDeckName`.
- `PasteNotesPage.test.tsx`: delete the three bible naming tests ("names the deck after a pasted Bible chapter", "keeps a name the reader typed…", "falls back to the default…") — keep the first, rewritten to assert the default name, and let Task 9's tests cover the bible path.
- `deck-screens.tsx`: `NewPasteScreen` keeps `nextDefaultName` and drops nothing else.
- i18n: delete `cards.paste.kindNotes`, `kindBible`, `formatLabel`, `autoDetected`, `resetAuto`, `biblePlaceholder`, `bibleHintTitle`, `bibleHint`.

- [ ] **Step 6: Prove core is clean**

```bash
grep -rin "bible\|verse\|scripture" src/app src/pages src/widgets src/features src/entities src/shared --include='*.ts' --include='*.tsx'
```

Expected: no matches except `src/app/extensions/registry.ts`'s manifest import. Anything else is a leak — fix it before committing.

- [ ] **Step 7: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions src/shared src/pages/paste-notes src/app/routes/deck-screens.tsx
git add -A src/extensions src/shared src/pages src/app
git commit -m "refactor(paste): move the verse parser into the Bible extension"
```

---

### Task 12: The admin Bible library

**Files:**

- Create: `src/extensions/bible/features/publish-source.ts` + test
- Create: `src/extensions/bible/features/clean-reference-backs.ts` + test
- Create: `src/extensions/bible/ui/BibleLibraryPage.tsx` + test
- Modify: `src/pages/settings-extensions/ui/SettingsExtensionsPage.tsx`

**Interfaces:**

- Consumes: `makeBibleVerse` (Task 6), `stripReference` (Task 7), `parseVerses` (Task 11), `parseRef` (Task 5), `BibleVerseStore` (Task 6), the core `cardStore`.
- Produces: `versesFromCards(cards, at)`, `publishVerses(store, verses)`, `countReferenceBacks(cards)`, `cleanReferenceBacks(cardStore, cards)`.

- [ ] **Step 1: Write the failing publish test**

```ts
// src/extensions/bible/features/publish-source.test.ts
import { describe, expect, it } from 'vitest'
import { versesFromCards } from './publish-source'

const at = new Date(0).toISOString()

describe('versesFromCards', () => {
  it('reads book, chapter and verse off the front and text off the back', () => {
    const verses = versesFromCards(
      [{ front: 'Genesis 1:1', back: 'In the beginning God created.' }],
      at,
    )
    expect(verses).toEqual([
      expect.objectContaining({
        id: 'web:Genesis:1:1',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created.',
      }),
    ])
  })

  it('strips a reference the back still carries', () => {
    const verses = versesFromCards(
      [{ front: 'Genesis 1:1', back: 'Genesis 1:1 In the beginning God created.' }],
      at,
    )
    expect(verses[0]?.text).toBe('In the beginning God created.')
  })

  it('skips a card whose front is not a reference', () => {
    expect(versesFromCards([{ front: 'Zeus', back: 'King of the gods' }], at)).toEqual([])
  })

  it('skips a range front — a source verse is one verse', () => {
    expect(versesFromCards([{ front: 'Genesis 1:1-31', back: 'the whole chapter' }], at)).toEqual(
      [],
    )
  })

  it('skips a card whose back is empty once stripped', () => {
    expect(versesFromCards([{ front: 'Genesis 1:1', back: 'Genesis 1:1' }], at)).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/extensions/bible/features/publish-source.test.ts`
Expected: FAIL — cannot resolve `./publish-source`.

- [ ] **Step 3: Write it**

```ts
// src/extensions/bible/features/publish-source.ts
import { parseRef } from '../model/reference'
import { stripReference } from '../model/strip-reference'
import { type BibleVerse, makeBibleVerse } from '../model/verse'
import type { BibleVerseStore } from '../model/store'

export interface SourceCard {
  front: string
  back: string
}

/** Turns cards that look like verses into source records. Anything else is left alone. */
export function versesFromCards(cards: readonly SourceCard[], at: string): BibleVerse[] {
  const verses: BibleVerse[] = []
  for (const card of cards) {
    const ref = parseRef(card.front)
    if (!ref || ref.to !== ref.from) continue
    const text = stripReference(card.back)
    if (!text) continue
    verses.push(
      makeBibleVerse({
        createdAt: at,
        book: ref.book,
        chapter: ref.chapter,
        verse: ref.from,
        text,
      }),
    )
  }
  return verses
}

export async function publishVerses(
  store: BibleVerseStore,
  verses: readonly BibleVerse[],
): Promise<number> {
  for (const verse of verses) await store.getState().save(verse)
  return verses.length
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/features/publish-source.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing clean-backs test**

```ts
// src/extensions/bible/features/clean-reference-backs.test.ts
import { describe, expect, it, vi } from 'vitest'
import { cleanReferenceBacks, countReferenceBacks } from './clean-reference-backs'

const cards = [
  { id: 'a', front: 'Genesis 1:1', back: 'Genesis 1:1 In the beginning.' },
  { id: 'b', front: 'Genesis 1:2', back: 'The earth was without form.' },
  { id: 'c', front: 'Zeus', back: 'King of the gods' },
]

describe('countReferenceBacks', () => {
  it('counts only the backs that repeat their front', () => {
    expect(countReferenceBacks(cards)).toBe(1)
  })
})

describe('cleanReferenceBacks', () => {
  it('rewrites only those backs, through the caller-supplied save', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const changed = await cleanReferenceBacks(cards, save)
    expect(changed).toBe(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('a', 'In the beginning.')
  })

  it('leaves a library that is already clean untouched', async () => {
    const save = vi.fn()
    expect(await cleanReferenceBacks([cards[1]!], save)).toBe(0)
    expect(save).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: Run it, watch it fail, then write it**

Run: `npx vitest run src/extensions/bible/features/clean-reference-backs.test.ts`
Expected: FAIL — cannot resolve `./clean-reference-backs`.

```ts
// src/extensions/bible/features/clean-reference-backs.ts
import { parseRef } from '../model/reference'
import { stripReference } from '../model/strip-reference'

export interface CleanableCard {
  id: string
  front: string
  back: string
}

/** A back needs cleaning when its front is a reference and the back opens with one. */
function cleanedBack(card: CleanableCard): string | null {
  if (!parseRef(card.front)) return null
  const cleaned = stripReference(card.back)
  return cleaned && cleaned !== card.back ? cleaned : null
}

export function countReferenceBacks(cards: readonly CleanableCard[]): number {
  return cards.filter((card) => cleanedBack(card) !== null).length
}

/**
 * Rewrites the backs through `save`, which the caller wires to the core card command so the
 * edit syncs and logs a pending change like any other.
 */
export async function cleanReferenceBacks(
  cards: readonly CleanableCard[],
  save: (id: string, back: string) => Promise<void>,
): Promise<number> {
  let changed = 0
  for (const card of cards) {
    const back = cleanedBack(card)
    if (!back) continue
    await save(card.id, back)
    changed += 1
  }
  return changed
}
```

Run it again: PASS, 3 tests.

- [ ] **Step 7: Write the admin screen**

`BibleLibraryPage.tsx`, exporting both `BibleLibraryPage` and the routed `BibleLibraryScreen`. Gate the whole screen on `useDevMode()`: when dev mode is off, render the `MissingScreen` from `@/shared/ui` rather than the admin tools.

It shows:

- a list of published books with `t('published', { count })` per book, each removable via `store.getState().remove(id)`
- **Publish a deck** — opens `MoveSheet targets="deck"`; on pick, `versesFromCards` over that deck's cards and its subdecks' cards, then `publishVerses`, then a `toast.success` with the count
- **Clean references from backs** — opens the same sheet; on pick, `countReferenceBacks` feeds a `ConfirmDialog` reading `t('cleanBacksCount', { count })`, and confirming runs `cleanReferenceBacks` with a save wired to the core card command
- empty state `t('empty')` when nothing is published

Test it with a started `BibleVerseStoreContext` over an `InMemoryRepository`, asserting: dev mode off hides the tools; publishing a two-card deck stores two verses; a deck of ordinary notes stores none.

- [ ] **Step 8: Reach it from Settings → Extensions**

Give `SettingsExtensionsPage` an `onOpenExtension?: (id: string) => void` and render a nav row under an enabled extension when its manifest declares a settings route. Wire it in `SettingsExtensionsScreen` to `navigate({ to: BIBLE_LIBRARY_PATH })` — read from the manifest's routes, not hardcoded.

- [ ] **Step 9: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions/bible src/pages/settings-extensions
git add src/extensions src/pages
git commit -m "feat(bible): the admin library — publish sources and clean old backs"
```

---

### Task 13: Documentation and the full verification pass

**Files:**

- Modify: `docs/UBIQUITOUS_LANGUAGE.md`, `CLAUDE.md`, `docs/CODE_STYLE.md`

- [ ] **Step 1: Add the vocabulary**

In `docs/UBIQUITOUS_LANGUAGE.md`, in the same table style as the existing entries:

| Term                   | Means                                                                 | Never                        |
| ---------------------- | --------------------------------------------------------------------- | ---------------------------- |
| **Extension**          | A self-contained feature the learner switches on in Settings          | plugin, add-on, module       |
| **Contribution point** | The named slot a host surface renders on an extension's behalf        | hook, which here means React |
| **Verse**              | One numbered line of scripture; its reference is not part of its text | passage, which is a range    |

- [ ] **Step 2: Teach CLAUDE.md the new layer**

Add to the Architecture section, after the Entities paragraph:

> **Extensions** (`src/extensions/<x>/`, reference `bible/`) — a self-contained feature behind a manifest. Reaches down like a page (widgets → features → entities → shared); **only `app` may import it**, and extensions never import each other. Contributions reach host surfaces through `useExtensionPoint`, never through an import. Enablement is `preferences.extensions`; disabling stops the stores, the keepers and the routes, and deletes nothing.

- [ ] **Step 3: Run everything**

```bash
npm run typecheck && npm run lint && npm run test
npm run build && npm run check:entry-graph
```

Expected: all green, and `check:entry-graph — ok`.

- [ ] **Step 4: Walk the disable contract by hand**

With `npm run dev` (only if asked to run it): switch Bible on, add Genesis 1:1–3 to a new deck, switch Bible off, confirm the deck still studies and the import sheet is back to two rows, then switch Bible on and confirm the library still lists what was published.

- [ ] **Step 5: Commit**

```bash
npx prettier --write docs CLAUDE.md
git add docs CLAUDE.md
git commit -m "docs: extensions layer, and the vocabulary that goes with it"
```

---

## Notes for whoever executes this

- **The canon table in Task 5 is the one place you must not improvise.** Four assertions guard it; if any fails, the table is wrong, not the test.
- **`grep` for bible in core after Task 11** is the acceptance test for the whole design. One hit outside `src/app/extensions/registry.ts` means the decoupling failed.
- **Every RxDB schema change needs both halves:** the migration in `database.ts` _and_ the `completeX` twin, because replication writes pulled rows unmigrated.
- **Card backs never carry a reference.** If a test passes with a back like `Genesis 1:1 In the beginning`, the test is wrong.
