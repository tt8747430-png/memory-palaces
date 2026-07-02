import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
  Landmark,
  MapPin,
  Plus,
  RotateCcw,
  SlidersHorizontal,
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
  questionsForRoom,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import {
  deleteLocus,
  duplicateLocus,
  markLociKnown,
  reorderLoci,
  resetLociSrs,
  toggleLocusFlag,
} from '@/features/locus'
import {
  type ContentSort,
  selectEffectivePreferences,
  usePreferencesStore,
} from '@/entities/preferences'
import {
  applyRoomContent,
  exportLociAnki,
  exportLociCsv,
  exportQuestionsCsv,
  exportRoomJson,
  readAnkiFile,
  readContentFile,
} from '@/features/content'
import {
  cardMaturityCounts,
  cn,
  ContentImportError,
  parsePastedLoci,
  parseVerses,
  srsStatus,
} from '@/shared/lib'
import {
  Button,
  CardMaturityOverview,
  ConfirmDialog,
  ImportRow,
  Sheet,
  SortControl,
  type SortControlOption,
  SpeedDial,
  Switch,
} from '@/shared/ui'
import { CardBrowser } from './CardBrowser'
import { CardRow, type RowDragHandle } from './ContentRows'
import { PasteSheet } from './PasteSheet'
import { ReorderableList } from './ReorderableList'

export interface RoomContentEditorProps {
  roomId: string
  /** Used for export filenames. */
  roomName: string
  /** Filters the cards list. Driven by the room header's search; empty = not searching. */
  searchQuery?: string
  /** Whether the room-header search is open, regardless of the query — so the sort control
   * steps aside the moment search takes over, not only once something is typed. */
  searching?: boolean
  /** Clears + closes the room-header search (wired to the "clear" affordance on no results). */
  onClearSearch?: () => void
  /** Multi-select, entered by a long-press on a row. */
  selectMode: boolean
  onSelectModeChange: (on: boolean) => void
  /** Content ordering, persisted by the host page. */
  sort: ContentSort
  onSortChange: (sort: ContentSort) => void
  /** Open the full-screen card editor (add / edit). */
  onAddCard: () => void
  onEditCard: (cardId: string) => void
}

/** Card maturity buckets the filter can narrow to — mirrors `srsStatus`. */
type MaturityKey = 'new' | 'learning' | 'known'

/**
 * The room's card-management surface: "Cards in this room" with its maturity overview, search,
 * sort + filter, multi-select bulk actions, import/export, and drag-reorder. Rendered inline in
 * the room hub; add/edit open the full-screen editor. Questions live on their own page.
 * Still reads questions for the room-level import/export (a room export carries both).
 */
