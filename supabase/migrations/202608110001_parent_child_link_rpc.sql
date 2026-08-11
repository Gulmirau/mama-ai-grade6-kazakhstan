-- Safe MVP parent-child linking by student code.
-- Parents do not browse all students. They can link only when they know the child's code.

create or replace function public.link_child_by_code(child_code text)
returns table (
  child_id uuid,
  child_email text,
  child_name text,
  grade int,
  city text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  child_profile public.profiles%rowtype;
  requester public.profiles%rowtype;
begin
  select * into requester
  from public.profiles
  where id = auth.uid()
    and role in ('parent', 'admin')
    and status <> 'deleted';

  if requester.id is null then
    raise exception 'Only a parent can link a child';
  end if;

  select * into child_profile
  from public.profiles
  where upper(student_code) = upper(trim(child_code))
    and role = 'student'
    and status <> 'deleted';

  if child_profile.id is null then
    raise exception 'Child code not found';
  end if;

  insert into public.parent_children (parent_id, child_id, invite_code, status)
  values (auth.uid(), child_profile.id, upper(trim(child_code)), 'active')
  on conflict (parent_id, child_id) do update
    set status = 'active',
        invite_code = excluded.invite_code;

  return query
  select
    child_profile.id,
    child_profile.email,
    child_profile.first_name,
    child_profile.grade,
    child_profile.city,
    'active'::text;
end;
$$;

grant execute on function public.link_child_by_code(text) to authenticated;
