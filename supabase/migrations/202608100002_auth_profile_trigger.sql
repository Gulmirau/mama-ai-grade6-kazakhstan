-- Create a public profile immediately when Supabase Auth creates a user.
-- This is important when email confirmation is enabled: the user exists in
-- auth.users before the first login session is available to the frontend.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  safe_role public.user_role;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'student');
  safe_role := case
    when requested_role in ('student', 'parent', 'teacher') then requested_role::public.user_role
    else 'student'::public.user_role
  end;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    city,
    school,
    grade,
    interface_language,
    learning_language,
    selected_subjects,
    student_code,
    status,
    last_active_at
  )
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'first_name', 'Ученик'),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    safe_role,
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'school', ''),
    nullif(new.raw_user_meta_data ->> 'grade', '')::int,
    coalesce(new.raw_user_meta_data ->> 'interface_language', 'ru'),
    coalesce(new.raw_user_meta_data ->> 'learning_language', 'ru'),
    coalesce((new.raw_user_meta_data -> 'selected_subjects')::jsonb, '[]'::jsonb),
    upper(substr(regexp_replace(coalesce(new.raw_user_meta_data ->> 'first_name', 'IMAMA'), '[^[:alnum:]]', '', 'g'), 1, 4))
      || '-' || upper(substr(replace(new.id::text, '-', ''), 1, 6)),
    'active',
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
    city = coalesce(nullif(public.profiles.city, ''), excluded.city),
    grade = coalesce(public.profiles.grade, excluded.grade),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();
