-- profile_image on fitness_profiles + table grants + Storage bucket for avatars
-- After running: confirm bucket "avatars" exists (this script inserts it if missing).

alter table public.fitness_profiles
  add column if not exists profile_image text;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.fitness_profiles to anon, authenticated, service_role;

-- Public bucket for avatar URLs (readable by anyone with URL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set public = excluded.public;

-- Storage RLS
alter table storage.objects enable row level security;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  )
  with check (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  );
