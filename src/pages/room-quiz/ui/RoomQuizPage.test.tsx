import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, type Palace, PalaceStoreContext } from '@/entities/palace'
import { createRoomStore, makeRoom, type Room, RoomStoreContext } from '@/entities/room'
import {
  createQuestionStore,
  makeQuestion,
  type Question,
  QuestionStoreContext,
} from '@/entities/question'
import { RoomQuizPage } from './RoomQuizPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function renderRoomQuiz(roomId = 'r1') {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: at(0), name: 'Forum' }),
  ])
  const roomRepo = new InMemoryRepository<Room>([
    makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'Geography', order: 0 }),
    makeRoom({ id: 'r2', createdAt: at(0), palaceId: 'p1', title: 'History', order: 1 }),
  ])
  const questionRepo = new InMemoryRepository<Question>([
    makeQuestion({
      id: 'q1',
      createdAt: at(1),
      roomId: 'r1',
      prompt: 'Capital of France?',
      options: ['Paris', 'Rome'],
      correctAnswer: 0,
    }),
    // A question in another room must NOT leak into this room's Test.
    makeQuestion({
      id: 'q2',
      createdAt: at(2),
      roomId: 'r2',
      prompt: 'Year of the fall of Rome?',
      options: ['476', '1453'],
      correctAnswer: 0,
    }),
  ])
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
          <RoomStoreContext value={createRoomStore(roomRepo)}>
            <QuestionStoreContext value={createQuestionStore(questionRepo)}>
              <RoomQuizPage roomId={roomId} onBack={() => {}} />
            </QuestionStoreContext>
          </RoomStoreContext>
        </PalaceStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
}

describe('RoomQuizPage', () => {
  it('builds the test from only this room’s questions', async () => {
    renderRoomQuiz()
    expect(await screen.findByText('Geography Test')).toBeInTheDocument()
    expect(screen.getByText('Capital of France?')).toBeInTheDocument()
    expect(screen.queryByText('Year of the fall of Rome?')).not.toBeInTheDocument()
  })

  it('answers a question and reveals feedback', async () => {
    const user = userEvent.setup()
    renderRoomQuiz()
    await screen.findByText('Capital of France?')
    await user.click(screen.getByRole('button', { name: /paris/i }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    expect(screen.getByText(/correct/i)).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown room', async () => {
    renderRoomQuiz('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })
})
