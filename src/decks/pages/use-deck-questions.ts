import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  deleteQuestion,
  deleteQuestions,
  duplicateQuestion,
  duplicateQuestions,
  type Question,
  questionsForDeck,
  reorderQuestions,
} from '@/decks'
import { applyDeckContent, exportQuestionsCsv, readContentFile } from '@/import'
import { ContentImportError } from '@/shared/domain'
import { orderPatch, useOptimisticPatch } from '@/shared/lib'
import { openConfirmDialog, type SelectActionHandlers } from '@/shared/ui'
import { useStore } from '@/shared/data/use-store'
import { useServices } from '@/shell/services-provider'
import { openQuestionExportDrawer, openQuestionImportDrawer } from '@/decks/ui'

export type QuestionSort = 'manual' | 'recent' | 'name'

/**
 * `manual` sorts by `order` rather than passing the store's array through (which `main` does):
 * `useOptimisticPatch` rewrites `order` in place while leaving the array in the store's previous
 * order, so a just-dropped row would sit at its old index for a beat. Sorting here is what makes
 * the optimistic patch visible (CODE_STYLE.md §10).
 */
function sortQuestions(questions: Question[], sort: QuestionSort): Question[] {
  switch (sort) {
    case 'name':
      return [...questions].sort((a, b) => a.prompt.localeCompare(b.prompt))
    case 'recent':
      return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'manual':
      return [...questions].sort((a, b) => a.order - b.order)
  }
}

export interface UseDeckQuestionsOptions {
  deckId: string
}

/**
 * `DeckQuestionsPage`'s ViewModel. Earned (A.7): it owns the derived question read model, the
 * optimistic reorder, multi-select with its bulk commands, and three promise-sequenced overlay
 * flows. `main` ran all of it from eight `useState`s in the component; five are gone here because
 * our overlays are promise-returning — `pendingDeleteId`/`bulkDeleteOpen`/`pendingImport` moved
 * into `openConfirmDialog`, `importOpen`/`exportOpen` into their own drawers.
 */
export function useDeckQuestions({ deckId }: UseDeckQuestionsOptions) {
  const { t } = useTranslation()
  const { questionStore, deckStore, cardStore, preferencesStore } = useServices()

  const storeQuestions = useStore(questionStore.questions)
  const decks = useStore(deckStore.decks)
  const prefs = useStore(preferencesStore.effective)
  const questionsReady = useStore(questionStore.status) === 'ready'
  const decksReady = useStore(deckStore.status) === 'ready'
  const ready = questionsReady && decksReady

  // A drop shows up instantly and stays put: the new order is held over the store's emissions
  // until the persisted rows agree with it.
  const [allQuestions, patchQuestions] = useOptimisticPatch(storeQuestions)

  const [sort, setSort] = useState<QuestionSort>('manual')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const deck = useMemo(() => decks.find((candidate) => candidate.id === deckId), [decks, deckId])
  const questions = useMemo(() => questionsForDeck(allQuestions, deckId), [allQuestions, deckId])
  const sortedQuestions = useMemo(() => sortQuestions(questions, sort), [questions, sort])

  const selectedCount = selectedIds.size
  const noSelection = selectedCount === 0
  const allSelected =
    sortedQuestions.length > 0 && sortedQuestions.every((q) => selectedIds.has(q.id))
  const hasQuestions = questions.length > 0
  const reorderable = selectMode

  const exitSelect = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const requestSelect = (id: string) => {
    setSelectMode(true)
    setSelectedIds((prev) => new Set(prev).add(id))
  }

  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) sortedQuestions.forEach((q) => next.delete(q.id))
      else sortedQuestions.forEach((q) => next.add(q.id))
      return next
    })

  const onReorder = (orderedIds: string[]) => {
    patchQuestions(orderPatch<Question>(orderedIds))
    void reorderQuestions(questionStore, orderedIds)
    // A manual drag *is* a statement about order; any other sort would discard it on the next
    // render, so the list switches to manual to keep what the learner just did.
    if (sort !== 'manual') setSort('manual')
  }

  const deleteOne = async (id: string) => {
    const confirmed = await openConfirmDialog({
      tone: 'danger',
      title: t('cards.delete.questionTitle'),
      description: t('cards.delete.body'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    })
    if (!confirmed) return
    await deleteQuestion(questionStore, id)
    toast.success(t('cards.transfer.deleted'))
  }

  const duplicateOne = async (id: string) => {
    await duplicateQuestion(questionStore, id)
    toast.success(t('cards.row.duplicated'))
  }

  /** Confirms, then deletes the whole selection in one command — never a loop over `deleteQuestion`. */
  const deleteSelected = async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    const confirmed = await openConfirmDialog({
      tone: 'danger',
      title: t('cards.delete.bulkTitle', { count: ids.length }),
      description: t('cards.delete.body'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    })
    if (!confirmed) return
    await deleteQuestions(questionStore, ids)
    toast.success(t('cards.transfer.deletedMany', { count: ids.length }))
    exitSelect()
  }

  /** Resolves the accept string when the learner picked the file route, else `null`. */
  const chooseImport = async (): Promise<string | null> => {
    const choice = await openQuestionImportDrawer()
    return choice === 'csv' ? '.csv' : null
  }

  const importFile = async (file: File) => {
    let incoming
    try {
      const data = await readContentFile(file)
      if (data.questions.length === 0) {
        toast.error(t('questions.transfer.noneFound'))
        return
      }
      incoming = data.questions
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('questions.transfer.importFailed'),
      )
      return
    }

    const confirmed = await openConfirmDialog({
      title: t(
        incoming.length === 1
          ? 'questions.transfer.importConfirmTitleOne'
          : 'questions.transfer.importConfirmTitleOther',
        { count: incoming.length },
      ),
      description: t('questions.transfer.importConfirmBody'),
      confirmLabel: t('questions.transfer.importConfirm'),
      cancelLabel: t('common.cancel'),
    })
    if (!confirmed) return

    const applied = await applyDeckContent(cardStore, questionStore, deckId, {
      cards: [],
      questions: incoming,
    })
    toast.success(t('questions.transfer.imported', { count: applied.questions }))
  }

  const exportQuestions = async () => {
    const choice = await openQuestionExportDrawer({ disabled: !hasQuestions })
    if (choice !== 'csv') return
    exportQuestionsCsv(deck?.name ?? '', questions)
    toast.success(t('questions.transfer.exported'))
  }

  // The bar the learner configured (Settings → Select toolbar) for questions. Each entry is a
  // bulk command, never a loop over a single-question one.
  const selectHandlers: SelectActionHandlers = {
    duplicate: {
      disabled: noSelection,
      onAction: () => {
        const ids = [...selectedIds]
        void duplicateQuestions(questionStore, ids)
        toast.success(t('questions.bulk.duplicated', { count: ids.length }))
        exitSelect()
      },
    },
    delete: { disabled: noSelection, onAction: () => void deleteSelected() },
  }

  return {
    ready,
    deck,
    questions,
    sortedQuestions,
    hasQuestions,
    sort,
    setSort,
    selectMode,
    selectedIds,
    selectedCount,
    allSelected,
    reorderable,
    swipe: prefs.swipe.card,
    selectToolbarActions: prefs.selectToolbar.question,
    selectHandlers,
    toggleSelect,
    requestSelect,
    toggleSelectAll,
    exitSelect,
    onReorder,
    deleteOne,
    duplicateOne,
    deleteSelected,
    chooseImport,
    importFile,
    exportQuestions,
  }
}

export type DeckQuestionsVm = ReturnType<typeof useDeckQuestions>
