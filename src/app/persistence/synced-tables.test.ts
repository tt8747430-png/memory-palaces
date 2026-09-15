import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SYNCED_TABLES } from '@/shared/config/sync-tables'

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
  it('names every synced table — one missing is a collection that silently never syncs', () => {
    expect([...latestAllowList()].sort()).toEqual([...SYNCED_TABLES].sort())
  })
})
