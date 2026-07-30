import { describe, expect, it } from 'vitest'
import { sortContent } from './content-order'

interface Row {
  id: string
  title: string
  createdAt: string
  srs?: { due?: string }
  flagged?: boolean
}

const rows: Row[] = [
  { id: 'b', title: 'Banana', createdAt: '2026-01-02', srs: { due: '2026-03-01' } },
  { id: 'a', title: 'Apple', createdAt: '2026-01-03', flagged: true },
  { id: 'c', title: 'Cherry', createdAt: '2026-01-01', srs: { due: '2026-02-01' } },
]

const ids = (list: Row[]) => list.map((row) => row.id)
const sort = (by: Parameters<typeof sortContent<Row>>[1]) =>
  ids(sortContent(rows, by, (row) => row.title))

describe('sortContent', () => {
  it('sorts by the title the caller names', () => {
    expect(sort('name')).toEqual(['a', 'b', 'c'])
  })

  it('sorts newest first', () => {
    expect(sort('recent')).toEqual(['a', 'b', 'c'])
  })

  it('sorts by due date, unscheduled rows first', () => {
    expect(sort('due')).toEqual(['a', 'c', 'b'])
  })

  it('lifts flagged rows to the top', () => {
    expect(sort('flagged')).toEqual(['a', 'b', 'c'])
  })

  it('hands the list back untouched for manual order', () => {
    expect(sortContent(rows, 'manual', (row) => row.title)).toBe(rows)
  })

  it('leaves the original list alone when it does sort', () => {
    sortContent(rows, 'name', (row) => row.title)
    expect(ids(rows)).toEqual(['b', 'a', 'c'])
  })
})
