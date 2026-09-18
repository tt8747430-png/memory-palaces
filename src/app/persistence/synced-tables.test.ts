import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SYNCED_TABLES } from '@/shared/config/sync-tables'
import { loadExtensionCollections } from '../extensions/collections'
import { EXTENSIONS } from '../extensions/registry'

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations')

function latestAllowList(): string[] {
  const files = readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith('.sql'))
    .sort()
  for (const name of [...files].reverse()) {
    const sql = readFileSync(join(MIGRATIONS, name), 'utf8')
    const match = /if p_table not in \(([\s\S]*?)\) then/.exec(sql)
    if (match?.[1])
      return [...match[1].matchAll(/'([a-z_]+)'/g)].flatMap(([, table]) => (table ? [table] : []))
  }
  throw new Error('No push_documents allow-list found in supabase/migrations')
}

describe('the push_documents allow-list', () => {
  it('names every synced table, extensions included — one missing never syncs', async () => {
    const { syncTables } = await loadExtensionCollections(EXTENSIONS)
    const expected = [...SYNCED_TABLES, ...syncTables.map((spec) => spec.table)]
    expect([...latestAllowList()].sort()).toEqual([...expected].sort())
  })
})
