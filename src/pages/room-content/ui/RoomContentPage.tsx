import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import {
  questionsForRoom,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { useRoomStore, useRoomStoreApi } from '@/entities/room'
import { createLocus, deleteLocus, editLocus } from '@/features/locus'
import { createQuestion, deleteQuestion } from '@/features/question'
import { BookText, Puzzle } from 'lucide-react'
import { LociList, QuestionList } from '@/widgets/loci-editor'
import { AppScreen, Button, IconButton, ScreenHeader, TextField } from '@/shared/ui'

export interface RoomContentPageProps {
  roomId: string
  onBack?: () => void
  /** Play the Match game over this room; wired by the route wrapper. */
  onMatch?: () => void
  /** Study this room's loci as verses; wired by the route wrapper. */
  onVerse?: () => void
}

/** Room content — a room's loci and questions, both fully editable and persisting
 * offline through the injected stores. */
export function RoomContentPage({ roomId, onBack, onMatch, onVerse }: RoomContentPageProps) {
  const { t } = useTranslation()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const room = useRoomStore((state) => state.rooms.find((r) => r.id === roomId))

  useEffect(() => {
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
  }, [roomStore, locusStore, questionStore])

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={room ? room.title : t('roomContent.notFound')}
          onBack={onBack}
          backLabel={t('roomContent.back')}
          action={
            room ? (
              <div className="flex items-center gap-2">
                {onVerse ? (
                  <IconButton
                    variant="tint"
                    aria-label={t('verse.openLabel', { title: room.title })}
                    onClick={onVerse}
                  >
                    <BookText className="size-5" aria-hidden />
                  </IconButton>
                ) : null}
                {onMatch ? (
                  <IconButton
                    variant="tint"
                    aria-label={t('match.openLabel', { title: room.title })}
                    onClick={onMatch}
                  >
                    <Puzzle className="size-5" aria-hidden />
                  </IconButton>
                ) : null}
              </div>
            ) : undefined
          }
        />
      }
    >
      {room ? <RoomContentBody roomId={roomId} /> : null}
    </AppScreen>
  )
}

function RoomContentBody({ roomId }: { roomId: string }) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const allLoci = useLocusStore(selectLoci)
  const allQuestions = useQuestionStore(selectQuestions)
  const loci = useMemo(() => lociForRoom(allLoci, roomId), [allLoci, roomId])
  const questions = useMemo(() => questionsForRoom(allQuestions, roomId), [allQuestions, roomId])

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [prompt, setPrompt] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [correct, setCorrect] = useState(0)

  const handleCreateLocus = (event: FormEvent) => {
    event.preventDefault()
    if (!front.trim() || !back.trim()) return
    void createLocus(locusStore, roomId, { front: front.trim(), back: back.trim() })
    setFront('')
    setBack('')
  }

  const handleCreateQuestion = (event: FormEvent) => {
    event.preventDefault()
    if (!prompt.trim() || !optionA.trim() || !optionB.trim()) return
    void createQuestion(questionStore, roomId, {
      prompt: prompt.trim(),
      options: [optionA.trim(), optionB.trim()],
      correctAnswer: correct,
    })
    setPrompt('')
    setOptionA('')
    setOptionB('')
    setCorrect(0)
  }

  return (
    <>
      <section className="mt-5">
        <h2>{t('roomContent.lociHeading')}</h2>
        <form onSubmit={handleCreateLocus} className="mt-3 flex flex-col gap-2">
          <TextField
            aria-label={t('loci.newFrontLabel')}
            placeholder={t('loci.frontPlaceholder')}
            value={front}
            onChange={(event) => setFront(event.target.value)}
          />
          <TextField
            aria-label={t('loci.newBackLabel')}
            placeholder={t('loci.backPlaceholder')}
            value={back}
            onChange={(event) => setBack(event.target.value)}
          />
          <Button type="submit" className="self-start">
            {t('loci.create')}
          </Button>
        </form>
        <div className="mt-4">
          <LociList
            loci={loci}
            onEdit={(id, changes) => void editLocus(locusStore, id, changes)}
            onDelete={(id) => void deleteLocus(locusStore, id)}
          />
        </div>
      </section>

      <section className="mt-8 flex-1 pb-8">
        <h2>{t('roomContent.questionsHeading')}</h2>
        <form onSubmit={handleCreateQuestion} className="mt-3 flex flex-col gap-2">
          <TextField
            aria-label={t('questions.promptLabel')}
            placeholder={t('questions.promptPlaceholder')}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <div className="flex items-center gap-2.5">
            <input
              type="radio"
              name="correct"
              checked={correct === 0}
              onChange={() => setCorrect(0)}
              aria-label={t('questions.correctOptionLabel', { number: 1 })}
              className="size-5 shrink-0 accent-[var(--primary)]"
            />
            <TextField
              aria-label={t('questions.optionLabel', { number: 1 })}
              placeholder={t('questions.optionPlaceholder', { number: 1 })}
              value={optionA}
              onChange={(event) => setOptionA(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="radio"
              name="correct"
              checked={correct === 1}
              onChange={() => setCorrect(1)}
              aria-label={t('questions.correctOptionLabel', { number: 2 })}
              className="size-5 shrink-0 accent-[var(--primary)]"
            />
            <TextField
              aria-label={t('questions.optionLabel', { number: 2 })}
              placeholder={t('questions.optionPlaceholder', { number: 2 })}
              value={optionB}
              onChange={(event) => setOptionB(event.target.value)}
            />
          </div>
          <Button type="submit" className="self-start">
            {t('questions.create')}
          </Button>
        </form>
        <div className="mt-4">
          <QuestionList
            questions={questions}
            onDelete={(id) => void deleteQuestion(questionStore, id)}
          />
        </div>
      </section>
    </>
  )
}
