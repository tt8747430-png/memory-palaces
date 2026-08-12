export { cn } from './cn'
export { clamp, clamp01, percentOf } from './number'
export {
  authEntrance,
  authRise,
  authStagger,
  EASE_EXPO,
  EASE_OUT,
  EASE_OUT_CSS,
  poseAt,
  STACK_DEPTH,
} from './motion'
export {
  coverSquare,
  dataUrlToBlob,
  fileToAvatar,
  fileToSquareImage,
  DECK_IMAGE_PX,
} from './avatar'
export { isInlineImage, uploadInlineImage } from './inline-image'
export { downloadText } from './download'
export { useStickyHeader, type StickyHeader } from './sticky-header/use-sticky-header'
export { HeaderElevationContext, useHeaderElevation } from './sticky-header/header-elevation'
export {
  clampSwipeOffset,
  armedSide,
  resolveSwipeRelease,
  type SwipeGeometry,
  type SwipeRelease,
} from './gestures'
export { useLongPress, type LongPressHandlers, type LongPressOptions } from './use-long-press'
export { usePersistedSet } from './use-persisted-set'
export { toggleInSet } from './set'
export { useMultiSelect, type MultiSelect } from './use-multi-select'
export { useHideAppNav, useAppNavHidden } from './app-nav'
export { useSplashStore, useSplashDone } from './app-splash'
export {
  activateWaitingWorker,
  watchWaitingWorker,
  type RegistrationLike,
  type WorkerLike,
} from './sw-update'
export { useAutoSelect } from './use-auto-select'
export { useDevMode, setDevMode } from './dev-mode'
export { useProbeOverlay, setProbeOverlay } from './probe-overlay'
export { visibleBottom, keyboardIsMeasured, REVEAL_GAP } from './keyboard-viewport'
export { useKeyboardInset } from './use-keyboard-inset'
export {
  isTextField,
  revealOffset,
  useKeyboardReveal,
  REVEAL_SCROLL_ATTR,
  type RevealBand,
} from './use-keyboard-reveal'
export { keepFieldFocused, TEXT_ENTRY } from './keep-field-focused'
export { SCREEN_SCROLL } from './screen-scroll'
export { useVirtualKeyboard, type VirtualKeyboard } from './use-virtual-keyboard'
export { useSortableSensors } from './use-sortable-sensors'
export { shuffle } from './shuffle'
export { nextOrder, reorderById, byOrderThenCreated, byNewestFirst, byOldestFirst } from './order'
export { CONTENT_SORTS, sortContent, type ContentSort, type SortableContent } from './content-order'
export {
  ContentImportError,
  importErrorMessage,
  contentSlug,
  cardsToCsv,
  questionsToCsv,
  cardsToAnkiTsv,
  parseDelimitedNotes,
  parseAnkiText,
  parseVerses,
  verseChapterTitles,
  parseDeckContent,
  detectPasteFormat,
  guessFieldSeparator,
  type CardLike,
  type QuestionLike,
  type ParsedCard,
  type PasteFormat,
  type DeckContentData,
} from './content-transfer'
export { speak, speechAvailable } from './speech'
export { tick, impact, success, setHapticsEnabled } from './haptics'
export { useShake, motionSupported, requestMotionPermission } from './shake'
export { EventBus, type EventHandler } from './event-bus'
export type { AppEvents } from './events'
export { EventBusContext, useEventBus, useEventBusOptional } from './event-bus-context'
export { AuthGatewayContext, useAuthGateway } from './auth-gateway-context'
export { authErrorKey, authErrorMessage } from './auth-error-copy'
export { parseAuthCallback, type AuthCallback } from './auth-callback'
export { StoragePortContext, useStorage } from './storage-context'
export { useValidatedSubmit, type FieldErrors, type ValidatedSubmit } from './use-validated-submit'
export { useOnline } from './use-online'
export { newest, type Clocked } from './newest'
export { mergeProgress, type MergeableProgress } from './merge-progress'
export { mergeCard, type MergeableCard } from './merge-srs'
export { resolveDataTransition, type DataTransition } from './data-transition'
export {
  isEmail,
  isLongEnoughPassword,
  emailErrorKey,
  passwordErrorKey,
  type EmailErrorKey,
  type PasswordErrorKey,
} from './validation'
export { DAY_MS, systemClock, fixedClock, nowIso, type Clock } from './clock'
export { cloneEntity, findEntity, newId, requireEntity, type Entity } from './entity'
export {
  createCollectionStore,
  createSingletonStore,
  selectIsReady,
  type CollectionState,
  type SingletonState,
  type StoreStatus,
} from './entity-store'
export {
  collectionCommands,
  type CollectionCommands,
  type CollectionCommandSpec,
  type OrderedStore,
} from './collection-commands'
export { createStoreContext, type StoreContext } from './store-context'
export {
  isDue,
  schedule,
  srsStatus,
  markKnown,
  nextIntervalLabel,
  type Grade,
  type SrsState,
  type SrsStatus,
} from './srs'
export {
  dayKey,
  recordTrainingDay,
  recordPractice,
  totalTrainingDays,
  buildDayCells,
  type StreakState,
  type StreakResult,
  type DailyTally,
  type PracticeOutcome,
  type DayCell,
} from './streak'
export {
  levelFromXp,
  isDeckCompleted,
  computeTrainingTotals,
  cardMaturityCounts,
  type LevelInfo,
  type TrainingTotals,
} from './stats'
export {
  ACHIEVEMENT_IDS,
  computeAchievements,
  isAchievementId,
  type Achievement,
  type AchievementId,
  type AchievementInput,
} from './achievements'
export {
  BADGE_IDS,
  computeBadges,
  isBadgeId,
  milestonePercent,
  nextMilestone,
  type Badge,
  type BadgeId,
  type BadgeInput,
} from './badges'
export {
  tokenizeWords,
  recallAnswer,
  isReferenceMarker,
  wordInitial,
  normalizeWord,
  normalizeInitial,
  scramble,
  typedRecallStatus,
  withNextWord,
  type WordInitial,
  type RecallSlot,
  type RecallSlotKind,
  type RecallTypingResult,
} from './recall'
export { studyOverview, type StudyOverview } from './study-overview'
export { nextDefaultName } from './naming'
export { useOptimisticPatch, orderPatch } from './use-optimistic-patch'
export { usePendingAct, type PendingAct } from './use-pending-act'
export { reconcileHeldOrder } from './reconcile-order'
export { moveBlock } from './move-block'
export { useStackLanding, type StackLanding, type StackOrigin } from './use-stack-landing'
export {
  useSortableBlock,
  type SortableBlock,
  type SortableBlockDrop,
  type SortableBlockOptions,
} from './use-sortable-block'
export { flattenDecks, type FlatDeck } from './tree-flatten'
export {
  childDecks,
  siblingDecks,
  orderSiblings,
  rootDecks,
  decksInFolder,
  subtreeDeckIds,
  subtreeDecks,
  deckPath,
  canReparent,
  resolveDeckSettings,
  cardsInSubtree,
  dueCountsPerDeck,
  type SelectState,
  type TreeDeck,
  type TreeCard,
} from './deck-tree'
