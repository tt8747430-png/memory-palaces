/**
 * The decks area's UI barrel — components other areas/routes import directly (ADR-0008).
 * Pages import these files individually where lazy-loading matters; this barrel exists for the
 * area's own pages and any sibling widget that composes them.
 */
export { HomeHeader, type HomeHeaderProps } from './home-header'
export { FolderForm, type FolderFormProps } from './folder-form'
export { openFolderDrawer, type FolderDraft, type OpenFolderDrawerOptions } from './folder-drawer'
export {
  DeckTree,
  DeckDragPreview,
  type DeckTreeProps,
  type DeckDragPreviewProps,
} from './deck-tree'
export {
  openMoveDeckDrawer,
  type MoveDestination,
  type OpenMoveDeckDrawerOptions,
} from './move-deck-drawer'
export { StudyOverviewCard, type StudyOverviewCardProps } from './study-overview-card'
export { CardMaturityOverview, type CardMaturityOverviewProps } from './card-maturity-overview'
export { DeckContentEditor, type DeckContentEditorProps } from './deck-content-editor'
export { useDeckContent, type DeckContentVm, type UseDeckContentOptions } from './use-deck-content'
// CardRow/QuestionRow and ReorderableList are shared with the questions page (1c.4); the
// browser, filter/import drawers and select bar stay internal to the editor.
export {
  CardRow,
  QuestionRow,
  type CardRowProps,
  type QuestionRowProps,
  type RowDragHandle,
} from './content-rows'
export { ReorderableList, type ReorderableListProps } from './reorderable-list'
export { openQuestionImportDrawer, openQuestionExportDrawer } from './question-transfer-drawers'
export { SelectModeBar, type SelectModeBarProps } from './select-mode-bar'
