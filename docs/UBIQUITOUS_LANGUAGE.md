# Ubiquitous Language

The words for code, interface copy, commits and talk. One line a term: what it means, then the code name or the
interface's words where they differ, then the words to avoid. How a thing works is in the code and the ADRs
(`docs/adr/`); how code is written is in [CODE_STYLE](CODE_STYLE.md).

Format: **Term** (code · UI): meaning. _Avoid:_ words.

## Content

- **Folder**: a top-level container that groups Decks. _Avoid:_ group, category.
- **Deck**: a study set of Cards and Questions. _Avoid:_ palace, set, collection, list.
- **Subdeck** (`parentId`): a Deck under a parent Deck. _Avoid:_ child deck, nested deck.
- **Main deck**: the Deck at the top of a tree of Subdecks; it owns the Learning algorithm for the whole tree.
  _Avoid:_ root deck, top deck, parent.
- **Card**: a flashcard with a front and a back. `Card` in `shared/ui/primitives/card.tsx` is a plain surface, not
  this. _Avoid:_ note, term, item.
- **Question**: a multiple-choice item with a prompt, options and one correct answer. _Avoid:_ quiz item, MCQ, card.
- **Card style** (UI Card styles): a Deck's card look: a preset, font, text size and alignment. _Avoid:_ theme, skin.
- **Preset** (`CARD_STYLE_PRESET_IDS`): one of the Card style scenes (paper, chalk, night…). Never a Learning
  algorithm. _Avoid:_ theme, template.
- **Memory palace**: the brand and store copy only. Everything in the app says Deck, Card, Question. _Avoid:_ palace,
  room, locus (in code and in-app copy).

## Studying

- **Learning algorithm** (UI Algorithm): which scheduler a Deck follows, Fast review or Spaced repetition; a Subdeck
  follows its Main deck's. _Avoid:_ mode, preset, strategy, "the algorithm" for the SRS.
- **Spaced repetition**: intervals grow with recall, and only Due Cards are offered. _Avoid:_ SRS mode, SM-2.
- **Fast review**: no schedule; every unfrozen Card is on offer in every pass. _Avoid:_ quick mode, cram.
- **SRS** (`srs`): the scheduler that sets when a Card is next Due. _Avoid:_ algorithm.
- **Review**: grading a Card's recall, which moves its schedule. Unqualified, always this, never a Sync's review.
  _Avoid:_ practice, test.
- **Grade** (`again` / `hard` / `good` / `easy`): the answer a Review gives. _Avoid:_ score, rating.
- **Not quite** / **Got it** (`fastReview`): the two Fast review answers: the Card comes back later in the pass, or
  leaves it. Not Grades; they never touch the SRS. _Avoid:_ again, good, wrong, correct.
- **Due**: when a Card is next scheduled. _Avoid:_ next date.
- **Card status** (`new` / `learning` / `known`): where a Card stands in the SRS. _Avoid:_ state, level.
- **Mastered** (code `known`): a Card whose interval has reached 21 days, or that the learner marked so. _Avoid:_
  Known (in the UI), mature.
- **Memorized** (`memorized`): a stored flag kept from a Mindscape import, separate from `known`; nothing in the app
  sets or shows it yet. _Avoid:_ known, mastered, done.
- **Flagged**: marked for later attention. _Avoid:_ starred, bookmarked.
- **Frozen** (UI Freeze): held out of every queue until unfrozen. _Avoid:_ paused, suspended.
- **Reversed** (UI Reverse): studied back to front, whatever the Deck says. _Avoid:_ flipped, inverted.
- **Reset progress**: clears a Card's schedule, its Fast review answer and its Learning history. _Avoid:_ restart.
- **Study session**: one pass through a Deck in one Practice mode. Never shortened to "session". _Avoid:_ session, run.
- **Practice mode**: a way to study: Flashcards, Quiz or Match. _Avoid:_ game, activity.
- **Flashcards**: front to back, self-graded. _Avoid:_ study cards.
- **Study mode** (`StudyMode` · UI Type, Initials, Blur, Rebuild): how a flashcard's answer is recalled; Rebuild is
  `words` in code. _Avoid:_ flashcard type.
- **Quiz**: Questions to answer. _Avoid:_ test, exam.
- **Match**: pairing Cards against the clock. _Avoid:_ pairs.
- **Study scope** (`StudyScope`, `MatchScope`): which Deck a Study session runs over. _Avoid:_ scope.
- **Study filter** (`StudyFilter`): which of its Cards: all, due, new, learning or flagged. _Avoid:_ scope, selection.
- **Learning history**: every answer a Card has been given, newest first. _Avoid:_ review log, audit.
- **History entry** (`kind`: `graded`, `answered`, `mastered`, `adjusted`): one answer or hand-set change on the
  Learning history. Wider than a Review. _Avoid:_ review, row, event.
- **Card progress**: the sheet where the learner sets a Card's status or next review by hand. _Avoid:_ edit schedule.

## Organising

- **Library**: all Folders and Decks, and the home screen that browses them. _Avoid:_ home, list.
- **Archive**: where archived Decks live, a place of its own outside every Folder and Deck. _Avoid:_ hidden, trash.
- **Favorite**: a Deck the learner marked so the Library filter can show it alone. _Avoid:_ pinned, starred.
- **Library order** (`DeckSort` · UI Sort decks): the order a level of the Library follows. _Avoid:_ sorting mode.
- **Library filter** (`DeckFilterId`): which Decks the Library shows. Not a Card filter or a Study filter. _Avoid:_
  view, scope.
- **Shelf** (`Shelf`): one list of Decks as the learner reads it, with its headings, the same wherever it appears.
  _Avoid:_ section, group.
