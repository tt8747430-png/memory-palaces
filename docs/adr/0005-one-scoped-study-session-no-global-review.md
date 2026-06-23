# Study is one full-featured session, scoped to a room or a palace; no global review

ADR-0004 split the daily loop onto detail surfaces and parked the global "review everything
due" launcher on the Streak page. In practice that left **three** ways to study a card set
that behaved differently: the room's "train all cards" session (full options: browse, scope,
in-study edit, swipe), the stripped per-scope "review" session (a fixed due queue, no
options), and the global cross-library review. The card carousel also carried its own "Study
flashcards" launcher, so a room had two competing study entry points sitting next to each
other.

We collapsed this to **one study session**. The full-featured session (the old room-train) is
now the only flashcard study surface, parameterised by a **scope** — a single room or a whole
palace. Its **Study action** opens in review mode (due cards lead), but every option (browse,
filter/range scope, in-study edit, orientation, shuffle, text-to-speech, sort-into-piles) is
available from the in-session options sheet, and "Study ahead" opens the same session when
nothing is due. The card carousel loses its launcher and is purely a visual preview, matching
the glossary.

The **global** cross-library review is **removed**: there is no "review everything due across
all palaces" entry anymore. Study is always reached by drilling into the thing you want to
study (a room or a palace). The Streak page returns to pure motivation (streak hero, stats,
calendar).

Every **practice mode** — Study cards, Verses (Bible-mode), Match, and Test — is available at
**both** scopes: a room hub studies/plays one room, and palace detail studies/plays the whole
palace (aggregated across its rooms). The mode tiles are one shared component.

Flashcard-study preferences (orientation, order, shuffle, text-to-speech, sort-into-piles) are
no longer mirrored in palace settings; they live in the in-session options sheet and persist
back to the palace from there. **Quiz** settings (timer, shuffle questions) move out of palace
settings to a **quiz options sheet on the quiz screen**, where they are used.

## Consequences

- Supersedes ADR-0004's "global review lives on the Streak page": there is no global review.
  A reader looking for cross-library review will not find one — study is room- or
  palace-scoped only.
- The detail study overviews (room hub, palace detail) from ADR-0004 stay; the palace-detail
  identity/progress hero is dropped (the header + settings carry identity).
- Routes `roomTrain`, `roomReview`, `palaceReview`, and `review` are removed in favour of
  `roomStudy` and `palaceStudy` (one component, scope param). `roomMatch`/`palaceMatch`,
  `roomVerse`/`palaceVerse`, and `roomQuiz`/`palaceQuiz` are the scoped pairs for the other
  modes.
- Palace settings shrinks to identity, appearance, type, manage, delete. Study behaviour is
  owned by the study session; quiz behaviour by the quiz screen.
  </content>
  </invoke>
