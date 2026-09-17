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

| File                                                | Responsibility                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/shared/lib/extension-manifest.ts`              | The manifest and contribution _types_. No behaviour.                            |
| `src/shared/lib/extension-points-context.tsx`       | Context holding live contributions + `useExtensionPoint`.                       |
| `src/shared/lib/extension-repositories-context.tsx` | Context handing an extension its own repositories.                              |
| `src/app/extensions/registry.ts`                    | The static list of known manifests. The only core file that names an extension. |
| `src/app/extensions/ExtensionsProvider.tsx`         | Reads enabled ids, mounts enabled extensions, publishes contributions.          |
| `src/pages/settings-extensions/`                    | The Settings → Extensions screen.                                               |

**New — the Bible extension:**

| File                                                                             | Responsibility                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/extensions/bible/manifest.ts`                                               | Ids, lazy loaders, contributions. Stays tiny — it is in the entry graph. |
| `src/extensions/bible/model/canon.ts`                                            | 66 books, chapters per book, verses per chapter.                         |
| `src/extensions/bible/model/reference.ts`                                        | `VerseRef` + format/parse/expand.                                        |
| `src/extensions/bible/model/strip-reference.ts`                                  | Removes a leading reference from a card back.                            |
| `src/extensions/bible/model/verse.ts`                                            | The `BibleVerse` entity + `makeBibleVerse` / `completeBibleVerse`.       |
| `src/extensions/bible/model/store.ts`                                            | `createBibleVerseStore`.                                                 |
| `src/extensions/bible/model/context.ts`                                          | Its store context, split out the way `entities/card` splits it.          |
| `src/extensions/bible/model/verse-text.ts`                                       | The `VerseTextSource` port + the deck-source adapter.                    |
| `src/extensions/bible/api/verse-schema.ts`                                       | RxDB schema + collection spec.                                           |
| `src/extensions/bible/features/build-verse-cards.ts`                             | Reference + text + split → `ParsedCard[]`. Pure.                         |
| `src/extensions/bible/features/add-verse-cards.ts`                               | Build, drop duplicates, resolve the target, write the import draft.      |
| `src/extensions/bible/features/place-in-chapter-deck.ts`                         | Automatic placement: book deck → chapter subdeck, reused when present.   |
| `src/extensions/bible/features/publish-source.ts`                                | Deck or pasted text → verse records.                                     |
| `src/extensions/bible/features/clean-reference-backs.ts`                         | Opt-in repair of existing cards.                                         |
| `src/extensions/bible/ui/BibleProvider.tsx`                                      | Starts/stops the verse store with the extension.                         |
| `src/extensions/bible/ui/BibleImportPage.tsx`                                    | The add-cards flow.                                                      |
| `src/extensions/bible/ui/BookPicker.tsx`, `NumberGrid.tsx`, `VerseTextPanel.tsx` | Flow pieces.                                                             |
| `src/extensions/bible/ui/BibleLibraryPage.tsx`                                   | Dev-mode admin screen.                                                   |
| `src/extensions/bible/i18n/en.ts`                                                | The `bible` namespace.                                                   |
| `src/extensions/bible/testing/decks.ts`                                          | A started deck store for this extension's tests, built from the barrels. |

**Modified:** `eslint.config.js`, `src/shared/lib/index.ts`, `src/shared/lib/entity-store.ts`, `src/shared/ui/ImportSheet.tsx`, `src/entities/preferences/model/{types,selectors}.ts`, `src/entities/preferences/index.ts`, `src/features/preferences/set-preferences.ts`, `src/app/persistence/{schemas,database,conflict-handlers,synced-tables.test}.ts`, `src/shared/api/rxdb/index.ts`, `src/shared/api/supabase/sync-manager.ts`, `src/app/providers/SyncProvider.tsx`, `src/app/composition-root.ts`, `src/app/router.tsx`, `src/app/providers/{AppProviders,ServicesProvider}.tsx`, `src/app/routes/settings-screens.tsx`, `src/pages/settings/ui/SettingsPage.tsx`, `src/pages/deck-library/ui/DeckLibraryPage.tsx`, `src/pages/deck-detail/ui/DeckDetailPage.tsx`, `src/widgets/content-editor/ui/DeckContentEditor.tsx`, `src/widgets/content-editor/model/import-draft.ts`, `src/features/sync/divergence.ts`, `src/shared/config/sync-tables.ts`, `src/shared/lib/content-transfer.ts`, `src/pages/paste-notes/**`, `src/shared/i18n/locales/en/settings.ts`, `docs/UBIQUITOUS_LANGUAGE.md`, `CLAUDE.md`.

**Two things this plan does to existing code, called out because they are easy to skip:**

1. **`lastWriteWins` and `firstWriteWins` move** from `src/app/persistence/conflict-handlers.ts` to
   `src/shared/api/rxdb/`. They are generic over `Clocked` and know no entity, and an extension that
   declares a collection cannot import `app`. `mergeCardConflict` / `mergeProgressConflict` stay put.
2. **`setPreferences` learns to merge** the extension list. Nothing else may write it.

---

### Task 1: Contribution types and the extension-points context

**Files:**

- Create: `src/shared/lib/extension-manifest.ts`
- Create: `src/shared/lib/extension-points-context.tsx`
- Create: `src/shared/lib/extension-repositories-context.tsx`
- Test: `src/shared/lib/extension-points-context.test.tsx`
- Modify: `src/shared/lib/index.ts`, `src/shared/lib/entity-store.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `type ExtensionId`, `interface ExtensionManifest`, `interface ImportOptionContribution`, `interface ExtensionContributions`, `ExtensionPointsContext`, `useExtensionPoint(point)`, `extensionRoute(...)`, `ExtensionRepositoriesContext`, `useExtensionRepository<T>(key)`, `whenStoreReady(store)`.

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
  titleKey: 'bible:label',
  subtitleKey: 'bible:importSubtitle',
  to: '/import/bible',
}

function Host() {
  const options = useExtensionPoint('importOptions')
  return (
    <ul>
      {options.map((option) => (
        <li key={option.id}>{option.titleKey}</li>
      ))}
    </ul>
  )
}

describe('useExtensionPoint', () => {
  it('returns nothing when no extension has contributed', () => {
    render(<Host />)
    expect(screen.queryByText('bible:label')).not.toBeInTheDocument()
  })

  it('returns what the enabled extensions contributed', () => {
    render(
      <ExtensionPointsContext value={{ importOptions: [bibleRow] }}>
        <Host />
      </ExtensionPointsContext>,
    )
    expect(screen.getByText('bible:label')).toBeInTheDocument()
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
import type { TransferOption } from '@/shared/ui'

/**
 * The id an extension is known by, in the registry and in `preferences.extensions`.
 *
 * A plain alias on purpose: the set is open, and `completePreferences` has to round-trip an id
 * a newer build enabled on another device. A closed union would delete it.
 */
export type ExtensionId = string

/**
 * A row an extension adds to the import sheet. It carries **keys, not copy** — resolved by the
 * host against the extension's own namespace — so no English ever lives in a manifest.
 * `to` is a route path. The rest is the row shape `TransferSheet` already renders, so the two
 * cannot drift.
 */
export type ImportOptionContribution = Omit<TransferOption, 'onSelect' | 'title' | 'subtitle'> & {
  titleKey: string
  subtitleKey: string
  to: string
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
  name: string
  validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>
}

/**
 * Declares one, binding `name` to what the module actually exports. Call this instead of writing
 * the object literal: the stored shape has to forget the module's type, and this is where the
 * check happens while it is still available.
 */
export function extensionRoute<Exports extends Record<string, unknown>>(
  path: string,
  load: () => Promise<Exports>,
  name: keyof Exports & string,
  validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>,
): ExtensionRoute {
  return { path, load, name, validateSearch }
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
  /**
   * Lazy, like everything else here: the schemas are awaited in `createServices` before the
   * database is built, so an extension's schema never reaches the entry graph.
   */
  loadCollections?: () => Promise<ExtensionCollectionSpec[]>
  contributions: ExtensionContributions
  /** The route of its detail screen, if it has one. The Extensions page links to it by path. */
  detailPath?: string
  /** Mounted only while the extension is enabled — this is where its stores and keepers live. */
  loadProvider?: () => Promise<{
    ExtensionProvider: (props: { children: ReactNode }) => ReactNode
  }>
}
```

`TransferOption` is imported **type-only**, so `verbatimModuleSyntax` erases it and no component
from `shared/ui` reaches this module at runtime — there is no cycle, and nothing new lands in the
entry graph. Deriving the row from it is what stops the contribution shape and the row the sheet
actually renders from drifting apart.

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
// src/shared/lib/extension-repositories-context.tsx
import { createContext, use } from 'react'
import type { Identifiable, Repository } from '@/shared/api'

/**
 * The repositories the composition root built for the enabled extensions, keyed as their
 * manifests named their collections.
 *
 * Repositories, not collections: `RxdbRepository` already takes a `Promise<RxCollection>`, so
 * handing these over costs no `await` in `createServices` — the database stays the lazy promise
 * every core repo is built from.
 */
export type ExtensionRepositories = Record<string, Repository<Identifiable>>

const EMPTY: ExtensionRepositories = {}

export const ExtensionRepositoriesContext = createContext<ExtensionRepositories>(EMPTY)

/**
 * The extension knows its entity type and `app` cannot, so exactly one cast exists and it lives
 * here rather than at every call site.
 */
export function useExtensionRepository<T extends Identifiable>(key: string): Repository<T> {
  const held = use(ExtensionRepositoriesContext)[key]
  if (!held) throw new Error(`No repository was provided for the extension collection ${key}`)
  return held as Repository<T>
}
```

- [ ] **Step 4b: Let a guard wait for a store**

`beforeLoad` runs before any provider has rendered, so it reads the store directly — and a store
that has not loaded yet answers `undefined`, not "off". Add to `src/shared/lib/entity-store.ts`:

```ts
/** Resolves once the store has mirrored its first read. A guard that skips this reads `idle`. */
export function whenStoreReady(store: {
  getState: () => Pick<Lifecycle, 'status'>
  subscribe: (listener: () => void) => () => void
}): Promise<void> {
  if (store.getState().status === 'ready') return Promise.resolve()
  return new Promise((resolve) => {
    const unsubscribe = store.subscribe(() => {
      if (store.getState().status !== 'ready') return
      unsubscribe()
      resolve()
    })
  })
}
```

Export it from `src/shared/lib/index.ts` beside `selectIsReady`.

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
export { extensionRoute } from './extension-manifest'
export { ExtensionPointsContext, useExtensionPoint } from './extension-points-context'
export {
  type ExtensionRepositories,
  ExtensionRepositoriesContext,
  useExtensionRepository,
} from './extension-repositories-context'
```

