# Angular migration — port tracker

Protocol (ADR-0003/0006): a file may be deleted from `legacy-react/` only after every export,
behavior, UI state, i18n key, and test it carries has a verified Angular equivalent.

**Files remaining: 256** — parity when this list is empty and `legacy-react/` is deleted.

Status legend: `[ ]` not started · `[~]` ported, verification pending · `[x]` verified & deleted

Known gaps in the decks-area `[~]` rows (deck library, deck tree, shared overlay primitives):

- **Bottom nav rebuilt to the M3 spec** (`shell/app-nav.ts`, ADR-0007) — Taiga UI removed entirely (12 packages), along with `@maskito` (4) and `@ng-web-apis` (6), which were Taiga's own dependency footprint, and the `less` devDep. 22 packages total.
- **Drag-and-drop reorder/reparent** (decks, folders) not yet ported — PrimeNG Tree adoption (ADR-0002) pending.
- **Swipe actions ported** (`shared/ui/swipe-row.ts` + `swipe-actions.ts`; wired into deck tree, folder rows, card rows, question rows, notifications panel).
- **Multi-select mode ported** (`shared/ui/select-dot.ts`, `select-actions.ts`, `select-toolbar.ts`; `decks/ui/select-mode-bar.ts`; wired into deck library, deck detail cards, deck questions with bulk move/favorite/duplicate/archive/unfile/flag/known/reset/delete). Long-press now enters select mode (React behavior); the interim long-press action sheet on deck/folder/card rows is gone — per-row actions live on swipe and the overflow button. Select-mode drag-reorder (dnd) still pending with the drag-and-drop port.
- **Settings area started**: hub (`settings/pages/settings-page.ts`), swipe editor, and select-toolbar editor ported and routed; both editors' previews drag with CDK drag-drop (ADR-0002 assigns dnd to PrimeNG Tree only for the deck tree). Remaining settings subpages (profile, change-password, privacy, help, about) still wildcard-redirect home.
- **Import flows** (paste notes, Anki file) gated off until the import area ports.
- Sticky-header elevation simplified to a boolean + CSS transition (React ramped 0–1 over 16px).
- Deck row "settings" action now reachable via swipe (deck-settings has ported); remaining unported routes wildcard-redirect home.
- React component tests (`*.test.tsx`) for these files still need Angular spec equivalents.

## .

- [ ] `eslint.config.js`
- [x] `index.html`
- [ ] `package-lock.json`
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `vite.config.ts`

## src

- [ ] `main.tsx`
- [ ] `vite-env.d.ts`

## src/app

- [ ] `App.tsx`
- [x] `RootLayout.tsx`
- [x] `auth-guard.test.ts`
- [x] `auth-guard.ts`
- [x] `composition-root.ts`
- [ ] `router.tsx`

## src/app/persistence

- [x] `database.test.ts`
- [x] `database.ts`
- [x] `local-auth-gateway.test.ts`
- [x] `local-auth-gateway.ts`
- [x] `schemas.ts`

## src/app/providers

- [x] `AppProviders.tsx`
- [x] `AuthProvider.tsx`
- [x] `NotificationBridge.test.tsx`
- [x] `NotificationBridge.tsx`
- [x] `PreferencesProvider.tsx`
- [x] `ServicesProvider.tsx`
- [x] `ThemeProvider.test.tsx`
- [x] `ThemeProvider.tsx`
- [x] `UpdatePrompt.tsx`

## src/entities/card

- [x] `index.ts`

## src/entities/card/api

- [x] `card-repository.ts`

## src/entities/card/model

- [x] `context.ts`
- [x] `selectors.ts`
- [x] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/deck

- [x] `index.ts`

## src/entities/deck/api

- [x] `deck-repository.ts`

## src/entities/deck/model

- [x] `appearance.ts`
- [x] `context.ts`
- [x] `selectors.ts`
- [x] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/folder

- [x] `index.ts`

## src/entities/folder/api

- [x] `folder-repository.ts`

## src/entities/folder/model

- [x] `appearance.ts`
- [x] `context.ts`
- [x] `selectors.ts`
- [x] `store.test.ts`
- [x] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/notification

- [x] `index.ts`

## src/entities/notification/api

- [x] `notification-repository.ts`

## src/entities/notification/model

