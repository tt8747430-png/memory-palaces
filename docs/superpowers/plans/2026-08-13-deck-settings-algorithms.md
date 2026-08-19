# Deck Settings and Learning Algorithms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every deck an explicit learning algorithm — Fast review or Spaced repetition — and rebuild the deck-scoped settings, deck detail and study surfaces around that choice.

**Architecture:** The algorithm and its knobs live in `DeckSettings`, which `resolveDeckSettings` already inherits down the deck tree, so a subdeck follows its parent until it decides otherwise. Card-level learner choices (`frozen`, `reversed`) and the fast-review bucket live on `Card`. Pure logic — style resolution, queue building, the fast-review re-insertion rule — lands in `shared/lib` and `features/review` with unit tests; pages stay thin and read through selectors, write through feature commands.

**Tech Stack:** React 19 + Vite + TS (strict), FSD layers enforced by `eslint-plugin-boundaries`, RxDB on-device with Supabase JSONB replication, Zustand-style entity stores, Tailwind v4 semantic tokens, `motion`, `lucide-react`, i18next, Vitest + jsdom (`globals: false`) + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-13-deck-settings-algorithms-design.md`

## Global Constraints

- **Zero legacy in code.** No polyfills, no fallback branches, no deprecated APIs. Persisted data is the exception: RxDB schema changes need a version bump and a migration strategy.
- **FSD imports only downward:** `app → pages → widgets → features → entities → shared`. Cross-slice imports go through the slice's `index.ts` barrel, never a deep path. Alias `@` → `src`.
- **All writes are feature commands** (`features/<x>/<use-case>.ts`, one per file, exported from the slice barrel). All reads are selectors or hooks. Components take the store from `useXStoreApi()` and pass it in.
- **Entities are framework-agnostic:** `model/types.ts` trims, validates and **throws on invariant violation**. No IO, no React.
- **Strict TS:** `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` → use `import type`.
- **Tests are colocated** `*.test.ts(x)`, Vitest with `globals: false` — every test file imports `{ describe, expect, it }` from `vitest`. Store-backed tests wire their own stores through `started()` from `@/shared/test/started`.
- **All user-facing copy** goes in `src/shared/i18n/locales/en.ts`. No hardcoded strings in components.
- **Prettier:** no semicolons, single quotes, trailing comma `all`, printWidth 100. Format only files you touched: `npx prettier --write <files>`. **Never** `npm run format`.
- **Every surface handles loading, error, empty and offline.** Semantic tokens only — no raw hex, no orange/amber accents. Honour `prefers-reduced-motion` and safe areas.
- **Excluded from scope, absent from the UI rather than disabled:** AI card generation, publish to library, sharing settings, report deck, offline learning, the Language-learning algorithm preset.
- **Verification gate:** `npm run typecheck && npm run lint && npm run test` passes before any task is called done.

---

### Task 1: Deck settings model

**Files:**
- Modify: `src/entities/deck/model/types.ts`
- Modify: `src/entities/deck/index.ts`
- Test: `src/entities/deck/model/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `LearningAlgorithm`, `CardStylePreset`, `CardFont`, `CardAlignment`, `TtsSide`, `CardStyle`, `SpacedAdvanced`, the widened `DeckSettings`, `DEFAULT_DECK_SETTINGS`, `DEFAULT_CARD_STYLE`, `DEFAULT_SPACED_ADVANCED`, `CARD_STYLE_PRESETS`, `CARD_FONTS`, `CARD_ALIGNMENTS`, `LEARNING_ALGORITHMS`, and `validateDeckSettings(settings: Partial<DeckSettings>): void`.

- [ ] **Step 1: Write the failing tests**

Append to `src/entities/deck/model/types.test.ts`:

```ts
describe('deck settings', () => {
  it('defaults a deck to spaced repetition', () => {
    expect(DEFAULT_DECK_SETTINGS.algorithm).toBe('spaced')
    expect(DEFAULT_DECK_SETTINGS.newCardsPerDay).toBe(10)
    expect(DEFAULT_DECK_SETTINGS.maxCardsPerDay).toBe(3000)
    expect(DEFAULT_DECK_SETTINGS.cardStyle).toEqual({
      preset: 'plain',
      font: 'default',
      textSize: 30,
      alignment: 'center',
    })
  })

  it('carries settings through makeDeck', () => {
    const deck = makeDeck({
      id: 'd1',
      createdAt: new Date(0).toISOString(),
      name: 'Deck',
      settings: { algorithm: 'fast', newCardsPerDay: 25 },
    })
    expect(deck.settings.algorithm).toBe('fast')
    expect(deck.settings.newCardsPerDay).toBe(25)
  })

  it('rejects a negative daily limit', () => {
    expect(() => validateDeckSettings({ newCardsPerDay: -1 })).toThrow(
      'New cards per day must be >= 0',
    )
    expect(() => validateDeckSettings({ maxCardsPerDay: -1 })).toThrow(
      'Max cards per day must be >= 0',
    )
  })

  it('rejects a text size outside 14–40', () => {
    expect(() =>
      validateDeckSettings({ cardStyle: { ...DEFAULT_CARD_STYLE, textSize: 41 } }),
    ).toThrow('Card text size must be between 14 and 40')
  })

  it('rejects a speech rate outside 0.5–2', () => {
    expect(() => validateDeckSettings({ tts: { side: 'both', rate: 3 } })).toThrow(
      'Speech rate must be between 0.5 and 2',
    )
  })

  it('rejects an unknown algorithm', () => {
    expect(() =>
      validateDeckSettings({ algorithm: 'psychic' as LearningAlgorithm }),
    ).toThrow('Unknown learning algorithm: psychic')
  })

  it('validates settings when a deck is updated', () => {
    const deck = makeDeck({ id: 'd1', createdAt: new Date(0).toISOString(), name: 'Deck' })
    expect(() =>
      updateDeck(deck, { settings: { maxCardsPerDay: -5 } }, new Date(1).toISOString()),
    ).toThrow('Max cards per day must be >= 0')
  })
})
```

Add the new names to that file's existing import from `./types`.

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npx vitest run src/entities/deck/model/types.test.ts`
Expected: FAIL — `validateDeckSettings` is not exported.

- [ ] **Step 3: Widen the model**

In `src/entities/deck/model/types.ts`, above `DeckSettings`:

```ts
export const LEARNING_ALGORITHMS = ['fast', 'spaced'] as const
export type LearningAlgorithm = (typeof LEARNING_ALGORITHMS)[number]

export const CARD_STYLE_PRESETS = ['plain', 'outlined', 'chalk', 'notebook', 'paper'] as const
export type CardStylePreset = (typeof CARD_STYLE_PRESETS)[number]

export const CARD_FONTS = ['default', 'serif', 'rounded', 'mono'] as const
export type CardFont = (typeof CARD_FONTS)[number]

export const CARD_ALIGNMENTS = ['left', 'center', 'right'] as const
export type CardAlignment = (typeof CARD_ALIGNMENTS)[number]

export const TTS_SIDES = ['front', 'back', 'both'] as const
export type TtsSide = (typeof TTS_SIDES)[number]

export interface CardStyle {
  preset: CardStylePreset
  font: CardFont
  /** Point size of the card's body text, 14–40. */
  textSize: number
  alignment: CardAlignment
}

export interface SpacedAdvanced {
  /** Minutes between the steps a new card walks before it graduates. */
  learningSteps: number[]
  graduatingInterval: number
  easyBonus: number
  maximumInterval: number
  leechThreshold: number
}

export const DEFAULT_CARD_STYLE: CardStyle = {
  preset: 'plain',
  font: 'default',
  textSize: 30,
  alignment: 'center',
}

export const DEFAULT_SPACED_ADVANCED: SpacedAdvanced = {
  learningSteps: [1, 10],
  graduatingInterval: 1,
  easyBonus: 1.3,
  maximumInterval: 36500,
  leechThreshold: 8,
}
```

Widen `DeckSettings` and its default:

```ts
export interface DeckSettings {
  quizTimer: boolean
  studyDirection: StudyDirection
  shuffleQuestions: boolean
  shuffleCards: boolean
  /** The master switch for read-aloud; `tts` holds how it reads. */
  textToSpeech: boolean
  algorithm: LearningAlgorithm
  newCardsPerDay: number
  maxCardsPerDay: number
  cardStyle: CardStyle
  tts: { side: TtsSide; rate: number }
  advanced: SpacedAdvanced
}