- [ ] **Step 6: Run the test and watch it pass**

Run: `npx vitest run src/shared/lib/extension-points-context.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 7: Verify and commit**

```bash
npm run typecheck && npm run lint
npx prettier --write src/shared/lib/extension-manifest.ts src/shared/lib/extension-points-context.tsx src/shared/lib/extension-repositories-context.tsx src/shared/lib/extension-points-context.test.tsx src/shared/lib/entity-store.ts src/shared/lib/index.ts
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

**Do not** add `'extensions'` to the `PreferencesChanges` `Pick<...>` union. A whole array in the
changes object is exactly the wholesale replacement the spec forbids; Step 6b gives it a merge
shape of its own instead.

Export the selector:

```ts
export function isExtensionEnabled(
  preferences: Pick<Preferences, 'extensions'>,
  id: ExtensionId,
): boolean {
  return preferences.extensions.includes(id)
}
```

From `src/entities/preferences/index.ts`, export `isExtensionEnabled`, and re-export the type the
way this entity already re-exports `ContentSort` and `SwipePreferences` from `shared`:

```ts
export type { ExtensionId } from '@/shared/lib'
```

so a call site takes the id type from the entity it belongs to, and `shared/lib` stays the one
place it is declared.

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

- [ ] **Step 6b: Teach `setPreferences` to merge, so nothing can replace the list**

This is the step the spec's "`setPreferences` **merges** the extension list; it never replaces it
wholesale" actually lands in. In `src/features/preferences/set-preferences.ts`:

```ts
export interface SetPreferencesInput extends PreferencesChanges {
  /**
   * Applied to the ids already stored, never a replacement. A caller cannot hold a whole array
   * and overwrite ids it never read — including ids this build has never heard of, which a newer
   * build on another device enabled.
   */
  extensions?: (current: readonly ExtensionId[]) => ExtensionId[]
}

export async function setPreferences(
  store: PreferencesStore,
  input: SetPreferencesInput,
  now: number = Date.now(),
): Promise<Preferences> {
  const base = currentPreferences(store, now)
  const { extensions, ...changes } = input
  const updated = updatePreferences(
    base,
    extensions ? { ...changes, extensions: extensions(base.extensions) } : changes,
    nowIso(now),
  )
  await store.getState().save(updated)
  return updated
}
```

`updatePreferences` spreads `changes` over the base, so `extensions` still needs to be assignable
there: widen its `changes` parameter to `PreferencesChanges & { extensions?: ExtensionId[] }`
rather than adding the field to `PreferencesChanges` itself. Every existing caller passes a plain
changes object and is untouched.

- [ ] **Step 7: Write the command**

Create `src/features/preferences/set-extension-enabled.ts`:

```ts
import type { ExtensionId } from '@/shared/lib'
import { type Preferences, type PreferencesStore } from '@/entities/preferences'
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
  return setPreferences(
    store,
    {
      extensions: (current) =>
        enabled
          ? current.includes(id)
            ? [...current]
            : [...current, id]
          : current.filter((held) => held !== id),
    },
    now,
  )
}
```

Export `setExtensionEnabled` from `src/features/preferences/index.ts`. Do **not** re-export
`isExtensionEnabled` from here — it already leaves `entities/preferences`, and a second path to one
symbol is two names for one thing.

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

- [ ] **Step 10: Test the migration, then run the persistence suite**

The spec asks for this one by name ("the v3 migration defaults to `[]`"). Append to
`src/app/persistence/database.test.ts`, beside the other migration cases — `as never` is how that
file already fakes a document from an older version:

```ts
it('gives a v2 preferences document an empty extension list', () => {
  const v2 = { id: 'preferences', createdAt: at, updatedAt: at } as never
  expect(preferencesMigrations[3](v2).extensions).toEqual([])
})

it('leaves a list that is somehow already there alone', () => {
  const v2 = { id: 'preferences', extensions: ['bible'] } as never
  expect(preferencesMigrations[3](v2).extensions).toEqual(['bible'])
})
```

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
- Create: `src/app/extensions/repositories.ts`
- Test: `src/app/extensions/ExtensionsProvider.test.tsx`
- Modify: `src/app/providers/AppProviders.tsx`, `src/app/providers/ServicesProvider.tsx`
- Modify: `src/app/composition-root.ts`

**Interfaces:**

- Consumes: `ExtensionManifest`, `ExtensionPointsContext`, `ExtensionRepositoriesContext` (Task 1); `isExtensionEnabled` (Task 2).
- Produces: `EXTENSIONS: ExtensionManifest[]`, `<ExtensionsProvider manifests={…}>`, `Services.extensionRepositories`.

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
  loadMessages: () => Promise.resolve({ label: 'Fake', importSubtitle: 'From the fake' }),
  routes: [],
  contributions: {
    importOptions: [
      {
        id: 'fake',
        icon: null,
        titleKey: 'fake:label',
        subtitleKey: 'fake:importSubtitle',
        to: '/import/fake',
      },
    ],
  },
}

function Host() {
  const options = useExtensionPoint('importOptions')
  return <span>{options.length === 0 ? 'no contributions' : options[0]!.titleKey}</span>
}

function renderWith(extensions: string[]) {
  const stored: Preferences = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    extensions,
  }
  const store = started(createPreferencesStore(new InMemoryRepository<Preferences>([stored])))
  renderWithProviders(
    <PreferencesStoreContext value={store}>
      <ExtensionsProvider manifests={[manifest]}>
        <Host />
      </ExtensionsProvider>
    </PreferencesStoreContext>,
  )
  return store
}

describe('ExtensionsProvider', () => {
  it('publishes nothing while the extension is off', () => {
    renderWith([])
    expect(screen.getByText('no contributions')).toBeInTheDocument()
  })

  it('publishes the enabled extension contributions, once its namespace is in', async () => {
    renderWith(['fake'])
    await waitFor(() => expect(screen.getByText('fake:label')).toBeInTheDocument())
    expect(i18n.getResourceBundle('en', 'fake')).toEqual({
      label: 'Fake',
      importSubtitle: 'From the fake',
    })
  })

  it('withdraws everything when the extension is switched off', async () => {
    const store = renderWith(['fake'])
    await waitFor(() => expect(screen.getByText('fake:label')).toBeInTheDocument())
    await act(async () => {
      await setExtensionEnabled(store, 'fake', false)
    })
    await waitFor(() => expect(screen.getByText('no contributions')).toBeInTheDocument())
    expect(i18n.getResourceBundle('en', 'fake')).toBeUndefined()
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

Nothing else in core may name an extension: not the router, not the Settings screens, not a route
constant. Task 11's grep is the acceptance test for that.

- [ ] **Step 4: Write the provider**

```tsx
// src/app/extensions/ExtensionsProvider.tsx
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { i18n } from '@/shared/i18n'
import {
  type ExtensionContributions,
  type ExtensionId,
  type ExtensionManifest,
  ExtensionPointsContext,
} from '@/shared/lib'
import { isExtensionEnabled, usePreferencesStore } from '@/entities/preferences'

function mergeContributions(manifests: ExtensionManifest[]): ExtensionContributions {
  return {
    importOptions: manifests.flatMap((manifest) => manifest.contributions.importOptions ?? []),
  }
}

/**
 * Mounts one enabled extension: its messages first, then its own provider, which is where its
 * stores and keepers live. Unmounting is the whole of disabling — React tears the provider down,
 * and the namespace goes with it.
 */
function MountedExtension({
  manifest,
  onReady,
  children,
}: {
  manifest: ExtensionManifest
  onReady: (id: ExtensionId) => void
  children: ReactNode
}) {
  const [Provider, setProvider] = useState<((props: { children: ReactNode }) => ReactNode) | null>(
    null,
  )

  useEffect(() => {
    let live = true
    void manifest.loadMessages().then((messages) => {
      if (!live) return
      i18n.addResourceBundle('en', manifest.namespace, messages, true, false)
      onReady(manifest.id)
    })
    if (manifest.loadProvider) {
      void manifest.loadProvider().then((module) => {
        if (live) setProvider(() => module.ExtensionProvider)
      })
    }
    return () => {
      live = false
      i18n.removeResourceBundle('en', manifest.namespace)
    }
  }, [manifest, onReady])

  return Provider ? <Provider>{children}</Provider> : children
}

export function ExtensionsProvider({
  manifests,
  children,
}: {
  manifests: ExtensionManifest[]
  children: ReactNode
}) {
  // The stored array's identity only changes when preferences do, so this is a stable snapshot —
  // no serialising the ids to compare them, which would break on an id containing a comma.
  const enabledIds = usePreferencesStore((state) => state.preferences?.extensions)

  const enabled = useMemo(
    () =>
      manifests.filter((manifest) =>
        enabledIds ? isExtensionEnabled({ extensions: enabledIds }, manifest.id) : false,
      ),
    [manifests, enabledIds],
  )

  // Contributions are published only once the namespace is in, so a host never paints a raw key.
  const [ready, setReady] = useState<readonly ExtensionId[]>([])
  const onReady = useCallback(
    (id: ExtensionId) => setReady((held) => (held.includes(id) ? held : [...held, id])),
    [],
  )

  const contributions = useMemo(
    () => mergeContributions(enabled.filter((manifest) => ready.includes(manifest.id))),
    [enabled, ready],
  )

  return (
    <ExtensionPointsContext value={contributions}>
      {enabled.reduceRight<ReactNode>(
        (inner, manifest) => (
          <MountedExtension key={manifest.id} manifest={manifest} onReady={onReady}>
            {inner}
          </MountedExtension>
        ),
        children,
      )}
    </ExtensionPointsContext>
  )
}
```

`ready` is never pruned on disable because the manifest list is static and a re-enabled extension
re-adds its bundle before it is read; what matters is that `contributions` is derived from
`enabled`, which the preferences drive, so a switched-off extension contributes nothing either way.

- [ ] **Step 5: Run it and watch it pass**

Run: `npx vitest run src/app/extensions/ExtensionsProvider.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Mount it in the app**

In `src/app/providers/AppProviders.tsx`, wrap the children _inside_ `ServicesProvider` (it reads preferences) with:

```tsx
<ExtensionsProvider manifests={EXTENSIONS}>{children}</ExtensionsProvider>
```

importing `EXTENSIONS` from `../extensions/registry` and `ExtensionsProvider` from `../extensions/ExtensionsProvider`.

- [ ] **Step 7: Carry extension repositories through services**

In `src/app/composition-root.ts` add to `interface Services`:

```ts
extensionRepositories: ExtensionRepositories
```

`createServices` already awaits the extension collection specs (Task 6 adds that line; for now the
list is empty), and the database stays the **unawaited** promise every core repository is built
from — `collections.then((c) => c.decks)`. Extension repositories are built the same way, so this
adds no `await` on the database and the splash is unaffected:

```ts
const extensionRepositories = buildExtensionRepositories(extensionSpecs, collections)
```

Create that helper in `src/app/extensions/repositories.ts`:

```ts
import type { RxCollection } from 'rxdb'
import type { Identifiable } from '@/shared/api'
import { RxdbRepository } from '@/shared/api/rxdb'
import type { ExtensionCollectionSpec, ExtensionRepositories } from '@/shared/lib'
import type { AppCollections } from '../persistence/database'

/**
 * One repository per declared collection, keyed as the manifest named it. Takes the database as a
 * promise and keeps it one: `RxdbRepository` resolves it lazily, so `createServices` never blocks.
 */
export function buildExtensionRepositories(
  specs: readonly ExtensionCollectionSpec[],
  collections: Promise<AppCollections>,
): ExtensionRepositories {
  return Object.fromEntries(
    specs.map((spec) => [
      spec.key,
      new RxdbRepository<Identifiable>(
        collections.then(
          (held) => (held as unknown as Record<string, RxCollection<Identifiable>>)[spec.key]!,
        ),
      ),
    ]),
  )
}
```

Provide it in `ServicesProvider` with
`<ExtensionRepositoriesContext value={services.extensionRepositories}>`.

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

The test file needs `act` and `useCallback`'s consequences: import `act` from
`@testing-library/react`, `setExtensionEnabled` from `@/features/preferences` and `i18n` from
`@/shared/i18n`.

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
- Produces: `<SettingsExtensionsPage manifests={…} highlight={…} onBack={…} />`, `ROUTES.settingsExtensions`, `validateExtensionsSearch`.

The page takes its manifests as a prop so the test can pass fakes and core never depends on the registry.

- [ ] **Step 1: Write the failing test**

````tsx
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
  contributions: {},
}

function renderPage(
  manifests: ExtensionManifest[],
  extensions: string[] = [],
  highlight?: string,
) {
  const stored: Preferences = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    extensions,
  }
  const store = started(createPreferencesStore(new InMemoryRepository<Preferences>([stored])))
  renderWithProviders(
    <PreferencesStoreContext value={store}>
      <SettingsExtensionsPage manifests={manifests} highlight={highlight} onBack={vi.fn()} />
    </PreferencesStoreContext>,
  )
  return store
}

Mock the toast at the top of the file, the way the other pages' tests do, and add `waitFor` to the
`@testing-library/react` import and `toast` to the `sonner` one:

```ts
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))
````

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

it('marks the row a guard sent the reader to', () => {
renderPage([manifest], [], 'fake')
expect(screen.getByRole('switch', { name: 'fake:label' }).closest('[data-highlighted]')).not.toBeNull()
})

it('says so when the write fails — the one error this page can have', async () => {
const user = userEvent.setup()
const failing = started(
createPreferencesStore({
observe: (emit: (all: Preferences[]) => void) => {
emit([])
return () => {}
},
save: () => Promise.reject(new Error('disk is full')),
remove: () => Promise.resolve(),
} as never),
)
renderWithProviders(
<PreferencesStoreContext value={failing}>
<SettingsExtensionsPage manifests={[manifest]} onBack={vi.fn()} />
</PreferencesStoreContext>,
)
await user.click(screen.getByRole('switch', { name: 'fake:label' }))
await waitFor(() => expect(toast.error).toHaveBeenCalled())
})
})

