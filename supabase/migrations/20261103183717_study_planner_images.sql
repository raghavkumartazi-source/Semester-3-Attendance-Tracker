-- Separate private storage; existing application tables and records are unchanged.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-planner-images', 'study-planner-images', false, 4194304, array['image/jpeg', 'image/png']);

create policy "Study images: read own files"
on storage.objects for select to authenticated
using (
  bucket_id = 'study-planner-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy "Study images: upload own files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'study-planner-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[2] in ('EC-201', 'EC-202', 'EC-203', 'EO-201', 'MA-201', 'MO-201', 'EO-103', 'HLM')
);

create policy "Study images: remove own files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'study-planner-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);
