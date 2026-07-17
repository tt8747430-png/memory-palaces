import { describe, it, expect, vi } from 'vitest'
import { Observable } from './observable'

describe('Observable', () => {
  it('exposes its initial value', () => {
    expect(new Observable(1).get()).toBe(1)
  })

  it('notifies subscribers when the value changes', () => {
    const o = new Observable(1)
    const listener = vi.fn()
    o.subscribe(listener)
    o.set(2)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(o.get()).toBe(2)
  })

  it('does not notify when the value is unchanged', () => {
    const o = new Observable(1)
    const listener = vi.fn()
    o.subscribe(listener)
    o.set(1)
    expect(listener).not.toHaveBeenCalled()
  })

  it('stops notifying after unsubscribe', () => {
    const o = new Observable(1)
    const listener = vi.fn()
    const off = o.subscribe(listener)
    off()
    o.set(2)
    expect(listener).not.toHaveBeenCalled()
  })

  it('survives a listener unsubscribing during notification', () => {
    const o = new Observable(1)
    const calls: string[] = []
    const offA = o.subscribe(() => {
      calls.push('a')
      offA()
    })
    o.subscribe(() => calls.push('b'))
    o.set(2)
    expect(calls).toEqual(['a', 'b'])
  })

  it('exposes a readonly view with stable references', () => {
    const o = new Observable(1)
    const ro = o.asReadonly()
    expect(ro.get).toBe(o.asReadonly().get)
    o.set(5)
    expect(ro.get()).toBe(5)
  })
})
