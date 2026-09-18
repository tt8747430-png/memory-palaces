-- The Bible extension's published verse text.
--
-- A mirror table like the other eight: the whole RxDB document in `data`, plus `user_id`, `deleted`
-- and the server-clock `updated_at` the pull checkpoint reads. The table is registered whether or
-- not the extension is enabled — a schema the database does not know is a schema replication can
-- orphan rows against. Only replication follows the toggle.
create table if not exists public.bible_verses (
  id         text not null,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  data       jsonb not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists bible_verses_user_updated_idx
  on public.bible_verses (user_id, updated_at, id);

drop trigger if exists set_updated_at on public.bible_verses;
create trigger set_updated_at before insert or update on public.bible_verses
  for each row execute function public.set_updated_at();

-- Per-user RLS, identical to the other eight.
alter table public.bible_verses enable row level security;
grant select, insert, update, delete on public.bible_verses to authenticated;
revoke all on public.bible_verses from anon;

drop policy if exists own_select on public.bible_verses;
create policy own_select on public.bible_verses for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists own_insert on public.bible_verses;
create policy own_insert on public.bible_verses for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists own_update on public.bible_verses;
create policy own_update on public.bible_verses for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists own_delete on public.bible_verses;
create policy own_delete on public.bible_verses for delete to authenticated
  using (user_id = (select auth.uid()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bible_verses'
  ) then
    alter publication supabase_realtime add table public.bible_verses;
  end if;
end $$;

-- The allow-list `push_documents` checks. Recreated whole rather than patched, because the list is
-- the only thing standing between a client-supplied table name and `format()`.
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
    'decks','cards','folders','questions','progress','preferences','profiles','history',
    'bible_verses'
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
