import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ScreenScrollContext } from '@/shared/lib'
import { useListWindow } from './use-list-window'

let scroller: HTMLElement

beforeEach(() => {
  // The screen's scroll element, as `AppScreen` publishes it.
  scroller = document.createElement('main')
  scroller.setAttribute('data-screen-scroll', '')
  document.body.append(scroller)
})

afterEach(() => {
  cleanup()
  scroller.remove()
})

const IDS = Array.from({ length: 300 }, (_, at) => `row-${at}`)

function Harness({ keep }: { keep?: string }) {
  const view = useListWindow({ ids: IDS, estimateSize: 100, gap: 12, keep })
  return (
    <div ref={view.listRef} style={{ height: view.height }}>
      {view.rows.map((row) => (
        <div key={row.key} ref={view.measure} data-index={row.index}>
          {IDS[row.index]}
        </div>
      ))}
    </div>
  )
}

function Screen({ keep }: { keep?: string }) {
  return (
    <ScreenScrollContext value={scroller}>
      <Harness keep={keep} />
    </ScreenScrollContext>
  )
}

describe('useListWindow', () => {
  it('draws the rows in view and a few past them', () => {
    render(<Screen />)
    expect(screen.getByText('row-0')).toBeInTheDocument()
    expect(screen.queryByText('row-299')).toBeNull()
  })

  it('keeps the row it is asked to keep drawn, however far out of view', () => {
    render(<Screen keep="row-250" />)
    expect(screen.getByText('row-250')).toBeInTheDocument()
    expect(screen.queryByText('row-200')).toBeNull()
  })

  it('draws nothing until there is a screen to measure against', () => {
    render(<Harness />)
    expect(screen.queryByText('row-0')).toBeNull()
  })
})
