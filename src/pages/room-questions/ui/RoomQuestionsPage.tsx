import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowDownAZ, Brain, Clock, GripVertical, HelpCircle, Play, Plus, Trash2 } from 'lucide-react'
import {
  type Question,
  questionsForRoom,
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import {
  selectIsReady as selectRoomsReady,
  selectRooms,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import { selectEffectivePreferences, usePreferencesStore } from '@/entities/preferences'
import { deleteQuestion, duplicateQuestion, reorderQuestions } from '@/features/question'
import { cn } from '@/shared/lib'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  ScreenHeader,
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
  const questions = useMemo(() => questionsForRoom(allQuestions, roomId), [allQuestions, roomId])

  const [sort, setSort] = useState<QuestionSort>('manual')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

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

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  const hasQuestions = questions.length > 0

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
                  ? t(questions.length === 1 ? 'questions.testReadyOne' : 'questions.testReadyOther', {
                      count: questions.length,
                    })
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

      {selectMode ? (
        <div className="sticky bottom-2 z-20 mx-4 flex items-center gap-2 rounded-card-featured bg-card/95 p-2.5 shadow-elevated backdrop-blur-xl">
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
      ) : null}

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

      {/* Hidden while selecting, where the bulk bar owns the bottom of the screen (otherwise
          the dial overlaps the bar's trailing action). */}
      {!selectMode ? (
        <SpeedDial
          label={t('questions.addQuestion')}
          className="bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]"
          actions={[
            {
              id: 'question',
              label: t('questions.addQuestion'),
              icon: <Plus className="size-5" aria-hidden />,
              onSelect: onAddQuestion,
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
