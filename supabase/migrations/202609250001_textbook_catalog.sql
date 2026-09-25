-- Kazakhstan textbooks/workbooks catalog and per-child selections.
-- Apply after the child profile/session migration.

create table if not exists public.textbook_catalog (
  id text primary key,
  grade int not null check (grade between 1 and 11),
  instruction_language text not null check (instruction_language in ('ru', 'kk')),
  subject_key text not null,
  subject_title text not null,
  title text not null,
  authors jsonb not null default '[]'::jsonb,
  publisher text not null default '',
  publication_year text not null default '',
  part text not null default '',
  pathway text not null default 'general' check (pathway in ('general', 'emn', 'ogn')),
  material_type text not null default 'main_textbook',
  academic_year text not null default '2026-2027',
  official_source_url text not null default '',
  electronic_url text not null default '',
  workbook_url text not null default '',
  additional_materials_url text not null default '',
  cover_url text not null default '',
  access_status text not null default 'requires_review' check (access_status in ('free', 'view', 'registration_required', 'paid', 'requires_review')),
  actuality_status text not null default 'review' check (actuality_status in ('current', 'review', 'archived')),
  previous_version_id text references public.textbook_catalog(id),
  verification_status text not null default 'awaiting_review',
  checked_at timestamptz,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.textbook_material_links (
  id uuid primary key default gen_random_uuid(),
  textbook_id text not null references public.textbook_catalog(id) on delete cascade,
  related_material_id text references public.textbook_catalog(id) on delete set null,
  relation_type text not null check (relation_type in ('workbook', 'additional', 'teacher_material')),
  official_url text not null default '',
  verification_status text not null default 'awaiting_review',
  created_at timestamptz not null default now()
);

create table if not exists public.user_textbook_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  profile_scope text not null default 'account',
  textbook_external_id text not null,
  grade int not null check (grade between 1 and 11),
  instruction_language text not null check (instruction_language in ('ru', 'kk')),
  subject_key text not null,
  textbook_snapshot jsonb not null default '{}'::jsonb,
  is_favorite boolean not null default false,
  selected_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  unique(user_id, profile_scope, grade, instruction_language, subject_key)
);

create table if not exists public.textbook_catalog_checks (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  checked_at timestamptz not null default now(),
  records_found int not null default 0,
  added_count int not null default 0,
  changed_count int not null default 0,
  archived_count int not null default 0,
  report jsonb not null default '{}'::jsonb
);

create index if not exists textbook_catalog_filter_idx
on public.textbook_catalog(grade, instruction_language, subject_key, pathway, actuality_status);

create index if not exists user_textbook_selections_owner_idx
on public.user_textbook_selections(user_id, profile_scope, last_opened_at desc);

drop trigger if exists textbook_catalog_touch_updated_at on public.textbook_catalog;
create trigger textbook_catalog_touch_updated_at
before update on public.textbook_catalog
for each row execute function public.touch_updated_at();

alter table public.textbook_catalog enable row level security;
alter table public.textbook_material_links enable row level security;
alter table public.user_textbook_selections enable row level security;
alter table public.textbook_catalog_checks enable row level security;

drop policy if exists "public_reads_verified_textbook_catalog" on public.textbook_catalog;
create policy "public_reads_verified_textbook_catalog" on public.textbook_catalog
for select using (verification_status in ('official_verified_metadata', 'verified_reference', 'publisher_verified') or public.is_admin());

drop policy if exists "public_reads_verified_textbook_links" on public.textbook_material_links;
create policy "public_reads_verified_textbook_links" on public.textbook_material_links
for select using (verification_status <> 'rejected' or public.is_admin());

drop policy if exists "users_manage_own_textbook_selections" on public.user_textbook_selections;
create policy "users_manage_own_textbook_selections" on public.user_textbook_selections
for all using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins_manage_textbook_catalog" on public.textbook_catalog;
create policy "admins_manage_textbook_catalog" on public.textbook_catalog
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins_manage_textbook_links" on public.textbook_material_links;
create policy "admins_manage_textbook_links" on public.textbook_material_links
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins_read_catalog_checks" on public.textbook_catalog_checks;
create policy "admins_read_catalog_checks" on public.textbook_catalog_checks
for select using (public.is_admin());

create or replace function public.save_child_textbook_selection(
  raw_session text,
  textbook_external_id text,
  selected_grade int,
  selected_language text,
  selected_subject text,
  textbook_snapshot jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  active_session public.child_sessions%rowtype;
begin
  select * into active_session
  from public.child_sessions
  where session_hash = public.token_sha256(raw_session)
    and status = 'active'
    and expires_at > now();

  if active_session.id is null then
    raise exception 'Child session is not active';
  end if;

  insert into public.user_textbook_selections (
    user_id, profile_scope, textbook_external_id, grade, instruction_language,
    subject_key, textbook_snapshot, selected_at, last_opened_at
  ) values (
    active_session.parent_id, active_session.child_id::text, textbook_external_id,
    selected_grade, selected_language, selected_subject, textbook_snapshot, now(), now()
  )
  on conflict (user_id, profile_scope, grade, instruction_language, subject_key)
  do update set
    textbook_external_id = excluded.textbook_external_id,
    textbook_snapshot = excluded.textbook_snapshot,
    selected_at = now(),
    last_opened_at = now();

  update public.child_sessions set last_seen_at = now() where id = active_session.id;
  return true;
end;
$$;

grant execute on function public.save_child_textbook_selection(text, text, int, text, text, jsonb) to anon, authenticated;
