-- Phase 9 — document ids are not uuids, and singletons are per-user.
--
-- Two faults in the original shape, both fatal to half the sync:
--
-- 1. `id uuid` assumed every RxDB document id is a uuid. Decks and cards are, but the singleton
--    entities are named: `profile`, `progress`, `preferences`. Pushing one raised
--    "invalid input syntax for type uuid" and RxDB retried it forever, so profile, progress and
--    preferences silently never synced.
--
-- 2. `primary key (id)` is global. Those singleton ids are identical for every user, so even as
--    text the first person to sync would own the only `profile` row there can be — the opposite of
--    the one-row-per-user the design calls for.
--
-- The key is therefore (user_id, id): ids stay exactly what the device calls them, and every user
-- gets their own row for each document.

do $$
declare t text;
begin
  foreach t in array array['decks','cards','folders','questions','progress','preferences','profiles']
  loop
    execute format('alter table public.%I alter column id type text;', t);
    execute format('alter table public.%I drop constraint if exists %I;', t, t || '_pkey');
    execute format('alter table public.%I add primary key (user_id, id);', t);
  end loop;
end $$;
