-- Phase 9 — a push that refuses to overwrite a newer document, and says which ones it refused.
--
-- A plain upsert makes the *last* writer win rather than the *latest*: a device that has been
-- offline pushes stale rows straight over newer ones, and the other device — already in sync, with
-- no local change — pulls the stale state without its conflict handler ever running. The counter
-- merges for progress and card.srs would never fire, and the XP, streak or review schedule they
-- exist to protect would be gone.
--
-- So the write is conditional on the document clock, and every row it declines comes back to the
-- client as the current server state. RxDB treats those as conflicts, resolves them locally through
-- the collection's conflict handler, and pushes the merged result.
--
-- SECURITY INVOKER: this runs as the caller, so RLS still decides which rows they may touch. The
-- table name is checked against a fixed list rather than interpolated blind.

create or replace function public.push_documents(p_table text, p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  refused jsonb;
begin
  if p_table not in ('decks','cards','folders','questions','progress','preferences','profiles') then
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
