-- ============================================================
-- Web-OS Community Schema (Custom Auth - No Supabase Auth)
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists unaccent;

-- ============================================================
-- PROFILES TABLE (custom auth only - no Supabase Auth)
-- ============================================================
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    username text not null unique,
    display_name text,
    "Pass" text not null,
    color text not null default '#4ECDC4',
    avatar_url text,
    cover_url text,
    github_url text,
    username_key text,
    bio text,
    is_admin boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
    add column if not exists display_name text,
    add column if not exists "Pass" text,
    add column if not exists color text not null default '#4ECDC4',
    add column if not exists avatar_url text,
    add column if not exists cover_url text,
    add column if not exists github_url text,
    add column if not exists username_key text,
    add column if not exists bio text,
    add column if not exists is_admin boolean not null default false,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
    alter column id set default gen_random_uuid();

do $$
declare
    v_constraint record;
begin
    for v_constraint in
        select conname
        from pg_constraint
        where conrelid = 'public.profiles'::regclass
          and confrelid = to_regclass('auth.users')
    loop
        execute format('alter table public.profiles drop constraint %I', v_constraint.conname);
    end loop;
end;
$$;

alter table public.profiles
    drop constraint if exists profiles_username_length_check,
    drop constraint if exists profiles_username_format_check,
    drop constraint if exists profiles_bio_length_check;

alter table public.profiles
    add constraint profiles_username_length_check check (char_length(trim(username)) between 3 and 32),
    add constraint profiles_username_format_check check (username ~ '^[A-Za-z0-9_ ]{3,32}$'),
    add constraint profiles_bio_length_check check (bio is null or char_length(bio) <= 160);

update public.profiles
set username_key = regexp_replace(lower(unaccent(trim(username))), '[^a-z0-9]+', '', 'g')
where username_key is distinct from regexp_replace(lower(unaccent(trim(username))), '[^a-z0-9]+', '', 'g');

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'password_hash'
    ) then
        execute 'update public.profiles set "Pass" = password_hash where "Pass" is null and password_hash is not null';
    end if;
end;
$$;

create unique index if not exists profiles_username_key_unique
on public.profiles (username_key);

-- Function to normalize username key
create or replace function public.normalize_username_key()
returns trigger
language plpgsql
as $$
begin
    new.username_key := regexp_replace(lower(unaccent(trim(new.username))), '[^a-z0-9]+', '', 'g');
    return new;
end;
$$;

drop trigger if exists profiles_normalize_key on public.profiles;
create trigger profiles_normalize_key
before insert or update on public.profiles
for each row
execute function public.normalize_username_key();

-- ============================================================
-- PROJECT OWNER FIELDS
-- ============================================================
do $$
begin
    if to_regclass('public.projects') is not null then
        alter table public.projects
            add column if not exists submitter_id uuid,
            add column if not exists submitter_username text;

        create index if not exists projects_submitter_id_idx
        on public.projects (submitter_id);
    end if;
end;
$$;

-- ============================================================
-- AUTH FUNCTIONS (using pgcrypto)
-- ============================================================

-- SIGNUP: Create new user with hashed password
create or replace function public.signup(
    p_username text,
    p_password text
) returns json
language plpgsql
security definer
as $$
declare
    v_user public.profiles;
    v_colors text[] := array[
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F0B27A', '#82E0AA', '#F1948A', '#85929E', '#73C6B6'
    ];
    v_color text;
begin
    -- Validate
    if p_username is null or char_length(trim(p_username)) < 3 then
        return json_build_object('success', false, 'error', 'Username must be at least 3 characters');
    end if;
    if not p_username ~ '^[A-Za-z0-9_ ]{3,32}$' then
        return json_build_object('success', false, 'error', 'Username can only contain letters, numbers, spaces and underscores');
    end if;
    if exists (select 1 from public.profiles where username_key = regexp_replace(lower(unaccent(trim(p_username))), '[^a-z0-9]+', '', 'g')) then
        return json_build_object('success', false, 'error', 'Username already taken');
    end if;
    if p_password is null or char_length(p_password) < 6 then
        return json_build_object('success', false, 'error', 'Password must be at least 6 characters');
    end if;

    v_color := v_colors[(1 + floor(random() * array_length(v_colors, 1)))::integer];

    insert into public.profiles (username, display_name, "Pass", color)
    values (trim(p_username), trim(p_username), crypt(p_password, gen_salt('bf', 10)), v_color)
    returning * into v_user;

    return json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user.id,
            'username', v_user.username,
            'color', v_user.color,
            'avatar_url', v_user.avatar_url,
            'cover_url', v_user.cover_url,
            'bio', v_user.bio,
            'is_admin', v_user.is_admin,
            'created_at', v_user.created_at
        )
    );
end;
$$;

-- SIGNIN: Verify password and return user
create or replace function public.signin(
    p_username text,
    p_password text
) returns json
language plpgsql
security definer
as $$
declare
    v_user public.profiles;
begin
    select * into v_user
    from public.profiles
    where username_key = regexp_replace(lower(unaccent(trim(p_username))), '[^a-z0-9]+', '', 'g');
    
    if v_user.id is null then
        return json_build_object('success', false, 'error', 'User not found');
    end if;

    if v_user."Pass" = crypt(p_password, v_user."Pass") then
        return json_build_object(
            'success', true,
            'user', json_build_object(
                'id', v_user.id,
                'username', v_user.username,
                'color', v_user.color,
                'avatar_url', v_user.avatar_url,
                'cover_url', v_user.cover_url,
                'bio', v_user.bio,
                'is_admin', v_user.is_admin,
                'created_at', v_user.created_at
            )
        );
    else
        return json_build_object('success', false, 'error', 'Invalid password');
    end if;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
for select to anon, authenticated using (true);

drop policy if exists "profiles_insert_all" on public.profiles;
create policy "profiles_insert_all" on public.profiles
for insert to anon, authenticated with check (true);

drop policy if exists "profiles_update_all" on public.profiles;
create policy "profiles_update_all" on public.profiles
for update to anon, authenticated using (true) with check (true);

grant execute on function public.signup(text, text) to anon, authenticated;
grant execute on function public.signin(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
