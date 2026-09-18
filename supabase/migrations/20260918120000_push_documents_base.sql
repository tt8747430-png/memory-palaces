-- A push says what it was based on, and the server refuses to overwrite what the device never saw.
--
-- `push_documents` used to accept any row with a newer document clock. A device that studied a card
-- after another device edited it — but before it pulled that edit — pushed the whole card back with
-- the old text and a newer clock, and the edit was gone without a conflict ever being raised. The
-- same held for every table that keeps a whole document: decks, folders, questions, profiles.
--
-- Each row now carries `base`: the `updatedAt` of the server copy the device last saw (null when it
-- never pulled one). A row with a base applies only when the server still holds that copy, or holds
-- nothing, or already holds exactly this data (an idempotent re-push). Anything else comes back to
-- the client as the current server state, for the collection's conflict handler to merge field by
-- field against that same base — and push again.
--
-- A row without `base` keeps the clock rule. That branch exists for app builds shipped before
-- 2026-09-18 and is dropped by a later migration once none of them are in use.
--
-- Rows the caller names are locked (`for update`) for the whole statement, so the check and the
-- write see the same server copy: a write from another device between them waits its turn and then
-- fails the check instead of being silently overwritten.

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
        coalesce((element->>'deleted')::boolean, false)    as deleted,
        element ? 'base'                                   as based,
        element->>'base'                                   as base
      from jsonb_array_elements($1) as element
    ),
    held as (
      select server.id, server.data, server.deleted
      from public.%1$I as server
      join incoming on incoming.id = server.id and incoming.user_id = server.user_id
      for update of server
    ),
    accepted as (
      select incoming.user_id, incoming.id, incoming.data, incoming.deleted
      from incoming
      left join held on held.id = incoming.id
      where held.id is null
         or (held.data = incoming.data and held.deleted = incoming.deleted)
         or (incoming.based and held.data->>'updatedAt' is not distinct from incoming.base)
         or (not incoming.based
             and coalesce(held.data->>'updatedAt', '') <= coalesce(incoming.data->>'updatedAt', ''))
    ),
    applied as (
      insert into public.%1$I as target (user_id, id, data, deleted)
      select user_id, id, data, deleted from accepted
      on conflict (user_id, id) do update
        set data = excluded.data, deleted = excluded.deleted
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
