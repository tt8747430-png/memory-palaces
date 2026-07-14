# Angular migration — port tracker

Protocol (ADR-0003/0006): a file may be deleted from `legacy-react/` only after every export,
behavior, UI state, i18n key, and test it carries has a verified Angular equivalent.

**Files remaining: 432** — parity when this list is empty and `legacy-react/` is deleted.

Status legend: `[ ]` not started · `[~]` ported, verification pending · `[x]` verified & deleted

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
- [ ] `RootLayout.tsx`
- [ ] `auth-guard.test.ts`
- [ ] `auth-guard.ts`
- [ ] `composition-root.ts`
- [ ] `router.tsx`

## src/app/persistence

- [ ] `database.test.ts`
- [ ] `database.ts`
- [ ] `local-auth-gateway.test.ts`
- [ ] `local-auth-gateway.ts`
- [ ] `schemas.ts`

## src/app/providers

- [ ] `AppProviders.tsx`
- [ ] `AuthProvider.tsx`
- [ ] `NotificationBridge.test.tsx`
- [ ] `NotificationBridge.tsx`
- [ ] `PreferencesProvider.tsx`
- [ ] `ServicesProvider.tsx`
- [ ] `ThemeProvider.test.tsx`
- [ ] `ThemeProvider.tsx`
- [ ] `UpdatePrompt.tsx`

## src/entities/card

- [ ] `index.ts`

## src/entities/card/api

- [ ] `card-repository.ts`

## src/entities/card/model

- [ ] `context.ts`
- [ ] `selectors.ts`
- [ ] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/deck

- [ ] `index.ts`

## src/entities/deck/api

- [ ] `deck-repository.ts`

## src/entities/deck/model

- [x] `appearance.ts`
- [ ] `context.ts`
- [ ] `selectors.ts`
- [ ] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/folder

- [ ] `index.ts`

## src/entities/folder/api

- [ ] `folder-repository.ts`

## src/entities/folder/model

- [x] `appearance.ts`
- [ ] `context.ts`
- [ ] `selectors.ts`
- [ ] `store.test.ts`
- [ ] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/notification

- [ ] `index.ts`

## src/entities/notification/api

- [ ] `notification-repository.ts`

## src/entities/notification/model

- [ ] `context.ts`
- [ ] `selectors.ts`
- [ ] `store.test.ts`
- [ ] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/preferences

- [ ] `index.ts`

## src/entities/preferences/api

- [ ] `preferences-repository.ts`

## src/entities/preferences/model

- [ ] `context.ts`
- [ ] `selectors.ts`
- [ ] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/profile

- [ ] `index.ts`

## src/entities/profile/api

- [ ] `profile-repository.ts`

## src/entities/profile/model

- [ ] `context.ts`
- [ ] `selectors.ts`
- [ ] `store.test.ts`
- [ ] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/progress

- [ ] `index.ts`

## src/entities/progress/api

- [ ] `progress-repository.ts`

## src/entities/progress/model

- [ ] `context.ts`
- [ ] `selectors.ts`
- [ ] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/question

- [ ] `index.ts`

## src/entities/question/api

- [ ] `question-repository.ts`

## src/entities/question/model

- [ ] `context.ts`
- [ ] `selectors.ts`
- [ ] `store.test.ts`
- [ ] `store.ts`
- [x] `types.test.ts`
- [x] `types.ts`

## src/entities/session

- [ ] `index.ts`

## src/entities/session/api

- [ ] `session-repository.ts`

## src/entities/session/model

- [ ] `context.ts`
- [ ] `store.test.ts`
- [ ] `store.ts`
- [x] `types.ts`

## src/features/card

- [ ] `create-card.ts`
- [ ] `delete-card.ts`
- [ ] `duplicate-card.ts`
- [ ] `edit-card.ts`
- [ ] `index.ts`
- [ ] `mark-cards-known.ts`
- [ ] `mark-deck-known.ts`
- [ ] `reorder-cards.ts`
- [ ] `require-card.ts`
- [ ] `reset-cards-srs.ts`
- [ ] `reset-deck-srs.ts`
- [ ] `toggle-card-flag.ts`

