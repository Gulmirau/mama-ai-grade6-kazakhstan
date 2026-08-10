-- Mama AI working MVP schema for Supabase.
-- Run this in Supabase SQL Editor after creating the project.
-- Frontend must use only SUPABASE_URL and SUPABASE_ANON_KEY.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('student', 'parent', 'teacher', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.account_status as enum ('active', 'warning_sent', 'scheduled_delete', 'deleted');
exception
  when duplicate_object then null;
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  role public.user_role not null default 'student',
  city text not null default '',
  school text not null default '',
  grade int check (grade between 1 and 11),
  interface_language text not null default 'ru' check (interface_language in ('ru','kk','en')),
  learning_language text not null default 'ru' check (learning_language in ('ru','kk','en')),
  selected_subjects jsonb not null default '[]'::jsonb,
  student_code text unique,
  status public.account_status not null default 'active',
  last_active_at timestamptz,
  warning_sent_at timestamptz,
  scheduled_deletion_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  grade int not null check (grade between 1 and 11),
  letter text not null default '',
  city text not null default '',
  school text not null default '',
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (grade, letter, school, city)
);

create table if not exists public.parent_children (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text,
  status text not null default 'active' check (status in ('pending','active','blocked')),
  created_at timestamptz not null default now(),
  primary key (parent_id, child_id)
);

create table if not exists public.teacher_classes (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, class_id)
);

create table if not exists public.student_classes (
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, class_id)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  grade int not null check (grade between 1 and 11),
  subject_key text not null,
  title_ru text not null,
  title_kk text,
  title_en text,
  status text not null default 'awaiting_import',
  created_at timestamptz not null default now(),
  unique (grade, subject_key)
);

create table if not exists public.textbooks (
  id uuid primary key default gen_random_uuid(),
  grade int not null check (grade between 1 and 11),
  subject_key text not null,
  title text not null,
  publisher text,
  authors text[] not null default '{}',
  language text not null default 'ru' check (language in ('ru','kk','en','multi')),
  edition text,
  year int,
  isbn text,
  source_status text not null default 'awaiting_import',
  downloadable_url text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.textbook_sources (
  id uuid primary key default gen_random_uuid(),
  textbook_id uuid references public.textbooks(id) on delete cascade,
  source_type text not null default 'metadata',
  source_name text not null,
  source_url text,
  license_note text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.curriculum (
  id uuid primary key default gen_random_uuid(),
  grade int not null check (grade between 1 and 11),
  subject_key text not null,
  quarter int check (quarter between 1 and 4),
  section text not null default '',
  topic text not null default '',
  lesson_title text not null default '',
  learning_objective text not null default '',
  competencies text[] not null default '{}',
  language text not null default 'ru' check (language in ('ru','kk','en')),
  source_status text not null default 'awaiting_import',
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  resource_id uuid,
  grade int check (grade between 1 and 11),
  subject_key text,
  quarter int check (quarter between 1 and 4),
  topic text,
  page_from int,
  page_to int,
  language text not null default 'ru' check (language in ('ru','kk','en')),
  content text not null,
  source_status text not null default 'awaiting_review',
  created_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  test_type text not null check (test_type in ('mini','sor','soch','ent','gia')),
  grade int not null check (grade between 1 and 11),
  subject_key text not null,
  quarter int check (quarter between 1 and 4),
  topic text,
  source_status text not null default 'awaiting_import',
  created_at timestamptz not null default now()
);

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references public.tests(id) on delete cascade,
  grade int not null check (grade between 1 and 11),
  subject_key text not null,
  topic text,
  difficulty text not null default 'medium',
  question text not null,
  choices jsonb not null default '[]'::jsonb,
  correct_answer text,
  explanation text,
  assessment_criteria text,
  score int not null default 1,
  source_status text not null default 'awaiting_import',
  created_at timestamptz not null default now()
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_id uuid references public.tests(id) on delete set null,
  grade int check (grade between 1 and 11),
  subject_key text not null default '',
  topic text,
  question text,
  selected_answer text,
  correct_answer text,
  is_correct boolean not null default false,
  points int not null default 0,
  source_status text not null default 'app_generated',
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_key text not null,
  grade int check (grade between 1 and 11),
  points int not null default 0,
  correct_answers int not null default 0,
  wrong_answers int not null default 0,
  weak_topics jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_key)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  activity_type text not null,
  detail text,
  grade int,
  subject_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  grade int,
  subject_key text,
  text text not null default '',
  helpful boolean,
  created_at timestamptz not null default now()
);

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  detail text,
  role text,
  grade int,
  city text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_grade_city_idx on public.profiles(grade, city);
create index if not exists test_attempts_user_created_idx on public.test_attempts(user_id, created_at desc);
create index if not exists user_events_user_created_idx on public.user_events(user_id, created_at desc);
create index if not exists knowledge_chunks_search_idx on public.knowledge_chunks(grade, subject_key, quarter);

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists textbooks_touch_updated_at on public.textbooks;
create trigger textbooks_touch_updated_at
before update on public.textbooks
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status <> 'deleted'
  );
$$;