- [x] `context.ts`
- [x] `selectors.ts`
- [x] `store.test.ts`
- [x] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/preferences

- [x] `index.ts`

## src/entities/preferences/api

- [x] `preferences-repository.ts`

## src/entities/preferences/model

- [x] `context.ts`
- [x] `selectors.ts`
- [x] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/profile

- [x] `index.ts`

## src/entities/profile/api

- [x] `profile-repository.ts`

## src/entities/profile/model

- [x] `context.ts`
- [x] `selectors.ts`
- [x] `store.test.ts`
- [x] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/progress

- [x] `index.ts`

## src/entities/progress/api

- [x] `progress-repository.ts`

## src/entities/progress/model

- [x] `context.ts`
- [x] `selectors.ts`
- [x] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/question

- [x] `index.ts`

## src/entities/question/api

- [x] `question-repository.ts`

## src/entities/question/model

- [x] `context.ts`
- [x] `selectors.ts`
- [x] `store.test.ts`
- [x] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/session

- [x] `index.ts`

## src/entities/session/api

- [x] `session-repository.ts`

## src/entities/session/model

- [x] `context.ts`
- [x] `store.test.ts`
- [x] `store.ts`
- [x] `types.ts`

## src/features/card

- [x] `create-card.ts`
- [x] `delete-card.ts`
- [x] `duplicate-card.ts`
- [x] `edit-card.ts`
- [x] `index.ts`
- [x] `mark-cards-known.ts`
- [x] `mark-deck-known.ts`
- [x] `reorder-cards.ts`
- [x] `require-card.ts`
- [x] `reset-cards-srs.ts`
- [x] `reset-deck-srs.ts`
- [x] `toggle-card-flag.ts`

## src/features/content

- [x] `apply-content.ts`
- [x] `content.test.ts`
- [x] `export-content.ts`
- [x] `import-content.ts`
- [x] `index.ts`

## src/features/data

- [x] `clear-content.ts`
- [x] `clear-notifications.ts`
- [x] `data-commands.test.ts`
- [x] `index.ts`
- [x] `reset-everything.ts`
- [x] `reset-progress.ts`

## src/features/deck

- [x] `create-deck.ts`
- [x] `delete-deck.ts`
- [x] `duplicate-deck.ts`
- [x] `edit-deck.ts`
- [x] `index.ts`
- [x] `move-deck.ts`
- [x] `reorder-decks.ts`
- [x] `require-deck.ts`
- [x] `set-archived.ts`
- [x] `set-folder.ts`
- [x] `toggle-favorite.ts`

## src/features/folder

- [x] `create-folder.ts`
- [x] `delete-folder.ts`
- [x] `edit-folder.ts`
- [x] `folder-commands.test.ts`
- [x] `index.ts`
- [x] `reorder-folders.ts`

## src/features/match

- [x] `index.ts`
- [x] `match-machine.test.ts`
- [x] `match-machine.ts`

## src/features/notification

- [x] `index.ts`
- [x] `mark-all-read.ts`
- [x] `notification-commands.test.ts`
- [x] `record-notification.ts`
- [x] `remove-notification.ts`

## src/features/preferences

- [x] `index.ts`
- [x] `preferences-commands.test.ts`
- [x] `set-preferences.ts`

## src/features/profile

- [x] `index.ts`
- [x] `profile-commands.test.ts`
- [x] `set-profile.ts`

## src/features/progress

- [x] `award-xp.ts`
- [x] `complete-session.test.ts`
- [x] `complete-session.ts`
- [x] `current-progress.ts`
- [x] `index.ts`
- [x] `progress-commands.test.ts`
- [x] `record-quiz-result.ts`
- [x] `record-training-day.ts`
- [x] `rewards.test.ts`
- [x] `rewards.ts`

## src/features/question

- [x] `create-question.ts`
- [x] `delete-question.ts`
- [x] `duplicate-question.ts`
- [x] `edit-question.ts`
- [x] `index.ts`
- [x] `question-commands.test.ts`
- [x] `reorder-questions.ts`
- [x] `require-question.ts`

## src/features/quiz

- [x] `index.ts`
- [x] `quiz-machine.test.ts`
- [x] `quiz-machine.ts`

## src/features/review

