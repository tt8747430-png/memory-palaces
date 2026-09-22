import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookMarked } from 'lucide-react'
import { ExtensionPointsContext } from '@/shared/lib'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { LibrarySelectBar, type LibrarySelectBarProps } from './LibrarySelectBar'

afterEach(cleanup)

const baseProps = (over: Partial<LibrarySelectBarProps> = {}): LibrarySelectBarProps => ({
  scopeName: null,
  sort: 'manual',
  onSortChange: vi.fn(),
  filter: 'all',
  onFilterChange: vi.fn(),
  allSubdecks: true,
  onAllSubdecksChange: vi.fn(),
  shown: 3,
  hidden: 0,
  ...over,
})

const render = (props: LibrarySelectBarProps, filters: unknown[] = []) =>
  renderWithProviders(
    <ExtensionPointsContext value={{ deckFilters: filters as never }}>
      <LibrarySelectBar {...props} />
    </ExtensionPointsContext>,
  )

describe('LibrarySelectBar', () => {
  it('says how many rows the filter is keeping back, and nothing while it keeps none back', () => {
    const { unmount } = render(baseProps({ shown: 2, hidden: 6 }))
    expect(screen.getByRole('status')).toHaveTextContent('2 of 8 shown')
    unmount()

    render(baseProps())
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('says so when the filter keeps nothing at all, rather than showing a bare count', () => {
    render(baseProps({ shown: 0, hidden: 8 }))
    expect(
      screen.getByText('No deck matches that. Change what is shown to see the rest.'),
    ).toBeInTheDocument()
  })

  it('shows no such notice for a Library that is simply empty — the filter is keeping nothing back', () => {
    render(baseProps({ shown: 0, hidden: 0 }))
    expect(screen.queryByText(/No deck matches that/)).toBeNull()
  })

  it('offers the contributed filters under the app’s own', async () => {
    const user = userEvent.setup()
    const props = baseProps()
    render(props, [
      {
        id: 'bible:law',
        labelKey: 'library.select.decks',
        icon: <BookMarked aria-hidden />,
        keep: () => true,
      },
    ])
    await user.click(screen.getByRole('button', { name: 'Show' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Decks' }))
    expect(props.onFilterChange).toHaveBeenCalledWith('bible:law')
  })

  it('turns the Library order on every subdeck off and on from one switch', async () => {
    const user = userEvent.setup()
    const props = baseProps({ allSubdecks: true })
    render(props)
    const chip = screen.getByRole('switch', { name: 'All subdecks' })
    expect(chip).toBeChecked()
    await user.click(chip)
    expect(props.onAllSubdecksChange).toHaveBeenCalledWith(false)
  })

  it('names the deck whose subdecks are being arranged, while one is', () => {
    const { unmount } = render(baseProps({ scopeName: 'Geneza' }))
    expect(screen.getByText('Subdecks of Geneza')).toBeInTheDocument()
    unmount()

    render(baseProps())
    expect(screen.queryByText(/Subdecks of/)).toBeNull()
  })
})
