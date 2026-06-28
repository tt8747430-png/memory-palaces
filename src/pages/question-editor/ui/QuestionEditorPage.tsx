import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import {
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { createQuestion, editQuestion } from '@/features/question'
import { AppScreen, Button, ScreenHeader } from '@/shared/ui'
import { buildQuestionData, isQuestionValid, MAX_OPTIONS, QuestionFields } from '@/widgets/loci-editor'

export interface QuestionEditorPageProps {
  roomId: string
  /** Present in edit mode; omit to create. */
  questionId?: string
  onBack: () => void
  /** Return to the room after a save commits. */
  onDone: () => void
}

/** Full-screen create/edit for a multiple-choice question — prompt, 2–6 options with a
 * correct marker, and an optional explanation. The primary path for adding questions (the
 * in-editor sheet stays only as a standalone fallback). */
export function QuestionEditorPage({ roomId, questionId, onBack, onDone }: QuestionEditorPageProps) {
  const { t } = useTranslation()
  const questionStore = useQuestionStoreApi()
  const roomStore = useRoomStoreApi()
  const questions = useQuestionStore(selectQuestions)
  const rooms = useRoomStore(selectRooms)

  useEffect(() => {
    questionStore.getState().start()
    roomStore.getState().start()
  }, [questionStore, roomStore])

  const editing = questionId ? (questions.find((q) => q.id === questionId) ?? null) : null
  const room = rooms.find((r) => r.id === roomId)

  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [correct, setCorrect] = useState(0)
  const [explanation, setExplanation] = useState('')

  // Seed from the question once it resolves from the store (edit mode); a create starts blank.
  useEffect(() => {
    setPrompt(editing?.prompt ?? '')
    setOptions(editing?.options ?? ['', ''])
    setCorrect(editing?.correctAnswer ?? 0)
    setExplanation(editing?.explanation ?? '')
    // Seed only when the target question changes — not on every field, or the form would reset
    // mid-edit each time the store re-emits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id])

  const valid = isQuestionValid(prompt, options, correct)

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))
  const addOption = () =>
    setOptions((prev) => (prev.length < MAX_OPTIONS ? [...prev, ''] : prev))
  const removeOption = (i: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
    setCorrect((prev) => (i === prev ? 0 : i < prev ? prev - 1 : prev))
  }

  const submit = async () => {
    if (!valid) return
    const data = buildQuestionData(prompt, options, correct, explanation)
    if (editing) {
      await editQuestion(questionStore, editing.id, data)
      toast.success(t('questions.editor.updated'))
    } else {
      await createQuestion(questionStore, roomId, data)
      toast.success(t('questions.editor.added'))
    }
    onDone()
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={editing ? t('questions.editor.editTitle') : t('questions.editor.newTitle')}
          subtitle={room?.title}
          onBack={onBack}
          backLabel={t('roomHub.back')}
        />
      }
    >
      <div className="mt-4 pb-40">
        <QuestionFields
          prompt={prompt}
          options={options}
          correct={correct}
          explanation={explanation}
          onPrompt={setPrompt}
          onOption={setOption}
          onAddOption={addOption}
          onRemoveOption={removeOption}
          onCorrect={setCorrect}
          onExplanation={setExplanation}
        />
      </div>

      <div className="sticky inset-x-0 bottom-0 z-20 -mx-4 border-t border-border/60 bg-card/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => void submit()}>
          <Check className="size-[18px]" aria-hidden />
          {editing ? t('common.saveChanges') : t('questions.editor.save')}
        </Button>
      </div>
    </AppScreen>
  )
}
