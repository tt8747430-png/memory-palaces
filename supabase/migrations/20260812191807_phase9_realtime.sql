-- Phase 9 — stream row changes to the replication `pull.stream$`.
--
-- Realtime respects RLS on the authenticated channel, so each client only ever receives its own
-- rows. Re-runnable: a table already in the publication would raise, so add only what is missing.

do $$
declare t text;
begin
  foreach t in array array['decks','cards','folders','questions','progress','preferences','profiles']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $$;
