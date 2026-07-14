import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import {
  createSessionStore,
  makeAccountSession,
  type Session,
  SessionStoreContext,
} from '@/entities/session'
import { WelcomePage } from './WelcomePage'

afterEach(cleanup)

async function renderWelcome() {
  const store = createSessionStore(new InMemoryRepository<Session>())
  await store
    .getState()
    .set(makeAccountSession('id-1', { email: 'ada@b.com', name: 'Ada' }, '2026-01-01'))
  const onContinue = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <SessionStoreContext value={store}>
        <WelcomePage onContinue={onContinue} />
      </SessionStoreContext>
    </I18nextProvider>,
  )
  return { onContinue }
}

describe('WelcomePage', () => {
  it('greets the new member by name', async () => {
    await renderWelcome()
    expect(screen.getByRole('heading', { name: /welcome, ada/i })).toBeInTheDocument()
  })

  it('continues into the app', async () => {
    const user = userEvent.setup()
    const { onContinue } = await renderWelcome()
    await user.click(screen.getByRole('button', { name: /enter mindscape/i }))
    expect(onContinue).toHaveBeenCalled()
  })
})
