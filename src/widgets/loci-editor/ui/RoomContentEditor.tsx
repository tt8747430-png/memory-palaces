import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  BookOpen,
  ClipboardPaste,
  Download,
  FileText,
  GraduationCap,
  HelpCircle,
  ListChecks,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  lociForRoom,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
  type Locus,
} from '@/entities/locus'
import {
  questionsForRoom,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
  type Question,
} from '@/entities/question'
import {
  createLocus,
  deleteLocus,
  duplicateLocus,
  editLocus,
  markLociKnown,
  moveLocus,
  resetLociSrs,
  toggleLocusFlag,
} from '@/features/locus'
import {
  createQuestion,
  deleteQuestion,
  duplicateQuestion,
  editQuestion,
  moveQuestion,
} from '@/features/question'
import {
  applyRoomContent,
  exportLociAnki,
  exportLociCsv,
  exportQuestionsCsv,
  exportRoomJson,
  readAnkiFile,
  readContentFile,
} from '@/features/content'
import { ContentImportError, cn, parsePastedLoci, parseVerses } from '@/shared/lib'
import {
  Button,
  ConfirmDialog,
  ImportRow,
  SegmentedControl,
  Sheet,
  SpeedDial,
  TextField,
} from '@/shared/ui'
import { CardRow, QuestionRow } from './ContentRows'
import {
  CardEditorSheet,
  QuestionEditorSheet,
  type CardData,
  type QuestionData,
} from './EditorSheets'
import { PasteSheet } from './PasteSheet'

export interface RoomContentEditorProps {
  roomId: string
  /** Used for export filenames. */
  roomName: string
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
 * stores and drives the create/edit/move/duplicate commands directly.
 */
export function RoomContentEditor({ roomId, roomName }: RoomContentEditorProps) {
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
  const [query, setQuery] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editor, setEditor] = useState<EditorTarget>(null)
  const [pendingDelete, setPendingDelete] = useState<{ kind: Tab; id: string } | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [verseOpen, setVerseOpen] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const importKind = useRef<'content' | 'anki'>('content')

  const needle = query.trim().toLowerCase()
  const visibleLoci = useMemo(
    () =>
      needle
        ? loci.filter((l) =>
            [l.front, l.back, l.hint, l.tip]
              .filter(Boolean)
              .some((field) => (field as string).toLowerCase().includes(needle)),
          )
        : loci,
    [loci, needle],
  )
  const visibleQuestions = useMemo(
    () =>
      needle
        ? questions.filter((q) =>
            [q.prompt, ...q.options].some((field) => field.toLowerCase().includes(needle)),
          )
        : questions,
    [questions, needle],
  )

  const isLoci = tab === 'loci'
  const total = isLoci ? loci.length : questions.length
  const visible = isLoci ? visibleLoci : visibleQuestions
  const hasItems = total > 0
  const hasContent = loci.length > 0 || questions.length > 0
  const selectedCount = selectedIds.size
  const allVisibleSelected = visible.length > 0 && visible.every((item) => selectedIds.has(item.id))

  const changeTab = (next: Tab) => {
    setTab(next)
    setSelectMode(false)
    setSelectedIds(new Set())
    setQuery('')
  }

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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

      {/* Search + selection controls */}
      {hasItems ? (
        <div className="pb-2">
          {selectMode ? (
            <div className="flex items-center justify-between gap-3">
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
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <TextField
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isLoci ? t('loci.searchCards') : t('loci.searchQuestions')}
                  aria-label={isLoci ? t('loci.searchCards') : t('loci.searchQuestions')}
                  className="pl-9 pr-9"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label={t('loci.clearSearch')}
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-heading"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-control bg-card px-3 text-[length:var(--p-text-label)] font-semibold text-heading shadow-rest active:scale-[0.97]"
              >
                <ListChecks className="size-[17px]" aria-hidden />
                {t('loci.select.select')}
              </button>
            </div>
          )}
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
              <EmptyContent
                kind="loci"
                onAdd={() => setEditor({ kind: 'locus', locus: null })}
                onImport={() => setTransferOpen(true)}
              />
            ) : visible.length === 0 ? (
              <NoResults onClear={() => setQuery('')} />
            ) : (
              visibleLoci.map((locus) => (
                <CardRow
                  key={locus.id}
                  locus={locus}
                  index={loci.indexOf(locus)}
                  selectMode={selectMode}
                  selected={selectedIds.has(locus.id)}
                  canMoveUp={loci.indexOf(locus) > 0}
                  canMoveDown={loci.indexOf(locus) < loci.length - 1}
                  onToggleSelect={() => toggleSelect(locus.id)}
                  onEdit={() => setEditor({ kind: 'locus', locus })}
                  onDuplicate={() => {
                    void duplicateLocus(locusStore, locus.id)
                    toast.success(t('loci.row.duplicated'))
                  }}
                  onMove={(dir) => void moveLocus(locusStore, locus.id, dir)}
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
              ))
            )
          ) : total === 0 ? (
            <EmptyContent
              kind="questions"
              onAdd={() => setEditor({ kind: 'question', question: null })}
              onImport={() => setTransferOpen(true)}
            />
          ) : visible.length === 0 ? (
            <NoResults onClear={() => setQuery('')} />
          ) : (
            visibleQuestions.map((question) => (
              <QuestionRow
                key={question.id}
                question={question}
                index={questions.indexOf(question)}
                selectMode={selectMode}
                selected={selectedIds.has(question.id)}
                canMoveUp={questions.indexOf(question) > 0}
                canMoveDown={questions.indexOf(question) < questions.length - 1}
                onToggleSelect={() => toggleSelect(question.id)}
                onEdit={() => setEditor({ kind: 'question', question })}
                onDuplicate={() => {
                  void duplicateQuestion(questionStore, question.id)
                  toast.success(t('loci.row.duplicated'))
                }}
                onMove={(dir) => void moveQuestion(questionStore, question.id, dir)}
                onDelete={() => setPendingDelete({ kind: 'questions', id: question.id })}
              />
            ))
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

function EmptyContent({
  kind,
  onAdd,
  onImport,
}: {
  kind: Tab
  onAdd: () => void
  onImport: () => void
}) {
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
      <p className="mb-5 max-w-[34ch] text-pretty text-[length:var(--p-text-body)] text-muted-foreground">
        {isLoci ? t('loci.emptyBody') : t('questions.emptyBody')}
      </p>
      <div className="flex items-center gap-2">
        <Button onClick={onAdd}>
          <Plus className="size-[18px]" aria-hidden />
          {isLoci ? t('loci.addCard') : t('questions.addQuestion')}
        </Button>
        <Button variant="ghost" onClick={onImport}>
          <Upload className="size-[18px]" aria-hidden />
          {t('loci.transfer.importShort')}
        </Button>
      </div>
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
