import { describe, expect, it } from 'vitest'
import { summariseRefs } from './summarise-refs'

describe('summariseRefs', () => {
  it('names one verse plainly', () => {
    expect(summariseRefs(['Efeseni 3:6'])).toEqual({ text: 'Efeseni 3:6', more: 0 })
  })

  it('collapses consecutive verses into a run', () => {
    expect(summariseRefs(['Efeseni 3:6', 'Efeseni 3:7', 'Efeseni 3:8']).text).toBe('Efeseni 3:6–8')
  })

  it('starts another run at a gap, and states the book once', () => {
    expect(summariseRefs(['Efeseni 3:6', 'Efeseni 3:7', 'Efeseni 3:12']).text).toBe(
      'Efeseni 3:6–7, 3:12',
    )
  })

  it('states the book again for another chapter', () => {
    expect(summariseRefs(['Efeseni 3:6', 'Efeseni 4:1']).text).toBe('Efeseni 3:6, Efeseni 4:1')
  })

  it('sorts what arrives out of order', () => {
    expect(summariseRefs(['Efeseni 3:8', 'Efeseni 3:6', 'Efeseni 3:7']).text).toBe('Efeseni 3:6–8')
  })

  it('joins a range reference to the run it continues', () => {
    expect(summariseRefs(['Efeseni 3:6-8', 'Efeseni 3:9']).text).toBe('Efeseni 3:6–9')
  })

  it('caps the list and counts what it left out', () => {
    const fronts = ['Efeseni 3:1', 'Efeseni 3:3', 'Efeseni 3:5', 'Efeseni 3:7', 'Efeseni 3:9']
    expect(summariseRefs(fronts, 3)).toEqual({ text: 'Efeseni 3:1, 3:3, 3:5', more: 2 })
  })

  it('keeps a front that is not a reference, rather than dropping the card it names', () => {
    expect(summariseRefs(['Efeseni 3:6', 'My own card']).text).toBe('Efeseni 3:6, My own card')
  })

  it('has nothing to say about nothing', () => {
    expect(summariseRefs([])).toEqual({ text: '', more: 0 })
  })
})
