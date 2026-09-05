import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useOneOpen } from './use-one-open'

type Sheet = 'move' | 'export' | 'import'

afterEach(cleanup)

describe('useOneOpen', () => {
  it('starts with nothing open', () => {
    const { result } = renderHook(() => useOneOpen<Sheet>())
    expect(result.current.current).toBeNull()
  })

  it('holds one member at a time', () => {
    const { result } = renderHook(() => useOneOpen<Sheet>())
    act(() => result.current.open('export'))
    act(() => result.current.open('move'))
    expect(result.current.current).toBe('move')
  })

  it('closes whatever is open when called bare', () => {
    const { result } = renderHook(() => useOneOpen<Sheet>())
    act(() => result.current.open('export'))
    act(() => result.current.close())
    expect(result.current.current).toBeNull()
  })

  it('lets a member close only itself', () => {
    const { result } = renderHook(() => useOneOpen<Sheet>())
    act(() => result.current.open('move'))
    act(() => result.current.close('export'))
    expect(result.current.current).toBe('move')
  })

  /**
   * The frame the guard exists for: the outgoing sheet's `onOpenChange(false)` lands after its
   * replacement has opened and before React has re-rendered, so a handler built from the old render
   * still has to lose.
   */
  it('ignores an outgoing member closing in the same frame as its replacement', () => {
    const { result } = renderHook(() => useOneOpen<Sheet>())
    act(() => result.current.open('export'))
    const closeExport = result.current.onOpenChange('export')
    act(() => {
      result.current.open('move')
      closeExport(false)
    })
    expect(result.current.current).toBe('move')
  })

  it('opens through onOpenChange only on close', () => {
    const { result } = renderHook(() => useOneOpen<Sheet>())
    act(() => result.current.open('import'))
    act(() => result.current.onOpenChange('import')(true))
    expect(result.current.current).toBe('import')
    act(() => result.current.onOpenChange('import')(false))
    expect(result.current.current).toBeNull()
  })

  it('takes the open member once and clears it', () => {
    const { result } = renderHook(() => useOneOpen<Sheet>())
    const taken: (Sheet | null)[] = []
    act(() => result.current.open('move'))
    act(() => {
      taken.push(result.current.take())
      taken.push(result.current.take())
    })
    expect(taken).toEqual(['move', null])
    expect(result.current.current).toBeNull()
  })
})
