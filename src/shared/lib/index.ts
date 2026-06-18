export { cn } from './cn'
export { authEntrance } from './motion'
export { coverSquare, fileToAvatar, type CropRect } from './avatar'
export { downloadText } from './download'
export {
  useCollapsibleHeader,
  type CollapsibleHeader,
} from './collapsible-header/use-collapsible-header'
export { headerHeight } from './collapsible-header/collapse'
export {
  clampSwipeOffset,
  shouldCommitSwipe,
  SWIPE_DELETE_THRESHOLD,
  SWIPE_DELETE_MAX,
  SWIPE_FLING_SPEED,
} from './gestures'
export { useLongPress, type LongPressHandlers, type LongPressOptions } from './use-long-press'
export { shuffle } from './shuffle'
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
  totalTrainingDays,
  buildDayCells,
  type StreakState,
  type StreakResult,
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
export { computeBadges, type Badge, type BadgeId, type BadgeInput } from './badges'
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
  type DueCard,
  type DuePalace,
  type DueRoom,
  type DueLocus,
} from './dueCards'
