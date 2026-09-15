-- The Learning history stops being device-local.
--
-- It is the eighth mirror table and takes the shape all seven already have: the whole RxDB document
-- in `data`, plus `user_id`, `deleted` and the server-clock `updated_at` the pull checkpoint reads.
-- The primary key is `(user_id, id)` for the same reason as everywhere else.
--
-- Its conflict handler on the client is **first write wins**, not a field merge: an entry records
-- one answer given at one moment and is never edited, so two copies of an id are the same event and
-- either is correct.
--
-- `pg_cron` is enabled here because this migration is the first thing that needs it, in the form
-- the Cron module's install guide gives: into `pg_catalog`, with `postgres` granted the `cron`
-- schema so the jobs below can be scheduled. Slice E depends on the same prerequisite and must
-- not re-add it.

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create table if not exists public.history (
  id         text not null,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  data       jsonb not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists history_user_updated_idx on public.history (user_id, updated_at, id);

drop trigger if exists set_updated_at on public.history;
create trigger set_updated_at before insert or update on public.history
  for each row execute function public.set_updated_at();

-- Per-user RLS, identical to the other seven.
alter table public.history enable row level security;
grant select, insert, update, delete on public.history to authenticated;
revoke all on public.history from anon;

drop policy if exists own_select on public.history;
create policy own_select on public.history for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists own_insert on public.history;
create policy own_insert on public.history for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists own_update on public.history;
create policy own_update on public.history for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists own_delete on public.history;
create policy own_delete on public.history for delete to authenticated
  using (user_id = (select auth.uid()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'history'
  ) then
    alter publication supabase_realtime add table public.history;
  end if;
end $$;

-- The allow-list `push_documents` checks. Recreated rather than patched, because the list is the
-- only thing standing between a client-supplied table name and `format()`.
create or replace function public.push_documents(p_table text, p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  refused jsonb;
begin
  if p_table not in (
    'decks','cards','folders','questions','progress','preferences','profiles','history'
  ) then
    raise exception 'push_documents: unknown table %', p_table;
  end if;

  execute format($q$
    with incoming as (
      select
        (select auth.uid())                                as user_id,
        element->>'id'                                     as id,
        element->'data'                                    as data,
        coalesce((element->>'deleted')::boolean, false)    as deleted
      from jsonb_array_elements($1) as element
    ),
    applied as (
      insert into public.%1$I as target (user_id, id, data, deleted)
      select user_id, id, data, deleted from incoming
      on conflict (user_id, id) do update
        set data = excluded.data, deleted = excluded.deleted
        -- Equal clocks still apply: re-pushing the same document must not read as a conflict.
        where coalesce(target.data->>'updatedAt', '') <= coalesce(excluded.data->>'updatedAt', '')
      returning target.id
    )
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', server.id, 'data', server.data,
             'deleted', server.deleted, 'updated_at', server.updated_at)), '[]'::jsonb)
    from public.%1$I as server
    join incoming on incoming.id = server.id and incoming.user_id = server.user_id
    where server.id not in (select id from applied)
  $q$, p_table)
  into refused
  using p_rows;

  return refused;
end;
$$;

revoke execute on function public.push_documents(text, jsonb) from public, anon;
grant execute on function public.push_documents(text, jsonb) to authenticated;

-- Server-side retention, mirroring `HISTORY_CAP` (2000) on the device.
--
-- Neither cap is sufficient alone: `keepHistoryCapped` cannot see another device's entries, and
-- this cannot run while a device is offline. Trimming is by recency, so a pulled entry older than
-- the boundary is dropped again rather than resurrecting anything.
--
-- Every row is ranked, tombstones included. A device's own trim is a soft delete — `history` has a
-- clock, so the repository stamps and tombstones rather than removing — and that tombstone
-- replicates. Ranking live rows only left every one of those behind for good, and a device that
-- still held a row this job had hard-deleted would push it back as a fresh tombstone: a table that
-- only ever grew. A tombstone inside the newest 2000 is harmless — it is what tells the other
-- devices to drop the entry — and one past the boundary goes the same way as the entry it replaced.
create or replace function public.trim_history(p_cap integer default 2000)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.history h
  using (
    select user_id, id,
           row_number() over (partition by user_id order by data->>'createdAt' desc, id desc) as rank
    from public.history
  ) ranked
  where h.user_id = ranked.user_id and h.id = ranked.id and ranked.rank > p_cap;
$$;

revoke execute on function public.trim_history(integer) from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('trim-history');
exception when others then
  -- Nothing scheduled yet; the first run of this migration is the normal case.
  null;
end $$;

select cron.schedule('trim-history', '17 3 * * *', $$select public.trim_history();$$);