- [x] `due-queue-flow.test.ts`
- [x] `grade-card.ts`
- [x] `index.ts`
- [x] `restore-schedule.ts`
- [x] `review-commands.test.ts`
- [x] `scope.test.ts`
- [x] `scope.ts`
- [x] `session-machine.test.ts`
- [x] `session-machine.ts`

## src/features/session

- [x] `continue-as-guest.ts`
- [x] `index.ts`
- [x] `request-password-reset.ts`
- [x] `restore-session.ts`
- [x] `session-commands.test.ts`
- [x] `sign-in-with-email.ts`
- [x] `sign-out.ts`
- [x] `sign-up-with-email.ts`
- [ ] `use-auth-actions.ts`

## src/pages/achievement-detail

- [x] `index.ts`

## src/pages/achievement-detail/ui

- [ ] `AchievementDetailPage.tsx`

## src/pages/achievements

- [x] `index.ts`

## src/pages/achievements/ui

- [ ] `AchievementsPage.tsx`

## src/pages/archived-decks

- [x] `index.ts`

## src/pages/archived-decks/ui

- [~] `ArchivedDecksPage.tsx`

## src/pages/badge-detail

- [x] `index.ts`

## src/pages/badge-detail/ui

- [ ] `BadgeDetailPage.tsx`

## src/pages/badges

- [x] `index.ts`

## src/pages/badges/ui

- [ ] `BadgesPage.tsx`

## src/pages/card-editor

- [ ] `index.ts`

## src/pages/card-editor/ui

- [~] `CardEditorPage.tsx`

## src/pages/deck-detail

- [ ] `index.ts`

## src/pages/deck-detail/ui

- [~] `DeckDetailPage.tsx`

## src/pages/deck-library

- [ ] `index.ts`

## src/pages/deck-library/ui

- [~] `DeckLibraryPage.tsx`
- [~] `FolderSheet.tsx`
- [~] `MoveDeckSheet.tsx`

## src/pages/deck-questions

- [ ] `index.ts`

## src/pages/deck-questions/ui

- [~] `DeckQuestionsPage.tsx`

## src/pages/deck-settings

- [ ] `index.ts`

## src/pages/deck-settings/ui

- [~] `DeckAppearanceSheet.tsx`
- [~] `DeckSettingsPage.tsx`

## src/pages/forgot-password

- [ ] `index.ts`

## src/pages/forgot-password/ui

- [ ] `ForgotPasswordPage.test.tsx`
- [ ] `ForgotPasswordPage.tsx`

## src/pages/import-review

- [ ] `index.ts`

## src/pages/import-review/ui

- [ ] `ImportReviewPage.tsx`

## src/pages/login

- [ ] `index.ts`

## src/pages/login/ui

- [ ] `LoginPage.test.tsx`
- [ ] `LoginPage.tsx`

## src/pages/match

- [ ] `index.ts`

## src/pages/match/ui

- [ ] `MatchPage.test.tsx`
- [~] `MatchPage.tsx`

## src/pages/notifications

- [ ] `index.ts`

## src/pages/notifications/ui

- [ ] `NotificationsPage.test.tsx`
- [~] `NotificationsPage.tsx`

## src/pages/paste-notes

- [ ] `index.ts`

## src/pages/paste-notes/ui

- [ ] `PasteNotesPage.tsx`

## src/pages/profile

- [ ] `index.ts`

## src/pages/profile/ui

- [ ] `ProfilePage.test.tsx`
- [ ] `ProfilePage.tsx`

## src/pages/question-editor

- [ ] `index.ts`

## src/pages/question-editor/ui

- [~] `QuestionEditorPage.tsx`

## src/pages/quiz

- [ ] `index.ts`

## src/pages/quiz/ui

- [ ] `QuizPage.test.tsx`
- [~] `QuizPage.tsx`

## src/pages/settings

- [ ] `index.ts`

## src/pages/settings/ui

- [ ] `SettingsPage.test.tsx`
- [~] `SettingsPage.tsx`

## src/pages/settings-about

- [ ] `index.ts`

## src/pages/settings-about/ui

- [ ] `SettingsAboutPage.test.tsx`
- [ ] `SettingsAboutPage.tsx`

## src/pages/settings-change-password

- [ ] `index.ts`

## src/pages/settings-change-password/ui

- [ ] `SettingsChangePasswordPage.test.tsx`
- [ ] `SettingsChangePasswordPage.tsx`

