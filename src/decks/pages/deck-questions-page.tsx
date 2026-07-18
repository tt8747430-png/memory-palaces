import { type ChangeEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownAZ,
  Brain,
  Clock,
  Download,
  GripVertical,
  HelpCircle,
  Play,
  Plus,
  Upload,
} from 'lucide-react'
import type { Question } from '@/decks'
import { QuestionRow, ReorderableList, type RowDragHandle, SelectModeBar } from '@/decks/ui'
import {
  AppScreen,
  Button,
  ScreenHeader,
  SelectToolbar,
  SortControl,
  type SortControlOption,
  SpeedDial,
} from '@/shared/ui'
import { type QuestionSort, useDeckQuestions } from './use-deck-questions'

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
  const fileRef = useRef<HTMLInputElement>(null)
  const vm = useDeckQuestions({ deckId })

  const sortOptions: SortControlOption<QuestionSort>[] = [
    { value: 'manual', label: t('cards.sort.manual'), icon: <GripVertical className="size-4" /> },
    { value: 'recent', label: t('cards.sort.recent'), icon: <Clock className="size-4" /> },
    { value: 'name', label: t('cards.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
  ]

  /** The chooser resolves an `accept` string only when the learner picked the file route. */
  const startImport = async () => {
    const accept = await vm.chooseImport()
    const input = fileRef.current
    if (!accept || !input) return
    input.value = ''
    input.accept = accept
    input.click()
  }

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void vm.importFile(file)
  }

  const renderQuestion = (question: Question, dragHandle?: RowDragHandle, dragging = false) => (
    <QuestionRow
      key={question.id}
      question={question}
      index={vm.sortedQuestions.indexOf(question)}
      selectMode={vm.selectMode}
      selected={vm.selectedIds.has(question.id)}
      reorderable={vm.reorderable}
      dragHandle={dragHandle}
      dragging={dragging}
      swipe={vm.swipe}
      onToggleSelect={() => vm.toggleSelect(question.id)}
      onRequestSelect={() => vm.requestSelect(question.id)}
      onEdit={() => onEditQuestion(question.id)}
      onDuplicate={() => void vm.duplicateOne(question.id)}
      onDelete={() => void vm.deleteOne(question.id)}
    />
  )

  if (!vm.ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  const selectionBar = (
    <div className="px-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom)))] pt-2">
      <SelectToolbar actions={vm.selectToolbarActions} handlers={vm.selectHandlers} />
    </div>
  )

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t('questions.title')}
          subtitle={vm.deck?.name}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
      footer={vm.selectMode ? selectionBar : undefined}
    >
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={onFile}
        aria-hidden
        tabIndex={-1}
      />

      <div className="mt-2 space-y-4 pb-24">
        <div className="rounded-card-featured bg-card p-4 shadow-featured">
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
              aria-hidden
            >
              <Brain className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[length:var(--ms-text-sub)] font-bold text-heading">
                {t('questions.testLead')}
              </p>
              <p className="text-[length:var(--ms-text-label)] text-muted-foreground">
                {vm.hasQuestions
                  ? t(
                      vm.questions.length === 1
                        ? 'questions.testReadyOne'
                        : 'questions.testReadyOther',
                      { count: vm.questions.length },
                    )
                  : t('questions.testNone')}
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="mt-3.5 w-full"
            disabled={!vm.hasQuestions}
            onClick={onStartTest}
          >
            <Play className="size-[1.125rem]" aria-hidden />
            {t('questions.startTest')}
          </Button>
        </div>

        <section aria-label={t('questions.inDeck')} className="space-y-3">
          {!vm.selectMode && vm.questions.length > 1 ? (
            <div className="flex justify-end">
              <SortControl
                label={t('cards.sortLabel')}
                value={vm.sort}
                options={sortOptions}
                onChange={vm.setSort}
              />
            </div>
          ) : null}

          {vm.selectMode ? (
            <SelectModeBar
              allSelected={vm.allSelected}
              count={vm.selectedCount}
              onToggleAll={vm.toggleSelectAll}
              onDone={vm.exitSelect}
            />
          ) : null}

          {vm.questions.length === 0 ? (
            <EmptyQuestions onAdd={onAddQuestion} />
          ) : (
            <ReorderableList
              items={vm.sortedQuestions}
              reorderable={vm.reorderable}
              onReorder={vm.onReorder}
              renderItem={renderQuestion}
            />
          )}
        </section>
      </div>

      {!vm.selectMode ? (
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
              onSelect: () => void startImport(),
            },
            {
              id: 'export',
              label: t('questions.transfer.exportShort'),
              icon: <Download className="size-5" aria-hidden />,
              onSelect: () => void vm.exportQuestions(),
            },
          ]}
        />
      ) : null}
    </AppScreen>
  )
}

function EmptyQuestions({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent">
        <HelpCircle className="size-6" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-balance text-[length:var(--ms-text-sub)] font-semibold text-heading">
        {t('questions.emptyTitle')}
      </h3>
      <p className="max-w-[34ch] text-pretty text-[length:var(--ms-text-body)] text-muted-foreground">
        {t('questions.emptyHint')}
      </p>
      <Button className="mt-5" onClick={onAdd}>
        <Plus className="size-[1.125rem]" aria-hidden />
        {t('questions.addQuestion')}
      </Button>
    </div>
  )
}
