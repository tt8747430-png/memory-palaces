-- Both image buckets go private.
--
-- They were created public because "the URL is already in a synced document" — which was true and
-- beside the point: a public bucket means every avatar and every deck cover is fetchable by anyone
-- who has ever seen the URL, whether or not they still have any business with the account. The read
-- policy was `using (bucket_id = ...)` with no owner predicate at all.
--
-- Read now uses the same predicate insert, update and delete already use: the first path segment is
-- the owner, and it must be the caller. Objects live at `${userId}/${entityId}`, which is what makes
-- that check possible without a second table.
--
-- The client side of this is `SupabaseStorage.signedUrl` plus `keepImagesCached`: documents store
-- the object *path*, the keeper mints a one-hour URL and caches the bytes, and `useImageSrc` reads
-- only the cache. So privacy costs neither offline rendering nor the "reads never touch the
-- network" rule.

update storage.buckets set public = false where id in ('deck-images', 'avatars');

do $$
declare b text;
begin
  foreach b in array array['deck-images','avatars']
  loop
    execute format('drop policy if exists "%1$s_read" on storage.objects;', b);
    execute format(
      $p$create policy "%1$s_read" on storage.objects for select to authenticated
         using (
           bucket_id = %1$L and (storage.foldername(name))[1] = (select auth.uid())::text
         );$p$, b);
  end loop;
end $$;