## src/features/content

- [ ] `apply-content.ts`
- [ ] `content.test.ts`
- [ ] `export-content.ts`
- [ ] `import-content.ts`
- [ ] `index.ts`

## src/features/data

- [ ] `clear-content.ts`
- [ ] `clear-notifications.ts`
- [ ] `data-commands.test.ts`
- [ ] `index.ts`
- [ ] `reset-everything.ts`
- [ ] `reset-progress.ts`

## src/features/deck

- [ ] `create-deck.ts`
- [ ] `delete-deck.ts`
- [ ] `duplicate-deck.ts`
- [ ] `edit-deck.ts`
- [ ] `index.ts`
- [ ] `move-deck.ts`
- [ ] `reorder-decks.ts`
- [ ] `require-deck.ts`
- [ ] `set-archived.ts`
- [ ] `set-folder.ts`
- [ ] `toggle-favorite.ts`

## src/features/folder

- [ ] `create-folder.ts`
- [ ] `delete-folder.ts`
- [ ] `edit-folder.ts`
- [ ] `folder-commands.test.ts`
- [ ] `index.ts`
- [ ] `reorder-folders.ts`

## src/features/match

- [ ] `index.ts`
- [ ] `match-machine.test.ts`
- [ ] `match-machine.ts`

## src/features/notification

- [ ] `index.ts`
- [ ] `mark-all-read.ts`
- [ ] `notification-commands.test.ts`
- [ ] `record-notification.ts`
- [ ] `remove-notification.ts`

## src/features/preferences

- [ ] `index.ts`
- [ ] `preferences-commands.test.ts`
- [ ] `set-preferences.ts`

## src/features/profile

- [ ] `index.ts`
- [ ] `profile-commands.test.ts`
- [ ] `set-profile.ts`

## src/features/progress

- [ ] `award-xp.ts`
- [ ] `complete-session.test.ts`
- [ ] `complete-session.ts`
- [ ] `current-progress.ts`
- [ ] `index.ts`
- [ ] `progress-commands.test.ts`
- [ ] `record-quiz-result.ts`
- [ ] `record-training-day.ts`
- [ ] `rewards.test.ts`
- [ ] `rewards.ts`

## src/features/question

- [ ] `create-question.ts`
- [ ] `delete-question.ts`
- [ ] `duplicate-question.ts`
- [ ] `edit-question.ts`
- [ ] `index.ts`
- [ ] `question-commands.test.ts`
- [ ] `reorder-questions.ts`
- [ ] `require-question.ts`

## src/features/quiz

- [ ] `index.ts`
- [ ] `quiz-machine.test.ts`
- [ ] `quiz-machine.ts`

## src/features/review

- [ ] `due-queue-flow.test.ts`
- [ ] `grade-card.ts`
- [ ] `index.ts`
- [ ] `restore-schedule.ts`
- [ ] `review-commands.test.ts`
- [ ] `scope.test.ts`
- [ ] `scope.ts`
- [ ] `session-machine.test.ts`
- [ ] `session-machine.ts`

## src/features/session

- [ ] `continue-as-guest.ts`
- [ ] `index.ts`
- [ ] `request-password-reset.ts`
- [ ] `restore-session.ts`
- [ ] `session-commands.test.ts`
- [ ] `sign-in-with-email.ts`
- [ ] `sign-out.ts`
- [ ] `sign-up-with-email.ts`
- [ ] `use-auth-actions.ts`

## src/pages/achievement-detail

- [ ] `index.ts`

## src/pages/achievement-detail/ui

- [ ] `AchievementDetailPage.tsx`

## src/pages/achievements

- [ ] `index.ts`

## src/pages/achievements/ui

- [ ] `AchievementsPage.tsx`

## src/pages/archived-decks

- [ ] `index.ts`

## src/pages/archived-decks/ui

- [ ] `ArchivedDecksPage.tsx`

## src/pages/badge-detail

- [ ] `index.ts`

## src/pages/badge-detail/ui

- [ ] `BadgeDetailPage.tsx`

## src/pages/badges

