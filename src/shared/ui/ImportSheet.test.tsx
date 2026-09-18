import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { i18n } from '@/shared/i18n'
import { ImportSheet } from './ImportSheet'

i18n.addResourceBundle('en', 'fake', { label: 'Bible', sub: 'Pick a passage' }, true, false)

afterEach(cleanup)

const OPTIONS = '[data-slot="transfer-options"]'

function renderSheet(extraOptions: Parameters<typeof ImportSheet>[0]['extraOptions'] = []) {
  const onSelect = vi.fn()
  renderWithProviders(
    <ImportSheet
      open
      onOpenChange={vi.fn()}
      title="Add cards"
      description="Bring cards in"
      onPasteNotes={vi.fn()}
      onPickFile={vi.fn()}
      extraOptions={extraOptions}
      onSelectExtra={onSelect}
    />,
  )
  return onSelect
}

const bibleRow = {
  id: 'bible',
  icon: null,
  titleKey: 'fake:label',
  subtitleKey: 'fake:sub',
  to: '/import/bible',
}

const rows = () => screen.getAllByRole('button').filter((button) => button.closest(OPTIONS))

describe('ImportSheet', () => {
  it('offers paste and file when nothing is contributed', () => {
    renderSheet()
    expect(rows()).toHaveLength(2)
  })

  it('appends a contributed row after the built-in ones, resolving its keys', () => {
    renderSheet([bibleRow])
    const found = rows()
    expect(found).toHaveLength(3)
    expect(found[2]).toHaveTextContent('Bible')
    expect(found[2]).toHaveTextContent('Pick a passage')
  })

  it('reports which contributed row was chosen', async () => {
    const user = userEvent.setup()
    const onSelect = renderSheet([bibleRow])
    await user.click(screen.getByText('Bible'))
    expect(onSelect).toHaveBeenCalledWith('/import/bible')
  })
})
