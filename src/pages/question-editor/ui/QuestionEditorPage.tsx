import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { selectQuestions, useQuestionStore, useQuestionStoreApi } from '@/entities/question'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { createQuestion, editQuestion } from '@/features/question'
import { AppScreen, Button, ScreenHeader } from '@/shared/ui'
import {
  buildQuestionData,
  isQuestionValid,
  MAX_OPTIONS,
  QuestionFields,
} from '@/widgets/content-editor'

export interface QuestionEditorPageProps {
  deckId: string
  questionId?: string
  onBack: () => void
  onDone: () => void
}

export function QuestionEditorPage({
  deckId,
  questionId,
  onBack,
  onDone,
}: QuestionEditorPageProps) {
  const { t } = useTranslation()
  const questionStore = useQuestionStoreApi()
  const deckStore = useDeckStoreApi()
  const questions = useQuestionStore(selectQuestions)
  const decks = useDeckStore(selectDecks)

  useEffect(() => {
    questionStore.getState().start()
    deckStore.getState().start()
  }, [questionStore, deckStore])

  const editing = questionId ? (questions.find((q) => q.id === questionId) ?? null) : null
  const deck = decks.find((d) => d.id === deckId)

  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [correct, setCorrect] = useState(0)
  const [explanation, setExplanation] = useState('')

  useEffect(() => {
    setPrompt(editing?.prompt ?? '')
    setOptions(editing?.options ?? ['', ''])
    setCorrect(editing?.correctAnswer ?? 0)
    setExplanation(editing?.explanation ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id])

  const valid = isQuestionValid(prompt, options, correct)

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))
  const addOption = () => setOptions((prev) => (prev.length < MAX_OPTIONS ? [...prev, ''] : prev))
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
      await createQuestion(questionStore, deckId, data)
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
          subtitle={deck?.name}
          onBack={onBack}
          backLabel={t('common.back')}
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