- [ ] `index.ts`

## src/pages/badges/ui

- [ ] `BadgesPage.tsx`

## src/pages/card-editor

- [ ] `index.ts`

## src/pages/card-editor/ui

- [ ] `CardEditorPage.tsx`

## src/pages/deck-detail

- [ ] `index.ts`

## src/pages/deck-detail/ui

- [ ] `DeckDetailPage.tsx`

## src/pages/deck-library

- [ ] `index.ts`

## src/pages/deck-library/ui

- [ ] `DeckLibraryPage.tsx`
- [ ] `FolderSheet.tsx`
- [ ] `MoveDeckSheet.tsx`

## src/pages/deck-questions

- [ ] `index.ts`

## src/pages/deck-questions/ui

- [ ] `DeckQuestionsPage.tsx`

## src/pages/deck-settings

- [ ] `index.ts`

## src/pages/deck-settings/ui

- [ ] `DeckAppearanceSheet.tsx`
- [ ] `DeckSettingsPage.tsx`

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
- [ ] `MatchPage.tsx`

## src/pages/notifications

- [ ] `index.ts`

## src/pages/notifications/ui

- [ ] `NotificationsPage.test.tsx`
- [ ] `NotificationsPage.tsx`

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

- [ ] `QuestionEditorPage.tsx`

## src/pages/quiz

- [ ] `index.ts`

## src/pages/quiz/ui

- [ ] `QuizPage.test.tsx`
- [ ] `QuizPage.tsx`

## src/pages/settings

- [ ] `index.ts`

## src/pages/settings/ui

- [ ] `SettingsPage.test.tsx`
- [ ] `SettingsPage.tsx`

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

- [ ] `SettingsSelectPage.tsx`

## src/pages/settings-swipe

- [ ] `index.ts`

## src/pages/settings-swipe/ui

- [ ] `SettingsSwipePage.tsx`

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

- [ ] `auth-gateway.ts`
- [x] `base-repository.ts`
- [x] `in-memory-repository.test.ts`
- [x] `in-memory-repository.ts`
- [ ] `index.ts`

## src/shared/api/rxdb

- [ ] `database.ts`
- [ ] `index.ts`
- [ ] `rxdb-persistence.test.ts`
- [ ] `rxdb-repository.test.ts`
- [ ] `rxdb-repository.ts`

## src/shared/config

- [x] `constants.ts`
- [x] `flashcard-swipe.ts`
- [x] `routes.ts`
- [x] `select-toolbar.test.ts`
- [x] `select-toolbar.ts`
- [x] `swipe.ts`

## src/shared/i18n

- [ ] `i18next.d.ts`
- [ ] `index.ts`

## src/shared/i18n/locales

- [ ] `en.ts`

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
- [ ] `use-keyboard-pin.ts`
- [ ] `use-long-press.test.tsx`
- [ ] `use-long-press.ts`
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

