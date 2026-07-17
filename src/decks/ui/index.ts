/**
 * The decks area's UI barrel — components other areas/routes import directly (ADR-0008).
 * Pages import these files individually where lazy-loading matters; this barrel exists for the
 * area's own pages and any sibling widget that composes them.
 */
export { HomeHeader, type HomeHeaderProps } from './home-header'
export { FolderForm, type FolderFormProps } from './folder-form'
export { openFolderDrawer, type FolderDraft, type OpenFolderDrawerOptions } from './folder-drawer'
export {
  openMoveDeckDrawer,
  type MoveDestination,
  type OpenMoveDeckDrawerOptions,
} from './move-deck-drawer'