## src/pages/settings-help

- [ ] `index.ts`

## src/pages/settings-help/ui

- [ ] `SettingsHelpPage.test.tsx`
- [ ] `SettingsHelpPage.tsx`

## src/pages/settings-privacy

- [ ] `index.ts`

## src/pages/settings-privacy/ui

- [ ] `SettingsPrivacyPage.test.tsx`
- [ ] `SettingsPrivacyPage.tsx`

## src/pages/settings-profile

- [ ] `index.ts`

## src/pages/settings-profile/ui

- [ ] `SettingsProfilePage.test.tsx`
- [ ] `SettingsProfilePage.tsx`

## src/pages/settings-select

- [ ] `index.ts`

## src/pages/settings-select/ui

- [~] `SettingsSelectPage.tsx`

## src/pages/settings-swipe

- [ ] `index.ts`

## src/pages/settings-swipe/ui

- [~] `SettingsSwipePage.tsx`

## src/pages/signup

- [ ] `index.ts`

## src/pages/signup/ui

- [ ] `SignupPage.test.tsx`
- [ ] `SignupPage.tsx`

## src/pages/streak

- [ ] `index.ts`

## src/pages/streak/ui

- [ ] `StreakPage.tsx`

## src/pages/study

- [ ] `index.ts`

## src/pages/study/ui

- [ ] `StudyCardsPage.tsx`

## src/pages/welcome

- [ ] `index.ts`

## src/pages/welcome/ui

- [ ] `WelcomePage.test.tsx`
- [ ] `WelcomePage.tsx`

## src/shared/api

- [x] `auth-gateway.ts`
- [x] `base-repository.ts`
- [x] `in-memory-repository.test.ts`
- [x] `in-memory-repository.ts`
- [ ] `index.ts`

## src/shared/api/rxdb

- [x] `database.ts`
- [ ] `index.ts`
- [x] `rxdb-persistence.test.ts`
- [x] `rxdb-repository.test.ts`
- [x] `rxdb-repository.ts`

## src/shared/config

- [x] `constants.ts`
- [x] `flashcard-swipe.ts`
- [x] `routes.ts`
- [x] `select-toolbar.test.ts`
- [x] `select-toolbar.ts`
- [x] `swipe.ts`

## src/shared/i18n

- [x] `i18next.d.ts`
- [ ] `index.ts`

## src/shared/i18n/locales

- [x] `en.ts`

## src/shared/lib

- [x] `achievements.test.ts`
- [x] `achievements.ts`
- [ ] `auth-gateway-context.tsx`
- [x] `avatar.test.ts`
- [x] `avatar.ts`
- [x] `badges.test.ts`
- [x] `badges.ts`
- [x] `clock.test.ts`
- [x] `clock.ts`
- [ ] `cn.ts`
- [x] `content-transfer.test.ts`
- [x] `content-transfer.ts`
- [x] `deck-tree.test.ts`
- [x] `deck-tree.ts`
- [x] `download.ts`
- [x] `drop-zone.test.ts`
- [x] `drop-zone.ts`
- [x] `entity.test.ts`
- [x] `entity.ts`
- [ ] `event-bus-context.test.tsx`
- [ ] `event-bus-context.tsx`
- [x] `event-bus.ts`
- [x] `events.ts`
- [x] `gestures.test.ts`
- [x] `gestures.ts`
- [x] `haptics.test.ts`
- [x] `haptics.ts`
- [ ] `index.ts`
- [ ] `motion.ts`
- [x] `naming.test.ts`
- [x] `naming.ts`
- [x] `order.test.ts`
- [x] `order.ts`
- [x] `recall.test.ts`
- [x] `recall.ts`
- [ ] `shake.ts`
- [x] `shuffle.test.ts`
- [x] `shuffle.ts`
- [x] `speech.ts`
- [x] `srs.test.ts`
- [x] `srs.ts`
- [x] `stats.test.ts`
- [x] `stats.ts`
- [x] `streak.test.ts`
- [x] `streak.ts`
- [x] `study-overview.test.ts`
- [x] `study-overview.ts`
- [ ] `use-auto-select.ts`
- [x] `use-keyboard-pin.ts`
- [ ] `use-long-press.test.tsx`
- [~] `use-long-press.ts`
- [ ] `use-optimistic-patch.test.ts`
- [ ] `use-optimistic-patch.ts`
- [ ] `use-sortable-sensors.ts`
- [x] `validation.ts`

