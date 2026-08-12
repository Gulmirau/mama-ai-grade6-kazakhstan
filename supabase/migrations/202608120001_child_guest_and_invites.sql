-- Child-first Mama AI MVP: parent-created child profiles and secure child links.
-- Run after the previous profiles / parent_children migrations.

create extension if not exists pgcrypto;

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  grade int not null check (grade between 1 and 11),
  learning_language text not null default 'ru' check (learning_language in ('ru','kk','en')),
  city text not null default '',
  school text not null default '',
  preferred_subjects jsonb not null default '[]'::jsonb,
  guest_progress jsonb not null default '{}'::jsonb,
  points int not null default 0,
  level int not null default 1,
  status text not null default 'active' check (status in ('active','paused','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.child_invites (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active','revoked','used')),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.child_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  session_hash text not null unique,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '180 days'
);

create table if not exists public.child_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  grade int not null check (grade between 1 and 11),
  subject_key text not null default '',
  topic text not null default '',
  points_delta int not null default 0,
  action_type text not null default 'guest_action',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists child_profiles_parent_idx on public.child_profiles(parent_id);
create index if not exists child_invites_child_status_idx on public.child_invites(child_id, status);
create index if not exists child_sessions_child_status_idx on public.child_sessions(child_id, status);
create index if not exists child_progress_child_created_idx on public.child_progress(child_id, created_at desc);

drop trigger if exists child_profiles_touch_updated_at on public.child_profiles;
create trigger child_profiles_touch_updated_at
before update on public.child_profiles
for each row execute function public.touch_updated_at();

alter table public.child_profiles enable row level security;
alter table public.child_invites enable row level security;
alter table public.child_sessions enable row level security;
alter table public.child_progress enable row level security;

drop policy if exists "parent_reads_own_child_profiles" on public.child_profiles;
create policy "parent_reads_own_child_profiles" on public.child_profiles
for select using (parent_id = auth.uid() or public.is_admin());

drop policy if exists "parent_writes_own_child_profiles" on public.child_profiles;
create policy "parent_writes_own_child_profiles" on public.child_profiles
for all using (parent_id = auth.uid() or public.is_admin())
with check (parent_id = auth.uid() or public.is_admin());

drop policy if exists "parent_reads_own_child_invites" on public.child_invites;
create policy "parent_reads_own_child_invites" on public.child_invites
for select using (parent_id = auth.uid() or public.is_admin());

drop policy if exists "parent_reads_own_child_sessions" on public.child_sessions;
create policy "parent_reads_own_child_sessions" on public.child_sessions
for select using (parent_id = auth.uid() or public.is_admin());

drop policy if exists "parent_reads_own_child_progress" on public.child_progress;
create policy "parent_reads_own_child_progress" on public.child_progress
for select using (
  public.is_admin()
  or exists (
    select 1 from public.child_profiles cp
    where cp.id = child_progress.child_id
      and cp.parent_id = auth.uid()
  )
);

create or replace function public.random_child_token()
returns text
language sql
volatile
as $$
  select encode(gen_random_bytes(32), 'hex');
$$;

create or replace function public.token_sha256(raw_token text)
returns text
language sql
immutable
as $$
  select encode(digest(raw_token, 'sha256'), 'hex');
$$;