create or replace function public.can_read_profile(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.parent_children pc
      where pc.parent_id = auth.uid()
        and pc.child_id = target_id
        and pc.status = 'active'
    )
    or exists (
      select 1
      from public.teacher_classes tc
      join public.student_classes sc on sc.class_id = tc.class_id
      where tc.teacher_id = auth.uid()
        and sc.student_id = target_id
    );
$$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.parent_children enable row level security;
alter table public.teacher_classes enable row level security;
alter table public.student_classes enable row level security;
alter table public.subjects enable row level security;
alter table public.textbooks enable row level security;
alter table public.textbook_sources enable row level security;
alter table public.curriculum enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.progress enable row level security;
alter table public.activities enable row level security;
alter table public.feedback enable row level security;
alter table public.user_events enable row level security;

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
for insert with check (id = auth.uid());

drop policy if exists "profiles_read_allowed" on public.profiles;
create policy "profiles_read_allowed" on public.profiles
for select using (public.can_read_profile(id));

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
for delete using (public.is_admin());

drop policy if exists "public_reference_read_subjects" on public.subjects;
create policy "public_reference_read_subjects" on public.subjects
for select using (true);

drop policy if exists "public_reference_read_textbooks" on public.textbooks;
create policy "public_reference_read_textbooks" on public.textbooks
for select using (true);

drop policy if exists "public_reference_read_textbook_sources" on public.textbook_sources;
create policy "public_reference_read_textbook_sources" on public.textbook_sources
for select using (true);

drop policy if exists "public_reference_read_curriculum" on public.curriculum;
create policy "public_reference_read_curriculum" on public.curriculum
for select using (true);

drop policy if exists "public_reference_read_chunks" on public.knowledge_chunks;
create policy "public_reference_read_chunks" on public.knowledge_chunks
for select using (source_status in ('official_verified','reviewed','imported_needs_review','awaiting_import'));

drop policy if exists "public_reference_read_tests" on public.tests;
create policy "public_reference_read_tests" on public.tests
for select using (true);

drop policy if exists "public_reference_read_questions" on public.test_questions;
create policy "public_reference_read_questions" on public.test_questions
for select using (true);

drop policy if exists "admin_reference_write_subjects" on public.subjects;
create policy "admin_reference_write_subjects" on public.subjects
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_reference_write_textbooks" on public.textbooks;
create policy "admin_reference_write_textbooks" on public.textbooks
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_reference_write_textbook_sources" on public.textbook_sources;
create policy "admin_reference_write_textbook_sources" on public.textbook_sources
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_reference_write_curriculum" on public.curriculum;
create policy "admin_reference_write_curriculum" on public.curriculum
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_reference_write_chunks" on public.knowledge_chunks;
create policy "admin_reference_write_chunks" on public.knowledge_chunks
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own_or_related_attempts_read" on public.test_attempts;
create policy "own_or_related_attempts_read" on public.test_attempts
for select using (public.can_read_profile(user_id));

drop policy if exists "own_attempts_insert" on public.test_attempts;
create policy "own_attempts_insert" on public.test_attempts
for insert with check (user_id = auth.uid());

drop policy if exists "own_or_related_progress_read" on public.progress;
create policy "own_or_related_progress_read" on public.progress
for select using (public.can_read_profile(user_id));

drop policy if exists "own_progress_write" on public.progress;
create policy "own_progress_write" on public.progress
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own_or_related_feedback_read" on public.feedback;
create policy "own_or_related_feedback_read" on public.feedback
for select using (public.can_read_profile(user_id));

drop policy if exists "own_feedback_insert" on public.feedback;
create policy "own_feedback_insert" on public.feedback
for insert with check (user_id = auth.uid());

drop policy if exists "own_or_admin_events_read" on public.user_events;
create policy "own_or_admin_events_read" on public.user_events
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "own_events_insert" on public.user_events;
create policy "own_events_insert" on public.user_events
for insert with check (user_id = auth.uid());

drop policy if exists "class_read_related" on public.classes;
create policy "class_read_related" on public.classes
for select using (
  public.is_admin()
  or teacher_id = auth.uid()
  or exists (select 1 from public.student_classes sc where sc.class_id = id and sc.student_id = auth.uid())
);

drop policy if exists "admin_class_write" on public.classes;
create policy "admin_class_write" on public.classes
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "parent_child_read_related" on public.parent_children;
create policy "parent_child_read_related" on public.parent_children
for select using (parent_id = auth.uid() or child_id = auth.uid() or public.is_admin());

drop policy if exists "parent_child_insert_parent" on public.parent_children;
create policy "parent_child_insert_parent" on public.parent_children
for insert with check (parent_id = auth.uid() or public.is_admin());

drop policy if exists "teacher_classes_read_related" on public.teacher_classes;
create policy "teacher_classes_read_related" on public.teacher_classes
for select using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "student_classes_read_related" on public.student_classes;
create policy "student_classes_read_related" on public.student_classes
for select using (student_id = auth.uid() or public.is_admin());

drop policy if exists "admin_activity_all" on public.activities;
create policy "admin_activity_all" on public.activities
for all using (public.is_admin()) with check (public.is_admin());
