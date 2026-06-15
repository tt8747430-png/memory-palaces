import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, PalaceStoreContext, type Palace } from '@/entities/palace'
import { PalacesPage } from './PalacesPage'

afterEach(cleanup)

function renderPage() {
  const repo = new InMemoryRepository<Palace>()
  const store = createPalaceStore(repo)
  render(
    <I18nextProvider i18n={i18n}>
      <PalaceStoreContext value={store}>
        <PalacesPage />
      </PalaceStoreContext>
    </I18nextProvider>,
  )
  return { repo }
}

async function createPalaceViaUi(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(screen.getByRole('textbox', { name: /new palace name/i }), name)
  await user.click(screen.getByRole('button', { name: /^create$/i }))
}

describe('PalacesPage — offline CRUD', () => {
  it('creates a palace, persisting it through the repository', async () => {
    const user = userEvent.setup()
    const { repo } = renderPage()

    await createPalaceViaUi(user, 'Roman Forum')

    expect(await screen.findByText('Roman Forum')).toBeInTheDocument()
    expect(await repo.getAll()).toHaveLength(1)
  })

  it('duplicates, renames, and deletes — each change persisted', async () => {
    const user = userEvent.setup()
    const { repo } = renderPage()
    await createPalaceViaUi(user, 'Original')
    await screen.findByText('Original')

    await user.click(screen.getByRole('button', { name: /duplicate original/i }))
    expect(await screen.findByText('Original (copy)')).toBeInTheDocument()
    expect(await repo.getAll()).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /^rename original$/i }))
    const renameInput = screen.getByRole('textbox', { name: /rename original/i })
    await user.clear(renameInput)
    await user.type(renameInput, 'Renamed')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Renamed')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete original \(copy\)/i }))
    await waitFor(() => expect(screen.queryByText('Original (copy)')).not.toBeInTheDocument())
    expect(await repo.getAll()).toHaveLength(1)
  })
})
