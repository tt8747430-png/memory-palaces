import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
  type VirtualItem,
} from '@tanstack/react-virtual'
import { useScreenScroll } from '@/shared/lib'

/** Rows drawn past each edge of the view, so a fling lands on rows that already exist. */
const OVERSCAN = 6

export interface ListWindowOptions {
  /** Every row's id, in order. The id is the row's key, so a measured height follows its row. */
  ids: readonly string[]
  /** A row's height before it is measured, in px. Close is enough; every row is measured. */
  estimateSize: number
  /** The space between rows, in px. */
  gap: number
  /** A row that stays drawn wherever it is scrolled — the one under a finger mid-drag. */
  keep?: string | null
}

export interface ListWindow {
  /** The list's own box: give it `height` and `position: relative`. */
  listRef: (node: HTMLDivElement | null) => void
  /** The list's full height, as though every row were drawn. */
  height: number
  /** The rows to draw. */
  rows: VirtualItem[]
  /** Where a row sits inside the list's box, in px. */
  offsetOf: (row: VirtualItem) => number
  /** Hand every drawn row's element to this, with `data-index`, so its real height is used. */
  measure: (node: Element | null) => void
}

/**
 * The rows of a long list that are in view — plus a few either side — and nothing else. Opening a
 * deck used to mount every card, so the cost of opening grew with the deck; this makes it the cost
 * of a screenful.
 *
 * The scroll element is the screen's own (`ScreenScrollContext`), and the list rarely starts at its
 * top, so where it starts inside the scroll content is measured: on every render of the list, and
 * whenever the content resizes, since whatever sits above it (an overview, a sort bar) can change
 * height without the list re-rendering.
 */
export function useListWindow({
  ids,
  estimateSize,
  gap,
  keep = null,
}: ListWindowOptions): ListWindow {
  const scrollElement = useScreenScroll()
  const list = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  const measureMargin = useCallback(() => {
    const node = list.current
    if (!node || !scrollElement) return
    const next = Math.round(
      node.getBoundingClientRect().top -
        scrollElement.getBoundingClientRect().top +
        scrollElement.scrollTop,
    )
    setScrollMargin((prev) => (prev === next ? prev : next))
  }, [scrollElement])

  // Every render: anything above the list may have changed height with it.
  useLayoutEffect(measureMargin)

  useEffect(() => {
    if (!scrollElement) return
    const observer = new ResizeObserver(measureMargin)
    for (const child of scrollElement.children) observer.observe(child)
    return () => observer.disconnect()
  }, [scrollElement, measureMargin])

  const keepIndex = keep ? ids.indexOf(keep) : -1
  const rangeExtractor = useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range)
      if (keepIndex < 0 || indexes.includes(keepIndex)) return indexes
      return [...indexes, keepIndex].sort((a, b) => a - b)
    },
    [keepIndex],
  )

  const virtualizer = useVirtualizer({
    count: ids.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    getItemKey: (index) => ids[index] ?? index,
    gap,
    overscan: OVERSCAN,
    scrollMargin,
    rangeExtractor,
    // React batches the scroll-driven update on its own; a synchronous flush from inside a
    // layout effect only earns React 19's warning.
    useFlushSync: false,
  })

  const listRef = useCallback(
    (node: HTMLDivElement | null) => {
      list.current = node
      measureMargin()
    },
    [measureMargin],
  )

  return {
    listRef,
    height: virtualizer.getTotalSize(),
    rows: virtualizer.getVirtualItems(),
    offsetOf: (row) => row.start - scrollMargin,
    measure: virtualizer.measureElement,
  }
}
