import { describe, expect, it } from 'vitest'
import { recentPassages } from './recents'

const card = (front: string, createdAt: string) => ({ front, createdAt })

describe('recentPassages', () => {
  it('lists the chapters of the newest verse cards first, once each', () => {
    expect(
      recentPassages([
        card('Ioan 3:16', 't1'),
        card('Coloseni 1:1', 't3'),
        card('Ioan 3:17', 't2'),
        card('1 Împărați 14:1', 't4'),
      ]),
    ).toEqual([
      { book: '1KI', chapter: 14 },
      { book: 'COL', chapter: 1 },
      { book: 'JHN', chapter: 3 },
    ])
  })

  it('ignores cards that are not references', () => {
    expect(recentPassages([card('Zeus', 't9'), card('Ioan 3:16', 't1')])).toEqual([
      { book: 'JHN', chapter: 3 },
    ])
  })

  it('stops at the limit', () => {
    const cards = Array.from({ length: 10 }, (_, index) =>
      card(`Psalmii ${index + 1}:1`, `t${index}`),
    )
    expect(recentPassages(cards, 2)).toEqual([
      { book: 'PSA', chapter: 10 },
      { book: 'PSA', chapter: 9 },
    ])
  })
})
