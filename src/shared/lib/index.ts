export { cn } from './cn'
export { authEntrance } from './motion'
export { coverSquare, fileToAvatar, type CropRect } from './avatar'
export { downloadText } from './download'
export { useStickyHeader, type StickyHeader } from './sticky-header/use-sticky-header'
export {
  clampSwipeOffset,
  armedSide,
  resolveSwipeRelease,
  type SwipeGeometry,
  type SwipeRelease,
} from './gestures'
export { useLongPress, type LongPressHandlers, type LongPressOptions } from './use-long-press'
export { useAutoSelect } from './use-auto-select'
export { useKeyboardPin } from './use-keyboard-pin'
export { useSortableSensors } from './use-sortable-sensors'
export { shuffle } from './shuffle'
export { nextOrder, resequence } from './order'
export {
  ContentImportError,
  contentSlug,
  cardsToCsv,
  questionsToCsv,
  cardsToAnkiTsv,
  parsePastedCards,
  parseDelimitedNotes,
  parseAnkiText,
  parseVerses,
  parseVerseChapters,
  parseDeckContent,
  detectPasteFormat,
  guessFieldSeparator,
  stripHtml,
  type ParsedCard,
  type ParsedQuestion,
  type NoteDelimiters,
  type PasteFormat,
  type DeckContentData,
  type VerseChapter,
} from './content-transfer'
export { speak, cancelSpeech, speechAvailable } from './speech'
export { tick, impact, success, setHapticsEnabled } from './haptics'
export { useShake, motionSupported, requestMotionPermission } from './shake'
export { EventBus, type EventHandler } from './event-bus'
export type { AppEvents } from './events'
export { EventBusContext, useEventBus, useEventBusOptional } from './event-bus-context'
export { AuthGatewayContext, useAuthGateway } from './auth-gateway-context'
export { isEmail } from './validation'
export { systemClock, fixedClock, type Clock } from './clock'
export { cloneEntity, type Entity } from './entity'
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
  isCardReviewed,
  isDeckCompleted,
  computeTrainingTotals,
  cardMaturityCounts,
  type LevelInfo,
  type TrainingTotals,
} from './stats'
export {
  computeAchievements,
  type Achievement,
  type AchievementId,
  type AchievementInput,
} from './achievements'
export {
  computeBadges,
  milestoneProgress,
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
export { dropZone, type DropZone, type DropIntent, type ZoneRect } from './drop-zone'
export {
  childDecks,
  siblingDecks,
  rootDecks,
  decksInFolder,
  subtreeDeckIds,
  subtreeDecks,
  deckPath,
  isDescendantOrSelf,
  canReparent,
  resolveDeckSettings,
  cardsInSubtree,
  countDueInSubtree,
  dueCountsPerDeck,
  type TreeDeck,
  type TreeCard,
} from './deck-tree'
