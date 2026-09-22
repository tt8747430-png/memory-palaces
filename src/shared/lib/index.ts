export { cn } from './cn'
export { FAST_OUTCOMES, type FastOutcome } from './fast-outcome'
export { clamp, clamp01, percentOf } from './number'
export {
  CARD_ALIGNMENT_IDS,
  CARD_FONT_IDS,
  CARD_SCENE_SURFACE,
  CARD_STYLE_PRESET_IDS,
  CARD_STYLE_SURFACE,
  CARD_STYLE_TEXT,
  cardSceneChrome,
  sceneTone,
  CHROME_TOKENS,
  clampCardTextSize,
  coerceCardStyle,
  resolveCardScene,
  resolveCardStyle,
  sameCardStyle,
  MAX_CARD_TEXT_SIZE,
  MIN_CARD_TEXT_SIZE,
  type CardAlignmentId,
  type CardFontId,
  type CardSceneVars,
  type CardStyleInput,
  type CardStylePresetId,
  type CardStyleVars,
  type SceneChrome,
} from './card-style'
export {
  authEntrance,
  authRise,
  authStagger,
  EASE_EXPO,
  EASE_OUT,
  EASE_OUT_CSS,
  SWAP_TRANSITION,
  poseAt,
  STACK_DEPTH,
} from './motion'
export { coverSquare, dataUrlToBlob, fileToSquareImage, DECK_IMAGE_PX } from './avatar'
export { isInlineImage, uploadInlineImage } from './inline-image'
export { coerceImagePath } from './image-path'
export {
  IMAGE_CACHE,
  imageCacheKey,
  isImageSettled,
  markImageMissing,
  onImageSettled,
  readCachedImage,
  writeCachedImage,
  type CachedImage,
} from './image-cache'
export { useImageSrc, type ImageSrc } from './use-image-src'
export { downloadText } from './download'
export { useStickyHeader, type StickyHeader } from './sticky-header/use-sticky-header'
export { HeaderElevationContext, useHeaderElevation } from './sticky-header/header-elevation'
export {
  clampSwipeOffset,
  armedSide,
  type DragFrame,
  dragFrame,
  resolveFling,
  resolveSwipeRelease,
  resolveThrow,
  type FlingThresholds,
  type SwipeGeometry,
  type SwipeRelease,
  type Throw,
  type ThrowAxis,
} from './gestures'
export {
  type GestureHold,
  type ReleaseReason,
  type SurfaceProps,
  useGestureHold,
} from './gesture-hold'
export { useLongPress, type LongPressHandlers, type LongPressOptions } from './use-long-press'
export { toggleInSet } from './set'
export { useMultiSelect, type MultiSelect } from './use-multi-select'
export {
  useBottomSlotStore,
  useBottomSlotTarget,
  useBottomSlotWanted,
  useWantBottomSlot,
} from './bottom-slot'
export {
  selectSplashShown,
  selectSplashWaitingOnSync,
  type SplashHold,
  useSplashShown,
  useSplashStore,
} from './app-splash'
export {
  activateWaitingWorker,
  watchWaitingWorker,
  type RegistrationLike,
  type WorkerLike,
} from './sw-update'
export { useProbeOverlay, setProbeOverlay } from './probe-overlay'
export { visibleBottom, keyboardIsMeasured, REVEAL_GAP } from './keyboard-viewport'
export { useKeyboardInset } from './use-keyboard-inset'
export {
  readTopInset,
  startTopInset,
  TOP_INSET_MEMORY_KEY,
  topInsetShape,
  type TopInsetReading,
} from './top-inset'
export { claimBottomInset } from './bottom-dock'
export { useBottomChrome } from './use-bottom-chrome'
export {
  isTextField,
  revealOffset,
  useKeyboardReveal,
  REVEAL_SCROLL_ATTR,
  type RevealBand,
} from './use-keyboard-reveal'
export { CHROME } from './use-keyboard-reveal'
export { keepFieldFocused, TEXT_ENTRY } from './keep-field-focused'
export { FOCUS_RING_OVERSHOOT } from './focus-ring'
export { syncFailure, type SyncFailure } from './sync-failure'
export { syncFailureMessage } from './sync-failure-message'
export { type ColorScheme, readColorScheme, useColorScheme } from './color-scheme'
export { readReducedMotion } from './reduced-motion'
export {
  paintedBehind,
  readStatusBarPaint,
  statusBarColor,
  statusBarIsDeclared,
  type StatusBarPaint,
} from './status-bar'
export { SCREEN_SCROLL, ScreenScrollContext, useScreenScroll } from './screen-scroll'
export { useKeyboardOpen, useVirtualKeyboard, type VirtualKeyboard } from './use-virtual-keyboard'
export { useSortableSensors } from './use-sortable-sensors'
export { shuffle } from './shuffle'
export {
  compareNatural,
  mergeVisibleOrder,
  nextOrder,
  reorderById,
  byOrderThenCreated,
  byNewestFirst,
  byOldestFirst,
} from './order'
export { classifyChange, descendantsOf, parentIdsOf } from './sync-divergence'
export type { Divergence, Parented, PendingLike } from './sync-divergence'
export { errorMessage } from './error-message'
export { daysFrom, longDate } from './long-date'
export { SyncRunnerContext, useSyncRunner } from './sync-runner'
export type {
  SyncDocumentRef,
  SyncOutcome,
  SyncPhase,
  SyncReview,
  SyncReviewDecision,
  SyncReviewItem,
  SyncReviewRow,
  SyncReviewRows,
  SyncRunner,
} from './sync-runner'
export { CONTENT_SORTS, sortContent, type ContentSort, type SortableContent } from './content-order'
export {
  CORE_DECK_FILTERS,
  CORE_DECK_SORTS,
  DEFAULT_DECK_FILTER,
  DEFAULT_DECK_SORT,
  filtersThatKeep,
  folderOrderOf,
  headingsFor,
  isCoreOrder,
  orderForChildren,
  orderId,
  ordersThatPlace,
  resolveDeckFilter,
  resolveDeckOrder,
  resolveDeckSort,
  sortDecks,
  type CoreDeckFilterId,
  type CoreDeckSort,
  type DeckFilter,
  type DeckFilterId,
  type DeckGroup,
  type DeckOrder,
  type DeckSort,
  type ResolvedOrder,
  type SortableDeck,
  type SubdeckOrderPreferences,
} from './deck-order'
export {
  ContentImportError,
  importErrorMessage,
  contentSlug,
  cardsToCsv,
  questionsToCsv,
  cardsToAnkiTsv,
  parseDelimitedNotes,
  parseAnkiText,
  parseDeckContent,
  guessFieldSeparator,
  type CardLike,
  type QuestionLike,
  type ParsedCard,
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
export { AccountDeletionContext, useAccountDeletion } from './account-deletion-context'
export { ResetLocalDataContext, useResetLocalData } from './reset-local-data-context'
export { useValidatedSubmit, type FieldErrors, type ValidatedSubmit } from './use-validated-submit'
export { readOnline, useOnline } from './use-online'
export { structurallyEqual } from './structurally-equal'
export { chunk } from './chunk'
export { useRouteSearch } from './use-route-search'
export { useBack, useBackTo } from './use-back'
export { useLatest } from './use-latest'
export { useStableHandlers } from './use-stable-handlers'
export { newest, type Clocked } from './newest'
export { mergeFields, type MergeFieldsOptions } from './merge-fields'
export { mergeProgress, mergeProgressAgainst, type MergeableProgress } from './merge-progress'
export { mergeCard, mergeCardAgainst, type MergeableCard } from './merge-srs'
export { resolveDataTransition, type DataTransition } from './data-transition'
export { localDataOwner, type DataOwner } from './data-owner'
export {
  isEmail,
  isLongEnoughPassword,
  emailErrorKey,
  passwordErrorKey,
  type EmailErrorKey,
  type PasswordErrorKey,
} from './validation'
export { DAY_MS, systemClock, fixedClock, nowIso, type Clock } from './clock'
export { cloneEntity, findEntity, newId, positionsById, requireEntity, type Entity } from './entity'
export {
  createCollectionStore,
  createSingletonStore,
  NO_PENDING,
  selectIsReady,
  whenStoreReady,
  type CollectionState,
  type CollectionStoreOptions,
  type PendingChangePort,
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
export type {
  ExtensionActivation,
  ExtensionCollectionSpec,
  ExtensionContext,
  ExtensionContributions,
  ExtensionId,
  ExtensionManifest,
  ExtensionPoint,
  ExtensionRoute,
  ExtensionRuntimeModule,
  DeckFilterContribution,
  DeckSortContribution,
  ImportOptionContribution,
} from './extension-manifest'
export { extensionRoute } from './extension-manifest'
export { ExtensionPointsContext, useExtensionPoint } from './extension-points-context'
export { type ContributedT, useContributedT } from './extension-i18n'
export {
  type ActiveExtensions,
  ExtensionServicesContext,
  isExtensionActive,
  useExtensionServices,
} from './extension-services-context'
export {
  isDue,
  schedule,
  scheduleOn,
  srsStatus,
  markKnown,
  markLearning,
  daysUntilDue,
  intervalLabel,
  nextIntervalLabel,
  DEFAULT_EASE,
  type Grade,
  type SrsState,
  type SrsStatus,
} from './srs'
export {
  draftDiffersFromCard,
  draftFrom,
  draftSchedule,
  draftStatus,
  withDue,
  withGrade,
  withStatus,
  type CardProgressDraft,
} from './card-progress'
export {
  dayKey,
  recordTrainingDay,
  recordPractice,
  totalTrainingDays,
  type StreakState,
  type StreakResult,
  type DailyTally,
  type PracticeOutcome,
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
export {
  fastOverview,
  studyOverview,
  type FastOverview,
  type StudyOverview,
} from './study-overview'
export { nextDefaultName } from './naming'
export { useOptimisticPatch, orderPatch } from './use-optimistic-patch'
export { useOneOpen, type OneOpen } from './use-one-open'
export { usePendingAct, type PendingAct } from './use-pending-act'
export { reconcileHeldOrder } from './reconcile-order'
export { useHeldOrder, type HeldOrder } from './use-held-order'
export { moveBlock } from './move-block'
export { useStackLanding, type StackLanding, type StackOrigin } from './use-stack-landing'
export {
  useSortableBlock,
  type SortableBlock,
  type SortableBlockDrop,
  type SortableBlockOptions,
} from './use-sortable-block'
export {
  arrangeLibrary,
  filterDecks,
  needsDueCounts,
  type ArrangeableDeck,
  type ArrangeableFolder,
  type ArrangeLibraryInput,
  type FlatDeck,
  type LibraryArrangement,
  type LibraryOrderPreferences,
  type Shelf,
  type ShelfPlace,
} from './library-arrangement'
export {
  childDecks,
  compareTreeOrder,
  siblingDecks,
  orderSiblings,
  reachableDecks,
  subtreeDeckIds,
  subtreeDecks,
  deckPath,
  idsWithoutDescendants,
  canReparent,
  inheritSettings,
  cardsInSubtree,
  dueCountsPerDeck,
  type SelectState,
  type TreeDeck,
  type TreeCard,
} from './deck-tree'
