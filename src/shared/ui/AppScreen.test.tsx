import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AppScreen } from './AppScreen'

afterEach(cleanup)

describe('AppScreen', () => {
  it('scrolls its content when no pinned header is given', () => {
    let scrollNode: HTMLElement | null = null
    render(
      <AppScreen scrollRef={(node) => (scrollNode = node)}>
        <div data-testid="content">C</div>
      </AppScreen>,
    )
    expect(scrollNode).not.toBeNull()
    expect(scrollNode).toContainElement(screen.getByTestId('content'))
  })

  describe('with a pinned header', () => {
    function renderWithHeader() {
      let scrollNode: HTMLElement | null = null
      render(
        <AppScreen
          header={<div data-testid="header">H</div>}
          scrollRef={(node) => (scrollNode = node)}
        >
          <div data-testid="content">C</div>
        </AppScreen>,
      )
      return { scrollNode: scrollNode as unknown as HTMLElement }
    }

    it('renders the header outside the scroll container so scrolling never moves it', () => {
      const { scrollNode } = renderWithHeader()
      expect(scrollNode).not.toContainElement(screen.getByTestId('header'))
    })

    it('keeps the content inside the scroll container', () => {
      const { scrollNode } = renderWithHeader()
      expect(scrollNode).toContainElement(screen.getByTestId('content'))
    })
  })
})
