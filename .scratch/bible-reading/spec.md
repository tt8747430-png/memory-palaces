# Bible: reading, a reading tracker, memorization progress

Status: needs-triage
Type: grilling

The rest of the owner's Bible plan (2026-09). The passage import, the extension mechanism and the shared corpus are
built (ADR 0009). Mockups were in the owner's Downloads (`plugins/bible/bible_tracker`,
`bible_memorization_progress`, `bible_reading`), not in the repo.

1. **Reading tracker.** Which books and chapters the learner has read, reading plans, an overview of activity.
2. **Memorization progress.** An overview of memorized books, and a row of Bible badges in the profile, for
   memorization and maybe reading.
3. **A Bible tab in the bottom nav.** Read the Bible, select verses, add them to the Library to memorize.

Each needs a contribution point that does not exist yet (a nav tab, a profile badge row). Reading needs the full text
for every book; the corpus holds only what publishers added. Decide where the full text comes from first.

Reference: the owner's screenshots in `memory_palaces_data/Projects/plugins/bible/bible_reading/`, `bible_tracker/` and `bible_memorization_progress/`.
