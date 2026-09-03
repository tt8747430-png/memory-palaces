import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useImportDraft } from './import-draft'
import { useImportFile } from './use-import-file'

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }))

vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }))

/** A `File` whose text is whatever the test wants parsed. */
const file = (text: string, name = 'deck.csv') =>
  ({ name, text: () => Promise.resolve(text) }) as unknown as File

afterEach(() => {
  toastError.mockReset()
  useImportDraft.getState().clear()
})

describe('useImportFile', () => {
  it('lands the parsed cards in the draft and then hands over', async () => {
    const onReady = vi.fn()
    const { result } = renderHook(() => useImportFile())

    await act(() => result.current(file('front,back\nQ1,A1\nQ2,A2'), onReady))

    const draft = useImportDraft.getState().draft
    expect(draft?.source).toBe('anki')
    expect(draft?.cards.map((card) => card.front)).toEqual(['Q1', 'Q2'])
    expect(onReady).toHaveBeenCalledOnce()
  })

  /** The review screen has nothing to show for an empty file, so it is never reached. */
  it('refuses a file with no cards out loud, and leaves the draft alone', async () => {
    const onReady = vi.fn()
    const { result } = renderHook(() => useImportFile())

    await act(() => result.current(file(''), onReady))

    expect(useImportDraft.getState().draft).toBeNull()
    expect(onReady).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalled()
  })

  it('reports an unreadable file rather than throwing at the caller', async () => {
    const onReady = vi.fn()
    const unreadable = {
      name: 'deck.apkg',
      text: () => Promise.resolve(''),
    } as unknown as File
    const { result } = renderHook(() => useImportFile())

    await act(() => result.current(unreadable, onReady))

    expect(onReady).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalled()
  })
})
