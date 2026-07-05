import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  Brain,
  Clock,
  Download,
  FileJson,
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
  questionsForRoom,
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { useLocusStoreApi } from '@/entities/locus'
import {
  selectIsReady as selectRoomsReady,
  selectRooms,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import { selectEffectivePreferences, usePreferencesStore } from '@/entities/preferences'
import { deleteQuestion, duplicateQuestion, reorderQuestions } from '@/features/question'
import {
  applyRoomContent,
  exportQuestionsCsv,
  exportRoomJson,
  readContentFile,
} from '@/features/content'
import { cn, ContentImportError } from '@/shared/lib'
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
import { QuestionRow, ReorderableList, type RowDragHandle } from '@/widgets/loci-editor'

export interface RoomQuestionsPageProps {
  roomId: string
  onBack?: () => void
  /** Open the full-screen question editor (add / edit). */
  onAddQuestion: () => void
  onEditQuestion: (questionId: string) => void
  /** Start the room's Test (quiz) with the authored questions. */
  onStartTest: () => void
}

type QuestionSort = 'manual' | 'recent' | 'name'

/**
 * The room's Questions & Test page: author the multiple-choice questions and launch the Test
 * from one screen. A hero card starts the quiz; below it the questions list supports edit,
 * duplicate, delete, multi-select bulk delete, and drag-reorder (in select mode).
 */
export function RoomQuestionsPage({
  roomId,
  onBack,
  onAddQuestion,
  onEditQuestion,
  onStartTest,
}: RoomQuestionsPageProps) {
  const { t } = useTranslation()
  const questionStore = useQuestionStoreApi()
  const roomStore = useRoomStoreApi()
  // The locus store is only here to satisfy the shared `applyRoomContent` signature; question
  // import never writes cards (it applies `{ loci: [], questions }`).
  const locusStore = useLocusStoreApi()

  useEffect(() => {
    questionStore.getState().start()
    roomStore.getState().start()
  }, [questionStore, roomStore])

  const allQuestions = useQuestionStore(selectQuestions)
  const rooms = useRoomStore(selectRooms)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const ready = questionsReady && roomsReady
  const swipe = usePreferencesStore(selectEffectivePreferences).swipe.card

  const room = rooms.find((candidate) => candidate.id === roomId)
  const roomName = room?.title ?? ''
  const questions = useMemo(() => questionsForRoom(allQuestions, roomId), [allQuestions, roomId])

  const [sort, setSort] = useState<QuestionSort>('manual')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
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
    { value: 'manual', label: t('loci.sort.manual'), icon: <GripVertical className="size-4" /> },
    { value: 'recent', label: t('loci.sort.recent'), icon: <Clock className="size-4" /> },
    { value: 'name', label: t('loci.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
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
        toast.success(t('loci.row.duplicated'))
      }}
      onDelete={() => setPendingDeleteId(question.id)}
    />
  )

  const confirmSingleDelete = () => {
    if (!pendingDeleteId) return
    void deleteQuestion(questionStore, pendingDeleteId)
    toast.success(t('loci.transfer.deleted'))
  }
  const confirmBulkDelete = () => {
    const ids = [...selectedIds]
    void Promise.all(ids.map((id) => deleteQuestion(questionStore, id)))
    toast.success(t('loci.transfer.deletedMany', { count: ids.length }))
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

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const data = await readContentFile(file)
      // Questions only — any cards in the file are dropped (they import from the Cards page).
      const applied = await applyRoomContent(locusStore, questionStore, roomId, {
        loci: [],
        questions: data.questions,
      })
      if (applied.questions === 0) {
        toast.error(t('questions.transfer.noneFound'))
        return
      }
      toast.success(t('questions.transfer.imported', { count: applied.questions }))
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('questions.transfer.importFailed'),
      )
    }
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
        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={() => setBulkDeleteOpen(true)}
          className={cn(
            'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-control text-(length:--p-text-label) font-semibold',
            'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]',
            'transition-transform active:scale-[0.97] disabled:opacity-40',
          )}
        >
          <Trash2 className="size-[17px]" aria-hidden />
          {t('common.delete')}
        </button>
      </div>
    </div>
  )

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t('questions.title')}
          subtitle={room?.title}
          onBack={onBack}
          backLabel={t('roomHub.back')}
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

        <section aria-label={t('questions.inRoom')} className="space-y-3">
          {!selectMode && questions.length > 1 ? (
            <div className="flex justify-end">
              <SortControl
                label={t('loci.sortLabel')}
                value={sort}
                options={sortOptions}
                onChange={setSort}
              />
            </div>
          ) : null}

          {selectMode ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-(length:--p-text-label) font-semibold text-heading"
              >
                {allSelected ? t('loci.select.clearAll') : t('loci.select.selectAll')}
              </button>
              <span className="text-(length:--p-text-label) font-semibold text-muted-foreground">
                {t('loci.select.count', { count: selectedCount })}
              </span>
              <button
                type="button"
                onClick={exitSelect}
                className="text-(length:--p-text-label) font-semibold text-accent"
              >
                {t('loci.select.done')}
              </button>
            </div>
          ) : null}

          {questions.length === 0 ? (
            <EmptyQuestions />
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
        title={t('loci.delete.questionTitle')}
        description={t('loci.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmSingleDelete}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('loci.delete.bulkTitle', { count: selectedCount })}
        description={t('loci.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkDelete}
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
            badge="CSV · JSON"
            title={t('questions.transfer.importFile')}
            subtitle={t('questions.transfer.importFileSub')}
            onClick={() => pickFile('.csv,.json')}
          />
        </div>
      </Sheet>

      {/* Export sheet — save this room's questions. */}
      <Sheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={t('questions.transfer.exportTitle')}
        description={t('questions.transfer.exportSubtitle')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<FileJson className="size-5" aria-hidden />}
            tone="brand"
            badge="JSON"
            trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
            title={t('questions.transfer.exportJson')}
            subtitle={t('questions.transfer.exportJsonSub')}
            disabled={!hasQuestions}
            onClick={() => closeExport(() => exportRoomJson(roomName, [], questions))}
          />
          <ImportRow
            icon={<FileText className="size-5" aria-hidden />}
            tone="positive"
            badge="CSV"
            trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
            title={t('questions.transfer.exportCsv')}
            subtitle={t('questions.transfer.exportCsvSub')}
            disabled={!hasQuestions}
            onClick={() => closeExport(() => exportQuestionsCsv(roomName, questions))}
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

function EmptyQuestions() {
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
    </div>
  )
}
