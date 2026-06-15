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
import { LociList, QuestionList } from '@/widgets/loci-editor'
import { Button } from '@/shared/ui'

export interface RoomContentPageProps {
  roomId: string
  onBack?: () => void
}

/** Room content — a room's loci and questions, both fully editable and persisting
 * offline through the injected stores. */
export function RoomContentPage({ roomId, onBack }: RoomContentPageProps) {
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
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-safe pb-safe">
      <header className="pt-12">
        {onBack ? (
          <Button variant="ghost" size="sm" className="mb-3 -ml-3" onClick={onBack}>
            {t('roomContent.back')}
          </Button>
        ) : null}
        <h1 className="text-balance">{room ? room.title : t('roomContent.notFound')}</h1>
      </header>

      {room ? <RoomContentBody roomId={roomId} /> : null}
    </main>
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

  const inputClass = 'h-11 rounded-control border border-border bg-card px-3 text-heading'

  return (
    <>
      <section className="mt-6">
        <h2>{t('roomContent.lociHeading')}</h2>
        <form onSubmit={handleCreateLocus} className="mt-3 flex flex-col gap-2">
          <input
            aria-label={t('loci.newFrontLabel')}
            placeholder={t('loci.frontPlaceholder')}
            value={front}
            onChange={(event) => setFront(event.target.value)}
            className={inputClass}
          />
          <input
            aria-label={t('loci.newBackLabel')}
            placeholder={t('loci.backPlaceholder')}
            value={back}
            onChange={(event) => setBack(event.target.value)}
            className={inputClass}
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

      <section className="mt-8 flex-1">
        <h2>{t('roomContent.questionsHeading')}</h2>
        <form onSubmit={handleCreateQuestion} className="mt-3 flex flex-col gap-2">
          <input
            aria-label={t('questions.promptLabel')}
            placeholder={t('questions.promptPlaceholder')}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className={inputClass}
          />
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correct === 0}
              onChange={() => setCorrect(0)}
              aria-label={t('questions.correctOptionLabel', { number: 1 })}
            />
            <input
              aria-label={t('questions.optionLabel', { number: 1 })}
              placeholder={t('questions.optionPlaceholder', { number: 1 })}
              value={optionA}
              onChange={(event) => setOptionA(event.target.value)}
              className={`${inputClass} flex-1`}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correct === 1}
              onChange={() => setCorrect(1)}
              aria-label={t('questions.correctOptionLabel', { number: 2 })}
            />
            <input
              aria-label={t('questions.optionLabel', { number: 2 })}
              placeholder={t('questions.optionPlaceholder', { number: 2 })}
              value={optionB}
              onChange={(event) => setOptionB(event.target.value)}
              className={`${inputClass} flex-1`}
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