````

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
  /** The id a route guard sent the reader here for, so the row can say which one they wanted. */
  highlight?: string
  onBack: () => void
}

export function SettingsExtensionsPage({
  manifests,
  highlight,
  onBack,
}: SettingsExtensionsPageProps) {
  const { t } = useTranslation()
  const ready = usePreferencesStore(selectIsReady)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const store = usePreferencesStoreApi()

  const toggle = (id: string, value: boolean) => {
    void setExtensionEnabled(store, id, value).catch(() => toast.error(t('settings.extensionsFailed')))
  }

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
            <div key={manifest.id} data-highlighted={manifest.id === highlight ? '' : undefined}>
              <SettingsRow
                kind="toggle"
                icon={manifest.icon ?? <Blocks />}
                label={t(manifest.labelKey as never)}
                description={t(manifest.descriptionKey as never)}
                checked={isExtensionEnabled(prefs, manifest.id)}
                onCheckedChange={(value) => toggle(manifest.id, value)}
              />
            </div>
          ))}
        </SettingsSection>
      )}
    </AppScreen>
  )
}
````

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
  extensionsFailed: 'That could not be saved. Try again.',
```

`t(manifest.labelKey as never)` is how this codebase already resolves a key it only knows at
runtime — `content-sort-options.tsx`, `swipe-actions.tsx`, `menu-actions.tsx`. Keep the cast;
inventing a different escape here would make four patterns out of one.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `npx vitest run src/pages/settings-extensions`
Expected: PASS, 4 tests.

The four states are covered: **loading** via `selectIsReady`, **empty** via the no-manifests branch,
**offline** by working — the toggle is a local write, so there is deliberately no network branch, and
a notice here would be a lie — and **error** as a failed write, surfaced with `toast.error`.

There is deliberately no error _screen_: `StoreStatus` is `idle | loading | ready`
(`shared/lib/entity-store.ts`) and has no `error` member, so a store cannot report one to render.
The only failure this page can have is `save()` rejecting, and every other local write in the app
reports that with a toast. Put both of those facts in a comment above the component so the next
reader neither "fixes" the missing offline branch nor invents a store error state for one page.

- [ ] **Step 6: Route it**

`src/shared/config/routes.ts` — add beside the other settings routes:

```ts
  settingsExtensions: '/settings/extensions',
```

`src/pages/settings-extensions/index.ts` also exports the search validator, so the route and the
reader cannot drift (`app/routes/search.ts` explains why this codebase validates rather than casts):

```ts
export interface ExtensionsSearch {
  highlight?: string
}

export function validateExtensionsSearch(search: Record<string, unknown>): ExtensionsSearch {
  return typeof search.highlight === 'string' && search.highlight
    ? { highlight: search.highlight }
    : {}
}
```

`src/app/routes/settings-screens.tsx`:

```tsx
import { SettingsExtensionsPage, validateExtensionsSearch } from '@/pages/settings-extensions'
import { EXTENSIONS } from '../extensions/registry'

export function SettingsExtensionsScreen() {
  const { highlight } = useRouteSearch(validateExtensionsSearch)
  return (
    <SettingsExtensionsPage
      manifests={EXTENSIONS}
      highlight={highlight}
      onBack={useBackTo(ROUTES.settings)}
    />
  )
}
```

`src/app/router.tsx` — add beside the other settings routes, with its validator, the way
`settingsChangePassword` already does:

```ts
  createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.settingsExtensions,
    validateSearch: validateExtensionsSearch,
    component: settings('SettingsExtensionsScreen'),
  }),
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
- Produces: `BOOKS: readonly BibleBook[]`, `type BibleBook = { name: string; verses: readonly number[] }`, `chapterCount(book)`, `verseCount(book, chapter)`, `type VerseRef = { book: string; chapter: number; from: number; to: number }`, `formatRef(ref)`, `formatPartial(parts)`, `parseRef(text)`, `expandRange(ref)`.
  `refKey` belongs to the verse entity, not here — Task 6 defines it.

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
import { expandRange, formatPartial, formatRef, parseRef } from './reference'

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

