create policy "Allow authenticated uploads to own portfolio folder"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'portfolio-images'::text) AND ((storage.foldername(name))[1] = 'public'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text) AND ((storage.foldername(name))[3] = 'portfolio'::text)));


create policy "Allow public read access to portfolio images"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'portfolio-images'::text) AND ((storage.foldername(name))[1] = 'public'::text)));


create policy "Authenticated users can delete their own avatar"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'avatars'::text) AND (auth.uid() = owner)));


create policy "Authenticated users can update their own avatar"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'avatars'::text) AND (auth.uid() = owner)))
with check (((bucket_id = 'avatars'::text) AND (auth.uid() = owner)));


create policy "Authenticated users can upload their avatar"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'avatars'::text) AND (auth.uid() = owner)));


create policy "Public read access for avatars"
on "storage"."objects"
as permissive
for select
to anon, authenticated
using ((bucket_id = 'avatars'::text));

