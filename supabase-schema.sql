create table if not exists tournaments (
  id text primary key,
  tournament_name text not null,
  course_name text not null,
  leaderboard_description text not null,
  status text not null default 'upcoming',
  is_live boolean not null default false,
  admin_code text not null default 'pga',
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists course_templates (
  id text primary key,
  name text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists course_template_holes (
  template_id text not null references course_templates(id) on delete cascade,
  hole_number integer not null check (hole_number between 1 and 18),
  par integer not null check (par between 3 and 6),
  stroke_index integer not null check (stroke_index between 1 and 18),
  yardage integer not null check (yardage > 0),
  primary key (template_id, hole_number)
);

create table if not exists tournament_holes (
  tournament_id text not null references tournaments(id) on delete cascade,
  hole_number integer not null check (hole_number between 1 and 18),
  par integer not null check (par between 3 and 6),
  stroke_index integer not null check (stroke_index between 1 and 18),
  yardage integer not null check (yardage > 0),
  primary key (tournament_id, hole_number)
);

create table if not exists players (
  id text primary key,
  tournament_id text not null references tournaments(id) on delete cascade,
  name text not null,
  hometown text not null default '',
  division text not null default 'Championship Flight',
  tee_time text not null default '',
  access_code text not null,
  handicap integer not null default 0 check (handicap >= 0),
  display_order integer not null default 0
);

create unique index if not exists players_tournament_access_code_idx
  on players (tournament_id, access_code);

create table if not exists groups (
  id text primary key,
  tournament_id text not null references tournaments(id) on delete cascade,
  name text not null,
  scorer_code text not null,
  display_order integer not null default 0
);

create unique index if not exists groups_tournament_scorer_code_idx
  on groups (tournament_id, scorer_code);

create table if not exists group_players (
  group_id text not null references groups(id) on delete cascade,
  player_id text not null references players(id) on delete cascade,
  slot_number integer not null check (slot_number between 1 and 4),
  primary key (group_id, slot_number),
  unique (group_id, player_id)
);

create table if not exists scores (
  tournament_id text not null references tournaments(id) on delete cascade,
  player_id text not null references players(id) on delete cascade,
  hole_number integer not null check (hole_number between 1 and 18),
  strokes integer not null check (strokes between 1 and 15),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (tournament_id, player_id, hole_number)
);

create table if not exists score_updates (
  id bigint generated always as identity primary key,
  tournament_id text not null references tournaments(id) on delete cascade,
  player_id text not null references players(id) on delete cascade,
  hole_number integer not null check (hole_number between 1 and 18),
  strokes integer not null check (strokes between 1 and 15),
  created_at timestamptz not null default timezone('utc', now())
);

alter publication supabase_realtime add table tournaments;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table group_players;
alter publication supabase_realtime add table tournament_holes;
alter publication supabase_realtime add table scores;
alter publication supabase_realtime add table score_updates;
