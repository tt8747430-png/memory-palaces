# 01 — Add a passage: the footer lifts off the bottom

Status: needs-triage
Type: bug

Screenshots: `memory_palaces_data/App Screenshots/bugs/IMG_3725.PNG` and `IMG_3726.PNG` (iPhone, Bible → Add a passage, same moment).

- **3725:** the book grid scrolled to Malachi, the **Add 0 cards** footer pinned at the bottom of the screen. Right.
- **3726:** the same screen with the footer about 150pt higher. The grid is cut under it (Obad…Țef clipped) and blurred
  content shows in the gap below the footer, down to the home indicator.

Likely trigger: the reference field was focused and the keyboard closed, or the page was scrolled to its end. That is
the "footer lifted at the end of a scroll" class of bug (HISTORY, App shell; ADR 0002: two footer positions, one shell
from the first render, `--kb-range`). Reproduce on a device, check the screen uses `AppScreen`'s footer slot rather
than its own, then fix at the cause with a test.

Also check: **Add 0 cards** should read as disabled when nothing is chosen (CODE_STYLE: say why a control is disabled).
