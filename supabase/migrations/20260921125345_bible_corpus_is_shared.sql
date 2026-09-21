-- The Bible corpus is published text, not one learner's data.
--
-- `bible_verses` was keyed `(user_id, id)` like the eight mirror tables, so each account held its
-- own copy of every verse it had ever imported and could see no other. A learner who imported
-- Philippians on one account found it missing on the next. But a verse's id is its content's
-- address — `translation:book:chapter:verse` — and the text behind it is the same for everyone.
-- It is a corpus: one row per verse, readable by every account.
--
-- Who may write it is a separate question from who may read it, and the answer is narrow:
-- **publishing is an editorial act.** One account — the publisher — puts a book in the cloud;
-- every other account reads it. A learner still owns their own study of that text: their cards,
-- their decks, their progress, and the verse text as their device holds it, which they may edit
-- freely. None of those edits reach the corpus. A device that is not a publisher pushes the table
-- and is told, truthfully, that nothing was refused: its rows simply stay at home.
--
-- What this changes:
--   * the key is `id` alone, and duplicates collapse onto the copy written last;
--   * `user_id` stops being part of the key and becomes who published the row. It no longer
--     cascades: deleting an account must not take the verses other accounts read with it;
--   * reads open to every authenticated account; writes are the publishers' alone;
--   * the corpus has no tombstones. Deleting is how a device forgets a book it no longer wants
--     locally, and one device forgetting must not blank the text for everyone — so `push_documents`
--     writes `deleted = false` from now on, and the tombstones already stored are dealt with by
--     what they actually are. Every one of them (939 of 939 when this was written) marks a *retired
--     id*: a row `keepVersesCanonical` re-keyed from `web:1 Corinteni:1:1` onto
--     `cornilescu-2024:1CO:1:1` and then removed. Nothing addresses those ids any more, so they are
--     deleted outright — clearing the flag instead would republish them to every device, whose
--     keeper would re-key and re-delete them, and the delete no longer travels. A tombstone on a
--     canonical id is the other thing, a book somebody forgot, and the corpus keeps that text.
--
-- Nothing changes on the device: the schema, the store and the conflict handler are the same. A
-- corpus row also raises no Realtime event, because `cloud-watcher` subscribes the account's own
-- rows and a corpus has no owner — which is right twice over: a book being published is not
-- "this account changed on another device", and the next Sync brings it in regardless.

-- One row per verse. Ties on `updated_at` are broken by `user_id` so the choice is deterministic.
delete from public.bible_verses as doomed
using public.bible_verses as keeper
where doomed.id = keeper.id
  and (doomed.updated_at, doomed.user_id) < (keeper.updated_at, keeper.user_id);

-- A retired id: re-keyed onto its canonical twin and removed. A canonical id carries a three-letter
-- book code; anything else is an address no device can reach, so the row goes rather than returns.
delete from public.bible_verses
where deleted and split_part(id, ':', 2) !~ '^[A-Z0-9]{3}$';

-- What is left is a book somebody forgot. Shared, that tombstone would forget it for everyone.
update public.bible_verses set deleted = false where deleted;

alter table public.bible_verses drop constraint if exists bible_verses_pkey;
alter table public.bible_verses add primary key (id);

-- The publisher, not the owner: a purged account leaves its verses behind.
alter table public.bible_verses drop constraint if exists bible_verses_user_id_fkey;
alter table public.bible_verses alter column user_id drop not null;
alter table public.bible_verses
  add constraint bible_verses_user_id_fkey
  foreign key (user_id) references auth.users on delete set null;

-- The index that carried the old key still leads the pull checkpoint, minus the user.
drop index if exists public.bible_verses_user_updated_idx;
create index if not exists bible_verses_updated_idx on public.bible_verses (updated_at, id);

-- Who may publish. The list lives outside `public`, which is the schema the Data API exposes: a
-- `security definer` function there is an endpoint every role can call, and the table behind it
-- would be one PostgREST request away from being read. Here nothing but the function reaches it,
-- and the list is maintained with the service key, so an account cannot add itself.
create schema if not exists private;
revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists private.corpus_publishers (
  user_id uuid primary key references auth.users on delete cascade,
  added_at timestamptz not null default now()
);

-- Defence in depth: the table is unreachable by grant already, and refuses every row besides.
alter table private.corpus_publishers enable row level security;
revoke all on private.corpus_publishers from anon, authenticated;

