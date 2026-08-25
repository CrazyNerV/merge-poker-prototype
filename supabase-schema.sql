create table if not exists public.leaderboard (
  id bigint generated always as identity primary key,
  player_name varchar(16) not null,
  score integer not null,
  slice_score integer not null,
  spins_left integer not null,
  play_time integer not null,
  created_at timestamptz not null default now(),
  constraint valid_name check (char_length(trim(player_name)) between 1 and 16),
  constraint valid_score check (score between -1000000 and 100000000),
  constraint valid_slice_score check (slice_score between 0 and 100000000),
  constraint valid_spins check (spins_left between 0 and 100),
  constraint valid_time check (play_time between 0 and 86400),
  constraint correct_score check (
    score = slice_score + spins_left * 1000 - play_time * 10
  )
);

alter table public.leaderboard enable row level security;

revoke all on public.leaderboard from anon;
grant select, insert on public.leaderboard to anon;

drop policy if exists "Anyone can read leaderboard" on public.leaderboard;
create policy "Anyone can read leaderboard"
on public.leaderboard for select to anon
using (true);

drop policy if exists "Anyone can submit valid score" on public.leaderboard;
create policy "Anyone can submit valid score"
on public.leaderboard for insert to anon
with check (
  char_length(trim(player_name)) between 1 and 16
  and score = slice_score + spins_left * 1000 - play_time * 10
);

create index if not exists leaderboard_score_index
on public.leaderboard (score desc, play_time asc, created_at asc);
