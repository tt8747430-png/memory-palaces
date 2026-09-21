-- The corpus's foreign key lost its covering index when the key stopped leading with `user_id`.
--
-- `bible_verses_user_updated_idx` was `(user_id, updated_at, id)` and covered `user_id` by leading
-- with it. Its replacement leads with `updated_at`, because that is what the pull checkpoint reads
-- now that the corpus is shared — which leaves `bible_verses_user_id_fkey` uncovered. The
-- constraint is `on delete set null`, so it is read when an account is deleted: without an index
-- that is a sequential scan of the whole corpus, and a corpus grows by a whole translation at a
-- time.
create index if not exists bible_verses_user_idx on public.bible_verses (user_id);
