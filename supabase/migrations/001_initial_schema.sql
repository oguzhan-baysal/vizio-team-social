-- ============================================================
-- Team-Based Social Media MVP — Initial Schema
-- ============================================================

-- 1. TABLES
-- ============================================================

-- Teams table: the core identity unit in this platform
create table teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz default now()
);

-- Profiles table: 1-1 with auth.users, links user to exactly one team
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  team_id    uuid not null references teams(id) on delete cascade,
  created_at timestamptz default now()
);

-- Posts table: team-owned content (no individual author tracking)
create table posts (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  content    text not null check (char_length(content) <= 280),
  created_at timestamptz default now()
);

-- Index for efficient feed ordering
create index posts_created_at_idx on posts(created_at desc);

-- Team follows: directional team-to-team relationships
create table team_follows (
  follower_id  uuid not null references teams(id) on delete cascade,
  following_id uuid not null references teams(id) on delete cascade,
  created_at   timestamptz default now(),

  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);


-- 2. HELPER FUNCTION
-- ============================================================

-- Returns the team_id of the currently authenticated user.
-- Used in RLS policies to avoid repeated joins.
create or replace function get_my_team_id()
returns uuid
language sql stable
as $$
  select team_id from profiles where id = auth.uid()
$$;


-- 3. ROW LEVEL SECURITY
-- ============================================================

-- --- teams ---
alter table teams enable row level security;

-- Anyone can view teams (needed for feed, team discovery)
create policy "teams_select_public"
  on teams for select using (true);

-- Team creation is handled by the signup trigger (server-side only)
-- No direct insert/update/delete policies for clients


-- --- profiles ---
alter table profiles enable row level security;

-- Users can only read their own profile
create policy "profiles_select_own"
  on profiles for select using (auth.uid() = id);

-- Profile creation is handled by the signup trigger
create policy "profiles_insert_own"
  on profiles for insert with check (auth.uid() = id);


-- --- posts ---
alter table posts enable row level security;

-- Anyone can read all posts (public global feed)
create policy "posts_select_public"
  on posts for select using (true);

-- Authenticated users can only create posts for their own team
create policy "posts_insert_own_team"
  on posts for insert
  with check (team_id = get_my_team_id());


-- --- team_follows ---
alter table team_follows enable row level security;

-- Anyone can see follow relationships
create policy "follows_select_public"
  on team_follows for select using (true);

-- Users can only create follows on behalf of their own team
create policy "follows_insert_own_team"
  on team_follows for insert
  with check (follower_id = get_my_team_id());

-- Users can only remove follows for their own team
create policy "follows_delete_own_team"
  on team_follows for delete
  using (follower_id = get_my_team_id());


-- 4. SIGNUP TRIGGER
-- ============================================================

-- Automatically creates a team and profile when a new user signs up.
-- Works for both email/password and OAuth signups.
create or replace function handle_new_user()
returns trigger
language plpgsql security definer
as $$
declare
  new_team_id uuid;
  team_name text;
  base_name text;
  counter int := 0;
begin
  -- Derive a team name from the user's email
  base_name := split_part(new.email, '@', 1) || '''s Team';
  team_name := base_name;

  -- Handle duplicate team names by appending a number
  loop
    begin
      insert into teams (name) values (team_name)
      returning id into new_team_id;
      exit; -- success, leave loop
    exception when unique_violation then
      counter := counter + 1;
      team_name := base_name || ' ' || counter;
    end;
  end loop;

  insert into profiles (id, team_id) values (new.id, new_team_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
