-- Grants the security advisor flagged, and one found beside them, closed.
--
-- `public.rls_auto_enable()` is the dashboard's helper behind the `ensure_rls` event trigger: it
-- switches row level security on for every new table. It was made from the dashboard, so no
-- migration recorded it, and it kept the default `EXECUTE` for `public`, `anon` and
-- `authenticated`, which lists it as an RPC endpoint. It returns `event_trigger`, so a call fails;
-- the grant still has no reason to exist. The event trigger runs it regardless.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- The Bible corpus is never deleted by an account (ADR 0009): no policy allows DELETE and
-- `push_documents` only inserts and updates it. TRUNCATE is the gap — it skips row level security
-- — so neither stays granted. The purge runs with the service role and keeps both.
revoke delete, truncate on public.bible_verses from anon, authenticated;
