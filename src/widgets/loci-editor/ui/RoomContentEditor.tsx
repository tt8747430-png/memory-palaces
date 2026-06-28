import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDownAZ,
  BookOpen,
  ClipboardPaste,
  Clock,
  Download,
  FileText,
  Flag,
  GraduationCap,
  GripVertical,
  HelpCircle,
  MapPin,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  lociForRoom,
  type Locus,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import {
  type Question,
  questionsForRoom,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import {
  createLocus,
  deleteLocus,
  duplicateLocus,
  editLocus,
  markLociKnown,
  reorderLoci,
  resetLociSrs,
  toggleLocusFlag,
} from '@/features/locus'
import {
  createQuestion,
  deleteQuestion,
  duplicateQuestion,
  editQuestion,
  reorderQuestions,
} from '@/features/question'
import type { ContentSort } from '@/entities/preferences'
import {
  applyRoomContent,
  exportLociAnki,
  exportLociCsv,
  exportQuestionsCsv,
  exportRoomJson,
  readAnkiFile,
  readContentFile,
} from '@/features/content'
import { cn, ContentImportError, parsePastedLoci, parseVerses } from '@/shared/lib'
import {
  ConfirmDialog,
  ImportRow,
  SegmentedControl,
  Sheet,
  SortControl,
  type SortControlOption,
  SpeedDial,
} from '@/shared/ui'
import { CardRow, QuestionRow, type RowDragHandle } from './ContentRows'
import {
  type CardData,
  CardEditorSheet,
  type QuestionData,
  QuestionEditorSheet,
} from './EditorSheets'
import { PasteSheet } from './PasteSheet'

export interface RoomContentEditorProps {
  roomId: string
  /** Used for export filenames. */
  roomName: string
  /** Filters the active tab. Driven by the room header's search; empty = not searching. */
  searchQuery?: string
  /** Clears + closes the room-header search (wired to the "clear" affordance on no results). */
  onClearSearch?: () => void
  /** Multi-select is entered from the room header (or a long-press on a row); pass this pair
   * to drive it from the parent. Omit both to let the editor own select mode itself. */
  selectMode?: boolean
  onSelectModeChange?: (on: boolean) => void
  /** Content ordering, persisted by the host page. Pass this pair to drive it; omit both to
   * let the editor own an internal sort (default `manual`), so it works standalone. */
  sort?: ContentSort
  onSortChange?: (sort: ContentSort) => void
}

type Tab = 'loci' | 'questions'
type EditorTarget =
  | { kind: 'locus'; locus: Locus | null }
  | { kind: 'question'; question: Question | null }
  | null

/**
 * The room's content-management surface: Cards / Questions tabs with inline quick-add,
 * search, multi-select bulk actions, import/export, and full editor sheets. Rendered
 * inline inside the room hub so studying and editing a room live on one page. Reads its
 * stores and drives the create/edit/reorder/duplicate commands directly.
 */
export function RoomContentEditor({
  roomId,
  roomName,
  searchQuery,
  onClearSearch,
  selectMode: controlledSelectMode,
  onSelectModeChange,
  sort: controlledSort,
  onSortChange,
}: RoomContentEditorProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const allLoci = useLocusStore(selectLoci)
  const allQuestions = useQuestionStore(selectQuestions)

  useEffect(() => {
    locusStore.getState().start()
    questionStore.getState().start()
  }, [locusStore, questionStore])

  const loci = useMemo(() => lociForRoom(allLoci, roomId), [allLoci, roomId])
  const questions = useMemo(() => questionsForRoom(allQuestions, roomId), [allQuestions, roomId])

  const [tab, setTab] = useState<Tab>('loci')
  // Select mode is controllable: the room header drives it when both props are passed, but the
  // editor keeps an internal fallback so it works standalone (and in isolation tests).
  const [internalSelectMode, setInternalSelectMode] = useState(false)
  const selectMode = controlledSelectMode ?? internalSelectMode
  const setSelectMode = (on: boolean) => {
    if (controlledSelectMode === undefined) setInternalSelectMode(on)
    onSelectModeChange?.(on)
  }
  // Sort is controllable like select mode: the host persists it, but the editor keeps an
  // internal fallback so it works standalone (and in isolation tests).
  const [internalSort, setInternalSort] = useState<ContentSort>('manual')
  const sort = controlledSort ?? internalSort
  const setSort = (next: ContentSort) => {
    if (controlledSort === undefined) setInternalSort(next)
    onSortChange?.(next)
  }
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editor, setEditor] = useState<EditorTarget>(null)
  const [pendingDelete, setPendingDelete] = useState<{ kind: Tab; id: string } | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [verseOpen, setVerseOpen] = useState(false)

  // Leaving select mode clears the picks so the next entry (header control or long-press) starts
  // empty — needed now that the flag can be flipped off from outside the editor.
  useEffect(() => {
    if (!selectMode) setSelectedIds(new Set())
  }, [selectMode])

  const fileRef = useRef<HTMLInputElement>(null)
  const importKind = useRef<'content' | 'anki'>('content')

  // `due` and `flagged` are card-only signals; the Questions tab falls back to `manual`.
  const questionsSort: ContentSort = sort === 'due' || sort === 'flagged' ? 'manual' : sort
  const sortedLoci = useMemo(() => sortLoci(loci, sort), [loci, sort])
  const sortedQuestions = useMemo(
    () => sortQuestions(questions, questionsSort),
    [questions, questionsSort],
  )

  const needle = (searchQuery ?? '').trim().toLowerCase()
  const visibleLoci = useMemo(
    () =>
      needle
        ? sortedLoci.filter((l) =>
            [l.front, l.back, l.hint, l.tip]
              .filter(Boolean)
              .some((field) => (field as string).toLowerCase().includes(needle)),
          )
        : sortedLoci,
    [sortedLoci, needle],
  )
  const visibleQuestions = useMemo(
    () =>
      needle
        ? sortedQuestions.filter((q) =>
            [q.prompt, ...q.options].some((field) => field.toLowerCase().includes(needle)),
          )
        : sortedQuestions,
    [sortedQuestions, needle],
  )

  const isLoci = tab === 'loci'
  const total = isLoci ? loci.length : questions.length
  const visible = isLoci ? visibleLoci : visibleQuestions
  const hasContent = loci.length > 0 || questions.length > 0
  const selectedCount = selectedIds.size
  const allVisibleSelected = visible.length > 0 && visible.every((item) => selectedIds.has(item.id))

  // The sort applied to the active tab; cards drive the full option set, questions a subset.
  const activeSort = isLoci ? sort : questionsSort
  // Hand-arranging is offered only in manual sort, and never while searching or selecting
  // (you reorder the whole list, not a filtered subset).
  const reorderable = activeSort === 'manual' && !needle && !selectMode
  const sortOptions: SortControlOption<ContentSort>[] = isLoci
    ? [
        {
          value: 'manual',
          label: t('loci.sort.manual'),
          icon: <GripVertical className="size-4" />,
        },
        { value: 'recent', label: t('loci.sort.recent'), icon: <Clock className="size-4" /> },
        { value: 'name', label: t('loci.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
        { value: 'due', label: t('loci.sort.due'), icon: <Sparkles className="size-4" /> },
        { value: 'flagged', label: t('loci.sort.flagged'), icon: <Flag className="size-4" /> },
      ]
    : [
        {
          value: 'manual',
          label: t('loci.sort.manual'),
          icon: <GripVertical className="size-4" />,
        },
        { value: 'recent', label: t('loci.sort.recent'), icon: <Clock className="size-4" /> },
        { value: 'name', label: t('loci.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
      ]

  const renderCard = (locus: Locus, dragHandle?: RowDragHandle, dragging = false) => (
    <CardRow
      key={locus.id}
      locus={locus}
      index={sortedLoci.indexOf(locus)}
      selectMode={selectMode}
      selected={selectedIds.has(locus.id)}
      reorderable={reorderable}
      dragHandle={dragHandle}
      dragging={dragging}
      onToggleSelect={() => toggleSelect(locus.id)}
      onRequestSelect={() => requestSelect(locus.id)}
      onEdit={() => setEditor({ kind: 'locus', locus })}
      onDuplicate={() => {
        void duplicateLocus(locusStore, locus.id)
        toast.success(t('loci.row.duplicated'))
      }}
      onDelete={() => setPendingDelete({ kind: 'loci', id: locus.id })}
      onToggleFlag={() => void toggleLocusFlag(locusStore, locus.id)}
      onMarkKnown={() => {
        void markLociKnown(locusStore, [locus.id])
        toast.success(t('loci.row.markedKnown'))
      }}
      onResetSrs={() => {
        void resetLociSrs(locusStore, [locus.id])
        toast.success(t('loci.row.scheduleReset'))
      }}
    />
  )

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
      onToggleSelect={() => toggleSelect(question.id)}
      onRequestSelect={() => requestSelect(question.id)}
      onEdit={() => setEditor({ kind: 'question', question })}
      onDuplicate={() => {
        void duplicateQuestion(questionStore, question.id)
        toast.success(t('loci.row.duplicated'))
      }}
      onDelete={() => setPendingDelete({ kind: 'questions', id: question.id })}
    />
  )

  const changeTab = (next: Tab) => {
    setTab(next)
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

  // Long-press enters select mode with the pressed item already picked.
  const requestSelect = (id: string) => {
    setSelectMode(true)
    setSelectedIds((prev) => new Set(prev).add(id))
  }

  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) visible.forEach((item) => next.delete(item.id))
      else visible.forEach((item) => next.add(item.id))
      return next
    })

  const exitSelect = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const pickFile = (accept: string, kind: 'content' | 'anki') => {
    setTransferOpen(false)
    importKind.current = kind
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
      const data =
        importKind.current === 'anki' ? await readAnkiFile(file) : await readContentFile(file)
      const applied = await applyRoomContent(locusStore, questionStore, roomId, data)
      toast.success(
        t('loci.transfer.imported', { loci: applied.loci, questions: applied.questions }),
      )
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('loci.transfer.importFailed'),
      )
    }
  }

  const applyPaste = (text: string) => {
    const parsed = parsePastedLoci(text)
    setPasteOpen(false)
    if (parsed.length === 0) {
      toast.error(t('loci.transfer.noneParsed'))
      return
    }
    void applyRoomContent(locusStore, questionStore, roomId, { loci: parsed, questions: [] }).then(
      (applied) => toast.success(t('loci.transfer.added', { count: applied.loci })),
    )
  }

  const applyVerses = (text: string) => {
    const parsed = parseVerses(text)
    setVerseOpen(false)
    if (parsed.length === 0) {
      toast.error(t('loci.transfer.noneParsed'))
      return
    }
    void applyRoomContent(locusStore, questionStore, roomId, { loci: parsed, questions: [] }).then(
      (applied) => toast.success(t('loci.transfer.added', { count: applied.loci })),
    )
  }

  const closeTransfer = (run: () => void) => {
    setTransferOpen(false)
    run()
  }

  const confirmSingleDelete = () => {
    if (!pendingDelete) return
    if (pendingDelete.kind === 'loci') void deleteLocus(locusStore, pendingDelete.id)
    else void deleteQuestion(questionStore, pendingDelete.id)
    toast.success(t('loci.transfer.deleted'))
  }

  const confirmBulkDelete = () => {
    const ids = [...selectedIds]
    if (isLoci) void Promise.all(ids.map((id) => deleteLocus(locusStore, id)))
    else void Promise.all(ids.map((id) => deleteQuestion(questionStore, id)))
    toast.success(t('loci.transfer.deletedMany', { count: ids.length }))
    exitSelect()
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={onFile}
        aria-hidden
        tabIndex={-1}
      />

      {/* Toolbar: tabs + import/export */}
      <div className="mb-3 flex items-center gap-2">
        <SegmentedControl<Tab>
          className="flex-1"
          aria-label={t('loci.tabs.label')}
          value={tab}
          onChange={changeTab}
          options={[
            { value: 'loci', label: `${t('loci.tabs.cards')} · ${loci.length}` },
            { value: 'questions', label: `${t('loci.tabs.questions')} · ${questions.length}` },
          ]}
        />
      </div>

      {/* Sort control: hidden while searching or selecting, and below 2 items there's
          nothing to order. Manual sort grows the per-row grips. */}
      {!selectMode && !needle && total > 1 ? (
        <div className="mb-3 flex justify-end">
          <SortControl
            label={t('loci.sortLabel')}
            value={activeSort}
            options={sortOptions}
            onChange={setSort}
          />
        </div>
      ) : null}

      {/* Select mode is entered from the room header's control or a long-press on a row; this
          bar appears only while selecting (the rows carry their own checkboxes). */}
      {selectMode ? (
        <div className="flex items-center justify-between gap-3 pb-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-[length:var(--p-text-label)] font-semibold text-heading"
          >
            {allVisibleSelected ? t('loci.select.clearAll') : t('loci.select.selectAll')}
          </button>
          <span className="text-[length:var(--p-text-label)] font-semibold text-muted-foreground">
            {t('loci.select.count', { count: selectedCount })}
          </span>
          <button
            type="button"
            onClick={exitSelect}
            className="text-[length:var(--p-text-label)] font-semibold text-accent"
          >
            {t('loci.select.done')}
          </button>
        </div>
      ) : null}

      {/* List */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          {isLoci ? (
            total === 0 ? (
              <EmptyContent kind="loci" />
            ) : visible.length === 0 ? (
              <NoResults onClear={() => onClearSearch?.()} />
            ) : (
              <ReorderableList
                items={visibleLoci}
                reorderable={reorderable}
                onReorder={(ids) => void reorderLoci(locusStore, ids)}
                renderItem={renderCard}
              />
            )
          ) : total === 0 ? (
            <EmptyContent kind="questions" />
          ) : visible.length === 0 ? (
            <NoResults onClear={() => onClearSearch?.()} />
          ) : (
            <ReorderableList
              items={visibleQuestions}
              reorderable={reorderable}
              onReorder={(ids) => void reorderQuestions(questionStore, ids)}
              renderItem={renderQuestion}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom bar: bulk actions in select mode, otherwise Add */}
      {selectMode ? (
        <div className="sticky bottom-2 z-20 mt-3 flex items-center gap-2 rounded-card-featured bg-card/95 p-2.5 shadow-elevated backdrop-blur-xl">
          {isLoci ? (
            <>
              <BulkButton
                disabled={selectedCount === 0}
                icon={<GraduationCap className="size-[17px]" aria-hidden />}
                label={t('loci.bulk.known')}
                onClick={() => {
                  void markLociKnown(locusStore, [...selectedIds])
                  toast.success(t('loci.row.markedKnown'))
                  exitSelect()
                }}
              />
              <BulkButton
                disabled={selectedCount === 0}
                icon={<RotateCcw className="size-[17px]" aria-hidden />}
                label={t('loci.bulk.reset')}
                onClick={() => {
                  void resetLociSrs(locusStore, [...selectedIds])
                  toast.success(t('loci.row.scheduleReset'))
                  exitSelect()
                }}
              />
            </>
          ) : null}
          <BulkButton
            disabled={selectedCount === 0}
            tone="danger"
            icon={<Trash2 className="size-[17px]" aria-hidden />}
            label={t('common.delete')}
            onClick={() => setBulkDeleteOpen(true)}
          />
        </div>
      ) : null}

      {/* Editor sheets */}
      <CardEditorSheet
        open={editor?.kind === 'locus'}
        initial={editor?.kind === 'locus' ? editor.locus : null}
        onOpenChange={(open) => !open && setEditor(null)}
        onSave={(data: CardData) => {
          if (editor?.kind === 'locus' && editor.locus) {
            void editLocus(locusStore, editor.locus.id, data)
            toast.success(t('loci.editor.updated'))
          } else {
            void createLocus(locusStore, roomId, data)
            toast.success(t('loci.editor.added'))
          }
          setEditor(null)
        }}
        onSaveAndAddAnother={(data: CardData) => {
          void createLocus(locusStore, roomId, data)
          toast.success(t('loci.editor.addedNext'))
        }}
      />

      <QuestionEditorSheet
        open={editor?.kind === 'question'}
        initial={editor?.kind === 'question' ? editor.question : null}
        onOpenChange={(open) => !open && setEditor(null)}
        onSave={(data: QuestionData) => {
          if (editor?.kind === 'question' && editor.question) {
            void editQuestion(questionStore, editor.question.id, data)
            toast.success(t('questions.editor.updated'))
          } else {
            void createQuestion(questionStore, roomId, data)
            toast.success(t('questions.editor.added'))
          }
          setEditor(null)
        }}
      />

      {/* Transfer + paste sheets */}
      <Sheet
        open={transferOpen}
        onOpenChange={setTransferOpen}
        title={t('loci.transfer.title')}
        description={t('loci.transfer.subtitle')}
      >
        <div className="flex flex-col gap-5 pb-2">
          <TransferGroup label={t('loci.transfer.importGroup')}>
            <ImportRow
              icon={<Upload className="size-5" aria-hidden />}
              title={t('loci.transfer.importFile')}
              subtitle={t('loci.transfer.importFileSub')}
              onClick={() => pickFile('.json,.csv', 'content')}
            />
            <ImportRow
              icon={<FileText className="size-5" aria-hidden />}
              title={t('loci.transfer.importAnki')}
              subtitle={t('loci.transfer.importAnkiSub')}
              onClick={() => pickFile('.txt,.tsv', 'anki')}
            />
            <ImportRow
              icon={<ClipboardPaste className="size-5" aria-hidden />}
              title={t('loci.transfer.pasteList')}
              subtitle={t('loci.transfer.pasteListSub')}
              onClick={() => closeTransfer(() => setPasteOpen(true))}
            />
            <ImportRow
              icon={<BookOpen className="size-5" aria-hidden />}
              title={t('loci.transfer.pasteVerses')}
              subtitle={t('loci.transfer.pasteVersesSub')}
              onClick={() => closeTransfer(() => setVerseOpen(true))}
            />
          </TransferGroup>

          <TransferGroup label={t('loci.transfer.exportGroup')}>
            <ImportRow
              icon={<Download className="size-5" aria-hidden />}
              title={t('loci.transfer.exportJson')}
              subtitle={t('loci.transfer.exportJsonSub')}
              disabled={!hasContent}
              onClick={() => closeTransfer(() => exportRoomJson(roomName, loci, questions))}
            />
            <ImportRow
              icon={<Download className="size-5" aria-hidden />}
              title={t('loci.transfer.exportCards')}
              subtitle={t('loci.transfer.exportCardsSub')}
              disabled={loci.length === 0}
              onClick={() => closeTransfer(() => exportLociCsv(roomName, loci))}
            />
            <ImportRow
              icon={<Download className="size-5" aria-hidden />}
              title={t('loci.transfer.exportQuestions')}
              subtitle={t('loci.transfer.exportQuestionsSub')}
              disabled={questions.length === 0}
              onClick={() => closeTransfer(() => exportQuestionsCsv(roomName, questions))}
            />
            <ImportRow
              icon={<Download className="size-5" aria-hidden />}
              title={t('loci.transfer.exportAnki')}
              subtitle={t('loci.transfer.exportAnkiSub')}
              disabled={loci.length === 0}
              onClick={() => closeTransfer(() => exportLociAnki(roomName, loci))}
            />
          </TransferGroup>
        </div>
      </Sheet>
      <PasteSheet
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        title={t('loci.transfer.pasteTitle')}
        description={t('loci.transfer.pasteHint')}
        placeholder={t('loci.transfer.pastePlaceholder')}
        applyLabel={t('loci.transfer.pasteApply')}
        onApply={applyPaste}
      />
      <PasteSheet
        open={verseOpen}
        onOpenChange={setVerseOpen}
        title={t('loci.transfer.verseTitle')}
        description={t('loci.transfer.verseHint')}
        placeholder={t('loci.transfer.versePlaceholder')}
        applyLabel={t('loci.transfer.pasteApply')}
        onApply={applyVerses}
      />

      {/* Delete confirms */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={
          pendingDelete?.kind === 'questions'
            ? t('loci.delete.questionTitle')
            : t('loci.delete.cardTitle')
        }
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

      <SpeedDial
        label={t('loci.quickActions')}
        className="bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]"
        actions={[
          {
            id: 'card',
            label: t('loci.addCard'),
            icon: <Plus className="size-5" aria-hidden />,
            onSelect: () => setEditor({ kind: 'locus', locus: null }),
          },
          {
            id: 'question',
            label: t('questions.addQuestion'),
            icon: <HelpCircle className="size-5" aria-hidden />,
            onSelect: () => setEditor({ kind: 'question', question: null }),
          },
          {
            id: 'import',
            label: t('loci.transfer.importShort'),
            icon: <Upload className="size-5" aria-hidden />,
            onSelect: () => setTransferOpen(true),
          },
        ]}
      />
    </div>
  )
}

/** New cards (no schedule yet) are effectively due now, so they sort to the front. */
const dueKey = (locus: Locus) => locus.srs?.due ?? ''

/** Cards in the chosen order. `manual` is the stored order (the list arrives pre-sorted by
 * it); the rest are derived. JS sort is stable, so equal keys keep the manual sequence. */
function sortLoci(loci: Locus[], sort: ContentSort): Locus[] {
  switch (sort) {
    case 'name':
      return [...loci].sort((a, b) => a.front.localeCompare(b.front))
    case 'recent':
      return [...loci].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'due':
      return [...loci].sort((a, b) => dueKey(a).localeCompare(dueKey(b)))
    case 'flagged':
      return [...loci].sort((a, b) => Number(b.flagged) - Number(a.flagged))
    case 'manual':
      return loci
  }
}

/** Questions in the chosen order. Only `manual`/`recent`/`name` apply; the card-only
 * `due`/`flagged` are mapped to `manual` by the caller before this runs. */
function sortQuestions(questions: Question[], sort: ContentSort): Question[] {
  switch (sort) {
    case 'name':
      return [...questions].sort((a, b) => a.prompt.localeCompare(b.prompt))
    case 'recent':
      return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    default:
      return questions
  }
}

/** Wraps a row as a dnd-kit sortable: the wrapper carries the transform/transition and
 * ghosts the source while its overlay clone is in hand; the row gets the grip's activator
 * wiring through the render prop. */
function SortableContentRow({
  id,
  children,
}: {
  id: string
  children: (handle: RowDragHandle) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-40')}
    >
      {children({ ref: setActivatorNodeRef, props: { ...attributes, ...listeners } })}
    </div>
  )
}

/** Renders a list of rows, drag-reorderable when `reorderable`. Off, it's a plain map; on,
 * it lifts a clone into a {@link DragOverlay} and commits the new id order on drop. Shared
 * by the cards and questions tabs. */
function ReorderableList<T extends { id: string }>({
  items,
  reorderable,
  onReorder,
  renderItem,
}: {
  items: T[]
  reorderable: boolean
  onReorder: (orderedIds: string[]) => void
  renderItem: (item: T, dragHandle?: RowDragHandle, dragging?: boolean) => ReactNode
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!reorderable) return <>{items.map((item) => renderItem(item))}</>

  const active = activeId ? items.find((item) => item.id === activeId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragEnd={(event: DragEndEvent) => {
        setActiveId(null)
        const { active: from, over } = event
        if (!over || from.id === over.id) return
        const fromIndex = items.findIndex((item) => item.id === from.id)
        const toIndex = items.findIndex((item) => item.id === over.id)
        if (fromIndex < 0 || toIndex < 0) return
        onReorder(arrayMove(items, fromIndex, toIndex).map((item) => item.id))
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <SortableContentRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableContentRow>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {active ? renderItem(active, undefined, true) : null}
      </DragOverlay>
    </DndContext>
  )
}

function EmptyContent({ kind }: { kind: Tab }) {
  const { t } = useTranslation()
  const isLoci = kind === 'loci'
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent">
        {isLoci ? (
          <MapPin className="size-6" aria-hidden />
        ) : (
          <HelpCircle className="size-6" aria-hidden />
        )}
      </div>
      <h3 className="mb-1.5 text-balance text-[length:var(--p-text-sub)] font-semibold text-heading">
        {isLoci ? t('loci.emptyTitle') : t('questions.emptyTitle')}
      </h3>
      <p className="max-w-[34ch] text-pretty text-[length:var(--p-text-body)] text-muted-foreground">
        {isLoci ? t('loci.emptyHint') : t('questions.emptyHint')}
      </p>
    </div>
  )
}

function NoResults({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-card bg-card-glass p-6 text-center shadow-rest">
      <p className="text-[length:var(--p-text-body)] text-muted-foreground">
        {t('loci.noResults')}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-[length:var(--p-text-label)] font-semibold text-accent"
      >
        {t('loci.clearSearch')}
      </button>
    </div>
  )
}

function TransferGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[length:var(--p-text-label)] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function BulkButton({
  icon,
  label,
  onClick,
  disabled,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-control text-[length:var(--p-text-label)] font-semibold',
        'transition-transform active:scale-[0.97] disabled:opacity-40',
        tone === 'danger'
          ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
          : 'bg-info-surface text-heading',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