export function RoomContentEditor({
  roomId,
  roomName,
  searchQuery,
  searching = false,
  onClearSearch,
  selectMode,
  onSelectModeChange,
  sort,
  onSortChange,
  onAddCard,
  onEditCard,
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

  const cardSwipe = usePreferencesStore(selectEffectivePreferences).swipe.card

  const loci = useMemo(() => lociForRoom(allLoci, roomId), [allLoci, roomId])
  // Questions are managed on their own page; kept here only for room-level import/export.
  const questions = useMemo(() => questionsForRoom(allQuestions, roomId), [allQuestions, roomId])

  const setSelectMode = onSelectModeChange
  const setSort = onSortChange
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [verseOpen, setVerseOpen] = useState(false)
  // The card the full-screen browser is open on (null = closed). Tapping a card row opens it.
  const [browserCardId, setBrowserCardId] = useState<string | null>(null)

  // Card filters: narrow by maturity and/or flagged. Empty = show everything. The applied
  // filter drives the list; the sheet edits a draft that only commits on Apply.
  const [filterOpen, setFilterOpen] = useState(false)
  const [maturityFilter, setMaturityFilter] = useState<Set<MaturityKey>>(new Set())
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [draftMaturity, setDraftMaturity] = useState<Set<MaturityKey>>(new Set())
  const [draftFlagged, setDraftFlagged] = useState(false)
  const cardFilterCount = maturityFilter.size + (flaggedOnly ? 1 : 0)
  const draftFilterCount = draftMaturity.size + (draftFlagged ? 1 : 0)

  // Opening seeds the draft from what's applied, so the sheet reflects the live filter.
  const openFilter = () => {
    setDraftMaturity(new Set(maturityFilter))
    setDraftFlagged(flaggedOnly)
    setFilterOpen(true)
  }
  const resetDraftFilter = () => {
    setDraftMaturity(new Set())
    setDraftFlagged(false)
  }
  const applyFilter = () => {
    setMaturityFilter(new Set(draftMaturity))
    setFlaggedOnly(draftFlagged)
    setFilterOpen(false)
  }
  // The one-tap reset on the filter-empty state clears the applied filter immediately.
  const clearCardFilter = () => {
    setMaturityFilter(new Set())
    setFlaggedOnly(false)
  }
  const toggleDraftMaturity = (key: MaturityKey) =>
    setDraftMaturity((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const maturity = useMemo(() => cardMaturityCounts(loci), [loci])

  // Leaving select mode clears the picks so the next long-press starts empty — needed now that
  // the flag can be flipped off from outside the editor (search opening).
  useEffect(() => {
    if (!selectMode) setSelectedIds(new Set())
  }, [selectMode])

  const fileRef = useRef<HTMLInputElement>(null)
  const importKind = useRef<'content' | 'anki'>('content')

  const sortedLoci = useMemo(() => sortLoci(loci, sort), [loci, sort])

  const needle = (searchQuery ?? '').trim().toLowerCase()
  const visibleLoci = useMemo(() => {
    let list = sortedLoci
    if (needle)
      list = list.filter((l) =>
        [l.front, l.back, l.hint, l.tip]
          .filter(Boolean)
          .some((field) => (field as string).toLowerCase().includes(needle)),
      )
    if (maturityFilter.size > 0) list = list.filter((l) => maturityFilter.has(srsStatus(l.srs)))
    if (flaggedOnly) list = list.filter((l) => l.flagged)
    return list
  }, [sortedLoci, needle, maturityFilter, flaggedOnly])

  const total = loci.length
  const hasContent = loci.length > 0 || questions.length > 0
  const selectedCount = selectedIds.size
  const allVisibleSelected =
    visibleLoci.length > 0 && visibleLoci.every((item) => selectedIds.has(item.id))

  // Hand-arranging lives in select mode (long-press → grip-drag), mirroring the library; it's
  // off while searching, since you reorder the whole list, not a filtered subset. A drop
  // forces manual sort — a hand-arranged order only reads against the manual rule.
  const reorderable = selectMode && !needle
  const reorderTo = (commit: () => void) => {
    commit()
    if (sort !== 'manual') setSort('manual')
  }
  const sortOptions: SortControlOption<ContentSort>[] = [
    { value: 'manual', label: t('loci.sort.manual'), icon: <GripVertical className="size-4" /> },
    { value: 'recent', label: t('loci.sort.recent'), icon: <Clock className="size-4" /> },
    { value: 'name', label: t('loci.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
    { value: 'due', label: t('loci.sort.due'), icon: <Sparkles className="size-4" /> },
    { value: 'flagged', label: t('loci.sort.flagged'), icon: <Flag className="size-4" /> },
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
      swipe={cardSwipe}
      onToggleSelect={() => toggleSelect(locus.id)}
      onRequestSelect={() => requestSelect(locus.id)}
      onOpen={() => setBrowserCardId(locus.id)}
      onEdit={() => onEditCard(locus.id)}
      onDuplicate={() => {
        void duplicateLocus(locusStore, locus.id)
        toast.success(t('loci.row.duplicated'))
      }}
      onDelete={() => setPendingDeleteId(locus.id)}
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
      if (allVisibleSelected) visibleLoci.forEach((item) => next.delete(item.id))
      else visibleLoci.forEach((item) => next.add(item.id))
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
    if (!pendingDeleteId) return
    void deleteLocus(locusStore, pendingDeleteId)
    toast.success(t('loci.transfer.deleted'))
  }

  const confirmBulkDelete = () => {
    const ids = [...selectedIds]
    void Promise.all(ids.map((id) => deleteLocus(locusStore, id)))
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

      {/* "Cards in this room (N)" header with its maturity overview (the overview owns the
          heading). Steps aside while searching or selecting so the list owns the screen. */}
      {!searching && !selectMode && loci.length > 0 ? (
        <div className="mb-3">
          <CardMaturityOverview total={loci.length} counts={maturity} scope="room" />
        </div>
      ) : null}

      {/* Toolbar: sort on the left, a filter control on the right. Both step aside the moment
          search or select takes over; sort needs 2+ items to be meaningful. */}
      {!selectMode && !searching && total > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          {total > 1 ? (
            <SortControl
              label={t('loci.sortLabel')}
              value={sort}
              options={sortOptions}
              onChange={setSort}
            />
          ) : (
            <span aria-hidden />
          )}
          <FilterButton
            label={t('loci.filterLabel')}
            count={cardFilterCount}
            onClick={openFilter}
          />
        </div>
      ) : null}

      {/* Select mode is entered by a long-press on a row; this bar appears only while selecting
          (the rows carry their own checkboxes, and a grip-drag reorders). */}
      {selectMode ? (
        <div className="flex items-center justify-between gap-3 pb-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-(length:--p-text-label) font-semibold text-heading"
          >
            {allVisibleSelected ? t('loci.select.clearAll') : t('loci.select.selectAll')}
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

      {/* Cards list */}
      <div className="flex flex-col gap-3">
        {total === 0 ? (
          <EmptyCards />
        ) : visibleLoci.length === 0 ? (
          needle ? (
            <NoResults onClear={() => onClearSearch?.()} />
          ) : (
            <FilterEmpty onClear={clearCardFilter} />
          )
        ) : (
          <ReorderableList
            items={visibleLoci}
            reorderable={reorderable}
            onReorder={(ids) => reorderTo(() => void reorderLoci(locusStore, ids))}
            renderItem={renderCard}
          />
        )}
      </div>

      {/* Bottom bar: bulk actions in select mode */}
      {selectMode ? (
        <div className="sticky bottom-2 z-20 mt-3 flex items-center gap-2 rounded-card-featured bg-card/95 p-2.5 shadow-elevated backdrop-blur-xl">
          <BulkButton
            disabled={selectedCount === 0}
            icon={<Flag className="size-[17px]" aria-hidden />}
            label={t('loci.bulk.flag')}
            onClick={() => {
              const toFlag = loci.filter((l) => selectedIds.has(l.id) && !l.flagged)
              toFlag.forEach((l) => void toggleLocusFlag(locusStore, l.id))
              toast.success(t('loci.bulk.flagged', { count: toFlag.length }))
              exitSelect()
            }}
          />
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
          <BulkButton
            disabled={selectedCount === 0}
            tone="danger"
            icon={<Trash2 className="size-[17px]" aria-hidden />}
            label={t('common.delete')}
            onClick={() => setBulkDeleteOpen(true)}
          />
        </div>
      ) : null}

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
              tone="accent"
              badge="JSON · CSV"
              title={t('loci.transfer.importFile')}
              subtitle={t('loci.transfer.importFileSub')}
              onClick={() => pickFile('.json,.csv', 'content')}
            />
            <ImportRow
              icon={<FileText className="size-5" aria-hidden />}
              tone="accent"
              badge="TXT · TSV"
              title={t('loci.transfer.importAnki')}
              subtitle={t('loci.transfer.importAnkiSub')}
              onClick={() => pickFile('.txt,.tsv', 'anki')}
            />
            <ImportRow
              icon={<ClipboardPaste className="size-5" aria-hidden />}
              tone="brand"
              title={t('loci.transfer.pasteList')}
              subtitle={t('loci.transfer.pasteListSub')}
              onClick={() => closeTransfer(() => setPasteOpen(true))}
            />
            <ImportRow
              icon={<BookOpen className="size-5" aria-hidden />}
              tone="brand"
              title={t('loci.transfer.pasteVerses')}
              subtitle={t('loci.transfer.pasteVersesSub')}
              onClick={() => closeTransfer(() => setVerseOpen(true))}
            />
          </TransferGroup>

          <TransferGroup label={t('loci.transfer.exportGroup')}>
            <ImportRow
              icon={<Landmark className="size-5" aria-hidden />}
              tone="positive"
              badge="JSON"
              trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
              title={t('loci.transfer.exportJson')}
              subtitle={t('loci.transfer.exportJsonSub')}
              disabled={!hasContent}
              onClick={() => closeTransfer(() => exportRoomJson(roomName, loci, questions))}
            />
            <ImportRow
              icon={<MapPin className="size-5" aria-hidden />}
              tone="neutral"
              badge="CSV"
              trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
              title={t('loci.transfer.exportCards')}
              subtitle={t('loci.transfer.exportCardsSub')}
              disabled={loci.length === 0}
              onClick={() => closeTransfer(() => exportLociCsv(roomName, loci))}
            />
            <ImportRow
              icon={<FileText className="size-5" aria-hidden />}
              tone="neutral"
              badge="CSV"
              trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
              title={t('loci.transfer.exportQuestions')}
              subtitle={t('loci.transfer.exportQuestionsSub')}
              disabled={questions.length === 0}
              onClick={() => closeTransfer(() => exportQuestionsCsv(roomName, questions))}
            />
            <ImportRow
              icon={<FileText className="size-5" aria-hidden />}
              tone="neutral"
              badge="TXT"
              trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
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

      {/* Card filter sheet — narrow the cards list by maturity and/or flagged. */}
      <Sheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title={t('loci.filter.title')}
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={resetDraftFilter}
              disabled={draftFilterCount === 0}
            >
              {t('loci.filter.reset')}
            </Button>
            <Button className="flex-1" onClick={applyFilter}>
              {t('loci.filter.apply')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 pb-2">
          <div>
            <p className="mb-2 px-1 text-(length:--p-text-label) font-bold uppercase tracking-wide text-muted-foreground">
              {t('loci.filter.maturity')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: 'new', label: t('loci.filter.new') },
                  { key: 'learning', label: t('loci.filter.learning') },
                  { key: 'known', label: t('loci.filter.known') },
                ] as const
              ).map(({ key, label }) => {
                const on = draftMaturity.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDraftMaturity(key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-pill px-3.5 py-2 text-(length:--p-text-label) font-semibold transition-transform active:scale-[0.97]',
                      on ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-heading',
                    )}
                  >
                    {label}
                    <span className="tabular-nums opacity-70">{maturity[key]}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 px-1 text-(length:--p-text-label) font-bold uppercase tracking-wide text-muted-foreground">
              {t('loci.filter.status')}
            </p>
            <label className="flex items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-3">
              <span className="inline-flex items-center gap-2 text-(length:--p-text-body) font-semibold text-heading">
                <Flag className="size-4 text-[var(--warning-foreground)]" aria-hidden />
                {t('loci.filter.flagged')}
              </span>
              <Switch
                label={t('loci.filter.flagged')}
                checked={draftFlagged}
                onCheckedChange={setDraftFlagged}
              />
            </label>
          </div>
        </div>
      </Sheet>

      {/* Delete confirms */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('loci.delete.cardTitle')}
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

      {/* The add/import affordance. Hidden while selecting, where the bulk bar owns the bottom
          of the screen (otherwise the dial overlaps the bar's trailing action). */}
      {!selectMode ? (
        <SpeedDial
          label={t('loci.quickActions')}
          className="bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]"
          actions={[
            {
              id: 'card',
              label: t('loci.addCard'),
              icon: <Plus className="size-5" aria-hidden />,
              onSelect: onAddCard,
            },
            {
              id: 'import',
              label: t('loci.transfer.importShort'),
              icon: <Upload className="size-5" aria-hidden />,
              onSelect: () => setTransferOpen(true),
            },
          ]}
        />
      ) : null}

      {/* Full-screen card browser — opened by tapping a card row; swipe/flip through the
          (currently visible) deck. Edit closes it and opens the editor; delete routes through
          the same confirm the list uses. */}
      <CardBrowser
        open={browserCardId !== null}
        loci={visibleLoci}
        startId={browserCardId}
        onClose={() => setBrowserCardId(null)}
        onEdit={(id) => {
          setBrowserCardId(null)
          onEditCard(id)
        }}
        onToggleFlag={(id) => void toggleLocusFlag(locusStore, id)}
        onDuplicate={(id) => {
          void duplicateLocus(locusStore, id)
          toast.success(t('loci.row.duplicated'))
        }}
        onDelete={(id) => {
          setBrowserCardId(null)
          setPendingDeleteId(id)
        }}
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

function EmptyCards() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent">
        <MapPin className="size-6" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-balance text-(length:--p-text-sub) font-semibold text-heading">
        {t('loci.emptyTitle')}
      </h3>
      <p className="max-w-[34ch] text-pretty text-(length:--p-text-body) text-muted-foreground">
        {t('loci.emptyHint')}
      </p>
    </div>
  )
}

function NoResults({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-card bg-card-glass p-6 text-center shadow-rest">
      <p className="text-(length:--p-text-body) text-muted-foreground">{t('loci.noResults')}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-(length:--p-text-label) font-semibold text-accent"
      >
        {t('loci.clearSearch')}
      </button>
    </div>
  )
}

/** The filter trigger — a pill mirroring the {@link SortControl} trigger, with a count badge
 * when filters are active. Opens the card filter sheet. */
function FilterButton({
  label,
  count,
  onClick,
}: {
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-control bg-card pl-2.5 pr-3 shadow-rest transition-transform active:scale-[0.97]',
        count > 0 && 'ring-1 ring-accent/45',
      )}
    >
      <SlidersHorizontal className="size-4 shrink-0 text-accent" aria-hidden />
      <span className="text-(length:--p-text-label) font-semibold text-heading">{label}</span>
      {count > 0 ? (
        <span className="grid size-5 place-items-center rounded-full bg-accent text-(length:--p-text-tiny) font-bold tabular-nums text-accent-foreground">
          {count}
        </span>
      ) : null}
    </button>
  )
}

/** Shown when active filters hide every card — offers a one-tap reset. */
function FilterEmpty({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-card bg-card-glass p-6 text-center shadow-rest">
      <p className="text-(length:--p-text-body) text-muted-foreground">{t('loci.filterEmpty')}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-(length:--p-text-label) font-semibold text-accent"
      >
        {t('loci.filterClear')}
      </button>
    </div>
  )
}

function TransferGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-(length:--p-text-label) font-bold uppercase tracking-wide text-muted-foreground">
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
        'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-control text-(length:--p-text-label) font-semibold',
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
