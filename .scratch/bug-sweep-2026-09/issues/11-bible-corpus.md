# 11 — Bible verses are per-user; "JWT" errors
Status: resolved
Type: grilling

`bible_verses` PK `(user_id, id)` + own-row RLS → per-user by construction. Decide shared corpus (all
authenticated read; who writes?) vs per-user. Need the exact JWT error text and where it shows.

## Answer
Decision: **the corpus is published text, not one learner's data.** A verse id is its content's
address (`translation:book:chapter:verse`), so one row per verse serves every account.
`supabase/migrations/20260921120000_bible_corpus_is_shared.sql`: duplicates collapse onto the copy
written last, the key becomes `id` alone, `user_id` becomes the publisher and stops cascading (a
purged account must not take other accounts' verses with it), reads open to every authenticated
account, and the corpus has no tombstones — `push_documents` writes `deleted = false` for a shared
table, so one device forgetting a book (a dev tool) cannot blank it for everyone. No client change:
schema, store and conflict handler are untouched.

**Publishing is editorial.** The user's call: only an admin publishes books to the cloud; a learner
edits their own cards and their own copy of the text freely, and none of it reaches the corpus. So
`corpus_publishers` + `publishes_corpus()` gate insert and update, and `push_documents` answers a
non-publisher's push with "nothing refused" — its rows stay at home and its pending log clears
rather than retrying a write that would never be accepted.

**Applied 2026-09-21** as `20260921125345_bible_corpus_is_shared`, plus
`20260921125532_bible_corpus_fk_index` (the advisor caught that the new checkpoint index no longer
covers the foreign key the way the old composite one did). 2861 rows → 1871, one per verse: 51
duplicates collapsed and 939 tombstones removed. Every one of those tombstones turned out to be a
*retired id* the re-key keeper had already replaced (`web:1 Corinteni:1:1` →
`cornilescu-2024:1CO:1:1`), not a forgotten book — both reviewers had said to resurrect them, which
would have republished ids nothing can address and set every device's keeper re-keying and
re-deleting them on a loop now that deletes no longer travel.

The publisher list lives in a `private` schema, not `public`: a `security definer` function in the
exposed schema is an endpoint every role can call, and the table behind it would be one PostgREST
request away (Supabase security checklist).

Verified against the live database, each probe inside a transaction that always rolled back:
a non-publisher's push returns `[]` and writes nothing; a publisher's push writes the row and
records them as its publisher. Nothing survived either probe.

**The publisher is named.** One account (Kristian Braila's) is listed in `private.corpus_publishers`;
the other three accounts on the project cannot publish. Verified signed-in, in a rolled-back
transaction: the admin's `publishes_corpus()` is true and their push lands the row; another
account's is false and its push writes nothing and reports nothing refused. The list is a table,
not a claim, so it is changed with the service key and never by the app:

```sql
-- add another publisher
insert into private.corpus_publishers (user_id)
select id from auth.users where email = '<publisher>' on conflict do nothing;
-- take one off
delete from private.corpus_publishers where user_id =
  (select id from auth.users where email = '<publisher>');
```

JWT: without the exact message, the class is handled rather than one string. `authFailure` tells a
refused token from a device clock the server reads as being in the future; `syncNow` refreshes the
session and retries **once** for the first, never for the second, and records a code instead of the
server's words. The banner and the Sync log then say "Your sign-in has expired…" or "This device's
date and time are wrong…". Tests: `auth-failure.test.ts`, `sync-now.test.ts` ×4,
`sync-failure-message.test.ts`, `SyncBanner.test.tsx`.