## src/shared/lib/sticky-header

- [ ] `elevation.test.ts`
- [ ] `elevation.ts`
- [ ] `use-sticky-header.ts`

## src/shared/test

- [x] `repository-contract.ts`
- [ ] `setup.ts`
- [ ] `sticky-header.ts`

## src/shared/ui

- [~] `ActionSheet.tsx`
- [ ] `AppScreen.tsx`
- [ ] `AuthField.test.tsx`
- [ ] `AuthField.tsx`
- [ ] `AuthScreen.test.tsx`
- [ ] `AuthScreen.tsx`
- [ ] `Avatar.test.tsx`
- [~] `Avatar.tsx`
- [ ] `BadgeMedallion.tsx`
- [ ] `Card.tsx`
- [~] `CardMaturityOverview.tsx`
- [~] `Chip.tsx`
- [ ] `CollectionPreview.tsx`
- [ ] `Combobox.tsx`
- [~] `ConfirmDialog.tsx`
- [~] `DeckCover.tsx`
- [ ] `DropIndicator.tsx`
- [ ] `EditableTitle.tsx`
- [ ] `EmojiField.test.tsx`
- [~] `EmojiField.tsx`
- [~] `EmptyState.tsx`
- [ ] `FlyoutMenu.test.tsx`
- [ ] `FlyoutMenu.tsx`
- [~] `FolderGlyph.tsx`
- [~] `GlassCard.tsx`
- [ ] `GradeButtons.test.tsx`
- [ ] `GradeButtons.tsx`
- [ ] `IconButton.tsx`
- [~] `IconColorRow.tsx`
- [ ] `ImportRow.tsx`
- [ ] `OverflowMenuButton.tsx`
- [ ] `PasswordField.tsx`
- [~] `ProgressBar.tsx`
- [~] `PromptSheet.tsx`
- [~] `ScreenHeader.tsx`
- [ ] `SegmentedControl.test.tsx`
- [~] `SegmentedControl.tsx`
- [~] `SelectDot.tsx`
- [~] `SelectToolbar.tsx`
- [ ] `SettingsRow.test.tsx`
- [~] `SettingsRow.tsx`
- [~] `SettingsSection.tsx`
- [~] `Sheet.tsx`
- [ ] `SocialButtons.test.tsx`
- [ ] `SocialButtons.tsx`
- [~] `SortControl.tsx`
- [~] `SpeedDial.tsx`
- [ ] `SrsStatusChip.test.tsx`
- [~] `SrsStatusChip.tsx`
- [ ] `StatTile.test.tsx`
- [ ] `StatTile.tsx`
- [~] `StickyBar.tsx`
- [ ] `StudyOverviewCard.test.tsx`
- [~] `StudyOverviewCard.tsx`
- [~] `SwipeRow.tsx`
- [ ] `Switch.test.tsx`
- [~] `Switch.tsx`
- [ ] `TextField.tsx`
- [ ] `Textarea.tsx`
- [ ] `TierPips.tsx`
- [ ] `WordReveal.test.tsx`
- [ ] `WordReveal.tsx`
- [ ] `button.tsx`
- [ ] `index.ts`
- [~] `select-actions.tsx`
- [~] `swipe-actions.tsx`
- [ ] `use-drag-to-dismiss.ts`

## src/styles

- [x] `index.css`
- [x] `theme.css`
- [x] `tokens.css`

## src/widgets/achievement-list

- [ ] `index.ts`

## src/widgets/achievement-list/ui

- [ ] `AchievementGrid.tsx`
- [ ] `AchievementsSection.tsx`
- [ ] `meta.ts`

## src/widgets/badge-list

- [ ] `index.ts`

## src/widgets/badge-list/ui

- [ ] `BadgeGrid.tsx`
- [ ] `BadgesSection.tsx`
- [ ] `NextMilestoneCard.tsx`
- [ ] `meta.ts`

## src/widgets/bottom-nav

- [ ] `index.ts`

## src/widgets/bottom-nav/ui

- [x] `AppNav.tsx`

## src/widgets/content-editor

- [ ] `index.ts`