describe('formatPartial', () => {
  it('renders the breadcrumb at every step the picker passes through', () => {
    expect(formatPartial({ book: null, chapter: null, from: null, to: null })).toBe('')
    expect(formatPartial({ book: 'Genesis', chapter: null, from: null, to: null })).toBe('Genesis')
    expect(formatPartial({ book: 'Genesis', chapter: 1, from: null, to: null })).toBe('Genesis 1:')
    expect(formatPartial({ book: 'Genesis', chapter: 1, from: 1, to: null })).toBe('Genesis 1:1')
    expect(formatPartial({ book: 'Genesis', chapter: 1, from: 1, to: 31 })).toBe('Genesis 1:1-31')
  })

  it('collapses a range that ends where it starts', () => {
    expect(formatPartial({ book: 'Jude', chapter: 1, from: 3, to: 3 })).toBe('Jude 1:3')
  })

  it('ignores a chapter picked without a book', () => {
    expect(formatPartial({ book: null, chapter: 1, from: 1, to: 1 })).toBe('')
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

/** The breadcrumb. `formatRef` cannot do this — it needs a complete reference. */
export function formatPartial(parts: {
  book: string | null
  chapter: number | null
  from: number | null
  to: number | null
}): string {
  const { book, chapter, from, to } = parts
  if (!book) return ''
  if (!chapter) return book
  if (!from) return `${book} ${chapter}:`
  return formatRef({ book, chapter, from, to: to ?? from })
}
```

- [ ] **Step 9: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/reference.test.ts`
Expected: PASS, 10 tests.

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
- Create: `src/extensions/bible/model/context.ts`
- Create: `src/extensions/bible/api/verse-schema.ts`
- Create: `src/app/extensions/collections.ts`
- Create: `supabase/migrations/20260917120000_bible_verses.sql`
- Move: `lastWriteWins` and `firstWriteWins` out of `src/app/persistence/conflict-handlers.ts` into `src/shared/api/rxdb/conflict-handlers.ts`
- Modify: `src/app/persistence/database.ts`, `src/app/composition-root.ts`
- Modify: `src/shared/config/sync-tables.ts`, `src/features/sync/divergence.ts`
- Modify: `src/shared/api/supabase/sync-manager.ts`, `src/app/providers/SyncProvider.tsx`, `src/app/providers/use-data-transition.ts`
- Modify: `src/app/persistence/synced-tables.test.ts`, `src/app/persistence/database.test.ts`

**Interfaces:**

- Consumes: `ExtensionCollectionSpec` (Task 1).
- Produces: `interface BibleVerse extends Entity`, `refKey(translation, book, chapter, verse)`, `makeBibleVerse(input)`, `completeBibleVerse(verse)`, `createBibleVerseStore(repo)`, `useBibleVerseStore`, `useBibleVerseStoreApi`, `bibleVerseCollection: ExtensionCollectionSpec`.

- [ ] **Step 1: Write the failing entity test**

```ts
// src/extensions/bible/model/verse.test.ts
import { describe, expect, it } from 'vitest'
import { completeBibleVerse, makeBibleVerse, refKey } from './verse'

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

describe('refKey', () => {
  it('keys a verse so republishing it updates in place', () => {
    expect(refKey('web', 'Genesis', 1, 1)).toBe('web:Genesis:1:1')
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

export const DEFAULT_TRANSLATION = 'web'

/** A verse's primary key. It lives here, not in `reference.ts`, which knows nothing of translations. */
export function refKey(translation: string, book: string, chapter: number, verse: number): string {
  return `${translation}:${book}:${chapter}:${verse}`
}

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

/**
 * Read-side twin: rows arrive from replication unmigrated, so a field the type calls required can
 * genuinely be absent. The `??` looks dead to TypeScript and is not — `completeSyncState` defaults
 * a required `checkpoints` for the same reason. Do not delete it; the test below is why.
 */
export function completeBibleVerse(verse: BibleVerse): BibleVerse {
  return { ...verse, translation: verse.translation ?? DEFAULT_TRANSLATION }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/model/verse.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the store and its context**

```ts
// src/extensions/bible/model/store.ts
import type { StoreApi } from 'zustand/vanilla'
import type { Repository } from '@/shared/api'
import { type CollectionState, createCollectionStore } from '@/shared/lib'
import { type BibleVerse, completeBibleVerse } from './verse'

export type BibleVerseState = CollectionState<'verses', BibleVerse>
export type BibleVerseStore = StoreApi<BibleVerseState>

const byPosition = (a: BibleVerse, b: BibleVerse): number =>
  a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse

export function createBibleVerseStore(repo: Repository<BibleVerse>): BibleVerseStore {
  return createCollectionStore('verses', repo, byPosition, { complete: completeBibleVerse })
}
```

Its context goes in its own file, the way `entities/card` splits `store.ts` from `context.ts`:

```ts
// src/extensions/bible/model/context.ts
import { createStoreContext } from '@/shared/lib'
import type { BibleVerseState } from './store'

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
  creator: { schema: bibleVerseSchema, conflictHandler: lastWriteWins<BibleVerse>() },
}
```

- [ ] **Step 6b: Move the generic conflict handlers where an extension can reach them**

`lastWriteWins` is the handler the spec names for this collection, and it lives in
`src/app/persistence/conflict-handlers.ts` — which an extension may not import, and lint will say
so. It is generic over `Clocked` and knows no entity, so it moves rather than being duplicated:

- Create `src/shared/api/rxdb/conflict-handlers.ts` holding `sameWrite`, `lastWriteWins` and
  `firstWriteWins`, exported from `src/shared/api/rxdb/index.ts`.
- `mergeCardConflict` and `mergeProgressConflict` **stay** in `src/app/persistence/conflict-handlers.ts`
  — they import entities, so they belong where they are. They import `sameWrite` from its new home.
- `src/app/persistence/database.ts` imports the two generic ones from `@/shared/api/rxdb`.
- Move `conflict-handlers.test.ts`'s cases for the two generic handlers with them.

Do this move in its own commit — it is the only existing-code move in this plan that is not
mechanical — and let `npm run test` prove nothing changed. Step 6's collection spec does not compile
until it lands, so if the import above is red, this is the step you skipped.

- [ ] **Step 7: Register extension collections in the database**

In `src/app/persistence/database.ts`, give `createAppDatabase` a second parameter and merge the specs in:

```ts
export async function createAppDatabase<Internals, InstanceCreationOptions>(
  storage: RxStorage<Internals, InstanceCreationOptions>,
  extensionCollections: readonly ExtensionCollectionSpec[] = [],
): Promise<AppCollections> {
```

and inside, after the core collection map is built, add:

```ts
    ...Object.fromEntries(
      extensionCollections.map((spec) => [spec.key, spec.creator] as const),
    ),
```

Extension collections are registered whether or not the extension is enabled — a schema the database does not know is a schema replication can orphan rows against.

The specs come from the manifests' `loadCollections()`, resolved once in one place. Create
`src/app/extensions/collections.ts`:

```ts
import type { ExtensionCollectionSpec, ExtensionId, ExtensionManifest } from '@/shared/lib'
import type { SyncTableSpec } from '@/shared/config/sync-tables'

export interface LoadedExtensionCollections {
  specs: ExtensionCollectionSpec[]
  /** The ones that replicate, as `{ table, collectionKey }` — a table name is not a collection key. */
  syncTables: SyncTableSpec[]
  /** Which extension owns a table, so replication can follow its toggle. */
  ownerOf: ReadonlyMap<string, ExtensionId>
}

/**
 * Awaited once in `createServices`, before the database is built. Three call sites need this list
 * and each used to derive it with its own `flatMap`; deriving it here is what keeps them equal.
 */
export async function loadExtensionCollections(
  manifests: readonly ExtensionManifest[],
): Promise<LoadedExtensionCollections> {
  const loaded = await Promise.all(
    manifests.map(async (manifest) => ({
      id: manifest.id,
      specs: (await manifest.loadCollections?.()) ?? [],
    })),
  )
  const specs = loaded.flatMap((entry) => entry.specs)
  const syncTables = specs.flatMap((spec) =>
    spec.table ? [{ table: spec.table, collectionKey: spec.key }] : [],
  )
  const ownerOf = new Map(
    loaded.flatMap((entry) =>
      entry.specs.flatMap((spec) => (spec.table ? [[spec.table, entry.id] as const] : [])),
    ),
  )
  return { specs, syncTables, ownerOf }
}
```

In `createServices`, resolve it beside the other dynamic imports and hand the specs to the database.
This awaits three tiny module imports, **not** the database — `collections` stays the unawaited
promise every repository is built from:

```ts
const extensions = await loadExtensionCollections(EXTENSIONS)
const collections = createAppDatabase(getRxStorageDexie(), extensions.specs)
```

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
const syncTableSpecs: SyncTableSpec[] = [...CORE_SYNC_TABLES, ...extensions.syncTables]
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

Two halves have to change, and the second is the one that is easy to miss: `fromSupabase` builds its
watcher from the **module-level `SYNCED_TABLES` const** (`src/shared/api/supabase/sync-manager.ts:51`),
not from `targets`. Filtering only `cycle()` leaves Realtime deaf to `bible_verses` forever.

First widen the table type in `src/shared/config/sync-tables.ts`, keeping autocomplete for core names:

```ts
/** The core tables, closed — `SYNCED_TABLES` is still exactly these. */
export type CoreSyncedTable = (typeof SYNCED_TABLES)[number]

/**
 * A table replication may carry, core or contributed. Open, because an extension's table name is
 * not knowable at compile time; `(string & {})` keeps autocomplete for the core names.
 *
 * Nothing switches exhaustively on this — every consumer either keys a map by it
 * (`SyncState['checkpoints']`, `PushedIds`, `Peek`) or takes it as a parameter (`peek`, `parents`,
 * `createCloudWatcher`) — so widening it costs no exhaustiveness check. Check that again before
 * adding a `switch` over a table name; the answer then is a map, not a union.
 */
export type SyncedTable = CoreSyncedTable | (string & {})
```

Then, in `src/shared/api/supabase/sync-manager.ts`, give the watcher factory its tables and the
manager a predicate:

```ts
type WatcherFactory = (
  userId: string,
  tables: readonly SyncedTable[],
  onRemoteChange: (event: RemoteChangeEvent) => void,
) => CloudWatcher

  constructor(
    private readonly targets: SyncTarget[] | Promise<SyncTarget[]>,
    private readonly makeReplication: ReplicationFactory,
    private readonly watch: WatcherFactory = () => ({ stop: async () => {} }),
    private readonly isActive: (table: SyncedTable) => boolean = () => true,
  ) {}

  static fromSupabase(
    supabase: SupabaseClient,
    targets: SyncTarget[] | Promise<SyncTarget[]>,
    isActive?: (table: SyncedTable) => boolean,
  ): SyncManager {
    return new SyncManager(
      targets,
      (userId, target, onPushed) =>
        createCollectionReplication({
          supabase,
          userId,
          table: target.table,
          collection: target.collection,
          onPushed,
        }),
      (userId, tables, onRemoteChange) =>
        createCloudWatcher(supabase, tables, userId, onRemoteChange),
      isActive,
    )
  }
```

`start()` now derives the watched tables from the active targets:

```ts
this.userId = userId
const active = (await this.targets).filter((target) => this.isActive(target.table))
this.watcher = this.watch(
  userId,
  active.map((target) => target.table),
  onRemoteChange,
)
```

and `cycle()` filters the same way:

```ts
const targets = (await this.targets).filter((target) => this.isActive(target.table))
```

Delete the now-unused `SYNCED_TABLES` import from `sync-manager.ts`.

The predicate itself is built in `src/app/composition-root.ts`:

```ts
const tableIsActive = (table: string): boolean => {
  const owner = extensions.ownerOf.get(table)
  if (!owner) return true
  const prefs = services.preferencesStore.getState().preferences
  return prefs ? isExtensionEnabled(prefs, owner) : false
}
```

and passed as the third argument to `cloud.SyncManager.fromSupabase(cloud.supabase, syncTargets, tableIsActive)`.

Because the watcher is built once per `start()`, the manager must be restarted when the enabled set
changes. **Do not add a second effect that starts and stops it** — `useDataTransition` already owns
that lifecycle, and its cleanup already calls `syncManager.stop()`. Two controllers over one manager
is the bug, not the fix. Instead give that effect the enabled set as a dependency, so a toggle
re-runs the transition it already knows how to run:

- `src/app/providers/SyncProvider.tsx`: read the list and pass it down.

  ```ts
  const enabledExtensions = usePreferencesStore((state) => state.preferences?.extensions)
  ```

  The stored array's identity only changes when preferences do, so this cannot loop.

- `src/app/providers/use-data-transition.ts`: add `enabledExtensions?: readonly ExtensionId[]` to
  `DataTransitionDeps`, and add it to the effect's dependency array. Nothing inside the effect reads
  it — it is there to make "which tables replicate" part of what the effect depends on. Say that in a
  comment, or the next reader deletes it as unused.

Test it in `src/app/providers/SyncProvider.test.tsx`: with an account signed in, switching an
extension on stops and restarts the manager, and the second `start` is the one whose watcher carries
the new table.

Test it in `src/shared/api/supabase/sync-manager.test.ts`:

- a cycle with the predicate rejecting `bible_verses` pushes and pulls every core table and never
  touches that one
- with the predicate accepting, the table is included
- `start()` hands the watcher factory exactly the active tables — assert `bible_verses` is absent
  from the list while rejected and present while accepted
- the skipped table's checkpoint is untouched, so re-enabling resumes rather than refetching

- [ ] **Step 9: Write the Supabase migration**

Take the shape from `supabase/migrations/20260915130000_history_table.sql` — it is the ninth mirror
table and must not invent a tenth shape:

```sql
-- supabase/migrations/20260917120000_bible_verses.sql
--
-- The Bible extension's published verse text. A mirror table like the other eight: the whole RxDB
-- document in `data`, plus `user_id`, `deleted` and the server-clock `updated_at` the pull
-- checkpoint reads. It is registered whether or not the extension is enabled; only replication
-- follows the toggle.
create table if not exists public.bible_verses (
  id         text not null,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  data       jsonb not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists bible_verses_user_updated_idx
  on public.bible_verses (user_id, updated_at, id);

drop trigger if exists set_updated_at on public.bible_verses;
create trigger set_updated_at before insert or update on public.bible_verses
  for each row execute function public.set_updated_at();

-- Per-user RLS, identical to the other eight.
alter table public.bible_verses enable row level security;
grant select, insert, update, delete on public.bible_verses to authenticated;
revoke all on public.bible_verses from anon;

drop policy if exists own_select on public.bible_verses;
create policy own_select on public.bible_verses for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists own_insert on public.bible_verses;
create policy own_insert on public.bible_verses for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists own_update on public.bible_verses;
create policy own_update on public.bible_verses for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists own_delete on public.bible_verses;
create policy own_delete on public.bible_verses for delete to authenticated
  using (user_id = (select auth.uid()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bible_verses'
  ) then
    alter publication supabase_realtime add table public.bible_verses;
  end if;
end $$;
```

Four of those lines are the whole point, and the obvious-looking migration gets each one wrong:

- **`primary key (user_id, id)`**, never `id text primary key`. The document id is
  `web:Genesis:1:1` — the same string for every learner who publishes that verse — so a global
  primary key lets the first account to publish it block every other one, and `push_documents`'
  `on conflict (user_id, id)` would not even compile against it.
- **`default auth.uid()`** on `user_id`, because `push_documents` inserts without naming an owner.
- **the `set_updated_at` trigger**, because `updated_at` is the server clock the pull checkpoint
  compares against. Without it the column keeps its insert-time default and pulls go stale.
- **four per-operation policies, not one `for all`**, plus `grant`/`revoke` — that is what the
  other eight tables declare, and RLS is not the place to be original.
- **the `do $$` guard** on the publication: `alter publication … add table` throws if the table is
  already a member, and migrations are re-run.

Then copy the most recent `push_documents` function definition from `supabase/migrations/` and re-declare it with `'bible_verses'` added to its `if p_table not in (…)` allow-list. `synced-tables.test.ts` reads the newest allow-list in the directory, so the new file must contain the whole function, not a fragment.

- [ ] **Step 10: Point the allow-list test at the composed list**

In `src/app/persistence/synced-tables.test.ts`, compare the allow-list against core tables plus every table the registry's manifests declare, so a manifest without a SQL grant fails:

```ts
it('names every synced table, extensions included', async () => {
  const { syncTables } = await loadExtensionCollections(EXTENSIONS)
  const expected = [...SYNCED_TABLES, ...syncTables.map((spec) => spec.table)]
  expect([...latestAllowList()].sort()).toEqual([...expected].sort())
})
```

The test derives the list the same way the composition root does, so a manifest that declares a
table without a SQL grant fails here rather than silently never syncing.

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
- Produces: `stripReference(back): string`, `interface VerseTextSource { read(ref): Promise<StoredVerse[]> }`, `type StoredVerse = { verse: number; text: string }`, `createStoredVerseSource(verses)`.

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
- Create: `src/app/extensions/extension-redirect.ts` + test
- Modify: `src/app/extensions/registry.ts`, `src/app/router.tsx`

**Interfaces:**

- Consumes: everything from Tasks 1–7.
- Produces: `bibleManifest: ExtensionManifest`, `BIBLE_IMPORT_PATH = '/import/bible'`, `validateBibleImportSearch`, `ImportSheet`'s `extraOptions` prop, `extensionRedirect(...)`.

- [ ] **Step 1: Write the failing import-sheet test**

```tsx
// src/shared/ui/ImportSheet.test.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { i18n } from '@/shared/i18n'
import { ImportSheet } from './ImportSheet'

i18n.addResourceBundle('en', 'fake', { label: 'Bible', sub: 'Pick a passage' }, true, false)

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

  it('appends a contributed row after the built-in ones, resolving its keys', () => {
    renderSheet([
      {
        id: 'bible',
        icon: null,
        titleKey: 'fake:label',
        subtitleKey: 'fake:sub',
        to: '/import/bible',
      },
    ])
    const rows = screen.getAllByRole('button')
    expect(rows).toHaveLength(3)
    expect(rows[2]).toHaveTextContent('Bible')
    expect(rows[2]).toHaveTextContent('Pick a passage')
  })

  it('reports which contributed row was chosen', async () => {
    const user = userEvent.setup()
    const onSelect = renderSheet([
      {
        id: 'bible',
        icon: null,
        titleKey: 'fake:label',
        subtitleKey: 'fake:sub',
        to: '/import/bible',
      },
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
          ...(extraOptions ?? []).map(({ titleKey, subtitleKey, to, ...row }) => ({
            ...row,
            tone: row.tone ?? ('brand' as const),
            title: t(titleKey as never),
            subtitle: t(subtitleKey as never),
            onSelect: () => onSelectExtra?.(to),
          })),
```

The sheet stays prop-driven; it never reads a context. It resolves the two keys itself because it
already holds `t` — the contribution carries keys precisely so no English sits in a manifest, and
`t(key as never)` is this codebase's existing way of resolving a key known only at runtime.

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
  translation: 'Translation',
  target: 'Include in decks',
  targetHint: 'A deck for the book, a subdeck for the chapter',
  targetExisting: 'Choose a deck',
  targetNew: 'Create a deck',
  pickDeck: 'Choose a deck',
  newDeckTitle: 'Name the deck',
  duplicates: 'You already have {{refs}} in your library',
  duplicatesSkip: 'Skipped. Add them anyway?',
  showMe: 'Show me',
  split_one: 'Split into {{count}} individual verse',
  split_other: 'Split into {{count}} individual verses',
  splitUnavailable: 'Number the verses (1) 2) 3)) to split them into separate cards.',
  keepText: 'Keep this text',
  kept_one: 'Kept {{count}} verse in your Bible library',
  kept_other: 'Kept {{count}} verses in your Bible library',
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
import { useExtensionRepository } from '@/shared/lib'
import { BibleVerseStoreContext } from '../model/context'
import { createBibleVerseStore } from '../model/store'
import type { BibleVerse } from '../model/verse'

/**
 * Mounted only while the extension is on. This is the extension's composition root: its store
 * starts here and stops when this unmounts, and any keeper it ever grows is an effect in this
 * file. Disabling the extension unmounts it, which is the whole of "backend off".
 */
export function ExtensionProvider({ children }: { children: ReactNode }) {
  const repository = useExtensionRepository<BibleVerse>('bibleVerses')
  const store = useMemo(() => createBibleVerseStore(repository), [repository])

  useEffect(() => {
    store.getState().start()
    return () => store.getState().stop()
  }, [store])

  return <BibleVerseStoreContext value={store}>{children}</BibleVerseStoreContext>
}
```

No cast and no `RxCollection` in sight: the composition root built the repository, and the one cast
this needs lives inside `useExtensionRepository`.

- [ ] **Step 8: Write the manifest**

```tsx
// src/extensions/bible/manifest.tsx
import { BookOpen } from 'lucide-react'
import { type ExtensionManifest, extensionRoute } from '@/shared/lib'

export const BIBLE_ID = 'bible'
export const BIBLE_IMPORT_PATH = '/import/bible'
export const BIBLE_LIBRARY_PATH = '/settings/extensions/bible'

/** What an import link may carry: the deck the reader was already in. */
export interface BibleImportSearch {
  deckId?: string
}

export function validateBibleImportSearch(search: Record<string, unknown>): BibleImportSearch {
  return typeof search.deckId === 'string' && search.deckId ? { deckId: search.deckId } : {}
}

export const bibleManifest: ExtensionManifest = {
  id: BIBLE_ID,
  icon: <BookOpen />,
  labelKey: 'bible:label',
  descriptionKey: 'bible:description',
  namespace: 'bible',
  loadMessages: () => import('./i18n/en').then((module) => module.bibleMessages),
  routes: [
    extensionRoute(
      BIBLE_IMPORT_PATH,
      () => import('./ui/BibleImportPage'),
      'BibleImportScreen',
      validateBibleImportSearch,
    ),
    extensionRoute(BIBLE_LIBRARY_PATH, () => import('./ui/BibleLibraryPage'), 'BibleLibraryScreen'),
  ],
  loadCollections: () =>
    import('./api/verse-schema').then((module) => [module.bibleVerseCollection]),
  detailPath: BIBLE_LIBRARY_PATH,
  contributions: {
    importOptions: [
      {
        id: 'bible',
        icon: <BookOpen className="size-5" aria-hidden />,
        tone: 'brand',
        titleKey: 'bible:label',
        subtitleKey: 'bible:importSubtitle',
        to: BIBLE_IMPORT_PATH,
      },
    ],
  },
  loadProvider: () => import('./ui/BibleProvider'),
}
```

Keep it this small, and keep **everything** behind a loader: the registry imports this file, so it is
in the entry graph and anything it imports eagerly comes with it. That is why `loadCollections`
imports the schema rather than the file importing `bibleVerseCollection` at the top — the spec says
the manifest carries lazy loaders for routes, i18n **and** collections, and a schema object in the
entry chunk is the same leak as a screen.

There is no English in here either: the row carries keys, and `ImportSheet` resolves them. The
namespace is added before the contributions are published (Task 3), so the sheet never paints a raw
key.

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

`src/app/extensions/registry.ts` — the **only** core file that may name an extension:

```ts
import { bibleManifest } from '@/extensions/bible/manifest'

export const EXTENSIONS: ExtensionManifest[] = [bibleManifest]
```

First the decision, on its own, so it can be tested without a router —
`src/app/extensions/extension-redirect.ts`:

```ts
import { ROUTES } from '@/shared/config/routes'
import type { ExtensionId } from '@/shared/lib'
import { isExtensionEnabled } from '@/entities/preferences'
import type { Preferences } from '@/entities/preferences'

export interface ExtensionRedirect {
  to: string
  search: { highlight: ExtensionId }
}

/**
 * Where an extension route sends the reader, or null to let it render.
 *
 * `preferences` must be the value read **after** the store is ready — `undefined` here means
 * "there are none stored", never "not loaded yet". Deciding on an unloaded store sends a cold deep
 * link to Settings with the extension switched on, which is the silent redirect the design forbids.
 */
export function extensionRedirect(
  preferences: Preferences | null | undefined,
  id: ExtensionId,
): ExtensionRedirect | null {
  if (preferences && isExtensionEnabled(preferences, id)) return null
  return { to: ROUTES.settingsExtensions, search: { highlight: id } }
}
```

with `src/app/extensions/extension-redirect.test.ts` covering the spec's enable/disable contract:
enabled → `null`; disabled → Settings → Extensions carrying `highlight`; no preferences stored →
the same redirect.

Then `src/app/router.tsx` — add the extension routes to `routeTree`, each guarded, and each
**waiting for preferences before it decides**, the way `rootRoute.beforeLoad` already waits on the
session:

```ts
const extensionRoutes = EXTENSIONS.flatMap((manifest) =>
  manifest.routes.map((route) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: route.path,
      validateSearch: route.validateSearch,
      component: lazyScreen(route.load)(route.name),
      beforeLoad: async ({ context }) => {
        const store = context.services.preferencesStore
        await whenStoreReady(store)
        const target = extensionRedirect(store.getState().preferences, manifest.id)
        if (target) throw redirect(target)
      },
    }),
  ),
)
```

and spread `...extensionRoutes` into `rootRoute.addChildren([...])`.

Without the `await`, a cold deep link to `/import/bible` — a shared link, a reopened PWA — reads
`status: 'idle'`, sees no preferences, and redirects to Settings even though Bible is on. That is
the failure the spec calls out by name.

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

  it('offers only verses after the start — "Just verse N" covers the equal case, so no number repeats', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    act(() => result.current.pickChapter(1))
    act(() => result.current.pickFrom(30))
    expect(result.current.endOptions).toEqual([31])
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
    () => (from ? startOptions.filter((verse) => verse > from) : []),
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

  it('keeps the text box on screen before anything is picked', () => {
    renderWithProviders(<BibleImportPage />)
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
    expect(screen.getByLabelText('Verse text')).toBeInTheDocument()
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

Replace the stub with the picker: breadcrumb from `formatPartial({ book, chapter, from, to })`,
**Start over** always, **Change verses** once `step === 'done'`, then `BookPicker`, `NumberGrid` for
chapters, `NumberGrid` for the start verse, and `NumberGrid` for the end verse with
`lead={{ label: t('justVerse', { verse: from }), onPick: () => pickTo(from) }}`.

The verse-text panel renders **below the picker at every step, including the first** — the mockups
show it from the chapter step onward, and keeping it on screen from the start is what makes pasting
without picking a book work without a separate mode. Task 10 fills in its behaviour; this task just
places it.

- [ ] **Step 8: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/ui/BibleImportPage.test.tsx`
Expected: PASS, 5 tests.

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
- Create: `src/extensions/bible/features/place-in-chapter-deck.ts`
- Test: `src/extensions/bible/features/place-in-chapter-deck.test.ts`
- Create: `src/extensions/bible/features/add-verse-cards.ts` + test
- Create: `src/extensions/bible/testing/decks.ts`
- Create: `src/extensions/bible/ui/VerseTextPanel.tsx`
- Create: `src/extensions/bible/ui/TargetPicker.tsx`
- Modify: `src/extensions/bible/ui/BibleImportPage.tsx` (+ its test)
- Modify: `src/widgets/content-editor/model/import-draft.ts`

**Interfaces:**

- Consumes: `VerseRef`, `formatRef`, `expandRange` (Task 5); `VerseTextSource` (Task 7); `useImportDraft`, `MoveSheet`, `PromptSheet`; `createDeck` / `createSubdeck` from `@/features/deck`.
- Produces: `buildVerseCards(ref | null, text, { split }): ParsedCard[]`, `canSplit(text): boolean`, `findDuplicates(cards, held): HeldRef[]` where `HeldRef = { front: string; deckId: string }`, `ensureChapterDeck(deckStore, book, chapter): Promise<string>`, `addVerseCards(deps, input): Promise<string>`.

**This task depends on nothing later.** `buildVerseCards` takes a **nullable** reference, and with
none it keys the fronts off the markers in the text — which is the whole of what the old
`parseVerses` did. That is why Task 11 is a deletion and not a move, and why pasting without picking
a book needs no second parser.

- [ ] **Step 1: Write the failing card-building test**

```ts
// src/extensions/bible/features/build-verse-cards.test.ts
import { describe, expect, it } from 'vitest'
import { buildVerseCards, canSplit, findDuplicates } from './build-verse-cards'

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

  it('keys the fronts off the markers when no book has been picked', () => {
    expect(buildVerseCards(null, '(1:1) The elder, to Gaius\n(1:2) Beloved, I pray')).toEqual([
      { front: '1:1', back: 'The elder, to Gaius' },
      { front: '1:2', back: 'Beloved, I pray' },
    ])
  })

  it('makes nothing from unmarked text when no book has been picked — there is no front to give it', () => {
    expect(buildVerseCards(null, 'In the beginning, plainly.')).toEqual([])
  })

  it('never leaves a reference on a back', () => {
    const cards = buildVerseCards(ref, '1) Genesis 1:1 In the beginning. 2) The earth.')
    expect(cards[0]?.back).toBe('In the beginning.')
  })
})

describe('splitting', () => {
  it('keeps the range as one card when splitting is off', () => {
    const cards = buildVerseCards(ref, '1) In the beginning. 2) The earth.', { split: false })
    expect(cards).toEqual([{ front: 'Genesis 1:1-2', back: '1) In the beginning. 2) The earth.' }])
  })

  it('knows whether the text can be split at all', () => {
    expect(canSplit('1) In the beginning. 2) The earth.')).toBe(true)
    expect(canSplit('(1:1) In the beginning.')).toBe(true)
    expect(canSplit('In the beginning, plainly.')).toBe(false)
  })
})

describe('findDuplicates', () => {
  it('names references held anywhere in the library, with the deck holding them', () => {
    const cards = [
      { front: 'Genesis 1:1', back: 'a' },
      { front: 'Genesis 1:2', back: 'b' },
    ]
    const held = [{ front: 'Genesis 1:1', deckId: 'deck-7' }]
    expect(findDuplicates(cards, held)).toEqual([{ front: 'Genesis 1:1', deckId: 'deck-7' }])
  })

  it('finds a duplicate that lives in a different deck from the target', () => {
    const held = [{ front: 'Genesis 1:1', deckId: 'some-other-deck' }]
    expect(findDuplicates([{ front: 'Genesis 1:1', back: 'a' }], held)).toHaveLength(1)
  })

  it('finds none in an empty library', () => {
    expect(findDuplicates([{ front: 'Genesis 1:1', back: 'a' }], [])).toEqual([])
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

/**
 * `1)` or `(1:1)` — the two shapes verse text arrives in. This is the app's only verse parser:
 * the one that used to live in `shared/lib/content-transfer.ts` is deleted in Task 11, not moved,
 * because two parsers for one format is one too many.
 */
const MARKER = /(?:\((\d+):(\d+)\)|(?:^|\s)(\d+)\))\s*/g

interface Segment {
  /** From a `(1:1)` marker; null when the text only numbered its verses. */
  chapter: number | null
  verse: number
  text: string
}

function splitByMarkers(text: string): Segment[] {
  const segments: Segment[] = []
  const matches = [...text.matchAll(MARKER)]
  matches.forEach((match, index) => {
    const chapter = match[1] ? Number(match[1]) : null
    const verse = Number(match[2] ?? match[3])
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? text.length
    const body = stripReference(text.slice(start, end).trim())
    if (verse > 0 && body) segments.push({ chapter, verse, text: body })
  })
  return segments
}

/** Whether the text carries markers at all — the toggle is meaningless without them. */
export function canSplit(text: string): boolean {
  return splitByMarkers(text.trim()).length > 0
}

/**
 * `ref` is nullable on purpose: the text box is always on screen, so a reader may paste marked-up
 * scripture without touching the picker. With no reference the markers supply the fronts; with no
 * reference *and* no markers there is nothing to put on a front, so nothing is made.
 */
export function buildVerseCards(
  ref: VerseRef | null,
  text: string,
  { split = true }: { split?: boolean } = {},
): ParsedCard[] {
  const body = text.trim()
  if (!body) return []

  const segments = split ? splitByMarkers(body) : []
  if (segments.length > 0) {
    return segments.map(({ chapter, verse, text: verseText }) => ({
      front: ref
        ? formatRef({ ...ref, from: verse, to: verse })
        : chapter
          ? `${chapter}:${verse}`
          : String(verse),
      back: verseText,
    }))
  }

  return ref ? [{ front: formatRef(ref), back: stripReference(body) }] : []
}

export interface HeldRef {
  front: string
  deckId: string
}

/**
 * Checked across the whole library, not just the target deck: decks are shaped
 * book -> chapter -> verse, so the passage being added may already live somewhere else.
 */
export function findDuplicates(cards: readonly ParsedCard[], held: readonly HeldRef[]): HeldRef[] {
  const index = new Map(held.map((entry) => [entry.front.trim().toLowerCase(), entry]))
  return cards.flatMap((card) => {
    const match = index.get(card.front.trim().toLowerCase())
    return match ? [match] : []
  })
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/extensions/bible/features/build-verse-cards.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 4b: Write the failing placement test**

First give this extension its own deck fixture. `@/features/deck/deck-fixtures` is not in that
slice's barrel and every existing user of it is inside the slice, so reaching for it from here would
be the deep cross-slice import the architecture rules ban — `boundaries/ignore` skips test files, so
lint would not catch it either:

```ts
// src/extensions/bible/testing/decks.ts
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, type DeckStore, makeDeck } from '@/entities/deck'

export function storedDeck(id: string, over: Partial<Deck> = {}): Deck {
  return { ...makeDeck({ id, createdAt: new Date(0).toISOString(), name: id }), ...over }
}

export function startedDeckStore(decks: Deck[]): DeckStore {
  return started(createDeckStore(new InMemoryRepository<Deck>(decks)))
}
```

```ts
// src/extensions/bible/features/place-in-chapter-deck.test.ts
import { describe, expect, it } from 'vitest'
import { startedDeckStore, storedDeck } from '../testing/decks'
import { ensureChapterDeck } from './place-in-chapter-deck'

const deckNames = (store: ReturnType<typeof startedDeckStore>) =>
  store.getState().decks.map((deck) => deck.name)

describe('ensureChapterDeck', () => {
  it('creates the book deck and the chapter subdeck when neither exists', async () => {
    const store = startedDeckStore([])
    const deckId = await ensureChapterDeck(store, 'Genesis', 1)
    expect(deckNames(store).sort()).toEqual(['Genesis', 'Genesis 1'])
    const chapter = store.getState().decks.find((deck) => deck.id === deckId)
    const book = store.getState().decks.find((deck) => deck.name === 'Genesis')
    expect(chapter?.name).toBe('Genesis 1')
    expect(chapter?.parentId).toBe(book?.id)
  })

  it('reuses a book deck that already exists', async () => {
    const store = startedDeckStore([storedDeck('genesis', { name: 'Genesis' })])
    await ensureChapterDeck(store, 'Genesis', 1)
    expect(deckNames(store).filter((name) => name === 'Genesis')).toHaveLength(1)
  })

  it('reuses a book deck filed inside a folder, where it sits', async () => {
    const store = startedDeckStore([
      storedDeck('genesis', { name: 'Genesis', folderId: 'folder-1' }),
    ])
    const deckId = await ensureChapterDeck(store, 'Genesis', 1)
    const chapter = store.getState().decks.find((deck) => deck.id === deckId)
    expect(chapter?.parentId).toBe('genesis')
    expect(deckNames(store).filter((name) => name === 'Genesis')).toHaveLength(1)
  })

  it('reuses the chapter subdeck, so a second import joins the first', async () => {
    const store = startedDeckStore([
      storedDeck('genesis', { name: 'Genesis' }),
      storedDeck('genesis-1', { name: 'Genesis 1', parentId: 'genesis' }),
    ])
    expect(await ensureChapterDeck(store, 'Genesis', 1)).toBe('genesis-1')
    expect(store.getState().decks).toHaveLength(2)
  })

  it('ignores an archived deck of the same name — the archive is a place outside the library', async () => {
    const store = startedDeckStore([storedDeck('genesis', { name: 'Genesis', archived: true })])
    await ensureChapterDeck(store, 'Genesis', 1)
    expect(deckNames(store).filter((name) => name === 'Genesis')).toHaveLength(2)
  })
})
```

- [ ] **Step 4c: Run it, watch it fail, then write it**

Run: `npx vitest run src/extensions/bible/features/place-in-chapter-deck.test.ts`
Expected: FAIL — cannot resolve `./place-in-chapter-deck`.

```ts
// src/extensions/bible/features/place-in-chapter-deck.ts
import type { Deck, DeckStore } from '@/entities/deck'
import { createDeck, createSubdeck } from '@/features/deck'
import { childDecks } from '@/shared/lib'

const sameName = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

/** A book deck is any live top-level deck of that name — including one filed in a folder. */
function findBookDeck(decks: readonly Deck[], book: string): Deck | undefined {
  return decks.find((deck) => deck.parentId === null && !deck.archived && sameName(deck.name, book))
}

/**
 * Automatic placement: a deck per book, a subdeck per chapter, both reused when they already
 * exist so a second import joins the first instead of sitting beside a copy of it.
 * Returns the id of the chapter subdeck the cards belong in.
 */
export async function ensureChapterDeck(
  store: DeckStore,
  book: string,
  chapter: number,
): Promise<string> {
  const bookDeck =
    findBookDeck(store.getState().decks, book) ?? (await createDeck(store, { name: book }))
  const chapterName = `${book} ${chapter}`
  const held = childDecks(store.getState().decks, bookDeck.id).find(
    (deck) => !deck.archived && sameName(deck.name, chapterName),
  )
  return (held ?? (await createSubdeck(store, bookDeck.id, { name: chapterName }))).id
}
```

Run it again: PASS, 5 tests.

- [ ] **Step 4d: Write the command that actually adds the cards**

The screen decides _when_; a command does the writing. Create
`src/extensions/bible/features/add-verse-cards.ts`:

```ts
import type { DeckStore } from '@/entities/deck'
import { createDeck } from '@/features/deck'
import type { ParsedCard } from '@/shared/lib'
import type { VerseRef } from '../model/reference'
import { buildVerseCards, findDuplicates, type HeldRef } from './build-verse-cards'
import { ensureChapterDeck } from './place-in-chapter-deck'

/** Where the cards are going: the reader's choice, or the app's. */
export type VerseTarget =
  { kind: 'automatic' } | { kind: 'deck'; deckId: string } | { kind: 'newDeck'; name: string }

export interface AddVerseCardsDeps {
  deckStore: DeckStore
  setDraft: (source: 'extension', cards: ParsedCard[]) => void
}

export interface AddVerseCardsInput {
  ref: VerseRef | null
  text: string
  split: boolean
  target: VerseTarget
  held: readonly HeldRef[]
  keepDuplicates: boolean
}

/**
 * Build, drop the duplicates, resolve the destination, hand the cards to the existing import
 * draft. Returns the deck to review them in.
 */
export async function addVerseCards(
  { deckStore, setDraft }: AddVerseCardsDeps,
  { ref, text, split, target, held, keepDuplicates }: AddVerseCardsInput,
): Promise<string> {
  const built = buildVerseCards(ref, text, { split })
  const duplicates = new Set(findDuplicates(built, held).map((entry) => entry.front))
  const cards = keepDuplicates ? built : built.filter((card) => !duplicates.has(card.front))

  const deckId =
    target.kind === 'deck'
      ? target.deckId
      : target.kind === 'newDeck'
        ? (await createDeck(deckStore, { name: target.name })).id
        : ref
          ? await ensureChapterDeck(deckStore, ref.book, ref.chapter)
          : (await createDeck(deckStore, { name: cards[0]?.front ?? '' })).id

  setDraft('extension', cards)
  return deckId
}
```

Automatic placement with no reference — a paste with markers and no book picked — has no book to
name a deck after, so it falls back to an ordinary new deck. Test that case explicitly along with
the three targets; `setDraft` is a `vi.fn()` and the deck store comes from `../testing/decks`.

- [ ] **Step 5: Widen the import draft by one neutral source**

In `src/widgets/content-editor/model/import-draft.ts`:

```ts
export type ImportSource = 'paste' | 'mindscape' | 'anki' | 'extension'
```

`'extension'`, never `'bible'` — the word does not belong in a core file. `ImportReviewPage` branches only on `'mindscape'`, so nothing else changes.

- [ ] **Step 6: Write the text panel and the target picker**

`VerseTextPanel.tsx` — a labelled `Textarea` plus one line of status: `t('textImported')` when the source filled it, `t('textMissing')` when it opened empty. Props: `{ value, onChange, prefilled }`. Reuse `Textarea` from `@/shared/ui`.

**Never `autoFocus` it** (CODE_STYLE §11): on a full-page input it opens the keyboard over the
page's own footer before the reader has seen it, and the mount-time pan lands before any keyboard
height has been measured. It was removed from `PasteNotesPage` for exactly this.

`TargetPicker.tsx` — a `ToggleRow` labelled `t('target')` with the hint `t('targetHint')`, default
**on**, and a manual branch revealed when it is off.

- **On** — nothing to choose. The footer button places the cards with `ensureChapterDeck`.
- **Off** — two buttons: `t('targetExisting')` opens `MoveSheet` with `targets="deck"`, `decks` and
  `folders` from `useDeckStore(selectDecks)` / `useFolderStore`, and `excludeIds={new Set()}`;
  `t('targetNew')` opens `PromptSheet` with the chapter as its initial value. The chosen destination
  is shown, so the reader sees where the cards will land before adding.

Props: `{ auto, onAutoChange, suggestedName, destination, onPickDeck, onNameDeck }`.

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

  it('pastes without picking a book — the box needs no separate mode', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('(1:1) The elder, to Gaius\n(1:2) Beloved, I pray')
    expect(screen.getByRole('button', { name: 'Add 2 cards' })).toBeEnabled()
  })

  it('places the cards automatically, book then chapter, when the toggle is on', async () => {
    const user = userEvent.setup()
    const deckStore = startedDeckStore([]) // from '../testing/decks'
    renderWithProviders(
      <DeckStoreContext value={deckStore}>
        <BibleImportPage />
      </DeckStoreContext>,
    )
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: 'Just verse 1' }))
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('In the beginning.')
    await user.click(screen.getByRole('button', { name: 'Add 1 card' }))
    expect(
      deckStore
        .getState()
        .decks.map((deck) => deck.name)
        .sort(),
    ).toEqual(['Genesis', 'Genesis 1'])
  })

  it('asks where the cards go when the toggle is off', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('switch', { name: 'Include in decks' }))
    expect(screen.getByRole('button', { name: 'Choose a deck' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create a deck' })).toBeInTheDocument()
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

Wire the pieces. The text panel and the footer button are always rendered; the picker sits above them.

**The Add button is `AppScreen`'s `footer`, not a bar of your own.** This screen has a textarea and a
bottom-pinned action, which is the combination CODE_STYLE §11 is about: `AppScreen` already gives
its scroll body the keyboard range (`.pb-keyboard` / `--kb-range`) that stops iOS panning the whole
app, and puts the dock `static` under `data-keyboard` so the CTA does not ride the keyboard's edge.
Hand-rolling a `fixed` or `sticky` footer here re-opens all four bugs that section records. The
header must not move when the keyboard opens — that is the acceptance test.

**`?deckId=`.** Read it with the manifest's own validator, and let it decide the opening target:

```ts
const { deckId } = useRouteSearch(validateBibleImportSearch)
const [target, setTarget] = useState<VerseTarget>(
  deckId ? { kind: 'deck', deckId } : { kind: 'automatic' },
)
```

Arriving from a deck, the reader has already said where the cards go, so "Include in decks" opens
**off** with that deck shown as the destination. Arriving from the library it opens on. Test both:
the sheet host passes the id (Task 8, Step 5) and it must not be dropped on the floor here.

**Prefill, when a complete range is chosen and the library covers it.** Read the source with
`createStoredVerseSource(useBibleVerseStore((state) => state.verses))` and fill the box **with
markers**, exactly as the mockup shows:

```ts
const prefill = (verses: StoredVerse[]): string =>
  verses.map((held) => `${held.verse}) ${held.text}`).join(' ')
```

A plain join would round-trip through `buildVerseCards` into a single card covering the whole range —
the one outcome this design must not produce. Prefill only when the reader has not already typed.

**Split toggle.** A `ToggleRow` labelled `t('split', { count })`, default on, passed to
`buildVerseCards(ref, text, { split })`. Disable it with the hint `t('splitUnavailable')` when
`!canSplit(text)` and the range spans more than one verse, so it never silently does nothing.

**Duplicates.** Feed `findDuplicates` every card in the library:

```ts
const held = useCardStore(selectCards).map((card) => ({ front: card.front, deckId: card.deckId }))
```

Render the banner with `t('duplicates', { refs })` and a **Show me** button that navigates to
`ROUTES.deckDetail` for the first match's `deckId`, plus the toggle that adds them anyway.

**Keep this text (admin).** Behind `useDevMode()`, a button beside the box reading `t('keepText')`
that publishes what is in the box into the library — the path that fills the picker before the
bundled translation exists. It calls `versesFromCards(buildVerseCards(ref, text), nowIso())` then
`publishVerses` (both from Task 12), and toasts `t('kept', { count })`.

The button calls the command and navigates, mirroring `NewPasteScreen`. Everything it does lives in
`addVerseCards` — the screen holds no write logic of its own:

```ts
const add = async () => {
  const deckId = await addVerseCards(
    { deckStore, setDraft },
    { ref, text, split, target, held, keepDuplicates },
  )
  await navigate({ to: ROUTES.deckImport, params: { deckId }, replace: true })
}
```

Render the translation as a static label under the text box — `t('translation')` and the one
translation's name. No selector exists until there is a second translation.

There is deliberately **no "paste text instead" mode**. The box is always on screen, so pasting
without touching the picker already works: `buildVerseCards` reads `(1:1)` and `n)` markers, and with
no reference picked the fronts come from the markers themselves. No other parser is involved, and
nothing here waits on Task 11.

- [ ] **Step 9: Run the whole file and watch it pass**

Run: `npx vitest run src/extensions/bible/ui/BibleImportPage.test.tsx`
Expected: PASS, 12 tests.

- [ ] **Step 10: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions/bible src/widgets/content-editor/model/import-draft.ts
git add src/extensions/bible src/widgets
git commit -m "feat(bible): verse text, the target deck, and the handoff to import review"
```

---

### Task 11: Delete the verse parser from core, and make Paste Notes notes-only

**Files:**

- Modify: `src/extensions/bible/features/build-verse-cards.test.ts` (the cases worth keeping)
- Modify: `src/shared/lib/content-transfer.ts`, `src/shared/lib/content-transfer.test.ts`, `src/shared/lib/index.ts`
- Modify: `src/pages/paste-notes/model/use-paste-parsing.ts`
- Delete: `src/pages/paste-notes/ui/FormatToggle.tsx`
- Modify: `src/pages/paste-notes/ui/PasteNotesPage.tsx`, `src/pages/paste-notes/ui/PasteNotesPage.test.tsx`
- Modify: `src/app/routes/deck-screens.tsx` (`NewPasteScreen`)
- Modify: `src/shared/i18n/locales/en/` (the file holding `cards.paste.*`)

**Interfaces:**

- Consumes: `buildVerseCards` (Task 10) — already written, already tested.
- Produces: nothing. `parseVerses`, `parseVerseChapters`, `verseChapterTitles`, `detectPasteFormat` and the `PasteFormat` type cease to exist.

**Deletion, not a move.** Task 10's `buildVerseCards` already reads `(1:1)` and `n)` markers, already
strips references, and already handles a paste with no reference picked — it _is_ the verse parser,
written against the card shape this design requires. Moving `parseVerses` into the extension as well
would leave two parsers for one format, the second with no caller, which is the dead shim the change
rules forbid. So the behaviour worth keeping moves into the extension's existing suite as test cases,
and the core code goes.

Two things to know before starting:

- `parseVerseChapters` is **module-private** in `content-transfer.ts` today — it is not exported and
  not in `src/shared/lib/index.ts`. Only `parseVerses`, `verseChapterTitles`, `detectPasteFormat` and
  `PasteFormat` are barrel exports.
- `use-paste-parsing.ts` is the only consumer of any of them.

- [ ] **Step 1: Carry the surviving behaviour into the extension's suite**

Append to `src/extensions/bible/features/build-verse-cards.test.ts`, so the deletion cannot quietly
lose what the old parser did:

```ts
describe('what the old core parser did', () => {
  it('joins a verse that wraps onto the next line', () => {
    const cards = buildVerseCards(null, '3 John 1\n(1:1) The elder,\nto Gaius')
    expect(cards[0]?.back).toBe('The elder, to Gaius')
  })

  it('ignores a book header line above the markers', () => {
    const cards = buildVerseCards(
      null,
      '3 John 1\n(1:1) The elder, to Gaius\n(1:2) Beloved, I pray',
    )
    expect(cards).toHaveLength(2)
  })

  it('finds nothing in ordinary notes', () => {
    expect(buildVerseCards(null, 'Zeus, King of the gods')).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and watch it fail on the wrapped line**

Run: `npx vitest run src/extensions/bible/features/build-verse-cards.test.ts`
Expected: FAIL on the wrapping case — `splitByMarkers` takes the text between markers verbatim, so a
newline survives. Collapse whitespace when it trims the body (`.replace(/\s+/g, ' ')`), which is what
`parseVerseChapters` did. The other two should already pass; if the header case fails, the text before
the first marker is being kept — it must be dropped.

- [ ] **Step 3: Delete the parser from core**

- `src/shared/lib/content-transfer.ts`: delete `UNTITLED_CHAPTER`, `VerseChapter`,
  `parseVerseChapters`, `parseVerses`, `verseChapterTitles`, `detectPasteFormat` and `PasteFormat`.
- `src/shared/lib/content-transfer.test.ts`: delete the `parseVerses`, `verseChapterTitles` and
  `detectPasteFormat` describe blocks.
- `src/shared/lib/index.ts`: stop exporting `parseVerses`, `verseChapterTitles`, `detectPasteFormat`
  and `PasteFormat`.

- [ ] **Step 4: Make Paste Notes notes-only**

- `src/pages/paste-notes/model/use-paste-parsing.ts`: delete `format`, `auto`, `setFormat`,
  `resetFormat`, `suggestedName` and every bible branch. Parsing is always `parseDelimitedNotes`.
- Delete `src/pages/paste-notes/ui/FormatToggle.tsx`.
- `PasteNotesPage.tsx`: delete the `FormatToggle` and `BibleHint` renders and the bible placeholder
  branch; `SeparatorSettings` always shows. The deck name falls back to `defaultDeckName`.
- `PasteNotesPage.test.tsx`: of the three bible naming tests, rewrite the first in place to assert
  the default name and delete the other two. Their subject — naming a deck after a pasted chapter —
  no longer exists on this screen.
- `deck-screens.tsx`: `NewPasteScreen` keeps `nextDefaultName` and drops nothing else.
- i18n: delete `cards.paste.kindNotes`, `kindBible`, `formatLabel`, `autoDetected`, `resetAuto`,
  `biblePlaceholder`, `bibleHintTitle`, `bibleHint`.

- [ ] **Step 5: Prove core is clean**

This grep is the acceptance test for the whole design, so it has to be one that can actually return
nothing — a plain `grep -i bible\|verse` matches `reverse`, `inverse` and `traverse`, and `Card`
carries a `reversed` field, so the loose pattern can never come back empty and proves nothing:

```bash
grep -rinE '\b(bible|verses?|scripture)\b' src/app src/pages src/widgets src/features src/entities src/shared --include='*.ts' --include='*.tsx'
```

Expected: exactly one hit — the manifest import in `src/app/extensions/registry.ts`. Anything else
is a leak: fix it before committing.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test
npx prettier --write src/extensions src/shared src/pages/paste-notes src/app/routes/deck-screens.tsx
git add -A src/extensions src/shared src/pages src/app
git commit -m "refactor(paste): Paste Notes is notes-only, and the verse parser lives in the extension"
```

---

### Task 12: The admin Bible library

**Files:**

- Create: `src/extensions/bible/features/publish-source.ts` + test
- Create: `src/extensions/bible/features/clean-reference-backs.ts` + test
- Create: `src/extensions/bible/ui/BibleLibraryPage.tsx` + test
- Modify: `src/pages/settings-extensions/ui/SettingsExtensionsPage.tsx`

**Interfaces:**

- Consumes: `makeBibleVerse` (Task 6), `stripReference` (Task 7), `buildVerseCards` (Task 10), `parseRef` (Task 5), `BibleVerseStore` (Task 6), the core `cardStore`.
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

The third admin action the spec names — **keep the text currently in the import box** — deliberately
lives on the import screen instead (Task 10, Step 8), because that is where the text is. This task
provides the command it calls: `versesFromCards(buildVerseCards(ref, text), nowIso())` piped into
`publishVerses`. Add a test here that a box of `1) … 2) …` text for `Genesis 1:1-2` publishes exactly
two verses, with the reference stripped from each.

Test it with a started `BibleVerseStoreContext` over an `InMemoryRepository`, asserting: dev mode off hides the tools; publishing a two-card deck stores two verses; a deck of ordinary notes stores none.

- [ ] **Step 8: Reach it from Settings → Extensions**

Give `SettingsExtensionsPage` an `onOpenExtension?: (path: string) => void` and render a nav row
under an enabled extension when its manifest carries a `detailPath` (Task 8 sets Bible's). Wire it in
`SettingsExtensionsScreen` to `navigate({ to: path })`.

The path comes from the manifest, never from an import: `import { BIBLE_LIBRARY_PATH } from '@/extensions/bible/manifest'`
in a core screen would put the word _bible_ in `src/app/routes/`, which is precisely what Task 11's
grep is there to catch, registry aside.

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

- Modify: `docs/UBIQUITOUS_LANGUAGE.md`, `CLAUDE.md`

- [ ] **Step 1: Add the vocabulary**

In `docs/UBIQUITOUS_LANGUAGE.md`, in the same table style as the existing entries:

| Term                   | Means                                                                 | Never                        |
| ---------------------- | --------------------------------------------------------------------- | ---------------------------- |
| **Extension**          | A self-contained feature the learner switches on in Settings          | plugin, add-on, module       |
| **Contribution point** | The named slot a host surface renders on an extension's behalf        | hook, which here means React |
| **Verse**              | One numbered line of scripture; its reference is not part of its text | passage, which is a range    |

- [ ] **Step 2: Teach CLAUDE.md the new layer**

Add to the Architecture section, after the Entities paragraph:

> **Extensions** (`src/extensions/<x>/`, reference `bible/`) — a self-contained feature behind a manifest. Reaches down like a page (widgets → features → entities → shared); **only `app` may import it**, and extensions never import each other. Contributions reach host surfaces through `useExtensionPoint`, never through an import, and carry i18n keys rather than copy. The extension's own provider is its composition root: its stores and keepers start there, and disabling unmounts it. Enablement is `preferences.extensions`, changed only through `setExtensionEnabled`, and deletes nothing. `src/app/extensions/registry.ts` is the one core file allowed to name an extension.

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
- **`grep` for bible in core after Task 11** is the acceptance test for the whole design. One hit outside `src/app/extensions/registry.ts` means the decoupling failed. Use the word-boundary pattern in that step — the loose one matches `reverse` and `Card.reversed` and can never come back empty.
- **Anything a guard reads before a provider has rendered must wait for the store.** `beforeLoad` runs first; an unloaded store says `undefined`, which is not the same as "off".
- **The manifest is in the entry graph; everything it names must be behind a loader** — routes, messages, collections. `npm run check:entry-graph` after `npm run build` is what proves it.
- **Every RxDB schema change needs both halves:** the migration in `database.ts` _and_ the `completeX` twin, because replication writes pulled rows unmigrated.
- **Card backs never carry a reference.** If a test passes with a back like `Genesis 1:1 In the beginning`, the test is wrong.