- **Card filter**: what a Deck's card list shows, by status or Flagged only. _Avoid:_ filter, scope.
- **Select mode**: entered by press-and-hold; the header becomes the Selection's and a toolbar takes the bottom.
  _Avoid:_ edit mode, bulk mode.
- **Selection**: the rows picked in Select mode, acted on together. _Avoid:_ multi-select, checked items.
- **Select toolbar**: the actions at the bottom in Select mode, arranged by the learner. _Avoid:_ action bar.
- **Swipe action**: what a left or right swipe does on a list row. _Avoid:_ gesture, quick action.

## Progress

- **Progress**: the learner's stats record: XP, Streak, accuracy, Training days. _Avoid:_ stats, profile.
- **XP**: points earned by studying. _Avoid:_ points.
- **Level**: a tier worked out from XP. _Avoid:_ rank.
- **Streak**: consecutive Training days. _Avoid:_ chain.
- **Training day**: a day the learner studied. _Avoid:_ active day, session.
- **Streak freeze**: keeps a Streak across one missed day. _Avoid:_ freeze, skip.
- **Achievement**: a one-time milestone. _Avoid:_ trophy, goal.
- **Badge**: an emblem with tiers, shown as pips. _Avoid:_ medal.
- **Notification**: an in-app notice (a level-up, a streak, a result). _Avoid:_ alert.

## Identity

- **Learner**: the person studying. _Avoid:_ user.
- **Session** (`kind`: `guest` / `account`): the current sign-in. Auth only, never a study pass. _Avoid:_ login,
  study session.
- **Guest**: a Session with no account; its data stays on the device. _Avoid:_ anonymous.
- **Account**: a signed-up identity with an email. _Avoid:_ user, login.
- **Profile**: display data: name, username, bio, avatar. _Avoid:_ account, user.
- **Preferences**: the learner's global settings. _Avoid:_ settings, config.
- **Deck settings**: one Deck's options. Not Preferences. _Avoid:_ settings, config.
- **Developer mode**: a Preference that shows developer tools on every device. _Avoid:_ debug mode, admin.

## Sync

- **Sync** (`syncNow`): one cycle that sends this device's changes and brings others' in. Never a study pass or a
  login. _Avoid:_ sync session, refresh.
- **Synchronise**: the verb in every UI sentence and on the button. _Avoid:_ sync (as a verb in the UI).
- **Autosync**: the Preference that runs a Sync without being asked, on by default; it covers Held tables only.
  _Avoid:_ auto-sync, background sync.
- **Pending change** (`pendingChanges`): a write to a synced document that no Sync has confirmed yet. _Avoid:_ dirty,
  unsaved.
- **Table** (`table`): the synced table a Pending change belongs to. _Avoid:_ collection (RxDB's word), kind.
- **Cadence** (`held` / `quiet`): how a table's changes leave the device. _Avoid:_ mode, policy.
- **Held table**: its changes wait for a Sync: decks, cards, folders, questions, progress, learning history, an
  extension's own. _Avoid:_ manual table.
- **Quiet table**: its changes go up on their own and are never shown as waiting: preferences, profiles. _Avoid:_ auto
  table.
- **Quiet sync** (`quietSync`): the unasked cycle over the Quiet tables. Not Autosync. _Avoid:_ background sync.
- **Content collection**: one of the four tables a learner's content lives in: folders, decks, cards, questions.
  _Avoid:_ table.
- **Base**: the server copy of a document this device last saw. _Avoid:_ last seen, ancestor.
- **Checkpoint**: where this device's last Sync got to in a table. _Avoid:_ cursor, bookmark.
- **Divergence**: the cloud and this device both changed a document since the last Sync. _Avoid:_ conflict.
- **Conflict**: RxDB's word for one document arriving in two versions, merged without asking. _Avoid:_ divergence.
- **Destructive divergence**: deleted here, changed elsewhere; the only question a Sync ever asks. _Avoid:_ conflict.
- **Review of a Sync** (`SyncReviewDialog`): the dialog that answers a Destructive divergence with Delete or Keep.
  _Avoid:_ review (alone), conflict dialog.
- **Sync log** (UI Recent syncs): this device's record of its last Syncs. _Avoid:_ history.
- **Repair**: the Sync page's tools: review pending changes, or check everything against the cloud. _Avoid:_ reset,
  resync.
- **Restoring**: the Sync forced after a cancelled account deletion. _Avoid:_ recovery, reload.
- **Purge**: the server destroying an account for good, 30 days after it was asked. _Avoid:_ delete, wipe.

## Extensions

- **Extension**: a self-contained feature the learner switches on in Settings. _Avoid:_ plugin, add-on, module.
- **Extension overview**: an Extension's own front door: what it is, what it gives, its feature switches. _Avoid:_
  settings screen.
- **Extension feature** (`preferences.disabledFeatures`): one part of an Extension that can be switched off. _Avoid:_
  module, plugin.
- **Contribution point** (`ExtensionPoint`, `useExtensionPoint`): a named slot a host screen fills on an Extension's
  behalf. _Avoid:_ hook (React's word).
- **Developer tools**: an Extension's diagnostic and destructive screen, shown in Developer mode. _Avoid:_ admin
  screen, settings.
- **Verse**: one numbered line of scripture; its reference is not part of its text. _Avoid:_ passage (a range).
- **Bible library**: the verse text an account holds, which the passage picker fills in from. _Avoid:_ library (the
  Decks).
- **Book code** (`JHN`, `1CO`): a book's stable identity, what a verse is stored under. _Avoid:_ book name.
- **Translation**: owns the book names and abbreviations shown (Cornilescu 2024). _Avoid:_ version, language.
- **Recent passage**: a chapter the learner last added verses from. _Avoid:_ history.
