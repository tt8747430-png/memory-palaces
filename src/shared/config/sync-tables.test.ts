import { describe, expect, it } from 'vitest'
import {
  activeSyncTables,
  CORE_HELD_TABLES,
  CORE_QUIET_TABLES,
  CORE_SYNC_TABLES,
  type SyncTableSpec,
} from './sync-tables'

const contributed = (table: string, cadence: SyncTableSpec['cadence']): SyncTableSpec => ({
  table,
  collectionKey: table,
  owner: 'bible',
  cadence,
})

const on = () => true
const off = () => false

describe('sync cadences', () => {
  it('holds the work a learner would name, and lets the furniture go quietly', () => {
    expect(CORE_HELD_TABLES).toEqual([
      'decks',
      'cards',
      'folders',
      'questions',
      'progress',
      'history',
    ])
    expect(CORE_QUIET_TABLES).toEqual(['preferences', 'profiles'])
  })

  it('leaves no core table in neither cadence', () => {
    expect([...CORE_HELD_TABLES, ...CORE_QUIET_TABLES].sort()).toEqual(
      CORE_SYNC_TABLES.map((spec) => spec.table).sort(),
    )
  })

  it('narrows to one cadence, and to the extensions that are on', () => {
    const specs = [...CORE_SYNC_TABLES, contributed('bible_verses', 'held')]

    expect(activeSyncTables(specs, on, 'held')).toContain('bible_verses')
    expect(activeSyncTables(specs, off, 'held')).not.toContain('bible_verses')
    expect(activeSyncTables(specs, on, 'quiet')).toEqual(CORE_QUIET_TABLES)
  })

  it('carries a contributed quiet table with the quiet ones', () => {
    const specs = [...CORE_SYNC_TABLES, contributed('bible_prefs', 'quiet')]

    expect(activeSyncTables(specs, on, 'quiet')).toEqual([...CORE_QUIET_TABLES, 'bible_prefs'])
    expect(activeSyncTables(specs, on, 'held')).toEqual(CORE_HELD_TABLES)
  })

  it('still answers with every live table when no cadence is named', () => {
    const specs = [...CORE_SYNC_TABLES, contributed('bible_verses', 'held')]

    expect(activeSyncTables(specs, on)).toEqual([
      ...CORE_SYNC_TABLES.map((spec) => spec.table),
      'bible_verses',
    ])
  })
})