create or replace function public.create_child_profile(
  child_name text,
  child_grade int,
  child_language text default 'ru',
  child_city text default '',
  child_school text default '',
  guest_progress jsonb default '{}'::jsonb
)
returns table (
  child_id uuid,
  display_name text,
  grade int,
  learning_language text,
  invite_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  requester public.profiles%rowtype;
  new_child public.child_profiles%rowtype;
  raw_token text;
  invite_expiry timestamptz;
begin
  select * into requester
  from public.profiles
  where id = auth.uid()
    and role in ('parent', 'admin')
    and status <> 'deleted';

  if requester.id is null then
    raise exception 'Only a parent can create a child profile';
  end if;

  if child_grade < 1 or child_grade > 11 then
    raise exception 'Grade must be between 1 and 11';
  end if;

  insert into public.child_profiles (
    parent_id, display_name, grade, learning_language, city, school, guest_progress, points
  )
  values (
    auth.uid(),
    coalesce(nullif(trim(child_name), ''), 'Ребёнок'),
    child_grade,
    case when child_language in ('ru','kk','en') then child_language else 'ru' end,
    coalesce(child_city, ''),
    coalesce(child_school, ''),
    coalesce(guest_progress, '{}'::jsonb),
    greatest(0, coalesce((guest_progress ->> 'points')::int, 0))
  )
  returning * into new_child;

  raw_token := public.random_child_token();
  invite_expiry := now() + interval '365 days';

  insert into public.child_invites (child_id, parent_id, token_hash, expires_at)
  values (new_child.id, auth.uid(), public.token_sha256(raw_token), invite_expiry);

  return query select new_child.id, new_child.display_name, new_child.grade, new_child.learning_language, raw_token, invite_expiry;
end;
$$;

create or replace function public.rotate_child_invite(target_child_id uuid)
returns table (
  child_id uuid,
  invite_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_token text;
  invite_expiry timestamptz;
begin
  if not exists (
    select 1 from public.child_profiles
    where id = target_child_id
      and (parent_id = auth.uid() or public.is_admin())
      and status = 'active'
  ) then
    raise exception 'Child profile not found';
  end if;

  update public.child_invites
  set status = 'revoked', revoked_at = now()
  where child_id = target_child_id and status = 'active';

  raw_token := public.random_child_token();
  invite_expiry := now() + interval '365 days';

  insert into public.child_invites (child_id, parent_id, token_hash, expires_at)
  select id, parent_id, public.token_sha256(raw_token), invite_expiry
  from public.child_profiles
  where id = target_child_id;

  return query select target_child_id, raw_token, invite_expiry;
end;
$$;

create or replace function public.revoke_child_invite(target_child_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.child_profiles
    where id = target_child_id
      and (parent_id = auth.uid() or public.is_admin())
  ) then
    raise exception 'Child profile not found';
  end if;

  update public.child_invites
  set status = 'revoked', revoked_at = now()
  where child_id = target_child_id and status = 'active';

  update public.child_sessions
  set status = 'revoked'
  where child_id = target_child_id and status = 'active';

  return true;
end;
$$;

create or replace function public.activate_child_invite(raw_token text)
returns table (
  child_id uuid,
  display_name text,
  grade int,
  learning_language text,
  points int,
  level int,
  session_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.child_invites%rowtype;
  child public.child_profiles%rowtype;
  raw_session text;
begin
  select * into invite
  from public.child_invites
  where token_hash = public.token_sha256(raw_token)
    and status = 'active'
    and (expires_at is null or expires_at > now());

  if invite.id is null then
    raise exception 'Child link is not active';
  end if;

  select * into child
  from public.child_profiles
  where id = invite.child_id and status = 'active';

  if child.id is null then
    raise exception 'Child profile is not active';
  end if;

  raw_session := public.random_child_token();

  insert into public.child_sessions (child_id, parent_id, session_hash)
  values (child.id, child.parent_id, public.token_sha256(raw_session));

  update public.child_invites
  set activated_at = coalesce(activated_at, now())
  where id = invite.id;

  return query select child.id, child.display_name, child.grade, child.learning_language, child.points, child.level, raw_session;
end;
$$;

create or replace function public.get_child_session(raw_session text)
returns table (
  child_id uuid,
  display_name text,
  grade int,
  learning_language text,
  points int,
  level int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.child_sessions%rowtype;
  child public.child_profiles%rowtype;
begin
  select * into session_row
  from public.child_sessions
  where session_hash = public.token_sha256(raw_session)
    and status = 'active'
    and expires_at > now();

  if session_row.id is null then
    raise exception 'Child session is not active';
  end if;

  update public.child_sessions
  set last_seen_at = now()
  where id = session_row.id;

  select * into child from public.child_profiles where id = session_row.child_id and status = 'active';
  if child.id is null then
    raise exception 'Child profile is not active';
  end if;

  return query select child.id, child.display_name, child.grade, child.learning_language, child.points, child.level;
end;
$$;

create or replace function public.save_child_progress(
  raw_session text,
  subject_key text,
  topic text,
  points_delta int,
  action_type text default 'guest_action',
  payload jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.child_sessions%rowtype;
  child public.child_profiles%rowtype;
begin
  select * into session_row
  from public.child_sessions
  where session_hash = public.token_sha256(raw_session)
    and status = 'active'
    and expires_at > now();

  if session_row.id is null then
    raise exception 'Child session is not active';
  end if;

  select * into child from public.child_profiles where id = session_row.child_id and status = 'active';
  if child.id is null then
    raise exception 'Child profile is not active';
  end if;

  insert into public.child_progress (child_id, grade, subject_key, topic, points_delta, action_type, payload)
  values (child.id, child.grade, coalesce(subject_key, ''), coalesce(topic, ''), coalesce(points_delta, 0), coalesce(action_type, 'guest_action'), coalesce(payload, '{}'::jsonb));

  update public.child_profiles
  set points = greatest(0, points + coalesce(points_delta, 0)),
      level = greatest(1, 1 + ((points + coalesce(points_delta, 0)) / 100))
  where id = child.id;

  update public.child_sessions set last_seen_at = now() where id = session_row.id;
  return true;
end;
$$;

grant execute on function public.create_child_profile(text, int, text, text, text, jsonb) to authenticated;
grant execute on function public.rotate_child_invite(uuid) to authenticated;
grant execute on function public.revoke_child_invite(uuid) to authenticated;
grant execute on function public.activate_child_invite(text) to anon, authenticated;
grant execute on function public.get_child_session(text) to anon, authenticated;
grant execute on function public.save_child_progress(text, text, text, int, text, jsonb) to anon, authenticated;
