import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCardStoreApi } from '@/entities/card'
import {
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import {
  type Question,
  questionsForDeck,
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { deleteQuestion, duplicateQuestion, reorderQuestions } from '@/features/question'
import { applyDeckContent, exportQuestionsCsv, readContentFile } from '@/features/content'
import {
  ContentImportError,
  type DeckContentData,
  type MultiSelect,
  useMultiSelect,
} from '@/shared/lib'
import type { SelectActionHandlers } from '@/shared/ui'
import { type QuestionSort, sortQuestions } from './sort-questions'

/**
 * An act the page has asked for but not yet carried out, because it needs the learner to confirm
 * it first. One value rather than three flags: only one of these can be true at a time.
 */
export type PendingAct =
  | { kind: 'delete-question'; question: Question }
  | { kind: 'delete-selection' }
  | { kind: 'import'; questions: DeckContentData['questions'] }

export interface DeckQuestions {
  ready: boolean
  deckName: string
  /** The Deck's Questions in the chosen order. */
  questions: Question[]
  sort: QuestionSort
  setSort: (sort: QuestionSort) => void
  selection: MultiSelect
  selectHandlers: SelectActionHandlers

  duplicate: (id: string) => void
  reorder: (ids: string[]) => void
  exportCsv: () => void
  /** Read a file and, if it holds Questions, queue the import for confirmation. */
  importFile: (file: File) => Promise<void>

  pending: PendingAct | null
  request: (act: PendingAct) => void
  dismiss: () => void
  confirm: () => void
}

/**
 * A Deck's Questions as one module: what they are, how they're ordered, what is selected, and
 * every act the page can ask for — including the three that need confirming first.
 *
 * The two stores it reads and the two it writes through are its own business; the page names
 * Questions and acts, never repositories.
 */
export function useDeckQuestions(deckId: string): DeckQuestions {
  const { t } = useTranslation()
  const questionStore = useQuestionStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()

  useEffect(() => {
    questionStore.getState().start()
    deckStore.getState().start()
  }, [questionStore, deckStore])

  const allQuestions = useQuestionStore(selectQuestions)
  const decks = useDeckStore(selectDecks)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const decksReady = useDeckStore(selectDecksReady)

  const [sort, setSort] = useState<QuestionSort>('manual')
  const [pending, setPending] = useState<PendingAct | null>(null)
  const selection = useMultiSelect()

  const deckQuestions = useMemo(
    () => questionsForDeck(allQuestions, deckId),
    [allQuestions, deckId],
  )
  const questions = useMemo(() => sortQuestions(deckQuestions, sort), [deckQuestions, sort])

  // Select-all covers what is on screen, which after sorting is exactly this list.
  const { setVisibleIds } = selection
  useEffect(() => {
    setVisibleIds(questions.map((question) => question.id))
  }, [questions, setVisibleIds])

  const duplicate = (id: string) => {
    void duplicateQuestion(questionStore, id)
    toast.success(t('cards.row.duplicated'))
  }

  const selectHandlers: SelectActionHandlers = {
    duplicate: {
      disabled: selection.count === 0,
      onAction: () => {
        const ids = [...selection.ids]
        void Promise.all(ids.map((id) => duplicateQuestion(questionStore, id)))
        toast.success(t('questions.bulk.duplicated', { count: ids.length }))
        selection.exit()
      },
    },
    delete: {
      disabled: selection.count === 0,
      onAction: () => setPending({ kind: 'delete-selection' }),
    },
  }

  const confirm = () => {
    const act = pending
    setPending(null)
    if (!act) return
    switch (act.kind) {
      case 'delete-question':
        void deleteQuestion(questionStore, act.question.id)
        toast.success(t('cards.transfer.deleted'))
        return
      case 'delete-selection': {
        const ids = [...selection.ids]
        void Promise.all(ids.map((id) => deleteQuestion(questionStore, id)))
        toast.success(t('cards.transfer.deletedMany', { count: ids.length }))
        selection.exit()
        return
      }
      case 'import':
        void applyDeckContent(cardStore, questionStore, deckId, {
          cards: [],
          questions: act.questions,
        }).then((applied) =>
          toast.success(t('questions.transfer.imported', { count: applied.questions })),
        )
    }
  }

  return {
    ready: questionsReady && decksReady,
    deckName: decks.find((candidate) => candidate.id === deckId)?.name ?? '',
    questions,
    sort,
    setSort,
    selection,
    selectHandlers,
    duplicate,
    reorder: (ids) => {
      // Dragging a row *is* choosing a manual order, so the sort follows the gesture.
      if (sort !== 'manual') setSort('manual')
      void reorderQuestions(questionStore, ids)
    },
    exportCsv: () => {
      exportQuestionsCsv(decks.find((d) => d.id === deckId)?.name ?? '', questions)
      toast.success(t('questions.transfer.exported'))
    },
    importFile: async (file) => {
      try {
        const data = await readContentFile(file)
        if (data.questions.length === 0) {
          toast.error(t('questions.transfer.noneFound'))
          return
        }
        setPending({ kind: 'import', questions: data.questions })
      } catch (error) {
        toast.error(
          error instanceof ContentImportError
            ? error.message
            : t('questions.transfer.importFailed'),
        )
      }
    },
    pending,
    request: setPending,
    dismiss: () => setPending(null),
    confirm,
  }
}