## src/widgets/content-editor/model

- [ ] `import-draft.test.ts`
- [ ] `import-draft.ts`

## src/widgets/content-editor/ui

- [ ] `CardBrowser.tsx`
- [~] `ContentRows.tsx`
- [ ] `DeckContentEditor.test.tsx`
- [~] `DeckContentEditor.tsx`
- [ ] `ReorderableList.tsx`
- [~] `SelectModeBar.tsx`
- [~] `editor-fields.tsx`
- [~] `editor-helpers.ts`

## src/widgets/deck-tree

- [ ] `index.ts`

## src/widgets/deck-tree/ui

- [~] `DeckTree.tsx`

## src/widgets/folder-form

- [ ] `index.ts`

## src/widgets/folder-form/ui

- [~] `FolderForm.tsx`

## src/widgets/home-header

- [ ] `index.ts`

## src/widgets/home-header/ui

- [ ] `HomeHeader.test.tsx`
- [~] `HomeHeader.tsx`

## src/widgets/match

- [ ] `index.ts`

## src/widgets/match/ui

- [ ] `MatchBoard.test.tsx`
- [~] `MatchBoard.tsx`

## src/widgets/notifications-panel

- [ ] `index.ts`

## src/widgets/notifications-panel/lib

- [~] `group.test.ts`
- [~] `group.ts`

## src/widgets/notifications-panel/ui

- [ ] `NotificationsPanel.test.tsx`
- [~] `NotificationsPanel.tsx`

## src/widgets/practice-modes

- [ ] `index.ts`

## src/widgets/practice-modes/ui

- [ ] `PracticeModes.test.tsx`
- [~] `PracticeModes.tsx`

## src/widgets/profile-header

- [ ] `index.ts`

## src/widgets/profile-header/ui

- [ ] `ProfileBar.test.tsx`
- [ ] `ProfileBar.tsx`
- [ ] `ProfileHero.test.tsx`
- [ ] `ProfileHero.tsx`

## src/widgets/quiz

- [ ] `index.ts`

## src/widgets/quiz/ui

- [~] `QuizOptionsSheet.tsx`
- [ ] `QuizSession.test.tsx`
- [~] `QuizSession.tsx`

## src/widgets/session-reward

- [ ] `index.ts`
- [ ] `use-session-reward.test.tsx`
- [~] `use-session-reward.ts`

## src/widgets/splash

- [ ] `index.ts`

## src/widgets/splash/ui

- [x] `SplashOverlay.test.tsx`
- [x] `SplashOverlay.tsx`

## src/widgets/streak-calendar

- [ ] `index.ts`

## src/widgets/streak-calendar/ui

- [ ] `StreakCalendar.test.tsx`
- [ ] `StreakCalendar.tsx`

## src/widgets/streak-summary

- [ ] `index.ts`

## src/widgets/streak-summary/ui

- [ ] `StreakSummary.test.tsx`
- [ ] `StreakSummary.tsx`

## src/widgets/study-session

- [ ] `index.ts`

## src/widgets/study-session/model

- [ ] `types.ts`
- [ ] `use-initials-recall.ts`

## src/widgets/study-session/ui

- [ ] `CompletionOverlay.tsx`
- [ ] `FlashcardsPanel.test.tsx`
- [ ] `FlashcardsPanel.tsx`
- [ ] `GearSheet.tsx`
- [ ] `InStudyEditor.tsx`
- [ ] `ModeSheet.tsx`
- [ ] `QuickActionRows.tsx`
- [ ] `QuickActionsSheet.tsx`
- [ ] `SheetSection.tsx`
- [ ] `StudyDeck.tsx`
- [ ] `ToggleRow.tsx`
- [ ] `mode-meta.ts`

## src/widgets/study-session/ui/faces

- [ ] `AnswerFace.tsx`
- [ ] `BlurFace.tsx`
- [ ] `CardFace.tsx`
- [ ] `InitialsFace.tsx`
- [ ] `PromptFace.tsx`
- [ ] `RebuildFace.tsx`
- [ ] `TypeFace.tsx`
- [ ] `index.ts`
- [ ] `types.ts`

## src/widgets/threshold

- [ ] `index.ts`

## src/widgets/threshold/ui

- [ ] `AuthLogo.tsx`
- [x] `Threshold.tsx`
