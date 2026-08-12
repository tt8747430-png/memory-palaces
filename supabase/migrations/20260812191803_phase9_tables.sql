-- Phase 9 — one mirror table per synced RxDB collection.
--
-- Each row is a whole RxDB document in `data` plus three promoted columns: `user_id` (RLS +
-- replication scope), `deleted` (RxDB's `_deleted` tombstone) and `updated_at` (the pull
-- checkpoint clock). The document's own `data->>'updatedAt'` is a separate, client-written clock
-- used only by the conflict handlers.

-- Shared server-clock trigger: forces updated_at = now() on every write so the replication pull
-- checkpoint is monotonic and client clocks can't skew it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['decks','cards','folders','questions','progress','preferences','profiles']
  loop
    execute format($f$
      create table if not exists public.%I (
        id         uuid primary key,
        user_id    uuid not null default auth.uid() references auth.users on delete cascade,
        data       jsonb not null,
        deleted    boolean not null default false,
        updated_at timestamptz not null default now()
      );
      create index if not exists %I on public.%I (user_id, updated_at, id);
      drop trigger if exists set_updated_at on public.%I;
      create trigger set_updated_at before insert or update on public.%I
        for each row execute function public.set_updated_at();
    $f$, t, t || '_user_updated_idx', t, t, t);
  end loop;
end $$;