-- `security definer` so the check can see a table no caller may read, and it answers only about
-- the caller — it takes no argument, so there is nothing to ask it about anyone else. `stable`, so
-- one statement evaluates it once; pinned `search_path`, like every other function here.
create or replace function private.publishes_corpus()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.corpus_publishers where user_id = (select auth.uid())
  );
$$;

revoke execute on function private.publishes_corpus() from public, anon;
grant execute on function private.publishes_corpus() to authenticated;

drop policy if exists own_select on public.bible_verses;
drop policy if exists own_insert on public.bible_verses;
drop policy if exists own_update on public.bible_verses;
drop policy if exists own_delete on public.bible_verses;

-- Every signed-in account reads the whole corpus.
create policy corpus_select on public.bible_verses for select to authenticated
  using (true);

-- Only a publisher writes it, and the row records which one.
create policy corpus_publish on public.bible_verses for insert to authenticated
  with check (private.publishes_corpus() and user_id = (select auth.uid()));

create policy corpus_amend on public.bible_verses for update to authenticated
  using (private.publishes_corpus())
  with check (private.publishes_corpus() and user_id = (select auth.uid()));

-- No delete policy: a corpus is added to and corrected, never emptied by one of its readers.

-- `push_documents` learns that a table can be shared: keyed by id alone, tombstone-free, and
-- writable only by a publisher. Recreated whole rather than patched, because the allow-list is the
-- only thing standing between a client-supplied table name and `format()`.
create or replace function public.push_documents(p_table text, p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  shared boolean := p_table in ('bible_verses');
  scope text := case when shared then '' else 'and incoming.user_id = server.user_id' end;
  conflict_key text := case when shared then 'id' else 'user_id, id' end;
  document text;
  refused jsonb;
begin
  if p_table not in (
    'decks','cards','folders','questions','progress','preferences','profiles','history',
    'bible_verses'
  ) then
    raise exception 'push_documents: unknown table %', p_table;
  end if;

  -- A device that may not publish keeps its edits. Nothing is refused, because nothing clashed:
  -- the corpus never saw them. Saying so is what lets the pending log clear instead of retrying
  -- a write that will never be accepted.
  if shared and not private.publishes_corpus() then
    return '[]'::jsonb;
  end if;

  for document in
    select distinct element->>'id' from jsonb_array_elements(p_rows) as element order by 1
  loop
    perform pg_advisory_xact_lock(
      hashtextextended(
        format('push_documents/%s/%s/%s', p_table,
               case when shared then '' else caller::text end, document),
        0)
    );
  end loop;

  execute format($q$
    with incoming as (
      select
        $2                                                 as user_id,
        element->>'id'                                     as id,
        element->'data'                                    as data,
        case when $3 then false
             else coalesce((element->>'deleted')::boolean, false) end as deleted,
        element ? 'base'                                   as based,
        element->>'base'                                   as base,
        (element->>'base_deleted')::boolean                as base_deleted
      from jsonb_array_elements($1) as element
    ),
    held as (
      select server.id, server.data, server.deleted
      from public.%1$I as server
      join incoming on incoming.id = server.id %2$s
      for update of server
    ),
    accepted as (
      select incoming.user_id, incoming.id, incoming.data, incoming.deleted
      from incoming
      left join held on held.id = incoming.id
      where held.id is null
         or (held.data = incoming.data and held.deleted = incoming.deleted)
         or (incoming.based
             and held.data->>'updatedAt' is not distinct from incoming.base
             and held.deleted = coalesce(incoming.base_deleted, held.deleted))
         or (not incoming.based
             and coalesce(held.data->>'updatedAt', '') <= coalesce(incoming.data->>'updatedAt', ''))
    ),
    applied as (
      insert into public.%1$I as target (user_id, id, data, deleted)
      select user_id, id, data, deleted from accepted
      on conflict (%3$s) do update
        set data = excluded.data, deleted = excluded.deleted, user_id = excluded.user_id
      returning target.id
    )
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', server.id, 'data', server.data,
             'deleted', server.deleted, 'updated_at', server.updated_at)), '[]'::jsonb)
    from public.%1$I as server
    join incoming on incoming.id = server.id %2$s
    where server.id not in (select id from applied)
  $q$, p_table, scope, conflict_key)
  into refused
  using p_rows, caller, shared;

  return refused;
end;
$$;

revoke execute on function public.push_documents(text, jsonb) from public, anon;
grant execute on function public.push_documents(text, jsonb) to authenticated;
