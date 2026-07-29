import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Plus, Upload } from 'lucide-react'
import type { Question } from '@/entities/question'
import { selectEffectivePreferences, usePreferencesStore } from '@/entities/preferences'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoading,
  SelectHeader,
  SelectToolbar,
  SelectToolbarDock,
  SortControl,
  SpeedDial,
  useContentSortOptions,
} from '@/shared/ui'
import { QuestionRow, ReorderableList, type RowDragHandle } from '@/widgets/content-editor'
import { QUESTION_SORTS } from '../model/sort-questions'
import { useDeckQuestions } from '../model/use-deck-questions'
import { EmptyQuestions } from './EmptyQuestions'
import { QuestionDialogs } from './QuestionDialogs'
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
  const page = useDeckQuestions(deckId)
  const { questions, selection } = page
  const prefs = usePreferencesStore(selectEffectivePreferences)

  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const sortOptions = useContentSortOptions(QUESTION_SORTS)

  const renderQuestion = (question: Question, dragHandle?: RowDragHandle, dragging = false) => (
    <QuestionRow
      key={question.id}
      question={question}
      index={questions.indexOf(question)}
      selectMode={selection.active}
      selected={selection.has(question.id)}
      reorderable={selection.active}
      dragHandle={dragHandle}
      dragging={dragging}
      swipe={prefs.swipe.card}
      onToggleSelect={() => selection.toggle(question.id)}
      onRequestSelect={() => selection.begin(question.id)}
      onEdit={() => onEditQuestion(question.id)}
      onDuplicate={() => page.duplicate(question.id)}
      onDelete={() => page.request({ kind: 'delete-question', question })}
    />
  )

  if (!page.ready) {
    return <ScreenLoading />
  }

  return (
    <AppScreen
      header={
        selection.active ? (
          <SelectHeader selection={selection} />
        ) : (
          <ScreenHeader
            title={t('questions.title')}
            subtitle={page.deckName}
            onBack={onBack}
            backLabel={t('common.back')}
          />
        )
      }
    >
      <div className="mt-2 space-y-4 pb-24">
        {selection.active ? null : (
          <TestLaunchCard questionCount={questions.length} onStartTest={onStartTest} />
        )}

        <section aria-label={t('questions.inDeck')} className="space-y-3">
          {!selection.active && questions.length > 1 ? (
            <div className="flex justify-end">
              <SortControl
                label={t('cards.sortLabel')}
                value={page.sort}
                options={sortOptions}
                onChange={page.setSort}
              />
            </div>
          ) : null}

          {questions.length === 0 ? (
            <EmptyQuestions onAdd={onAddQuestion} />
          ) : (
            <ReorderableList
              items={questions}
              reorderable={selection.active}
              selectedIds={selection.ids}
              onReorder={page.reorder}
              renderItem={renderQuestion}
            />
          )}
        </section>
      </div>

      {selection.active ? (
        <SelectToolbarDock>
          <SelectToolbar actions={prefs.selectToolbar.question} handlers={page.selectHandlers} />
        </SelectToolbarDock>
      ) : null}

      <QuestionDialogs
        pending={page.pending}
        selectedCount={selection.count}
        onDismiss={page.dismiss}
        onConfirm={page.confirm}
      />

      <QuestionTransferSheets
        importOpen={importOpen}
        onImportOpenChange={setImportOpen}
        onPickFile={(file) => void page.importFile(file)}
        exportOpen={exportOpen}
        onExportOpenChange={setExportOpen}
        canExport={questions.length > 0}
        onExportCsv={page.exportCsv}
      />

      {!selection.active ? (
        <SpeedDial
          label={t('questions.quickActions')}
          placement="above-safe-area"
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
