# Product

## Register

product

## Users

Phone-first learners who want to memorize things that matter to them and actually keep
them: scripture and verses, study material, lists, anything worth long-term recall. They
practice in short, frequent bursts on a phone, often offline, fitting a few minutes of
training between other things. They start as guests with no signup, and an account comes
later only to protect and carry their progress. Their job to be done: turn what they want
to remember into durable memory using the method of loci, and stay motivated enough to
come back tomorrow.

## Product Purpose

Mindscape is an offline-first, phone-only PWA for memory training with the method of loci.
Users build palaces (places) made of rooms, place loci (memorable spots) inside them, and
attach what they want to learn. Retention is driven by spaced review, quizzes, and matching
games; momentum is driven by XP, streaks, badges, and achievements. Every core action
works without a network, instantly, because practice should never wait on connectivity.

Success looks like a user who returns daily, whose recall measurably improves, and for whom
the act of practicing feels like a calm, well-lit room to think in rather than a chore. A
later-phase AI Tutor (secondary to the core loop) will let users drive the whole app
conversationally, performing real actions (create palaces, rooms, loci, quizzes; edit
settings and profile) only after a per-action permission prompt.

## Brand Personality

Voice: a warm, clear, encouraging guide. Knowledgeable but never a drill sergeant, never a
hype machine. Three words: **lucid, encouraging, crafted**.

Emotional goal: a calm, daylight-clear mental space, with genuine, earned moments of delight
when progress lands (a streak extended, a session finished, a palace completed). Playfulness
is welcome, but it lives in celebration and motion, not in ambient clutter or noise. The
whole experience should read as premium and considered, the work of someone who cares about
the details.

## Anti-references

- **Not a dense enterprise dashboard.** No data-dense panels, tiny rows, or desktop-first
  tables. This is a phone-only, one-thing-at-a-time tool.
- **Not a clinical, sterile flashcard tool.** Retention (spaced repetition) is the engine,
  but the experience must feel humane and crafted, never joyless or utilitarian like a bare
  Anki.
- **Not a generic SaaS template.** No cream/beige body background, identical icon-card grids,
  tiny tracked uppercase eyebrows, or the rest of the AI-slop default kit.
- Loud, gamified energy is _not_ on the avoid list: celebration and play are wanted. The
  guardrail is that they stay earned and tasteful (no confetti spam, no streak-guilt
  nagging), in service of the calm ground rather than fighting it.

## Design Principles

1. **Calm ground, earned delight.** The resting state is a calm, well-lit space; energy and
   celebration arrive at the right moments (a streak extended, a session completed), never as
   constant background stimulation.
2. **Local-first, instant, always.** The network is never in the path of practice. Every core
   action works offline and responds immediately; sync is additive and invisible.
3. **One thing at a time, thumb-first.** Phone-only, one primary task per screen, reachable
   and forgiving for touch. Guide the user to the calmest sensible next step instead of
   surfacing every option at once.
4. **Motivate without nagging.** Streaks, XP, and reminders reward coming back; they never
   shame the user or manufacture guilt for a missed day.
5. **Guest-first, no walls.** Deliver value before any signup. An account is an upgrade that
   claims and protects existing local progress, never a gate in front of the product.
6. **Self-evident, not explained.** The interface teaches itself: one accent family that
   always means "this acts", status colors that never change meaning, icons beside short
   labels. Explanatory copy is the last resort — if a screen needs a paragraph to be usable,
   redesign the screen, don't write the paragraph.
7. **Say less, front-load it.** Copy is brief and starts with what matters: verb-first
   buttons ("Study", "Add room"), the key information first, at most one short supporting
   line. First-run guidance lives in empty states, never in tours, coach marks, or
   persistent hints.

## Accessibility & Inclusion

Target WCAG 2.1 AA; the design tokens already carry verified contrast ratios for every text
role, and body/placeholder text must clear 4.5:1. Color is never the sole indicator of state
(pair it with shape, icon, or label). Every animation has a `prefers-reduced-motion`
alternative (crossfade or instant). Touch targets are ≥44px. Required reading never drops
below 12px — Apple's Human Interface Guidelines floor legible text at 11pt — and every
screen tolerates one OS text-size step up without clipping or truncating it. Respect
OS-level text scaling and the device safe areas (notch, home indicator).
