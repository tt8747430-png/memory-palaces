# 01 — Memorized: show it and let the learner set it

Status: needs-triage
Type: grilling

Every card stores `memorized` (`entities/card/model/types.ts`, schema in `app/persistence/schemas.ts`). Only an import
from the original Mindscape app sets it (`ImportReviewPage`, when "restore progress" is on). Nothing in the app shows it
or changes it.

It stays: removing it would drop what imports restored, and CLAUDE.md forbids orphaning stored data.

To decide with the owner:

- **Where it shows:** a mark on the card row and in the card preview, a "Memorized" filter in the deck's card list.
- **How it is set:** a card action (menu and swipe), and select-mode bulk action.
- **What it means for study:** whether a memorized card leaves the due queue (like frozen) or only carries the mark.
  It is not `known` (Mastered), which the schedule sets at 21 days.
