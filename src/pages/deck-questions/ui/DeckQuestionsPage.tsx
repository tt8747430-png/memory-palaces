import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  Brain,
  Clock,
  Download,
  FileText,
  GripVertical,
  HelpCircle,
  Play,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
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
import { ContentImportError, type DeckContentData } from '@/shared/lib'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  ImportRow,
  ScreenHeader,
  Sheet,
  SortControl,
  type SortControlOption,
  SpeedDial,
} from '@/shared/ui'
import {
  BulkButton,
  QuestionRow,
  ReorderableList,
  type RowDragHandle,
  SelectModeBar,
} from '@/widgets/content-editor'

export interface DeckQuestionsPageProps {
  deckId: string
  onBack?: () => void
  /** Open the full-screen question editor (add / edit). */
  onAddQuestion: () => void
  onEditQuestion: (questionId: string) => void
  /** Start the deck's Test (quiz) with the authored questions. */
  onStartTest: () => void
}

type QuestionSort = 'manual' | 'recent' | 'name'

/**
 * The deck's Questions & Test page: author the multiple-choice questions and launch the Test
 * from one screen. A hero card starts the quiz; below it the questions list supports edit,
 * duplicate, delete, multi-select bulk delete, and drag-reorder (in select mode).
 */
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
  // The card store is only here to satisfy the shared `applyDeckContent` signature; question
  // import never writes cards (it applies `{ cards: [], questions }`).
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
  const swipe = usePreferencesStore(selectEffectivePreferences).swipe.card

  const deck = decks.find((candidate) => candidate.id === deckId)
  const deckName = deck?.name ?? ''
  const questions = useMemo(() => questionsForDeck(allQuestions, deckId), [allQuestions, deckId])

  const [sort, setSort] = useState<QuestionSort>('manual')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  // Parsed but not yet applied — a picked file waits behind a count-confirm, mirroring the
  // review step card imports get, so a wrong file never writes straight into the deck.
  const [pendingImport, setPendingImport] = useState<DeckContentData['questions'] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectMode) setSelectedIds(new Set())
  }, [selectMode])

  const sortedQuestions = useMemo(() => sortQuestions(questions, sort), [questions, sort])
  const selectedCount = selectedIds.size
  const allSelected =
    sortedQuestions.length > 0 && sortedQuestions.every((q) => selectedIds.has(q.id))
  const reorderable = selectMode

  const sortOptions: SortControlOption<QuestionSort>[] = [
    { value: 'manual', label: t('cards.sort.manual'), icon: <GripVertical className="size-4" /> },
    { value: 'recent', label: t('cards.sort.recent'), icon: <Clock className="size-4" /> },
    { value: 'name', label: t('cards.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
  ]

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
  const exitSelect = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const renderQuestion = (question: Question, dragHandle?: RowDragHandle, dragging = false) => (
    <QuestionRow
      key={question.id}
      question={question}
      index={sortedQuestions.indexOf(question)}
      selectMode={selectMode}
      selected={selectedIds.has(question.id)}
      reorderable={reorderable}
      dragHandle={dragHandle}
      dragging={dragging}
      swipe={swipe}
      onToggleSelect={() => toggleSelect(question.id)}
      onRequestSelect={() => requestSelect(question.id)}
      onEdit={() => onEditQuestion(question.id)}
      onDuplicate={() => {
        void duplicateQuestion(questionStore, question.id)
        toast.success(t('cards.row.duplicated'))
      }}
      onDelete={() => setPendingDeleteId(question.id)}
    />
  )

  const confirmSingleDelete = () => {
    if (!pendingDeleteId) return
    void deleteQuestion(questionStore, pendingDeleteId)
    toast.success(t('cards.transfer.deleted'))
  }
  const confirmBulkDelete = () => {
    const ids = [...selectedIds]
    void Promise.all(ids.map((id) => deleteQuestion(questionStore, id)))
    toast.success(t('cards.transfer.deletedMany', { count: ids.length }))
    exitSelect()
  }

  const pickFile = (accept: string) => {
    setImportOpen(false)
    const input = fileRef.current
    if (!input) return
    input.value = ''
    input.accept = accept
    input.click()
  }

  // Questions only — any cards in the file are dropped (they import from the Cards page).
  // Parsing never writes; the count-confirm below does.
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
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

  const closeExport = (run: () => void) => {
    setExportOpen(false)
    run()
    toast.success(t('questions.transfer.exported'))
  }

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  const hasQuestions = questions.length > 0

  // Pinned as the screen footer (not a sticky child) so the bulk bar sits at the bottom even
  // when a single short question wouldn't scroll the list far enough to pin a sticky element.
  const selectionBar = (
    <div className="px-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom)))] pt-2">
      <div className="flex items-center gap-2 rounded-card-featured bg-card/95 p-2.5 shadow-elevated backdrop-blur-xl">
        <BulkButton
          disabled={selectedCount === 0}
          tone="danger"
          icon={<Trash2 className="size-[17px]" aria-hidden />}
          label={t('common.delete')}
          onClick={() => setBulkDeleteOpen(true)}
        />
      </div>
    </div>
  )

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t('questions.title')}
          subtitle={deck?.name}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
      footer={selectMode ? selectionBar : undefined}
    >
      <div className="mt-2 space-y-4 pb-24">
        {/* Start-test hero — author below, launch from here. */}
        <div className="rounded-card-featured bg-card p-4 shadow-featured">
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
              aria-hidden
            >
              <Brain className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-(length:--p-text-sub) font-bold text-heading">
                {t('questions.testLead')}
              </p>
              <p className="text-(length:--p-text-label) text-muted-foreground">
                {hasQuestions
                  ? t(
                      questions.length === 1
                        ? 'questions.testReadyOne'
                        : 'questions.testReadyOther',
                      {
                        count: questions.length,
                      },
                    )
                  : t('questions.testNone')}
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="mt-3.5 w-full"
            disabled={!hasQuestions}
            onClick={onStartTest}
          >
            <Play className="size-[18px]" aria-hidden />
            {t('questions.startTest')}
          </Button>
        </div>

        <section aria-label={t('questions.inDeck')} className="space-y-3">
          {!selectMode && questions.length > 1 ? (
            <div className="flex justify-end">
              <SortControl
                label={t('cards.sortLabel')}
                value={sort}
                options={sortOptions}
                onChange={setSort}
              />
            </div>
          ) : null}

          {selectMode ? (
            <SelectModeBar
              allSelected={allSelected}
              count={selectedCount}
              onToggleAll={toggleSelectAll}
              onDone={exitSelect}
            />
          ) : null}

          {questions.length === 0 ? (
            <EmptyQuestions onAdd={onAddQuestion} />
          ) : (
            <ReorderableList
              items={sortedQuestions}
              reorderable={reorderable}
              onReorder={(ids) => {
                if (sort !== 'manual') setSort('manual')
                void reorderQuestions(questionStore, ids)
              }}
              renderItem={renderQuestion}
            />
          )}
        </section>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.delete.questionTitle')}
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmSingleDelete}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.delete.bulkTitle', { count: selectedCount })}
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkDelete}
      />

      {/* A picked file is parsed, then held here until the count is confirmed. */}
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

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={onFile}
        aria-hidden
        tabIndex={-1}
      />

      {/* Import sheet — add questions from a file. Cards are imported from the Cards page. */}
      <Sheet
        open={importOpen}
        onOpenChange={setImportOpen}
        title={t('questions.transfer.importTitle')}
        description={t('questions.transfer.importSubtitle')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<Upload className="size-5" aria-hidden />}
            tone="accent"
            badge="CSV"
            title={t('questions.transfer.importFile')}
            subtitle={t('questions.transfer.importFileSub')}
            onClick={() => pickFile('.csv')}
          />
        </div>
      </Sheet>

      {/* Export sheet — save this deck's questions. */}
      <Sheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={t('questions.transfer.exportTitle')}
        description={t('questions.transfer.exportSubtitle')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<FileText className="size-5" aria-hidden />}
            tone="positive"
            badge="CSV"
            trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
            title={t('questions.transfer.exportCsv')}
            subtitle={t('questions.transfer.exportCsvSub')}
            disabled={!hasQuestions}
            onClick={() => closeExport(() => exportQuestionsCsv(deckName, questions))}
          />
        </div>
      </Sheet>

      {/* Hidden while selecting, where the bulk bar owns the bottom of the screen (otherwise
          the dial overlaps the bar's trailing action). */}
      {!selectMode ? (
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

function sortQuestions(questions: Question[], sort: QuestionSort): Question[] {
  switch (sort) {
    case 'name':
      return [...questions].sort((a, b) => a.prompt.localeCompare(b.prompt))
    case 'recent':
      return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    default:
      return questions
  }
}

function EmptyQuestions({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent">
        <HelpCircle className="size-6" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-balance text-(length:--p-text-sub) font-semibold text-heading">
        {t('questions.emptyTitle')}
      </h3>
      <p className="max-w-[34ch] text-pretty text-(length:--p-text-body) text-muted-foreground">
        {t('questions.emptyHint')}
      </p>
      <Button className="mt-5" onClick={onAdd}>
        <Plus className="size-[18px]" aria-hidden />
        {t('questions.addQuestion')}
      </Button>
    </div>
  )
}
