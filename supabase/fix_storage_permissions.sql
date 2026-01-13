-- Enable the storage extension if not already enabled (typically enabled by default in Supabase)
-- create extension if not exists "storage";

-- Create the avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 1. Allow public access to view files in the 'avatars' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 2. Allow authenticated users to upload files to the 'avatars' bucket
create policy "Authenticated users can upload"
on storage.objects for insert
with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 3. Allow users to update their own files (optional but recommended)
create policy "Users can update own files"
on storage.objects for update
using ( bucket_id = 'avatars' and auth.uid() = owner )
with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- 4. Allow users to delete their own files
create policy "Users can delete own files"
on storage.objects for delete
using ( bucket_id = 'avatars' and auth.uid() = owner );