- [ ] `ActionSheet.tsx`
- [ ] `AppScreen.tsx`
- [ ] `AuthField.test.tsx`
- [ ] `AuthField.tsx`
- [ ] `AuthScreen.test.tsx`
- [ ] `AuthScreen.tsx`
- [ ] `Avatar.test.tsx`
- [ ] `Avatar.tsx`
- [ ] `BadgeMedallion.tsx`
- [ ] `Card.tsx`
- [ ] `CardMaturityOverview.tsx`
- [ ] `Chip.tsx`
- [ ] `CollectionPreview.tsx`
- [ ] `Combobox.tsx`
- [ ] `ConfirmDialog.tsx`
- [ ] `DeckCover.tsx`
- [ ] `DropIndicator.tsx`
- [ ] `EditableTitle.tsx`
- [ ] `EmojiField.test.tsx`
- [ ] `EmojiField.tsx`
- [ ] `EmptyState.tsx`
- [ ] `FlyoutMenu.test.tsx`
- [ ] `FlyoutMenu.tsx`
- [ ] `FolderGlyph.tsx`
- [ ] `GlassCard.tsx`
- [ ] `GradeButtons.test.tsx`
- [ ] `GradeButtons.tsx`
- [ ] `IconButton.tsx`
- [ ] `IconColorRow.tsx`
- [ ] `ImportRow.tsx`
- [ ] `OverflowMenuButton.tsx`
- [ ] `PasswordField.tsx`
- [ ] `ProgressBar.tsx`
- [ ] `PromptSheet.tsx`
- [ ] `ScreenHeader.tsx`
- [ ] `SegmentedControl.test.tsx`
- [ ] `SegmentedControl.tsx`
- [ ] `SelectDot.tsx`
- [ ] `SelectToolbar.tsx`
- [ ] `SettingsRow.test.tsx`
- [ ] `SettingsRow.tsx`
- [ ] `SettingsSection.tsx`
- [ ] `Sheet.tsx`
- [ ] `SocialButtons.test.tsx`
- [ ] `SocialButtons.tsx`
- [ ] `SortControl.tsx`
- [ ] `SpeedDial.tsx`
- [ ] `SrsStatusChip.test.tsx`
- [ ] `SrsStatusChip.tsx`
- [ ] `StatTile.test.tsx`
- [ ] `StatTile.tsx`
- [ ] `StickyBar.tsx`
- [ ] `StudyOverviewCard.test.tsx`
- [ ] `StudyOverviewCard.tsx`
- [ ] `SwipeRow.tsx`
- [ ] `Switch.test.tsx`
- [ ] `Switch.tsx`
- [ ] `TextField.tsx`
- [ ] `Textarea.tsx`
- [ ] `TierPips.tsx`
- [ ] `WordReveal.test.tsx`
- [ ] `WordReveal.tsx`
- [ ] `button.tsx`
- [ ] `index.ts`
- [ ] `select-actions.tsx`
- [ ] `swipe-actions.tsx`
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

- [ ] `AppNav.tsx`

## src/widgets/content-editor

- [ ] `index.ts`

## src/widgets/content-editor/model

- [ ] `import-draft.test.ts`
- [ ] `import-draft.ts`

## src/widgets/content-editor/ui

- [ ] `CardBrowser.tsx`
- [ ] `ContentRows.tsx`
- [ ] `DeckContentEditor.test.tsx`
- [ ] `DeckContentEditor.tsx`
- [ ] `ReorderableList.tsx`
- [ ] `SelectModeBar.tsx`
- [ ] `editor-fields.tsx`
- [ ] `editor-helpers.ts`

## src/widgets/deck-tree

- [ ] `index.ts`

## src/widgets/deck-tree/ui

- [ ] `DeckTree.tsx`

## src/widgets/folder-form

- [ ] `index.ts`

## src/widgets/folder-form/ui

- [ ] `FolderForm.tsx`

## src/widgets/home-header

- [ ] `index.ts`

## src/widgets/home-header/ui

- [ ] `HomeHeader.test.tsx`
- [ ] `HomeHeader.tsx`

## src/widgets/match

- [ ] `index.ts`

## src/widgets/match/ui

- [ ] `MatchBoard.test.tsx`
- [ ] `MatchBoard.tsx`

## src/widgets/notifications-panel

- [ ] `index.ts`

## src/widgets/notifications-panel/lib

- [ ] `group.test.ts`
- [ ] `group.ts`

## src/widgets/notifications-panel/ui

- [ ] `NotificationsPanel.test.tsx`
- [ ] `NotificationsPanel.tsx`

## src/widgets/practice-modes

- [ ] `index.ts`

## src/widgets/practice-modes/ui

- [ ] `PracticeModes.test.tsx`
- [ ] `PracticeModes.tsx`

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

- [ ] `QuizOptionsSheet.tsx`
- [ ] `QuizSession.test.tsx`
- [ ] `QuizSession.tsx`

## src/widgets/session-reward

- [ ] `index.ts`
- [ ] `use-session-reward.test.tsx`
- [ ] `use-session-reward.ts`

## src/widgets/splash

- [ ] `index.ts`

## src/widgets/splash/ui

- [ ] `SplashOverlay.test.tsx`
- [ ] `SplashOverlay.tsx`

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
- [ ] `Threshold.tsx`

