export { cn } from './cn'
export { authEntrance } from './motion'
export { coverSquare, fileToAvatar, type CropRect } from './avatar'
export { downloadText } from './download'
export {
  useStickyHeader,
  type StickyHeader,
} from './sticky-header/use-sticky-header'
export {
  clampSwipeOffset,
  shouldCommitSwipe,
  SWIPE_DELETE_THRESHOLD,
  SWIPE_DELETE_MAX,
  SWIPE_FLING_SPEED,
} from './gestures'
export { useLongPress, type LongPressHandlers, type LongPressOptions } from './use-long-press'
export { shuffle } from './shuffle'
export { nextOrder, resequence } from './order'
export {
  ContentImportError,
  contentSlug,
  roomContentToJson,
  lociToCsv,
  questionsToCsv,
  lociToAnkiTsv,
  parsePastedLoci,
  parseAnkiText,
  parseVerses,
  parseVerseChapters,
  parseRoomContent,
  palaceContentToJson,
  parsePalaceContent,
  stripHtml,
  type ParsedLocus,
  type ParsedQuestion,
  type RoomContentData,
  type ImportedRoom,
  type PalaceMeta,
  type PalaceContentData,
  type VerseChapter,
} from './content-transfer'
export { speak, cancelSpeech, speechAvailable } from './speech'
export { tick, impact, success, setHapticsEnabled } from './haptics'
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
  isLocusReviewed,
  roomProgress,
  isRoomCompleted,
  computeTrainingTotals,
  palaceProgress,
  isRoomUnlocked,
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
  verseText,
  tokenizeWords,
  isVerseMarker,
  wordInitial,
  normalizeWord,
  scramble,
  typedVerseStatus,
  type VerseSource,
  type WordInitial,
  type TypedWordStatus,
  type VerseTypingResult,
} from './verse'
export {
  getDueLoci,
  countDueLoci,
  countDuePerPalace,
  type DueCard,
  type DuePalace,
  type DueRoom,
  type DueLocus,
} from './dueCards'
