-- Two holes in "the server refuses to overwrite what the device never saw".
--
-- A deletion is unseen too. Deleting a document keeps its `updatedAt`, so a base made of the clock
-- alone could not tell the copy a device saw from the deletion another device made since: an edit
-- based on the live copy passed the check and brought the deleted document back without a conflict
-- ever being raised. A push now says whether the copy it was based on was deleted
-- (`base_deleted`), and the check compares that too. The builds of 2026-09-18 that first sent
-- `base` send no `base_deleted`; for them the clock alone decides, as it did, and that branch goes
-- with the no-base one.
--
-- A document nobody holds yet has no row to lock. Two devices pushing the same new id at once —
-- the Bible keeper moving verses onto one canonical id does exactly that — both found nothing,
-- both passed the check, and the second's upsert overwrote the first's row. It could not even say
-- so: the statement's snapshot predates the first device's commit, so the overwritten row never
-- came back as refused. Each document a push names is now held by a transaction-scoped advisory
-- lock, taken in id order so two pushes naming the same documents cannot deadlock, and taken
-- before the statement that checks and writes — whose snapshot then sees whatever the push it
-- waited for committed. The row locks stay, for writers that do not come through here.

create or replace function public.push_documents(p_table text, p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  document text;
  refused jsonb;
begin
  if p_table not in (
    'decks','cards','folders','questions','progress','preferences','profiles','history',
    'bible_verses'
  ) then
    raise exception 'push_documents: unknown table %', p_table;
  end if;

  for document in
    select distinct element->>'id' from jsonb_array_elements(p_rows) as element order by 1
  loop
    perform pg_advisory_xact_lock(
      hashtextextended(format('push_documents/%s/%s/%s', p_table, caller, document), 0)
    );
  end loop;

  execute format($q$
    with incoming as (
      select
        $2                                                 as user_id,
        element->>'id'                                     as id,
        element->'data'                                    as data,
        coalesce((element->>'deleted')::boolean, false)    as deleted,
        element ? 'base'                                   as based,
        element->>'base'                                   as base,
        (element->>'base_deleted')::boolean                as base_deleted
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
         or (incoming.based
             and held.data->>'updatedAt' is not distinct from incoming.base
             and held.deleted = coalesce(incoming.base_deleted, held.deleted))
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
  using p_rows, caller;

  return refused;
end;
$$;

revoke execute on function public.push_documents(text, jsonb) from public, anon;
grant execute on function public.push_documents(text, jsonb) to authenticated;
