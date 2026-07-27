import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowDownAZ, Clock, Download, GripVertical, Plus, Trash2, Upload } from 'lucide-react'
import {
  type Question,
  questionsForDeck,
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { useCardStoreApi } from '@/entities/card'
import {
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import { selectEffectivePreferences, usePreferencesStore } from '@/entities/preferences'
import { deleteQuestion, duplicateQuestion, reorderQuestions } from '@/features/question'
import { applyDeckContent, exportQuestionsCsv, readContentFile } from '@/features/content'
import { ContentImportError, type DeckContentData, useMultiSelect } from '@/shared/lib'
import {
  AppScreen,
  ConfirmDialog,
  ScreenHeader,
  type SelectActionHandlers,
  SelectHeader,
  SelectToolbar,
  SelectToolbarDock,
  SortControl,
  type SortControlOption,
  SpeedDial,
} from '@/shared/ui'
import { QuestionRow, ReorderableList, type RowDragHandle } from '@/widgets/content-editor'
import { type QuestionSort, sortQuestions } from '../model/sort-questions'
import { EmptyQuestions } from './EmptyQuestions'
import { QuestionTransferSheets } from './QuestionTransferSheets'
import { TestLaunchCard } from './TestLaunchCard'

export interface DeckQuestionsPageProps {
  deckId: string
  onBack?: () => void
  onAddQuestion: () => void
  onEditQuestion: (questionId: string) => void
  onStartTest: () => void
}

export function DeckQuestionsPage({
  deckId,
  onBack,
  onAddQuestion,
  onEditQuestion,
  onStartTest,
}: DeckQuestionsPageProps) {
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
  const ready = questionsReady && decksReady
  const prefs = usePreferencesStore(selectEffectivePreferences)

  const deck = decks.find((candidate) => candidate.id === deckId)
  const questions = useMemo(() => questionsForDeck(allQuestions, deckId), [allQuestions, deckId])

  const [sort, setSort] = useState<QuestionSort>('manual')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<DeckContentData['questions'] | null>(null)

  // Same selection model as the deck library and the card list: the page header carries it.
  const selection = useMultiSelect()
  const sortedQuestions = useMemo(() => sortQuestions(questions, sort), [questions, sort])
  const { setPool } = selection
  useEffect(() => {
    setPool(sortedQuestions.map((question) => question.id))
  }, [sortedQuestions, setPool])

  const sortOptions: SortControlOption<QuestionSort>[] = [
    { value: 'manual', label: t('cards.sort.manual'), icon: <GripVertical className="size-4" /> },
    { value: 'recent', label: t('cards.sort.recent'), icon: <Clock className="size-4" /> },
    { value: 'name', label: t('cards.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
  ]

  const renderQuestion = (question: Question, dragHandle?: RowDragHandle, dragging = false) => (
    <QuestionRow
      key={question.id}
      question={question}
      index={sortedQuestions.indexOf(question)}
      selectMode={selection.active}
      selected={selection.has(question.id)}
      reorderable={selection.active}
      dragHandle={dragHandle}
      dragging={dragging}
      swipe={prefs.swipe.card}
      onToggleSelect={() => selection.toggle(question.id)}
      onRequestSelect={() => selection.begin(question.id)}
      onEdit={() => onEditQuestion(question.id)}
      onDuplicate={() => {
        void duplicateQuestion(questionStore, question.id)
        toast.success(t('cards.row.duplicated'))
      }}
      onDelete={() => setPendingDeleteId(question.id)}
    />
  )

  const importFile = async (file: File) => {
    try {
      const data = await readContentFile(file)
      if (data.questions.length === 0) {
        toast.error(t('questions.transfer.noneFound'))
        return
      }
      setPendingImport(data.questions)
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('questions.transfer.importFailed'),
      )
    }
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    const applied = await applyDeckContent(cardStore, questionStore, deckId, {
      cards: [],
      questions: pendingImport,
    })
    setPendingImport(null)
    toast.success(t('questions.transfer.imported', { count: applied.questions }))
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
    delete: { disabled: selection.count === 0, onAction: () => setBulkDeleteOpen(true) },
  }

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  return (
    <AppScreen
      header={
        selection.active ? (
          <SelectHeader
            count={selection.count}
            allSelected={selection.allSelected}
            onToggleAll={selection.toggleAll}
            onCancel={selection.exit}
          />
        ) : (
          <ScreenHeader
            title={t('questions.title')}
            subtitle={deck?.name}
            onBack={onBack}
            backLabel={t('common.back')}
          />
        )
      }
    >
      <div className="mt-2 space-y-4 pb-24">
        {/* A selection is about the rows, so the test call-to-action steps out of the way —
            the same way the home screen drops to bare rows while you are choosing decks. */}
        {selection.active ? null : (
          <TestLaunchCard questionCount={questions.length} onStartTest={onStartTest} />
        )}

        <section aria-label={t('questions.inDeck')} className="space-y-3">
          {!selection.active && questions.length > 1 ? (
            <div className="flex justify-end">
              <SortControl
                label={t('cards.sortLabel')}
                value={sort}
                options={sortOptions}
                onChange={setSort}
              />
            </div>
          ) : null}

          {questions.length === 0 ? (
            <EmptyQuestions onAdd={onAddQuestion} />
          ) : (
            <ReorderableList
              items={sortedQuestions}
              reorderable={selection.active}
              selectedIds={selection.ids}
              onReorder={(ids) => {
                if (sort !== 'manual') setSort('manual')
                void reorderQuestions(questionStore, ids)
              }}
              renderItem={renderQuestion}
            />
          )}
        </section>
      </div>

      {selection.active ? (
        <SelectToolbarDock>
          <SelectToolbar actions={prefs.selectToolbar.question} handlers={selectHandlers} />
        </SelectToolbarDock>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.delete.questionTitle')}
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (!pendingDeleteId) return
          void deleteQuestion(questionStore, pendingDeleteId)
          toast.success(t('cards.transfer.deleted'))
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.delete.bulkTitle', { count: selection.count })}
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          const ids = [...selection.ids]
          void Promise.all(ids.map((id) => deleteQuestion(questionStore, id)))
          toast.success(t('cards.transfer.deletedMany', { count: ids.length }))
          selection.exit()
        }}
      />
      <ConfirmDialog
        open={pendingImport !== null}
        onOpenChange={(open) => !open && setPendingImport(null)}
        icon={<Upload className="size-6" aria-hidden />}
        title={t(
          pendingImport?.length === 1
            ? 'questions.transfer.importConfirmTitleOne'
            : 'questions.transfer.importConfirmTitleOther',
          { count: pendingImport?.length ?? 0 },
        )}
        description={t('questions.transfer.importConfirmBody')}
        confirmLabel={t('questions.transfer.importConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void confirmImport()}
      />

      <QuestionTransferSheets
        importOpen={importOpen}
        onImportOpenChange={setImportOpen}
        onPickFile={(file) => void importFile(file)}
        exportOpen={exportOpen}
        onExportOpenChange={setExportOpen}
        canExport={questions.length > 0}
        onExportCsv={() => {
          exportQuestionsCsv(deck?.name ?? '', questions)
          toast.success(t('questions.transfer.exported'))
        }}
      />

      {!selection.active ? (
        <SpeedDial
          label={t('questions.quickActions')}
          className="bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]"
          actions={[
            {
              id: 'question',
              label: t('questions.addQuestion'),
              icon: <Plus className="size-5" aria-hidden />,
              onSelect: onAddQuestion,
            },
            {
              id: 'import',
              label: t('questions.transfer.importShort'),
              icon: <Upload className="size-5" aria-hidden />,
              onSelect: () => setImportOpen(true),
            },
            {
              id: 'export',
              label: t('questions.transfer.exportShort'),
              icon: <Download className="size-5" aria-hidden />,
              onSelect: () => setExportOpen(true),
            },
          ]}
        />
      ) : null}
    </AppScreen>
  )
}
