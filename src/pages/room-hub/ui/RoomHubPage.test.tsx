import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, type Palace, PalaceStoreContext } from '@/entities/palace'
import { createRoomStore, makeRoom, type Room, RoomStoreContext } from '@/entities/room'
import { createLocusStore, type Locus, LocusStoreContext, makeLocus } from '@/entities/locus'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { RoomHubPage } from './RoomHubPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function renderHub({ loci = [] as Locus[] }: { loci?: Locus[] } = {}) {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: at(0), name: 'Forum' }),
  ])
  const roomRepo = new InMemoryRepository<Room>([
    makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'Garden Room', order: 0 }),
  ])
  const locusRepo = new InMemoryRepository<Locus>(loci)
  const questionRepo = new InMemoryRepository<Question>()
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PreferencesStoreContext
          value={createPreferencesStore(new InMemoryRepository<Preferences>())}
        >
          <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
            <RoomStoreContext value={createRoomStore(roomRepo)}>
              <LocusStoreContext value={createLocusStore(locusRepo)}>
                <QuestionStoreContext value={createQuestionStore(questionRepo)}>
                  <RoomHubPage
                    roomId="r1"
                    onBack={() => {}}
                    onStudy={() => {}}
                    onMatch={() => {}}
                    onTest={() => {}}
                    onAddCard={() => {}}
                    onEditCard={() => {}}
                    onAddQuestion={() => {}}
                    onEditQuestion={() => {}}
                  />
                </QuestionStoreContext>
              </LocusStoreContext>
            </RoomStoreContext>
          </PalaceStoreContext>
        </PreferencesStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
}

const card = (id: string, front: string, back: string, order: number) =>
  makeLocus({ id, createdAt: at(order + 1), roomId: 'r1', front, back, order })

describe('RoomHubPage', () => {
  it('leads with the room title, card count, preview, and study modes', async () => {
    renderHub({ loci: [card('l1', 'mihi', 'to me', 0), card('l2', 'tibi', 'to you', 1)] })

    expect(await screen.findByRole('heading', { name: 'Garden Room' })).toBeInTheDocument()
    // Both fresh cards are due today; the study overview leads with the count.
    expect(screen.getByText(/2 cards for today/i)).toBeInTheDocument()
    // The study overview owns the single Study action (the carousel is preview-only).
    expect(screen.getByRole('button', { name: /study cards/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^match/i })).toBeInTheDocument()
  })

  it('disables Test until the room has questions', async () => {
    renderHub({ loci: [card('l1', 'a', 'A', 0)] })
    await screen.findByRole('heading', { name: 'Garden Room' })
    expect(screen.getByRole('button', { name: /^test/i })).toBeDisabled()
  })

  it('shows the cards-and-questions editor inline (one scroll)', async () => {
    renderHub({ loci: [card('l1', 'a', 'A', 0)] })
    await screen.findByRole('heading', { name: 'Garden Room' })

    expect(screen.getByRole('heading', { name: /cards & questions/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cards · 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /questions · 0/i })).toBeInTheDocument()
  })

  it('teaches the empty room instead of showing a blank deck', async () => {
    renderHub()
    await screen.findByRole('heading', { name: 'Garden Room' })
    // The study overview/carousel hide for an empty room; the editor's empty state guides.
    expect(screen.getByText(/no cards yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /study cards/i })).not.toBeInTheDocument()
  })
})