export const DEFAULT_DECK_SETTINGS: DeckSettings = {
  quizTimer: true,
  studyDirection: 'front',
  shuffleQuestions: false,
  shuffleCards: false,
  textToSpeech: false,
  algorithm: 'spaced',
  newCardsPerDay: 10,
  maxCardsPerDay: 3000,
  cardStyle: DEFAULT_CARD_STYLE,
  tts: { side: 'both', rate: 1 },
  advanced: DEFAULT_SPACED_ADVANCED,
}
```

Add the validator and call it from both factories:

```ts
export function validateDeckSettings(settings: Partial<DeckSettings>): void {
  if (settings.algorithm !== undefined && !LEARNING_ALGORITHMS.includes(settings.algorithm)) {
    throw new Error(`Unknown learning algorithm: ${settings.algorithm}`)
  }
  if (settings.newCardsPerDay !== undefined && settings.newCardsPerDay < 0) {
    throw new Error('New cards per day must be >= 0')
  }
  if (settings.maxCardsPerDay !== undefined && settings.maxCardsPerDay < 0) {
    throw new Error('Max cards per day must be >= 0')
  }
  const style = settings.cardStyle
  if (style) {
    if (!CARD_STYLE_PRESETS.includes(style.preset)) {
      throw new Error(`Unknown card style preset: ${style.preset}`)
    }
    if (!CARD_FONTS.includes(style.font)) throw new Error(`Unknown card font: ${style.font}`)
    if (!CARD_ALIGNMENTS.includes(style.alignment)) {
      throw new Error(`Unknown card alignment: ${style.alignment}`)
    }
    if (style.textSize < 14 || style.textSize > 40) {
      throw new Error('Card text size must be between 14 and 40')
    }
  }
  if (settings.tts && (settings.tts.rate < 0.5 || settings.tts.rate > 2)) {
    throw new Error('Speech rate must be between 0.5 and 2')
  }
}
```

In `makeDeck`, after the order check: `validateDeckSettings(input.settings ?? {})`.
In `updateDeck`, after the order check: `validateDeckSettings(next.settings)`.

- [ ] **Step 4: Export from the barrel**

In `src/entities/deck/index.ts`, extend the two `./model/types` lines:

```ts
export type {
  Deck,
  DeckSettings,
  StudyDirection,
  MakeDeckInput,
  DeckChanges,
  LearningAlgorithm,
  CardStyle,
  CardStylePreset,
  CardFont,
  CardAlignment,
  TtsSide,
  SpacedAdvanced,
} from './model/types'
export {
  makeDeck,
  updateDeck,
  validateDeckSettings,
  DEFAULT_DECK_SETTINGS,
  DEFAULT_CARD_STYLE,
  DEFAULT_SPACED_ADVANCED,
  LEARNING_ALGORITHMS,
  CARD_STYLE_PRESETS,
  CARD_FONTS,
  CARD_ALIGNMENTS,
  TTS_SIDES,
} from './model/types'
```

- [ ] **Step 5: Run the tests and the typechecker**

Run: `npx vitest run src/entities/deck && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/entities/deck/model/types.ts src/entities/deck/model/types.test.ts src/entities/deck/index.ts
git add src/entities/deck
git commit -m "feat(deck): learning algorithm, daily limits, card style and TTS in deck settings"
```

---

### Task 2: Card model — frozen, reversed, fast-review bucket

**Files:**
- Modify: `src/entities/card/model/types.ts`
- Modify: `src/entities/card/index.ts`
- Test: `src/entities/card/model/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Card.frozen: boolean`, `Card.reversed: boolean`, `Card.fastReview?: FastOutcome`, and `type FastOutcome = 'notQuite' | 'gotIt'`.

- [ ] **Step 1: Write the failing tests**

Append to `src/entities/card/model/types.test.ts`:

```ts
describe('card learner flags', () => {
  const base = { id: 'c1', createdAt: new Date(0).toISOString(), deckId: 'd1', front: 'f', back: 'b' }

  it('defaults frozen and reversed to false and leaves the bucket unset', () => {
    const card = makeCard(base)
    expect(card.frozen).toBe(false)
    expect(card.reversed).toBe(false)
    expect(card.fastReview).toBeUndefined()
  })

  it('accepts the flags through makeCard', () => {
    const card = makeCard({ ...base, frozen: true, reversed: true, fastReview: 'gotIt' })
    expect(card.frozen).toBe(true)
    expect(card.reversed).toBe(true)
    expect(card.fastReview).toBe('gotIt')
  })

  it('updates the bucket without touching the rest', () => {
    const card = makeCard(base)
    const next = updateCard(card, { fastReview: 'notQuite' }, new Date(1).toISOString())
    expect(next.fastReview).toBe('notQuite')
    expect(next.front).toBe('f')
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npx vitest run src/entities/card/model/types.test.ts`
Expected: FAIL — `frozen` does not exist on `Card`.

- [ ] **Step 3: Extend the card**

In `src/entities/card/model/types.ts`:

```ts
/** How a learner answered a card under Fast review. Absent means they have not seen it yet. */
export type FastOutcome = 'notQuite' | 'gotIt'
```

Add to `Card`, after `memorized`:

```ts
  /** Held out of every study queue until the learner unfreezes it. */
  frozen: boolean
  /** Studied back → front, whatever the deck's direction says. */
  reversed: boolean
  fastReview?: FastOutcome
```

Add the same three to `MakeCardInput` (all optional), and to the object `makeCard` returns:

```ts
    frozen: input.frozen ?? false,
    reversed: input.reversed ?? false,
    fastReview: input.fastReview,
```

- [ ] **Step 4: Export from the barrel**

Add `FastOutcome` to the type export list in `src/entities/card/index.ts`.

- [ ] **Step 5: Run the tests and the typechecker**

Run: `npx vitest run src/entities/card && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/entities/card/model/types.ts src/entities/card/model/types.test.ts src/entities/card/index.ts
git add src/entities/card
git commit -m "feat(card): frozen, reversed and fast-review bucket"
```

---

### Task 3: Persistence — schema versions and migrations

**Files:**
- Modify: `src/app/persistence/schemas.ts:11-99`
- Modify: `src/app/persistence/database.ts`
- Test: `src/app/persistence/database.test.ts`

**Interfaces:**
- Consumes: Task 1 and Task 2 types.
- Produces: `deckSchema.version === 1`, `cardSchema.version === 1`, exported `deckMigrations` and `cardMigrations` from `database.ts`.

- [ ] **Step 1: Write the failing tests**

Append to `src/app/persistence/database.test.ts`:

```ts
describe('schema migrations', () => {
  it('leaves a v0 deck untouched — absent settings resolve to defaults at read time', () => {
    const v0 = { id: 'd1', name: 'Deck', settings: { shuffleCards: true } }
    expect(deckMigrations[1](v0 as never)).toEqual(v0)
  })

  it('gives a v0 card the learner flags it never had', () => {
    const v0 = { id: 'c1', deckId: 'd1', front: 'f', back: 'b', flagged: false, memorized: false }
    const migrated = cardMigrations[1](v0 as never)
    expect(migrated.frozen).toBe(false)
    expect(migrated.reversed).toBe(false)
    expect(migrated.fastReview).toBeUndefined()
  })

  it('versions both collections', () => {
    expect(deckSchema.version).toBe(1)
    expect(cardSchema.version).toBe(1)
  })
})
```

Import `deckMigrations`, `cardMigrations` from `./database` and `deckSchema`, `cardSchema` from `./schemas`.

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npx vitest run src/app/persistence/database.test.ts`
Expected: FAIL — `deckMigrations` is not exported.

- [ ] **Step 3: Version the schemas**

In `src/app/persistence/schemas.ts`, set `deckSchema.version` to `1` and extend `settings.properties` (the object is `additionalProperties: false`, so every new key must be declared):

```ts
        algorithm: { type: 'string', enum: ['fast', 'spaced'] },
        newCardsPerDay: { type: 'number' },
        maxCardsPerDay: { type: 'number' },
        cardStyle: {
          type: 'object',
          properties: {
            preset: { type: 'string', enum: ['plain', 'outlined', 'chalk', 'notebook', 'paper'] },
            font: { type: 'string', enum: ['default', 'serif', 'rounded', 'mono'] },
            textSize: { type: 'number' },
            alignment: { type: 'string', enum: ['left', 'center', 'right'] },
          },
          required: ['preset', 'font', 'textSize', 'alignment'],
          additionalProperties: false,
        },
        tts: {
          type: 'object',
          properties: {
            side: { type: 'string', enum: ['front', 'back', 'both'] },
            rate: { type: 'number' },
          },
          required: ['side', 'rate'],
          additionalProperties: false,
        },
        advanced: {
          type: 'object',
          properties: {
            learningSteps: { type: 'array', items: { type: 'number' } },
            graduatingInterval: { type: 'number' },
            easyBonus: { type: 'number' },
            maximumInterval: { type: 'number' },
            leechThreshold: { type: 'number' },
          },
          required: [
            'learningSteps',
            'graduatingInterval',
            'easyBonus',
            'maximumInterval',
            'leechThreshold',
          ],
          additionalProperties: false,
        },
```

Set `cardSchema.version` to `1`, add to its `properties`:

```ts
    frozen: { type: 'boolean' },
    reversed: { type: 'boolean' },
    fastReview: { type: 'string', enum: ['notQuite', 'gotIt'] },
```

and add `'frozen'` and `'reversed'` to `cardSchema.required` (the migration fills them; `fastReview` stays optional because "not seen yet" is the absence of a value).

- [ ] **Step 4: Add the migration strategies**

In `src/app/persistence/database.ts`, beside the existing `preferencesMigrations`:

```ts
/**
 * A deck written before this version simply lacks the new settings keys, and `resolveDeckSettings`
 * already answers a missing key with the default — so there is nothing to rewrite. The version bump
 * exists because the schema's shape changed, not because the documents did.
 */
export const deckMigrations = {
  1: (doc: Deck) => doc,
}

/** Frozen and reversed are required, so every card that predates them is given the quiet answer. */
export const cardMigrations = {
  1: (doc: Card) => ({ ...doc, frozen: doc.frozen ?? false, reversed: doc.reversed ?? false }),
}
```

Wire them into `addCollections`:

```ts
    decks: {
      schema: deckSchema,
      migrationStrategies: deckMigrations,
      conflictHandler: lastWriteWins<Deck>(),
    },
    cards: {
      schema: cardSchema,
      migrationStrategies: cardMigrations,
      conflictHandler: mergeCardConflict,
    },
```

- [ ] **Step 5: Run the persistence tests**

Run: `npx vitest run src/app/persistence && npm run typecheck`
Expected: PASS. If a fixture elsewhere fails to validate, add `frozen: false, reversed: false` to that fixture — do not relax the schema.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/app/persistence/schemas.ts src/app/persistence/database.ts src/app/persistence/database.test.ts
git add src/app/persistence
git commit -m "feat(persistence): deck and card schema v1 with migrations"
```

---

### Task 4: Card style resolution

**Files:**
- Create: `src/shared/lib/card-style.ts`
- Create: `src/shared/lib/card-style.test.ts`
- Modify: `src/shared/lib/index.ts`

**Interfaces:**
- Consumes: `CardStyle`, `CardStylePreset` — but `shared` cannot import from `entities`, so this module declares its own structural input type and the entity types satisfy it.
- Produces: `resolveCardStyle(style: CardStyleInput): CardStyleVars`, `CARD_STYLE_PRESET_IDS`, `clampCardTextSize(value: number): number`.

- [ ] **Step 1: Write the failing test**

Create `src/shared/lib/card-style.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { CARD_STYLE_PRESET_IDS, clampCardTextSize, resolveCardStyle } from './card-style'

const plain = { preset: 'plain', font: 'default', textSize: 30, alignment: 'center' } as const

describe('resolveCardStyle', () => {
  it('turns a style into custom properties', () => {
    const vars = resolveCardStyle(plain)
    expect(vars['--card-style-size']).toBe('30px')
    expect(vars['--card-style-align']).toBe('center')
    expect(vars['--card-style-font']).toContain('system-ui')
  })

  it('clamps a text size into 14–40', () => {
    expect(clampCardTextSize(4)).toBe(14)
    expect(clampCardTextSize(400)).toBe(40)
    expect(clampCardTextSize(22)).toBe(22)
    expect(resolveCardStyle({ ...plain, textSize: 400 })['--card-style-size']).toBe('40px')
  })

  it('gives every preset a background and an ink colour', () => {
    for (const preset of CARD_STYLE_PRESET_IDS) {
      const vars = resolveCardStyle({ ...plain, preset })
      expect(vars['--card-style-bg']).toBeTruthy()
      expect(vars['--card-style-ink']).toBeTruthy()
    }
  })

  it('serves each font family', () => {
    expect(resolveCardStyle({ ...plain, font: 'serif' })['--card-style-font']).toContain('serif')
    expect(resolveCardStyle({ ...plain, font: 'mono' })['--card-style-font']).toContain('mono')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/shared/lib/card-style.test.ts`
Expected: FAIL — cannot resolve `./card-style`.

- [ ] **Step 3: Implement the module**

Create `src/shared/lib/card-style.ts`:

```ts
/**
 * A card's look, resolved once into custom properties. Preview thumbnails, the style page's live
 * card and the study card all read the same variables, so none of them can drift from the others.
 */
export const CARD_STYLE_PRESET_IDS = [
  'plain',
  'outlined',
  'chalk',
  'notebook',
  'paper',
] as const
export type CardStylePresetId = (typeof CARD_STYLE_PRESET_IDS)[number]

export type CardFontId = 'default' | 'serif' | 'rounded' | 'mono'
export type CardAlignmentId = 'left' | 'center' | 'right'

export interface CardStyleInput {
  preset: CardStylePresetId
  font: CardFontId
  textSize: number
  alignment: CardAlignmentId
}

export interface CardStyleVars extends Record<string, string> {
  '--card-style-bg': string
  '--card-style-ink': string
  '--card-style-border': string
  '--card-style-font': string
  '--card-style-size': string
  '--card-style-align': string
}

export const MIN_CARD_TEXT_SIZE = 14
export const MAX_CARD_TEXT_SIZE = 40

export function clampCardTextSize(value: number): number {
  if (Number.isNaN(value)) return MIN_CARD_TEXT_SIZE
  return Math.min(MAX_CARD_TEXT_SIZE, Math.max(MIN_CARD_TEXT_SIZE, Math.round(value)))
}

const FONTS: Record<CardFontId, string> = {
  default: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
}

/** Grain drawn by the browser rather than shipped — an inline SVG costs nothing to download. */
function grain(opacity: number, frequency: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3"/></filter><rect width="120" height="120" filter="url(#n)" opacity="${opacity}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

interface PresetSkin {
  bg: string
  ink: string
  border: string
}

const PRESETS: Record<CardStylePresetId, PresetSkin> = {
  plain: {
    bg: 'var(--card)',
    ink: 'var(--heading)',
    border: '1px solid var(--border)',
  },
  outlined: {
    bg: 'var(--card)',
    ink: 'var(--heading)',
    border: '2.5px solid var(--heading)',
  },
  chalk: {
    bg: `${grain(0.28, '0.85')}, linear-gradient(160deg, #3b4450, #232a33)`,
    ink: '#f2f5f7',
    border: '1px solid rgba(255,255,255,0.14)',
  },
  notebook: {
    bg: 'repeating-linear-gradient(180deg, transparent 0 27px, rgba(80,120,200,0.22) 27px 28px), linear-gradient(180deg, #fffdf8, #fdf7ef)',
    ink: '#28303a',
    border: '1px solid rgba(80,120,200,0.25)',
  },
  paper: {
    bg: `${grain(0.16, '0.65')}, radial-gradient(120% 100% at 30% 0%, #f7ecd8, #e6d2b3)`,
    ink: '#4a3620',
    border: '1px solid rgba(120,90,50,0.25)',
  },
}

export function resolveCardStyle(style: CardStyleInput): CardStyleVars {
  const skin = PRESETS[style.preset]
  return {
    '--card-style-bg': skin.bg,
    '--card-style-ink': skin.ink,
    '--card-style-border': skin.border,
    '--card-style-font': FONTS[style.font],
    '--card-style-size': `${clampCardTextSize(style.textSize)}px`,
    '--card-style-align': style.alignment,
  }
}
```

Presets `chalk`, `notebook` and `paper` are printed surfaces, not app chrome: their colours are intrinsic to the material and stay fixed in both themes. `plain` and `outlined` follow the theme through tokens.

- [ ] **Step 4: Export, and make the two preset lists one list**

Add `export * from './card-style'` to `src/shared/lib/index.ts` in alphabetical position.

`entities` may import from `shared`, so remove the duplicate literals Task 1 put in
`src/entities/deck/model/types.ts` and derive them instead — one list, no drift:

```ts
import {
  CARD_ALIGNMENT_IDS,
  CARD_FONT_IDS,
  CARD_STYLE_PRESET_IDS,
  type CardStyleInput,
} from '@/shared/lib'

export const CARD_STYLE_PRESETS = CARD_STYLE_PRESET_IDS
export const CARD_FONTS = CARD_FONT_IDS
export const CARD_ALIGNMENTS = CARD_ALIGNMENT_IDS
export type CardStyle = CardStyleInput
```

Export `CARD_FONT_IDS` and `CARD_ALIGNMENT_IDS` from `card-style.ts` alongside
`CARD_STYLE_PRESET_IDS` to make that possible, and keep `CardStylePreset`, `CardFont` and
`CardAlignment` as aliases of the shared ids so every existing import still resolves.

Run: `npx vitest run src/shared/lib/card-style.test.ts src/entities/deck && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/shared/lib/card-style.ts src/shared/lib/card-style.test.ts src/shared/lib/index.ts
git add src/shared/lib
git commit -m "feat(shared): resolve a card style into custom properties"
```

---

### Task 5: Queue building with daily limits

**Files:**
- Modify: `src/features/review/study-filter.ts`
- Modify: `src/features/review/index.ts`
- Test: `src/features/review/study-filter.test.ts`

**Interfaces:**
- Consumes: `Card` (Task 2).
- Produces: `buildStudyQueue(cards: Card[], options: QueueOptions): string[]` and `interface QueueOptions { now: number; algorithm: 'fast' | 'spaced'; shuffle: boolean; newCardsPerDay: number; maxCardsPerDay: number; random?: () => number }`.

- [ ] **Step 1: Write the failing tests**

Append to `src/features/review/study-filter.test.ts`:

```ts
describe('buildStudyQueue', () => {
  const options = {
    now: NOW,
    algorithm: 'spaced' as const,
    shuffle: false,
    newCardsPerDay: 10,
    maxCardsPerDay: 3000,
  }

  it('never queues a frozen card', () => {
    const cards = [card('a'), { ...card('b'), frozen: true }]
    expect(buildStudyQueue(cards, options)).toEqual(['a'])
  })

  it('caps the queue at the daily maximum', () => {
    const cards = Array.from({ length: 12 }, (_, i) => card(`c${i}`))
    expect(buildStudyQueue(cards, { ...options, maxCardsPerDay: 5 })).toHaveLength(5)
  })

  it('limits how many never-studied cards enter', () => {
    const cards = Array.from({ length: 12 }, (_, i) => card(`n${i}`))
    expect(buildStudyQueue(cards, { ...options, newCardsPerDay: 3 })).toHaveLength(3)
  })

  it('lets due cards through beyond the new-card limit', () => {
    const due = { ...card('due'), srs: { due: new Date(NOW - DAY).toISOString(), interval: 5, ease: 2.5, reps: 3, lapses: 0, lastReviewed: new Date(NOW - DAY).toISOString() } }
    const cards = [due, card('n1'), card('n2')]
    expect(buildStudyQueue(cards, { ...options, newCardsPerDay: 1 })).toHaveLength(2)
  })

  it('offers every unfrozen card under fast review, ignoring schedules', () => {
    const future = { ...card('f'), srs: { due: new Date(NOW + 90 * DAY).toISOString(), interval: 90, ease: 2.5, reps: 6, lapses: 0, lastReviewed: new Date(NOW).toISOString() } }
    const cards = [future, card('a')]
    expect(buildStudyQueue(cards, { ...options, algorithm: 'fast' })).toEqual(['f', 'a'])
  })

  it('caps fast review at the daily maximum too', () => {
    const cards = Array.from({ length: 9 }, (_, i) => card(`c${i}`))
    const queue = buildStudyQueue(cards, { ...options, algorithm: 'fast', maxCardsPerDay: 4 })
    expect(queue).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/features/review/study-filter.test.ts`
Expected: FAIL — `buildStudyQueue` is not exported.

- [ ] **Step 3: Implement**

Add to `src/features/review/study-filter.ts`:

```ts
export interface QueueOptions {
  now: number
  algorithm: LearningAlgorithm
  shuffle: boolean
  newCardsPerDay: number
  maxCardsPerDay: number
  random?: () => number
}

/**
 * The one place a study queue is built. Fast review ignores schedules entirely — every card is on
 * offer, which is the whole point of it — while spaced repetition takes what is due and tops up
 * with new cards to the day's allowance. Both obey the day's ceiling, and neither ever sees a
 * frozen card.
 */
export function buildStudyQueue(cards: Card[], options: QueueOptions): string[] {
  const { now, algorithm, shuffle: shouldShuffle, random = Math.random } = options
  const live = cards.filter((card) => !card.frozen)

  const chosen =
    algorithm === 'fast'
      ? live
      : [
          ...live.filter((card) => srsStatus(card.srs) !== 'new' && isDue(card.srs, now)),
          ...live.filter((card) => srsStatus(card.srs) === 'new').slice(0, options.newCardsPerDay),
        ]

  const capped = chosen.slice(0, options.maxCardsPerDay)
  const ids = capped.map((card) => card.id)
  return shouldShuffle ? shuffle(ids, random) : ids
}
```

Import `LearningAlgorithm` from `@/entities/deck` at the top of the file.

- [ ] **Step 4: Export and run**

Add `buildStudyQueue` and `type QueueOptions` to `src/features/review/index.ts`.
Run: `npx vitest run src/features/review && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/features/review/study-filter.ts src/features/review/study-filter.test.ts src/features/review/index.ts
git add src/features/review
git commit -m "feat(review): build study queues per algorithm with daily limits"
```

---

### Task 6: Fast review in the session machine

**Files:**
- Create: `src/features/review/fast-review.ts`
- Create: `src/features/review/fast-review.test.ts`
- Modify: `src/features/review/session-machine.ts`
- Modify: `src/features/review/session-machine.test.ts`
- Modify: `src/features/review/index.ts`

**Interfaces:**
- Consumes: `FastOutcome` from `@/entities/card`.
- Produces: `reinsertAhead(rest: string[], id: string, ahead?: number): string[]`, `REINSERT_AHEAD`, `initSession({ ids, mode })` where `mode: SessionMode = 'spaced' | 'fast'`, `ReviewState.buckets: { notQuite: string[]; gotIt: string[] }`, and the action `{ type: 'answer'; outcome: FastOutcome }`.

- [ ] **Step 1: Write the failing tests for the re-insertion rule**

Create `src/features/review/fast-review.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { reinsertAhead, REINSERT_AHEAD } from './fast-review'

describe('reinsertAhead', () => {
  it('drops the card a few places down the queue', () => {
    expect(reinsertAhead(['b', 'c', 'd', 'e', 'f'], 'a', 3)).toEqual(['b', 'c', 'd', 'a', 'e', 'f'])
  })

  it('puts it last when the queue is shorter than the gap', () => {
    expect(reinsertAhead(['b'], 'a', 4)).toEqual(['b', 'a'])
  })

  it('still returns the card when the queue is empty — Not quite never retires a card', () => {
    expect(reinsertAhead([], 'a')).toEqual(['a'])
  })

  it('defaults to four places, which is close enough to feel more frequent', () => {
    expect(REINSERT_AHEAD).toBe(4)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/features/review/fast-review.test.ts`
Expected: FAIL — cannot resolve `./fast-review`.

- [ ] **Step 3: Implement the rule**

Create `src/features/review/fast-review.ts`:

```ts
/**
 * How far ahead a "Not quite" card is put back. Fast review has no schedule, so "still learning"
 * has to mean something inside the session: the card returns soon, and keeps returning, until the
 * learner says they have it.
 */
export const REINSERT_AHEAD = 4

export function reinsertAhead(rest: string[], id: string, ahead: number = REINSERT_AHEAD): string[] {
  const at = Math.min(ahead, rest.length)
  return [...rest.slice(0, at), id, ...rest.slice(at)]
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/features/review/fast-review.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing tests for the machine**

Append to `src/features/review/session-machine.test.ts`:

```ts
describe('fast review', () => {
  const start = () => initSession({ ids: ['a', 'b', 'c'], mode: 'fast' })

  it('starts every card outside both buckets', () => {
    const state = start()
    expect(state.buckets).toEqual({ notQuite: [], gotIt: [] })
  })

  it('sends a Not quite card back into the queue', () => {
    const state = sessionReducer(start(), { type: 'answer', outcome: 'notQuite' })
    if (state.status !== 'review') throw new Error('expected review')
    expect(state.queue).toContain('a')
    expect(state.queue[0]).toBe('b')
    expect(state.buckets.notQuite).toEqual(['a'])
  })

  it('retires a Got it card', () => {
    const state = sessionReducer(start(), { type: 'answer', outcome: 'gotIt' })
    if (state.status !== 'review') throw new Error('expected review')
    expect(state.queue).not.toContain('a')
    expect(state.buckets.gotIt).toEqual(['a'])
  })

  it('counts a card once however often it comes round', () => {
    let state: SessionState = initSession({ ids: ['a'], mode: 'fast' })
    state = sessionReducer(state, { type: 'answer', outcome: 'notQuite' })
    state = sessionReducer(state, { type: 'answer', outcome: 'notQuite' })
    if (state.status !== 'review') throw new Error('expected review')
    expect(state.buckets.notQuite).toEqual(['a'])
  })

  it('moves a card out of Not quite when the learner finally gets it', () => {
    let state: SessionState = initSession({ ids: ['a'], mode: 'fast' })
    state = sessionReducer(state, { type: 'answer', outcome: 'notQuite' })
    state = sessionReducer(state, { type: 'answer', outcome: 'gotIt' })
    expect(state.status).toBe('complete')
    expect(state.buckets).toEqual({ notQuite: [], gotIt: ['a'] })
  })

  it('completes only when every card has been got', () => {
    let state: SessionState = initSession({ ids: ['a', 'b'], mode: 'fast' })
    state = sessionReducer(state, { type: 'answer', outcome: 'gotIt' })
    expect(state.status).toBe('review')
    state = sessionReducer(state, { type: 'answer', outcome: 'gotIt' })
    expect(state.status).toBe('complete')
  })

  it('undoes an answer, buckets and all', () => {
    let state: SessionState = start()
    state = sessionReducer(state, { type: 'answer', outcome: 'gotIt' })
    state = sessionReducer(state, { type: 'undo' })
    if (state.status !== 'review') throw new Error('expected review')
    expect(state.queue).toEqual(['a', 'b', 'c'])
    expect(state.buckets.gotIt).toEqual([])
  })
})
```

- [ ] **Step 6: Run them and watch them fail**

Run: `npx vitest run src/features/review/session-machine.test.ts`
Expected: FAIL — `initSession` takes no `mode`.

- [ ] **Step 7: Teach the machine both modes**

In `src/features/review/session-machine.ts`:

```ts
import type { FastOutcome } from '@/entities/card'
import { reinsertAhead } from './fast-review'

export type SessionMode = 'spaced' | 'fast'

/** Which cards the learner has put where. Fast review counts cards, not answers. */
export interface Buckets {
  notQuite: string[]
  gotIt: string[]
}
```

Add `mode: SessionMode` and `buckets: Buckets` to `ReviewState`, `CompleteState` and `Snapshot`; add `{ type: 'answer'; outcome: FastOutcome }` to `SessionAction`; give `InitParams` a `mode: SessionMode`. `initSession` returns `mode`, `buckets: { notQuite: [], gotIt: [] }`. `snapshot()` records `buckets`; the `undo` case restores `last.buckets` and keeps `state.mode`. The `grade` and `skip` cases pass `mode` and `buckets` through unchanged.

The new case, beside `grade`:

```ts
    case 'answer': {
      if (state.status !== 'review') return state
      const current = state.queue[0]
      if (current === undefined) return state
      const history = [...state.history, snapshot(state)]
      const rest = state.queue.slice(1)
      const gotIt = action.outcome === 'gotIt'
      const buckets: Buckets = {
        notQuite: withId(state.buckets.notQuite, current, !gotIt),
        gotIt: withId(state.buckets.gotIt, current, gotIt),
      }
      const queue = gotIt ? rest : reinsertAhead(rest, current)
      const graded = gotIt ? state.graded + 1 : state.graded
      if (queue.length === 0) {
        return { status: 'complete', mode: state.mode, graded, total: state.total, piles: state.piles, buckets, history }
      }
      return { ...state, queue, graded, buckets, flipped: false, history }
    }
```

and the helper above the reducer:

```ts
function withId(ids: string[], id: string, present: boolean): string[] {
  const without = ids.filter((each) => each !== id)
  return present ? [...without, id] : without
}
```

- [ ] **Step 8: Fix the existing callers**

`initSession` now needs a mode. In `src/widgets/study-session/ui/FlashcardsPanel.tsx` pass `mode: 'spaced'` for now — Task 15 makes it real. In `session-machine.test.ts` and `due-queue-flow.test.ts`, add `mode: 'spaced'` to each existing `initSession` call.

- [ ] **Step 9: Run the review suite**

Run: `npx vitest run src/features/review src/widgets/study-session && npm run typecheck`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
npx prettier --write src/features/review src/widgets/study-session/ui/FlashcardsPanel.tsx
git add src/features/review src/widgets/study-session
git commit -m "feat(review): fast-review answers re-queue a card until the learner has it"
```

---

### Task 7: Card commands — freeze, reverse, fast-review outcome

**Files:**
- Create: `src/features/card/freeze-card.ts`
- Create: `src/features/card/reverse-card.ts`
- Create: `src/features/card/set-fast-review.ts`
- Create: `src/features/card/card-flags.test.ts`
- Modify: `src/features/card/index.ts`

**Interfaces:**
- Consumes: `Card`, `CardStore`, `FastOutcome`, `requireCard` from `./card-commands`.
- Produces: `toggleCardFrozen(store, id, now?)`, `toggleCardReversed(store, id, now?)`, `setCardFastReview(store, id, outcome, now?)`, `clearDeckFastReview(store, cardIds, now?)` — all `Promise<Card>` except the last, which is `Promise<void>`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/card/card-flags.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { type Card, createCardStore, makeCard } from '@/entities/card'
import { clearDeckFastReview, setCardFastReview, toggleCardFrozen, toggleCardReversed } from './index'

function storeWith(...cards: Card[]) {
  const repo = new InMemoryRepository<Card>()
  for (const card of cards) void repo.save(card)
  return started(createCardStore(repo))
}

const card = (id: string, extra: Partial<Card> = {}): Card => ({
  ...makeCard({ id, createdAt: new Date(0).toISOString(), deckId: 'd1', front: id, back: 'b' }),
  ...extra,
})

describe('card flags', () => {
  it('freezes and unfreezes', async () => {
    const store = storeWith(card('c1'))
    expect((await toggleCardFrozen(store, 'c1')).frozen).toBe(true)
    expect((await toggleCardFrozen(store, 'c1')).frozen).toBe(false)
  })

  it('reverses and unreverses', async () => {
    const store = storeWith(card('c1'))
    expect((await toggleCardReversed(store, 'c1')).reversed).toBe(true)
    expect((await toggleCardReversed(store, 'c1')).reversed).toBe(false)
  })

  it('records a fast-review outcome', async () => {
    const store = storeWith(card('c1'))
    expect((await setCardFastReview(store, 'c1', 'notQuite')).fastReview).toBe('notQuite')
    expect((await setCardFastReview(store, 'c1', 'gotIt')).fastReview).toBe('gotIt')
  })

  it('clears the outcome across a deck', async () => {
    const store = storeWith(card('c1', { fastReview: 'gotIt' }), card('c2', { fastReview: 'notQuite' }))
    await clearDeckFastReview(store, ['c1', 'c2'])
    for (const id of ['c1', 'c2']) {
      expect(store.getState().cards.find((each) => each.id === id)?.fastReview).toBeUndefined()
    }
  })
})
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/features/card/card-flags.test.ts`
Expected: FAIL — no export named `toggleCardFrozen`.

- [ ] **Step 3: Write the commands**

`src/features/card/freeze-card.ts`:

```ts
import { type Card, type CardStore, updateCard } from '@/entities/card'
import { nowIso } from '@/shared/lib'
import { requireCard } from './card-commands'

/** A frozen card keeps its schedule and its place; it simply stops being offered. */
export async function toggleCardFrozen(
  store: CardStore,
  id: string,
  now: number = Date.now(),
): Promise<Card> {
  const card = requireCard(store, id)
  const updated = updateCard(card, { frozen: !card.frozen }, nowIso(now))
  await store.getState().save(updated)
  return updated
}
```

`src/features/card/reverse-card.ts` is the same shape with `reversed: !card.reversed`.

`src/features/card/set-fast-review.ts`:

```ts
import { type Card, type CardStore, type FastOutcome, updateCard } from '@/entities/card'
import { nowIso } from '@/shared/lib'
import { requireCard } from './card-commands'

export async function setCardFastReview(
  store: CardStore,
  id: string,
  outcome: FastOutcome,
  now: number = Date.now(),
): Promise<Card> {
  const card = requireCard(store, id)
  const updated = updateCard(card, { fastReview: outcome }, nowIso(now))
  await store.getState().save(updated)
  return updated
}

/** Resetting a deck's progress has to clear the fast-review buckets too, or the counts lie. */
export async function clearDeckFastReview(
  store: CardStore,
  cardIds: string[],
  now: number = Date.now(),
): Promise<void> {
  const stamp = nowIso(now)
  for (const id of cardIds) {
    const card = requireCard(store, id)
    if (card.fastReview === undefined) continue
    await store.getState().save(updateCard(card, { fastReview: undefined }, stamp))
  }
}
```

- [ ] **Step 4: Export, and fold the clear into reset**

Add all four to `src/features/card/index.ts`. In `src/features/card/set-cards-srs.ts`, have `resetDeckSrs` also clear `fastReview` on the cards it touches, so Reset progress means the same thing under both algorithms. Add a test to the file's existing suite asserting a reset card has no `fastReview`.

- [ ] **Step 5: Run**

Run: `npx vitest run src/features/card && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/features/card
git add src/features/card
git commit -m "feat(card): freeze, reverse and fast-review outcome commands"
```

---

### Task 8: Copy

**Files:**
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Produces: the `deckSettings` additions plus new `algorithm`, `cardStyle`, `cardActions`, `fastReview` and `tts` blocks. Every later task uses these keys and adds none of its own.

- [ ] **Step 1: Extend `deckSettings`**

Add inside the existing `deckSettings` object:

```ts
    algorithmRow: 'Algorithm preset',
    cardStyle: 'Card style',
    ttsRow: 'Text-to-speech',
    importCards: 'Import cards',
    rename: 'Rename deck',
    move: 'Move deck',
```

- [ ] **Step 2: Add the new blocks**

After `deckSettings`, at the same level:

```ts
  algorithm: {
    title: 'Algorithm settings',
    chooseTitle: 'Choose learning algorithm',
    newPerDay: 'New cards per day',
    maxPerDay: 'Max cards per day',
    shuffle: 'Shuffle cards',
    advanced: 'Advanced settings',
    advancedTitle: 'Advanced settings',
    advancedHint: 'Fine-tune how intervals grow. Saved now, used when the scheduler lands.',
    learningSteps: 'Learning steps (minutes)',
    graduatingInterval: 'Graduating interval (days)',
    easyBonus: 'Easy bonus',
    maximumInterval: 'Maximum interval (days)',
    leechThreshold: 'Leech threshold (lapses)',
    resetDefaults: 'Reset to defaults',
    resetDefaultsDone: 'Advanced settings reset',
    keepsSchedules: 'Switching keeps every schedule — you can change back at any time.',
    fast: {
      name: 'Fast review',
      body: 'Review cards without any schedules, just one by one. Cards are always available to study on demand, letting you refresh material at your own pace without following spaced repetition intervals.',
    },
    spaced: {
      name: 'Spaced repetition',
      longName: 'General spaced repetition',
      body: 'An intelligent system that schedules reviews based on how well you remember each card. Easier cards appear less often, while challenging ones are shown more often — helping you learn efficiently and retain knowledge over the long term.',
    },
    deckLine: 'Learning algorithm:',
    explain: 'About this algorithm',
  },
  cardStyle: {
    title: 'Card style',
    presets: 'Presets',
    font: 'Font',
    fontTitle: 'Card font',
    textSize: 'Text size',
    decrease: 'Smaller text',
    increase: 'Larger text',
    alignment: 'Alignment',
    alignLeft: 'Align left',
    alignCenter: 'Align centre',
    alignRight: 'Align right',
    reset: 'Reset card style',
    resetDone: 'Card style reset',
    haptics: 'Haptics',
    preview: 'Preview',
    previewFront: 'What are the 3 different types of equilibrium in physics?',
    previewBack: 'Stable, unstable and neutral.',
    preset: {
      plain: 'Plain',
      outlined: 'Outlined',
      chalk: 'Chalk',
      notebook: 'Notebook',
      paper: 'Paper',
    },
    fontName: {
      default: 'Default',
      serif: 'Serif',
      rounded: 'Rounded',
      mono: 'Monospace',
    },
  },
  cardActions: {
    title: 'Card actions',
    select: 'Select',
    edit: 'Edit',
    freeze: 'Freeze',
    unfreeze: 'Unfreeze',
    move: 'Move',
    reverse: 'Reverse',
    unreverse: 'Unreverse',
    duplicate: 'Duplicate',
    history: 'Learning history',
    delete: 'Delete',
    reversedChip: 'Reversed',
    frozenChip: 'Frozen',
    frozeToast: 'Card frozen',
    unfrozeToast: 'Card unfrozen',
    reversedToast: 'Card reversed',
    unreversedToast: 'Card back to normal',
    historyTitle: 'Learning history',
    historyEmpty: 'No history yet',
    historyEmptyBody:
      'Reviews are not recorded yet. Once the new scheduler lands, every answer for this card shows up here.',
  },
  fastReview: {
    notQuite: 'Not quite',
    gotIt: 'Got it',
    notStudied: 'Not studied',
    cardsToStudy_one: 'card to study',
    cardsToStudy_other: 'cards to study',
  },
  tts: {
    title: 'Text-to-speech',
    enable: 'Read cards aloud',
    side: 'What to read',
    sideFront: 'Front only',
    sideBack: 'Back only',
    sideBoth: 'Both sides',
    rate: 'Speech rate',
    test: 'Test voice',
    testPhrase: 'This is how your cards will sound.',
    unsupported: 'This device has no speech voices',
    unsupportedBody: 'Read-aloud needs a system voice. Try another browser or device.',
  },
```

Also change `srs.known` to `'Mastered'` at the three places it still reads `'Known'` in learner-facing sections (leave achievement copy alone).

- [ ] **Step 3: Verify nothing broke**

Run: `npm run typecheck && npx vitest run src/shared/i18n src/pages/settings`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
npx prettier --write src/shared/i18n/locales/en.ts
git add src/shared/i18n
git commit -m "feat(i18n): copy for algorithms, card style, card actions and TTS"
```

---

### Task 9: Filled variant for the action sheet

**Files:**
- Modify: `src/shared/ui/ActionSheet.tsx`
- Modify: `src/shared/ui/ActionSheet.test.tsx`

**Interfaces:**
- Produces: `ActionSheetProps` gains `variant?: 'plain' | 'filled'` (default `'plain'`), `hideTitle?: boolean`, and `cancelLabel?: string` becomes optional.

- [ ] **Step 1: Write the failing tests**

Append to `src/shared/ui/ActionSheet.test.tsx`:

```ts
it('keeps the title for screen readers when it is hidden', () => {
  render(
    <ActionSheet
      open
      hideTitle
      onOpenChange={() => {}}
      title="Card actions"
      actions={[{ id: 'edit', label: 'Edit', onSelect: () => {} }]}
    />,
  )
  expect(screen.getByText('Card actions')).toHaveClass('sr-only')
})

it('omits the cancel row when no label is given', () => {
  render(
    <ActionSheet
      open
      onOpenChange={() => {}}
      title="Card actions"
      actions={[{ id: 'edit', label: 'Edit', onSelect: () => {} }]}
    />,
  )
  expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
})
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/shared/ui/ActionSheet.test.tsx`
Expected: FAIL — `hideTitle` is not a prop.

- [ ] **Step 3: Implement**

Make `cancelLabel` optional and add the two props. Wrap the title block so `hideTitle` renders `<DrawerTitle className="sr-only">`; render the header `div` only when the title is visible or a description exists. Render `DrawerClose` only when `cancelLabel` is set. On each action button add, when `variant === 'filled'`:

```ts
                variant === 'filled' && 'mb-1.5 h-14 rounded-card bg-info-surface px-4',
```

- [ ] **Step 4: Run and commit**

Run: `npx vitest run src/shared/ui/ActionSheet.test.tsx && npm run typecheck`

```bash
npx prettier --write src/shared/ui/ActionSheet.tsx src/shared/ui/ActionSheet.test.tsx
git add src/shared/ui
git commit -m "feat(ui): filled, title-optional variant of the action sheet"
```

---

### Task 10: Algorithm picker sheet

**Files:**
- Create: `src/widgets/algorithm/ui/AlgorithmSheet.tsx`
- Create: `src/widgets/algorithm/ui/AlgorithmSheet.test.tsx`
- Create: `src/widgets/algorithm/ui/algorithm-meta.tsx`
- Create: `src/widgets/algorithm/index.ts`

**Interfaces:**
- Consumes: `LearningAlgorithm`, `LEARNING_ALGORITHMS` from `@/entities/deck`; `Sheet` from `@/shared/ui`.
- Produces: `<AlgorithmSheet open onOpenChange value onChange />`, and `ALGORITHM_META: Record<LearningAlgorithm, { icon: ReactNode; nameKey: string; longNameKey: string; bodyKey: string }>` for reuse by the settings pages and deck detail.

- [ ] **Step 1: Write the failing test**

Create `src/widgets/algorithm/ui/AlgorithmSheet.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { AlgorithmSheet } from './AlgorithmSheet'

afterEach(cleanup)

const open = (value: 'fast' | 'spaced', onChange = vi.fn()) => {
  render(
    <I18nextProvider i18n={i18n}>
      <AlgorithmSheet open value={value} onOpenChange={() => {}} onChange={onChange} />
    </I18nextProvider>,
  )
  return onChange
}

describe('AlgorithmSheet', () => {
  it('offers exactly the two algorithms', () => {
    open('fast')
    expect(screen.getByRole('radio', { name: /Fast review/ })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /General spaced repetition/ })).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('marks the current one', () => {
    open('spaced')
    expect(screen.getByRole('radio', { name: /General spaced repetition/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('reports a change', async () => {
    const onChange = open('fast')
    await userEvent.click(screen.getByRole('radio', { name: /General spaced repetition/ }))
    expect(onChange).toHaveBeenCalledWith('spaced')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/widgets/algorithm`
Expected: FAIL — cannot resolve `./AlgorithmSheet`.

- [ ] **Step 3: Implement**

`algorithm-meta.tsx` exports `ALGORITHM_META` keyed by algorithm, with a `Layers` icon for `fast` and a `RefreshCw`-over-`Layers` composition for `spaced` (both `lucide-react`, both `text-accent`), plus the i18n key paths from Task 8.

`AlgorithmSheet.tsx` renders a `Sheet` titled `algorithm.chooseTitle` containing a `role="radiogroup"`, one `role="radio"` button per algorithm: icon, long name, a `SelectDot` on the right showing `checked`/`unchecked`, description below, `aria-checked` bound to selection, selected card ringed with `border-accent ring-2 ring-accent/25`. Below the group, `algorithm.keepsSchedules` in `text-muted-foreground`. Clicking calls `onChange(id)` then `onOpenChange(false)`.

`index.ts` re-exports `AlgorithmSheet` and `ALGORITHM_META`.

- [ ] **Step 4: Run and commit**

Run: `npx vitest run src/widgets/algorithm && npm run typecheck && npm run lint`

```bash
npx prettier --write src/widgets/algorithm
git add src/widgets/algorithm
git commit -m "feat(algorithm): sheet for choosing a deck's learning algorithm"
```

---

### Task 11: Algorithm settings page

**Files:**
- Create: `src/pages/deck-algorithm/ui/DeckAlgorithmPage.tsx`
- Create: `src/pages/deck-algorithm/ui/DeckAlgorithmPage.test.tsx`
- Create: `src/pages/deck-algorithm/ui/DeckAdvancedPage.tsx`
- Create: `src/pages/deck-algorithm/index.ts`
- Modify: `src/shared/config/routes.ts`
- Modify: `src/app/router.tsx`
- Modify: `src/app/routes/deck-screens.tsx`

**Interfaces:**
- Consumes: `useDeck`, `editDeck`, `AlgorithmSheet`, `ALGORITHM_META`, `NumberRow` (defined here).
- Produces: `<DeckAlgorithmPage deckId onBack onOpenAdvanced />`, `<DeckAdvancedPage deckId onBack />`, routes `ROUTES.deckAlgorithm = '/decks/$deckId/settings/algorithm'` and `ROUTES.deckAlgorithmAdvanced = '/decks/$deckId/settings/algorithm/advanced'`.

- [ ] **Step 1: Write the failing test**

Create `src/pages/deck-algorithm/ui/DeckAlgorithmPage.test.tsx` following the shape of `src/pages/settings/ui/SettingsPage.test.tsx`: an `InMemoryRepository<Deck>` seeded with one deck, wrapped in `DeckStoreContext value={started(createDeckStore(repo))}` and `I18nextProvider`. Cases:

```ts
it('shows only shuffle under fast review', async () => {
  renderPage({ algorithm: 'fast' })
  expect(await screen.findByRole('switch', { name: 'Shuffle cards' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: /New cards per day/ })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Advanced settings' })).toBeNull()
})

it('shows the daily limits and advanced under spaced repetition', async () => {
  renderPage({ algorithm: 'spaced' })
  expect(await screen.findByRole('button', { name: /New cards per day/ })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Max cards per day/ })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Advanced settings' })).toBeTruthy()
})

it('saves a new algorithm to the deck', async () => {
  const { repo } = renderPage({ algorithm: 'fast' })
  await userEvent.click(await screen.findByRole('button', { name: /Fast review/ }))
  await userEvent.click(screen.getByRole('radio', { name: /General spaced repetition/ }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.algorithm).toBe('spaced'))
})

it('saves a new daily limit', async () => {
  const { repo } = renderPage({ algorithm: 'spaced' })
  await userEvent.click(await screen.findByRole('button', { name: /New cards per day/ }))
  const field = screen.getByLabelText('New cards per day')
  await userEvent.clear(field)
  await userEvent.type(field, '25')
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.newCardsPerDay).toBe(25))
})
```

Read `InMemoryRepository` first to use its real inspection API; if it exposes stored documents differently from `saved`, assert through that instead.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/pages/deck-algorithm`
Expected: FAIL — cannot resolve the page.

- [ ] **Step 3: Build the page**

`DeckAlgorithmPage.tsx`: `AppScreen` + `ScreenHeader title={t('algorithm.title')}`. Gate on `ready`/`deck` exactly as `DeckSettingsPage` does today. One `SettingsSection` holding:

- the preset row — a tinted `button` with the algorithm's icon, its short name and a chevron, opening `AlgorithmSheet`;
- under `fast`: the Shuffle cards toggle;
- under `spaced`: `NumberRow` for New cards per day, `NumberRow` for Max cards per day, then Shuffle cards.

`NumberRow` is a local component in the same file: a `SettingsRow kind="nav"` whose `value` is the number, opening a `PromptSheet` with `fieldLabel` equal to the row label and `initialValue` the current value; on submit it parses with `Number.parseInt(value, 10)`, ignores `NaN`, and calls the save.

Under the section, when `spaced`, a full-width `Button variant="secondary"` reading `algorithm.advanced` that calls `onOpenAdvanced`.

Saving is one helper, mirroring `DeckSettingsPage`:

```ts
const override = (patch: Partial<DeckSettings>) =>
  void editDeck(deckStore, deckId, { settings: { ...deck.settings, ...patch } })
```

`DeckAdvancedPage.tsx`: the same frame, one section of `NumberRow`s over `settings.advanced` (learning steps is a text row — comma-separated minutes parsed to `number[]`, invalid input ignored), an explanatory line reading `algorithm.advancedHint`, and a `Reset to defaults` action row writing `DEFAULT_SPACED_ADVANCED` and toasting `algorithm.resetDefaultsDone`.

- [ ] **Step 4: Wire the routes**

Add both paths to `ROUTES`. In `router.tsx`, add two `createRoute` entries beside `deckSettingsRoute` and register them in the route tree. In `deck-screens.tsx`:

```tsx
export function DeckAlgorithmScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  return (
    <DeckAlgorithmPage
      deckId={deckId}
      onBack={useBack(() => void navigate({ to: ROUTES.deckSettings, params: { deckId } }))}
      onOpenAdvanced={() => navigate({ to: ROUTES.deckAlgorithmAdvanced, params: { deckId } })}
    />
  )
}

export function DeckAdvancedScreen({ deckId }: { deckId: string }) {
  const navigate = useNavigate()
  return (
    <DeckAdvancedPage
      deckId={deckId}
      onBack={useBack(() => void navigate({ to: ROUTES.deckAlgorithm, params: { deckId } }))}
    />
  )
}
```

- [ ] **Step 5: Run and commit**

Run: `npx vitest run src/pages/deck-algorithm && npm run typecheck && npm run lint`

```bash
npx prettier --write src/pages/deck-algorithm src/shared/config/routes.ts src/app/router.tsx src/app/routes/deck-screens.tsx
git add src/pages/deck-algorithm src/shared/config src/app
git commit -m "feat(deck): algorithm settings and advanced settings pages"
```

---

### Task 12: Card style page

**Files:**
- Create: `src/pages/deck-card-style/ui/DeckCardStylePage.tsx`
- Create: `src/pages/deck-card-style/ui/DeckCardStylePage.test.tsx`
- Create: `src/pages/deck-card-style/ui/StylePreview.tsx`
- Create: `src/pages/deck-card-style/ui/PresetStrip.tsx`
- Create: `src/pages/deck-card-style/index.ts`
- Modify: `src/shared/config/routes.ts`, `src/app/router.tsx`, `src/app/routes/deck-screens.tsx`

**Interfaces:**
- Consumes: `resolveCardStyle`, `clampCardTextSize`, `CARD_STYLE_PRESETS`, `CARD_FONTS`, `CARD_ALIGNMENTS`, `DEFAULT_CARD_STYLE`, `useDeck`, `editDeck`, `SegmentedControl`, `ActionSheet`.
- Produces: `<DeckCardStylePage deckId onBack />`, `<StylePreview style front back />`, `<PresetStrip value onChange />`, route `ROUTES.deckCardStyle = '/decks/$deckId/settings/card-style'`.

- [ ] **Step 1: Write the failing test**

Create `DeckCardStylePage.test.tsx` in the shape of Task 11's test. Cases:

```ts
it('saves a preset', async () => {
  const { repo } = renderPage()
  await userEvent.click(await screen.findByRole('radio', { name: 'Notebook' }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.cardStyle?.preset).toBe('notebook'))
})

it('steps the text size and clamps at the top', async () => {
  const { repo } = renderPage({ cardStyle: { ...DEFAULT_CARD_STYLE, textSize: 39 } })
  await userEvent.click(await screen.findByRole('button', { name: 'Larger text' }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.cardStyle?.textSize).toBe(40))
  await userEvent.click(screen.getByRole('button', { name: 'Larger text' }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.cardStyle?.textSize).toBe(40))
})

it('saves an alignment', async () => {
  const { repo } = renderPage()
  await userEvent.click(await screen.findByRole('radio', { name: 'Align left' }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.cardStyle?.alignment).toBe('left'))
})

it('resets the style', async () => {
  const { repo } = renderPage({ cardStyle: { preset: 'chalk', font: 'mono', textSize: 18, alignment: 'right' } })
  await userEvent.click(await screen.findByRole('button', { name: 'Reset card style' }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.cardStyle).toEqual(DEFAULT_CARD_STYLE))
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/pages/deck-card-style`
Expected: FAIL — cannot resolve the page.

- [ ] **Step 3: Build the pieces**

`StylePreview.tsx` — a card that spreads `resolveCardStyle(style)` onto `style={...}` and paints itself from the variables:

```tsx
const vars = resolveCardStyle(style)
const text =
  '[color:var(--card-style-ink)] [font-family:var(--card-style-font)] ' +
  '[font-size:var(--card-style-size)] [text-align:var(--card-style-align)] leading-snug'

return (
  <div
    style={vars}
    className="rounded-card-featured p-6 [background:var(--card-style-bg)] [border:var(--card-style-border)]"
  >
    <p className={text}>{front}</p>
    <hr className="my-4 border-0 border-t [border-color:var(--card-style-ink)] opacity-20" />
    <p className={text}>{back}</p>
  </div>
)
```

`PresetStrip.tsx` — a horizontally scrolling `role="radiogroup"` (`overflow-x-auto` with `snap-x`), one `role="radio"` per preset rendering a miniature `StylePreview` with "Aa"/"Bb", `aria-label` from `cardStyle.preset.<id>`, ringed when selected.

`DeckCardStylePage.tsx` — `AppScreen` with a `ScreenHeader` whose action slot holds a reset `IconButton` (`RotateCcw`, label `cardStyle.reset`) and a haptics `IconButton` (`Vibrate`) toggling `preferences.haptics` through `setPreferences`. Body: `StylePreview` pinned above a scrolling panel of `PRESETS` (the strip), then a `SettingsSection` with the Font nav row (opening an `ActionSheet` of `CARD_FONTS`, `selected` on the active one), the Text size stepper row (`−` / value / `+`, each step ±2 through `clampCardTextSize`), and the Alignment `SegmentedControl` with the three `AlignLeft`/`AlignCenter`/`AlignRight` icons and `ariaLabel` from `cardStyle.alignLeft|alignCenter|alignRight`.

Every change writes immediately through the same `override` helper as Task 11 — there is no save button.

- [ ] **Step 4: Wire the route**

`ROUTES.deckCardStyle`, a `createRoute` entry, and a `DeckCardStyleScreen` in `deck-screens.tsx` returning to `ROUTES.deckSettings`.

- [ ] **Step 5: Run and commit**

Run: `npx vitest run src/pages/deck-card-style && npm run typecheck && npm run lint`

```bash
npx prettier --write src/pages/deck-card-style src/shared/config/routes.ts src/app/router.tsx src/app/routes/deck-screens.tsx
git add src/pages/deck-card-style src/shared/config src/app
git commit -m "feat(deck): card style page with live preview"
```

---

### Task 13: Text-to-speech page

**Files:**
- Create: `src/pages/deck-tts/ui/DeckTtsPage.tsx`
- Create: `src/pages/deck-tts/ui/DeckTtsPage.test.tsx`
- Create: `src/pages/deck-tts/index.ts`
- Modify: `src/shared/config/routes.ts`, `src/app/router.tsx`, `src/app/routes/deck-screens.tsx`

**Interfaces:**
- Consumes: `useDeck`, `editDeck`, `speak`, `speechAvailable` from `@/shared/lib`, `TTS_SIDES`.
- Produces: `<DeckTtsPage deckId onBack />`, route `ROUTES.deckTts = '/decks/$deckId/settings/tts'`.

- [ ] **Step 1: Write the failing test**

```ts
it('saves the master switch', async () => {
  const { repo } = renderPage({ textToSpeech: false })
  await userEvent.click(await screen.findByRole('switch', { name: 'Read cards aloud' }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.textToSpeech).toBe(true))
})

it('saves which side is read', async () => {
  const { repo } = renderPage({ textToSpeech: true })
  await userEvent.click(await screen.findByRole('radio', { name: 'Front only' }))
  await waitFor(() => expect(repo.saved.at(-1)?.settings.tts?.side).toBe('front'))
})

it('explains itself when the device has no voices', async () => {
  vi.spyOn(lib, 'speechAvailable').mockReturnValue(false)
  renderPage({ textToSpeech: true })
  expect(await screen.findByText('This device has no speech voices')).toBeTruthy()
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/pages/deck-tts`
Expected: FAIL — cannot resolve the page.

- [ ] **Step 3: Build it**

`AppScreen` + `ScreenHeader title={t('tts.title')}`. When `speechAvailable()` is false, render an `Empty` with `tts.unsupported` / `tts.unsupportedBody` and nothing else. Otherwise a `SettingsSection` with the `tts.enable` toggle bound to `settings.textToSpeech`; when it is on, a `SegmentedControl` row for `tts.side` over `TTS_SIDES`, a rate stepper row (0.5–2 in 0.25 steps, clamped in the page), and an action row `tts.test` calling `speak(t('tts.testPhrase'))`.

- [ ] **Step 4: Wire the route, run, commit**

Run: `npx vitest run src/pages/deck-tts && npm run typecheck && npm run lint`

```bash
npx prettier --write src/pages/deck-tts src/shared/config/routes.ts src/app/router.tsx src/app/routes/deck-screens.tsx
git add src/pages/deck-tts src/shared/config src/app
git commit -m "feat(deck): text-to-speech settings page"
```

---

### Task 14: Deck settings page rewrite

**Files:**
- Modify: `src/pages/deck-settings/ui/DeckSettingsPage.tsx`
- Create: `src/pages/deck-settings/ui/DeckSettingsPage.test.tsx`
- Modify: `src/app/routes/deck-screens.tsx`

**Interfaces:**
- Consumes: everything from Tasks 11–13; `moveDeck` and the existing transfer sheet used by the library's Move flow; `DeckAppearanceSheet` for Rename.
- Produces: `DeckSettingsPageProps` gains `onOpenAlgorithm`, `onOpenCardStyle`, `onOpenTts`, `onImportCards`.

- [ ] **Step 1: Write the failing test**

```ts
it('leads with the deck's algorithm', async () => {
  renderPage({ algorithm: 'fast' })
  const row = await screen.findByRole('button', { name: /Fast review/ })
  expect(within(row).getByText('Algorithm preset')).toBeTruthy()
})

it('offers the three settings groups and nothing excluded', async () => {
  renderPage()
  expect(await screen.findByRole('button', { name: /Card style/ })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Text-to-speech/ })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Import cards/ })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Rename deck/ })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Move deck/ })).toBeTruthy()
  for (const gone of ['AI cards generation', 'Publish in library', 'Sharing settings', 'Report deck', 'Offline learning']) {
    expect(screen.queryByText(gone)).toBeNull()
  }
})

it('navigates to each sub-page', async () => {
  const onOpenAlgorithm = vi.fn()
  renderPage({}, { onOpenAlgorithm })
  await userEvent.click(await screen.findByRole('button', { name: /Fast review|Spaced repetition/ }))
  expect(onOpenAlgorithm).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/pages/deck-settings`
Expected: FAIL — no `onOpenAlgorithm` prop.

- [ ] **Step 3: Rewrite the page**

Keep the loading gate, the export sheet, the reset confirm and the delete confirm exactly as they are. Replace the body with:

1. The algorithm row — same tall tinted button shape the appearance card uses today, but showing `ALGORITHM_META[settings.algorithm].icon`, the algorithm's short name as the title and `deckSettings.algorithmRow` beneath, calling `onOpenAlgorithm`.
2. `SettingsSection` — `Text-to-speech` (nav → `onOpenTts`) and `Card style` (nav → `onOpenCardStyle`).
3. `SettingsSection` — Import cards (nav → `onImportCards`), Rename deck (opens `DeckAppearanceSheet`), Move deck (opens the deck transfer sheet), Duplicate deck, Reset progress, Archive/Restore deck, Export deck.
4. `SettingsSection` — Delete deck, `tone="danger"`.

The appearance sheet stays as the Rename affordance; the standalone appearance card at the top is gone, so the deck cover is edited from that same sheet.

- [ ] **Step 4: Wire the new props in `deck-screens.tsx`**

```tsx
      onOpenAlgorithm={() => navigate({ to: ROUTES.deckAlgorithm, params: { deckId } })}
      onOpenCardStyle={() => navigate({ to: ROUTES.deckCardStyle, params: { deckId } })}
      onOpenTts={() => navigate({ to: ROUTES.deckTts, params: { deckId } })}
      onImportCards={() => navigate({ to: ROUTES.deckImport, params: { deckId } })}
```

- [ ] **Step 5: Run and commit**

Run: `npx vitest run src/pages/deck-settings && npm run typecheck && npm run lint`

```bash
npx prettier --write src/pages/deck-settings src/app/routes/deck-screens.tsx
git add src/pages/deck-settings src/app
git commit -m "feat(deck): rebuild deck settings around the learning algorithm"
```

---

### Task 15: Study session — fast review footer and progress header

**Files:**
- Create: `src/widgets/study-session/ui/FastReviewFooter.tsx`
- Create: `src/widgets/study-session/ui/FastReviewFooter.test.tsx`
- Modify: `src/widgets/study-session/ui/SessionFooter.tsx`
- Modify: `src/widgets/study-session/ui/FlashcardsPanel.tsx`
- Modify: `src/widgets/study-session/ui/FlashcardsPanel.test.tsx`
- Modify: `src/pages/study/ui/StudyCardsPage.tsx`

**Interfaces:**
- Consumes: `buildStudyQueue`, `SessionMode`, `Buckets`, `setCardFastReview`.
- Produces: `<FastReviewFooter flipped notQuite gotIt onAnswer />`; `FlashcardsPanelProps` gains `algorithm: LearningAlgorithm` and `onAnswer: (cardId: string, outcome: FastOutcome) => void`.

- [ ] **Step 1: Write the failing footer test**

```tsx
it('shows both tallies and both buttons', () => {
  render(<FastReviewFooter flipped notQuite={3} gotIt={7} onAnswer={() => {}} />)
  expect(screen.getByText('3')).toBeTruthy()
  expect(screen.getByText('7')).toBeTruthy()
})

it('reports each outcome', async () => {
  const onAnswer = vi.fn()
  render(<FastReviewFooter flipped notQuite={0} gotIt={0} onAnswer={onAnswer} />)
  await userEvent.click(screen.getByRole('button', { name: 'Not quite' }))
  expect(onAnswer).toHaveBeenCalledWith('notQuite')
  await userEvent.click(screen.getByRole('button', { name: 'Got it' }))
  expect(onAnswer).toHaveBeenCalledWith('gotIt')
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/widgets/study-session/ui/FastReviewFooter.test.tsx`
Expected: FAIL — cannot resolve the component.

- [ ] **Step 3: Build the footer**

A row of four cells: the `notQuite` tally, a `Not quite` button on `--warning-surface`/`--warning-foreground`, a `Got it` button on `--success-surface`/`--success-on-surface`, then the `gotIt` tally — the tallies in the matching foreground colours, `tabular-nums`. Same shell classes as `SessionFooter`'s container so the two footers sit identically, and the same `AnimatePresence` crossfade between unflipped and flipped states.

- [ ] **Step 4: Choose the footer by algorithm**

In `SessionFooter.tsx` accept `mode: SessionMode`, `buckets: Buckets` and `onAnswer`, and render `FastReviewFooter` instead of `GradeButtons` when `mode === 'fast'`. In `FlashcardsPanel.tsx`:

- take `algorithm` and `onAnswer` as props;
- build the queue with `buildStudyQueue(cardEntities, { now, algorithm, shuffle: prefs.shuffle, newCardsPerDay, maxCardsPerDay })` — pass the two limits down from the page as part of `StudyPrefs`;
- `initSession({ ids, mode: algorithm === 'fast' ? 'fast' : 'spaced' })`;
- add `applyAnswer(outcome)` mirroring `applyGrade`: push an undo entry, call `onAnswer(id, outcome)`, dispatch `{ type: 'answer', outcome }`;
- pass `mode`, `state.buckets` and `applyAnswer` to `SessionFooter`;
- under fast review hide the grade-only affordances in `GearSheet` that speak of scheduling (the study filter's `due` option), since nothing is scheduled.

In `StudyCardsPage.tsx`, widen `studyPrefsFromSettings` to carry `newCardsPerDay` and `maxCardsPerDay`, pass `algorithm={settings.algorithm}`, and add:

```ts
  const handleAnswer = (id: string, outcome: FastOutcome) => {
    void setCardFastReview(cardStore, id, outcome)
  }
```

- [ ] **Step 5: Give the session header its progress**

The reference shows `✕ · <done>/<total> · ⋮` over a thin bar, under both algorithms. In
`src/shared/ui/SessionScreen.tsx`, `SessionHeader` gains two optional props:

```ts
  progress?: { done: number; total: number }
  action?: ReactNode
```

When `progress` is given, the title/subtitle block is replaced by a centred pill —
`rounded-pill bg-info-surface px-3 py-1 text-(length:--p-text-label) tabular-nums`, the done half in
`text-heading` and `/total` in `text-muted-foreground` — and a 2px track is rendered under the
header with a `--success-foreground` fill at `width: {done/total * 100}%`, transitioning over
`0.3s` unless `useReducedMotion()` says otherwise. `action` renders at the trailing edge; the study
page puts the existing gear affordance there.

Add to `SessionScreen`'s test file: a header with `progress={{ done: 3, total: 10 }}` shows `3` and
`/10`, and the fill reports `width: 30%`.

In `StudyCardsPage.tsx`, pass `progress={{ done: graded, total }}` — `FlashcardsPanel` already owns
those numbers, so lift them out through a new optional `onProgress?: (done: number, total: number)
=> void` callback fired from an effect on `state.graded`.

- [ ] **Step 6: Add a panel test**

Append to `FlashcardsPanel.test.tsx`: rendering with `algorithm="fast"` shows `Not quite`/`Got it` and no `Again`; with `algorithm="spaced"` shows `Again` and no `Not quite`.

- [ ] **Step 7: Run and commit**

Run: `npx vitest run src/widgets/study-session src/pages/study src/shared/ui && npm run typecheck && npm run lint`

```bash
npx prettier --write src/widgets/study-session src/pages/study src/shared/ui/SessionScreen.tsx
git add src/widgets/study-session src/pages/study src/shared/ui
git commit -m "feat(study): fast-review footer, progress header and per-algorithm queues"
```

---

### Task 16: Study cards wear the deck's style

**Files:**
- Modify: `src/widgets/study-session/ui/faces/CardFace.tsx`
- Modify: `src/widgets/study-session/ui/faces/CardFace.test.tsx`
- Modify: `src/widgets/study-session/model/types.ts`
- Modify: `src/widgets/study-session/ui/FlashcardsPanel.tsx`
- Modify: `src/pages/study/ui/StudyCardsPage.tsx`

**Interfaces:**
- Consumes: `resolveCardStyle`, `CardStyle`.
- Produces: `StudyPrefs` gains `cardStyle: CardStyle`; `CardFace` applies the resolved variables to its shell.

- [ ] **Step 1: Write the failing test**

```tsx
it('wears the deck's card style', () => {
  renderFace({ cardStyle: { preset: 'paper', font: 'serif', textSize: 22, alignment: 'left' } })
  const shell = screen.getByTestId('card-face')
  expect(shell.style.getPropertyValue('--card-style-size')).toBe('22px')
  expect(shell.style.getPropertyValue('--card-style-align')).toBe('left')
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/widgets/study-session/ui/faces/CardFace.test.tsx`
Expected: FAIL — no such custom property.

- [ ] **Step 3: Apply the style**

Thread `cardStyle` from the deck's settings through `StudyPrefs` → `FlashcardsPanel` → `FaceProps`. In `CardFace`, put `style={resolveCardStyle(cardStyle)}` and `data-testid="card-face"` on the outer shell, swap the shell's `bg-card-glass` for `[background:var(--card-style-bg)]` plus `[border:var(--card-style-border)]`, and give the body text `[color:var(--card-style-ink)] [font-family:var(--card-style-font)] [font-size:var(--card-style-size)] [text-align:var(--card-style-align)]`.

Chrome — the flag, the read-aloud button, the gear — keeps its own tokens. Only the card's material and its text follow the style, so a dark preset never swallows a control.

- [ ] **Step 4: Run and commit**

Run: `npx vitest run src/widgets/study-session src/pages/study && npm run typecheck`

```bash
npx prettier --write src/widgets/study-session src/pages/study
git add src/widgets/study-session src/pages/study
git commit -m "feat(study): study cards wear the deck's card style"
```

---

### Task 17: Card rows and the card actions sheet

**Files:**
- Modify: `src/widgets/content-editor/ui/CardRow.tsx`
- Modify: `src/widgets/content-editor/ui/ContentRow.tsx`
- Create: `src/widgets/content-editor/ui/CardActionsSheet.tsx`
- Create: `src/widgets/content-editor/ui/CardActionsSheet.test.tsx`
- Create: `src/widgets/content-editor/ui/LearningHistorySheet.tsx`
- Modify: `src/widgets/content-editor/ui/DeckContentEditor.tsx`
- Modify: `src/widgets/content-editor/ui/content-rows.test.tsx`

**Interfaces:**
- Consumes: `toggleCardFrozen`, `toggleCardReversed`, the existing edit/move/duplicate/delete handlers, `ActionSheet` with `variant="filled"`.
- Produces: `<CardActionsSheet card open onOpenChange handlers />` where `handlers` is `{ onSelect, onEdit, onFreeze, onMove, onReverse, onDuplicate, onHistory, onDelete }`; `CardRowProps` gains `onFreeze`, `onReverse`, `onHistory`, and drops `onMarkKnown`/`onResetSrs` from the sheet (they stay on the swipe rows).

- [ ] **Step 1: Write the failing test**

```tsx
it('lists the eight actions in order', () => {
  renderSheet(card({ frozen: false, reversed: false }))
  expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
    'Select', 'Edit', 'Freeze', 'Move', 'Reverse', 'Duplicate', 'Learning history', 'Delete',
  ])
})

it('flips the labels for a frozen, reversed card', () => {
  renderSheet(card({ frozen: true, reversed: true }))
  expect(screen.getByRole('button', { name: 'Unfreeze' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Unreverse' })).toBeTruthy()
})

it('calls the handler and closes', async () => {
  const onFreeze = vi.fn()
  const onOpenChange = vi.fn()
  renderSheet(card(), { onFreeze, onOpenChange })
  await userEvent.click(screen.getByRole('button', { name: 'Freeze' }))
  expect(onFreeze).toHaveBeenCalled()
  expect(onOpenChange).toHaveBeenCalledWith(false)
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/widgets/content-editor/ui/CardActionsSheet.test.tsx`
Expected: FAIL — cannot resolve the sheet.

- [ ] **Step 3: Build the sheet and wire the row**

`CardActionsSheet.tsx` is an `ActionSheet variant="filled" hideTitle title={t('cardActions.title')}` whose `actions` array is built in the order above, with `destructive` on Delete and labels flipped by `card.frozen` / `card.reversed`.

`ContentRow.tsx` gains an optional `onOpenActions` prop; when given, the `FlyoutMenu` is replaced by an `IconButton` with `MoreVertical` that calls it, so cards open the sheet while questions keep the flyout.

`CardRow.tsx` renders the `Reversed` chip beside the SRS chip when `card.reversed`, a `Frozen` chip when `card.frozen`, and passes `onOpenActions`. Under fast review the SRS chip is hidden — `CardRow` takes an `algorithm` prop and renders `SrsStatusChip` only when it is `'spaced'`.

`LearningHistorySheet.tsx` is a `Sheet` titled `cardActions.historyTitle` whose only content is an `Empty` with `cardActions.historyEmpty` / `cardActions.historyEmptyBody`.

`DeckContentEditor.tsx` holds the open-sheet state, threads `algorithm` down from its caller, and wires Freeze and Reverse to the Task 7 commands with the matching toasts.

- [ ] **Step 4: Run and commit**

Run: `npx vitest run src/widgets/content-editor && npm run typecheck && npm run lint`

```bash
npx prettier --write src/widgets/content-editor
git add src/widgets/content-editor
git commit -m "feat(cards): card actions sheet with freeze, reverse and learning history"
```

---

### Task 18: Deck detail, both faces

**Files:**
- Modify: `src/pages/deck-detail/ui/DeckDetailPage.tsx`
- Create: `src/pages/deck-detail/ui/DeckDetailPage.test.tsx`
- Create: `src/pages/deck-detail/ui/AlgorithmLine.tsx`
- Modify: `src/shared/ui/StudyOverviewCard.tsx`
- Modify: `src/shared/ui/StudyOverviewCard.test.tsx`
- Modify: `src/shared/lib/study-overview.ts`
- Modify: `src/shared/lib/study-overview.test.ts`

**Interfaces:**
- Consumes: `buildStudyQueue`, `ALGORITHM_META`, `AlgorithmSheet`.
- Produces: `fastOverview(cards, maxCardsPerDay): { count: number; breakdown: { notStudied: number; notQuite: number; gotIt: number } }`; `StudyOverviewCardProps` gains `variant: 'fast' | 'spaced'` and takes its three labelled stats from that variant.

- [ ] **Step 1: Write the failing tests**

In `study-overview.test.ts`:

```ts
describe('fastOverview', () => {
  it('counts the three buckets', () => {
    const cards = [{}, { fastReview: 'notQuite' as const }, { fastReview: 'gotIt' as const }]
    expect(fastOverview(cards, 3000).breakdown).toEqual({ notStudied: 1, notQuite: 1, gotIt: 1 })
  })

  it('offers no more than the daily maximum', () => {
    const cards = Array.from({ length: 10 }, () => ({}))
    expect(fastOverview(cards, 4).count).toBe(4)
  })

  it('never counts a frozen card', () => {
    expect(fastOverview([{ frozen: true }, {}], 3000).count).toBe(1)
  })
})
```

In `DeckDetailPage.test.tsx`: a fast deck shows `Not studied` / `Not quite` / `Got it` and `cards to study`, and renders no maturity bar; a spaced deck shows `Not studied` / `Learning` / `Mastered` and `cards for today`, and renders the bar.

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/shared/lib/study-overview.test.ts src/pages/deck-detail`
Expected: FAIL — `fastOverview` is not exported.

- [ ] **Step 3: Implement**

`fastOverview` in `study-overview.ts` takes `ReadonlyArray<{ frozen?: boolean; fastReview?: 'notQuite' | 'gotIt' }>` and the cap, filters frozen cards, tallies the three buckets, and returns `count = Math.min(live.length, maxCardsPerDay)`.

`StudyOverviewCard` takes `variant` and a `stats: Array<{ key: string; label: string; value: number; tone: 'neutral' | 'warning' | 'success' | 'info' }>` instead of the fixed `breakdown`, so the two faces share one card. Keep the caught-up state for `spaced`; under `fast` a deck is never caught up, so that branch is skipped.

`AlgorithmLine.tsx` renders `{t('algorithm.deckLine')} <button>{name}</button> ⓘ` under the deck title, opening a `Sheet` with the algorithm's description and a "Change" action that opens `AlgorithmSheet`.

`DeckDetailPage` reads `settings.algorithm`, picks the overview, and passes `algorithm` to `DeckContentEditor`. The maturity bar under "Cards in deck (N)" renders only under `spaced`.

- [ ] **Step 4: Run and commit**

Run: `npx vitest run src/pages/deck-detail src/shared && npm run typecheck && npm run lint`

```bash
npx prettier --write src/pages/deck-detail src/shared/ui/StudyOverviewCard.tsx src/shared/lib/study-overview.ts
git add src/pages/deck-detail src/shared
git commit -m "feat(deck): deck detail speaks the deck's algorithm"
```

---

### Task 19: Documentation and the honest status list

**Files:**
- Create: `docs/DECK_SETTINGS_UI_STATUS.md`
- Modify: `docs/UBIQUITOUS_LANGUAGE.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: every task above.
- Produces: the status doc the user asked for.

- [ ] **Step 1: Write the status doc**

`docs/DECK_SETTINGS_UI_STATUS.md`: one table per surface (Deck settings, Algorithm settings, Advanced settings, Card style, Text-to-speech, Card actions sheet, Deck detail, Study session), each row a control, each marked **Works**, **UI only** or **Invented (no reference)**, with a "what phase 2 owes it" sentence for anything not **Works**. At minimum these are not **Works**:

- Advanced settings, every field — **Invented**, stored but never read by `schedule()`.
- Text-to-speech page — **Invented** (no reference screenshot); the master switch and side are honoured, the rate is stored only.
- Learning history — **UI only**; there is no review log to draw.
- Fast review buckets — **Works**, but they are the only scheduling state the phase persists; the intervals behind Spaced repetition are unchanged.

- [ ] **Step 2: Extend the glossary**

Add to `docs/UBIQUITOUS_LANGUAGE.md`: **Learning algorithm**, **Fast review**, **Spaced repetition**, **Frozen**, **Reversed**, **Not quite**, **Got it**, and confirm **Mastered** as the learner-facing word for SRS `known` — the existing `known` vs Memorized entry stands.

- [ ] **Step 3: Point CLAUDE.md at the new ground**

Under "Read before you touch", add: *Deck settings, algorithms, card styles → `docs/DECK_SETTINGS_UI_STATUS.md` for what is real, then the design spec.*

- [ ] **Step 4: Full verification**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: all three pass. Then `npm run build` to confirm the bundle still builds.

- [ ] **Step 5: Commit**

```bash
npx prettier --write docs/DECK_SETTINGS_UI_STATUS.md docs/UBIQUITOUS_LANGUAGE.md CLAUDE.md
git add docs CLAUDE.md
git commit -m "docs: what the new deck settings actually do"
```

---

## Notes for the executor

- **Read `docs/CODE_STYLE.md` before the first UI task**, and §11 before touching anything that scrolls, focuses or sits near the bottom of the screen. The card style page and both sheets are scroll containers.
- **`docs/adr/0001`** governs the preset strip if you make it draggable. Don't — it is a radio group, not a sortable list.
- **Never restore staged deletions.** If something in the index looks wrong, say so and stop.
- Task 5 and Task 6 both touch `features/review/index.ts`; Tasks 11–13 all touch `routes.ts`, `router.tsx` and `deck-screens.tsx`. Run them in order rather than in parallel.
