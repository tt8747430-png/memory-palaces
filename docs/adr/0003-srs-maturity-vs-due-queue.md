# SRS maturity is three buckets; "due" is a queue, not a status

`srsStatus` returned one of `new | due | learning | known`, where `due` was exclusive — a matured
("known") card that came up for review reported as `due`, hiding its maturity. We split these two
ideas: **maturity** is now three buckets ordered **New → Learning → Known** (every card lands in
exactly one, independent of timing), and **"cards for today"** is a separate temporal queue of
everything due now (`isDue`), which can contain cards of any maturity. We did this so the study
overviews can show a stable maturity breakdown next to a "what's due today" count without the two
numbers contradicting each other.

## Consequences

- Maturity is derived (not persisted), so this is reversible, but it touches `srsStatus`, the
  `srs.*` labels, the room overview, per-card chips, and their tests.
- Keeping the old 4-bucket breakdown was rejected because "Due" double-counted with the
  "cards for today" headline and couldn't reproduce the maturity view the design calls for.
