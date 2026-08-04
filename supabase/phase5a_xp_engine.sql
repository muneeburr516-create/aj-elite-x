-- ================================================================
-- ELITE X — PHASE 5A : XP ENGINE · LEVELS · SEASONS · WORKOUT PHASES
-- ================================================================
-- SINGLE SOURCE OF TRUTH for XP, Levels, Seasons and Workout Phases.
-- Reserved extension points for future Achievements / Titles / Badges.
--
-- PREREQUISITE: run supabase/phase5_00_cleanup.sql first (once).
--
-- 100% IDEMPOTENT & SELF-HEALING:
--   * safe on a fresh database
--   * safe on a partially migrated database
--   * safe to run any number of times
--   * never drops or rewrites athletes, workouts, measurements,
--     gallery, settings, admins, logs or existing seasons/progress data
-- ================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS (create-if-missing, then top up missing values)
-- ------------------------------------------------------------
do $$ begin create type public.season_status  as enum ('upcoming','active','completed','archived');
exception when duplicate_object then null; end $$;
do $$ begin create type public.phase_status   as enum ('active','inactive','archived');
exception when duplicate_object then null; end $$;
do $$ begin create type public.exercise_slot  as enum ('pushup','pullup','chinup');
exception when duplicate_object then null; end $$;
do $$ begin create type public.xp_source      as enum ('workout','manual','bonus','adjustment');
exception when duplicate_object then null; end $$;

-- future-proofing: achievement/title/badge XP sources reserved now
do $$
declare v text;
begin
  foreach v in array array['workout','manual','bonus','adjustment','achievement','title','badge','streak'] loop
    begin execute format('alter type public.xp_source add value if not exists %L', v);
    exception when others then null; end;
  end loop;
end $$;

-- ------------------------------------------------------------
-- SEASONS
-- ------------------------------------------------------------
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid()
);
alter table public.seasons add column if not exists slug          text;
alter table public.seasons add column if not exists name          text;
alter table public.seasons add column if not exists season_number int  not null default 1;
alter table public.seasons add column if not exists duration_days int  not null default 90;
alter table public.seasons add column if not exists start_date    date;
alter table public.seasons add column if not exists status        public.season_status not null default 'active';
alter table public.seasons add column if not exists is_current    boolean not null default false;
alter table public.seasons add column if not exists created_at    timestamptz not null default now();
alter table public.seasons add column if not exists updated_at    timestamptz not null default now();

update public.seasons set slug = coalesce(slug, 'season-'||season_number),
                          name = coalesce(name, 'Elite X Season '||season_number);
alter table public.seasons alter column slug set not null;
alter table public.seasons alter column name set not null;

create unique index if not exists uniq_seasons_slug    on public.seasons(slug);
create unique index if not exists uniq_seasons_current on public.seasons(is_current) where is_current;

insert into public.seasons (slug, name, season_number, duration_days, status, is_current, start_date)
select 'season-1','Elite X Season 1',1,
       coalesce((select challenge_duration from public.challenge_settings order by updated_at desc limit 1),90),
       'active', true,
       (select min(workout_date) from public.daily_workouts)
where not exists (select 1 from public.seasons);

create or replace function public.current_season_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.seasons where is_current order by season_number desc limit 1;
$$;

-- ------------------------------------------------------------
-- LEVEL CONFIGURATION (admin-editable, never hardcoded)
-- ------------------------------------------------------------
create table if not exists public.level_config (
  id uuid primary key default gen_random_uuid()
);
alter table public.level_config add column if not exists season_id   uuid references public.seasons(id) on delete cascade;
alter table public.level_config add column if not exists level       int;
alter table public.level_config add column if not exists xp_required bigint;
alter table public.level_config add column if not exists label       text;
alter table public.level_config add column if not exists created_at  timestamptz not null default now();
alter table public.level_config add column if not exists updated_at  timestamptz not null default now();

delete from public.level_config where level is null or xp_required is null;
alter table public.level_config alter column level       set not null;
alter table public.level_config alter column xp_required set not null;

create unique index if not exists uniq_level_config_season_level on public.level_config(season_id, level);
create index        if not exists idx_level_config_xp            on public.level_config(season_id, xp_required);

do $$
declare _season uuid; _lvl int; _xp bigint; _delta bigint;
begin
  select public.current_season_id() into _season;
  if _season is null then return; end if;
  if exists (select 1 from public.level_config where season_id = _season) then return; end if;

  insert into public.level_config(season_id, level, xp_required, label) values
    (_season,1,0,'Initiate'),(_season,2,500,'Rookie'),
    (_season,3,1200,'Contender'),(_season,4,2200,'Challenger')
  on conflict (season_id, level) do nothing;

  _xp := 2200; _delta := 1000;
  for _lvl in 5..60 loop
    _delta := _delta + 300;
    _xp := _xp + _delta;
    insert into public.level_config(season_id, level, xp_required, label)
    values (_season, _lvl, _xp, 'Tier '||_lvl)
    on conflict (season_id, level) do nothing;
  end loop;
end $$;

create or replace function public.xp_level(_xp bigint, _season uuid default null)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(max(level),1)
  from public.level_config
  where season_id = coalesce(_season, public.current_season_id())
    and xp_required <= greatest(coalesce(_xp,0),0);
$$;

-- ------------------------------------------------------------
-- WORKOUT PHASES + EXERCISE TEMPLATES
-- ------------------------------------------------------------
create table if not exists public.workout_phases (
  id uuid primary key default gen_random_uuid()
);
alter table public.workout_phases add column if not exists season_id    uuid references public.seasons(id) on delete cascade;
alter table public.workout_phases add column if not exists phase_number int;
alter table public.workout_phases add column if not exists name         text;
alter table public.workout_phases add column if not exists start_day    int;
alter table public.workout_phases add column if not exists end_day      int;
alter table public.workout_phases add column if not exists status       public.phase_status not null default 'active';
alter table public.workout_phases add column if not exists created_at   timestamptz not null default now();
alter table public.workout_phases add column if not exists updated_at   timestamptz not null default now();
alter table public.workout_phases add column if not exists duration_days int
  generated always as (end_day - start_day + 1) stored;

delete from public.workout_phases where phase_number is null or start_day is null or end_day is null;
alter table public.workout_phases alter column phase_number set not null;
alter table public.workout_phases alter column start_day    set not null;
alter table public.workout_phases alter column end_day      set not null;

create unique index if not exists uniq_phases_season_number on public.workout_phases(season_id, phase_number);
create index        if not exists idx_phases_season         on public.workout_phases(season_id, phase_number);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid()
);
alter table public.workout_exercises add column if not exists phase_id       uuid references public.workout_phases(id) on delete cascade;
alter table public.workout_exercises add column if not exists slot           public.exercise_slot;
alter table public.workout_exercises add column if not exists display_name   text;
alter table public.workout_exercises add column if not exists exercise_order int not null default 1;
alter table public.workout_exercises add column if not exists xp_per_rep     int not null default 1;
alter table public.workout_exercises add column if not exists created_at     timestamptz not null default now();

delete from public.workout_exercises where phase_id is null or slot is null;
alter table public.workout_exercises alter column slot set not null;
update public.workout_exercises set display_name = coalesce(display_name, initcap(slot::text)||'s');
alter table public.workout_exercises alter column display_name set not null;

create unique index if not exists uniq_exercises_phase_slot on public.workout_exercises(phase_id, slot);
create index        if not exists idx_exercises_phase       on public.workout_exercises(phase_id, exercise_order);

do $$
declare _season uuid; _p1 uuid; _p2 uuid; _p3 uuid;
begin
  select public.current_season_id() into _season;
  if _season is null then return; end if;

  insert into public.workout_phases(season_id, phase_number, name, start_day, end_day) values
    (_season,1,'Phase 1 — Foundation',1,30),
    (_season,2,'Phase 2 — Intensity',31,60),
    (_season,3,'Phase 3 — Final Forge',61,90)
  on conflict (season_id, phase_number) do nothing;

  select id into _p1 from public.workout_phases where season_id=_season and phase_number=1;
  select id into _p2 from public.workout_phases where season_id=_season and phase_number=2;
  select id into _p3 from public.workout_phases where season_id=_season and phase_number=3;

  insert into public.workout_exercises(phase_id, slot, display_name, exercise_order, xp_per_rep) values
    (_p1,'pullup','Pull-ups',1,6),
    (_p1,'pushup','Push-ups',2,1),
    (_p1,'chinup','Chin-ups',3,5),
    (_p2,'pullup','Pull-ups',1,6),
    (_p2,'pushup','Push-ups',2,1),
    (_p2,'chinup','Diamond Push-ups',3,5),
    (_p3,'pullup','Pull-ups',1,6),
    (_p3,'pushup','Push-ups',2,6)
  on conflict (phase_id, slot) do update
    set display_name   = excluded.display_name,
        exercise_order = excluded.exercise_order,
        xp_per_rep     = excluded.xp_per_rep;
end $$;

-- phase/season context on each workout row (additive)
alter table public.daily_workouts add column if not exists phase_id  uuid references public.workout_phases(id);
alter table public.daily_workouts add column if not exists season_id uuid references public.seasons(id);
create index if not exists idx_workouts_phase  on public.daily_workouts(phase_id);
create index if not exists idx_workouts_season on public.daily_workouts(season_id);

-- ------------------------------------------------------------
-- ATHLETE PROGRESS (per athlete, per season)
-- ------------------------------------------------------------
create table if not exists public.athlete_progress (
  id uuid primary key default gen_random_uuid()
);
alter table public.athlete_progress add column if not exists athlete_id             uuid references public.athletes(id) on delete cascade;
alter table public.athlete_progress add column if not exists season_id              uuid references public.seasons(id) on delete cascade;
alter table public.athlete_progress add column if not exists total_xp               bigint not null default 0;
alter table public.athlete_progress add column if not exists workout_xp             bigint not null default 0;
alter table public.athlete_progress add column if not exists bonus_xp               bigint not null default 0;
alter table public.athlete_progress add column if not exists current_level          int not null default 1;
alter table public.athlete_progress add column if not exists workout_days_completed int not null default 0;
alter table public.athlete_progress add column if not exists current_phase_id       uuid references public.workout_phases(id);
alter table public.athlete_progress add column if not exists phase_started_at       timestamptz not null default now();
alter table public.athlete_progress add column if not exists updated_at             timestamptz not null default now();

delete from public.athlete_progress where athlete_id is null or season_id is null;
create unique index if not exists uniq_progress_athlete_season on public.athlete_progress(athlete_id, season_id);
create index        if not exists idx_progress_season_xp       on public.athlete_progress(season_id, total_xp desc);

-- ------------------------------------------------------------
-- XP HISTORY (immutable ledger — the only XP audit trail)
-- ------------------------------------------------------------
create table if not exists public.xp_history (
  id uuid primary key default gen_random_uuid()
);
alter table public.xp_history add column if not exists athlete_id    uuid references public.athletes(id) on delete cascade;
alter table public.xp_history add column if not exists season_id     uuid references public.seasons(id) on delete cascade;
alter table public.xp_history add column if not exists workout_id    uuid references public.daily_workouts(id) on delete cascade;
alter table public.xp_history add column if not exists phase_id      uuid references public.workout_phases(id);
alter table public.xp_history add column if not exists challenge_day int;
alter table public.xp_history add column if not exists source        public.xp_source not null default 'workout';
alter table public.xp_history add column if not exists xp_amount     bigint not null default 0;
alter table public.xp_history add column if not exists breakdown     jsonb;
alter table public.xp_history add column if not exists created_at    timestamptz not null default now();
-- reserved for future achievement/title/badge awards
alter table public.xp_history add column if not exists reference_id  uuid;
alter table public.xp_history add column if not exists note          text;

delete from public.xp_history where athlete_id is null or season_id is null;
create unique index if not exists uniq_xp_history_workout   on public.xp_history(workout_id) where workout_id is not null;
create index        if not exists idx_xp_history_athlete    on public.xp_history(athlete_id, created_at desc);
create index        if not exists idx_xp_history_season_src on public.xp_history(season_id, source);

-- ------------------------------------------------------------
-- XP ENGINE
-- ------------------------------------------------------------
create or replace function public.resolve_workout_phase(_athlete uuid, _day int, _explicit uuid default null)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    _explicit,
    (select ap.current_phase_id from public.athlete_progress ap
      where ap.athlete_id = _athlete and ap.season_id = public.current_season_id()),
    (select wp.id from public.workout_phases wp
      where wp.season_id = public.current_season_id()
        and coalesce(_day,1) between wp.start_day and wp.end_day
      order by wp.phase_number limit 1),
    (select wp.id from public.workout_phases wp
      where wp.season_id = public.current_season_id()
      order by wp.phase_number limit 1)
  );
$$;

create or replace function public.workout_xp(_phase uuid, _pushups int, _pullups int, _chinups int, _att public.attendance_status)
returns bigint language sql stable security definer set search_path = public as $$
  select case when _att <> 'PRESENT' then 0 else coalesce((
    select sum(
      case e.slot
        when 'pushup' then coalesce(_pushups,0)
        when 'pullup' then coalesce(_pullups,0)
        when 'chinup' then coalesce(_chinups,0)
      end::bigint * e.xp_per_rep
    )
    from public.workout_exercises e where e.phase_id = _phase
  ),0) end;
$$;

create or replace function public.recalculate_athlete_xp(_athlete uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  _season uuid := public.current_season_id();
  _default_phase uuid;
  _workout_xp bigint := 0;
  _bonus bigint := 0;
  _days int := 0;
  _phase uuid;
begin
  if _season is null then return; end if;

  select id into _default_phase from public.workout_phases
   where season_id = _season order by phase_number limit 1;

  insert into public.athlete_progress(athlete_id, season_id, current_phase_id)
  values (_athlete, _season, _default_phase)
  on conflict (athlete_id, season_id) do nothing;

  -- rebuild ONLY workout-sourced XP; bonus/manual/achievement rows are preserved
  delete from public.xp_history
   where athlete_id = _athlete and season_id = _season and source = 'workout';

  insert into public.xp_history(athlete_id, season_id, workout_id, phase_id, challenge_day, source, xp_amount, breakdown)
  select w.athlete_id, _season, w.id,
         coalesce(w.phase_id, public.resolve_workout_phase(w.athlete_id, w.challenge_day)),
         w.challenge_day, 'workout',
         public.workout_xp(
           coalesce(w.phase_id, public.resolve_workout_phase(w.athlete_id, w.challenge_day)),
           w.pushup_set_1 + w.pushup_set_2 + w.pushup_set_3,
           w.pullup_set_1 + w.pullup_set_2 + w.pullup_set_3,
           w.chinup_set_1 + w.chinup_set_2 + w.chinup_set_3,
           w.attendance),
         jsonb_build_object(
           'pushups', w.pushup_set_1 + w.pushup_set_2 + w.pushup_set_3,
           'pullups', w.pullup_set_1 + w.pullup_set_2 + w.pullup_set_3,
           'chinups', w.chinup_set_1 + w.chinup_set_2 + w.chinup_set_3,
           'attendance', w.attendance)
  from public.daily_workouts w
  where w.athlete_id = _athlete
  on conflict do nothing;

  select coalesce(sum(xp_amount),0) into _workout_xp
    from public.xp_history where athlete_id=_athlete and season_id=_season and source='workout';
  select coalesce(sum(xp_amount),0) into _bonus
    from public.xp_history where athlete_id=_athlete and season_id=_season and source <> 'workout';
  select count(*) into _days
    from public.daily_workouts where athlete_id=_athlete and attendance='PRESENT';

  select current_phase_id into _phase from public.athlete_progress
   where athlete_id=_athlete and season_id=_season;

  update public.athlete_progress set
    workout_xp = _workout_xp,
    bonus_xp = _bonus,
    total_xp = _workout_xp + _bonus,
    current_level = public.xp_level(_workout_xp + _bonus, _season),
    workout_days_completed = _days,
    current_phase_id = coalesce(_phase, _default_phase),
    updated_at = now()
  where athlete_id=_athlete and season_id=_season;
end $$;

create or replace function public.trg_workout_xp_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' then
    perform public.recalculate_athlete_xp(OLD.athlete_id);
    return OLD;
  end if;
  perform public.recalculate_athlete_xp(NEW.athlete_id);
  return NEW;
end $$;

drop trigger if exists trg_workouts_xp on public.daily_workouts;
create trigger trg_workouts_xp after insert or update or delete on public.daily_workouts
for each row execute function public.trg_workout_xp_sync();

create or replace function public.trg_workout_stamp_phase()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.season_id := coalesce(new.season_id, public.current_season_id());
  new.phase_id  := coalesce(new.phase_id, public.resolve_workout_phase(new.athlete_id, new.challenge_day));
  return new;
end $$;

drop trigger if exists trg_workouts_stamp_phase on public.daily_workouts;
create trigger trg_workouts_stamp_phase before insert on public.daily_workouts
for each row execute function public.trg_workout_stamp_phase();

-- Admin-confirmed phase advance (NEVER automatic)
create or replace function public.advance_athlete_phase(_athlete uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _season uuid := public.current_season_id();
  _cur int; _next uuid; _next_no int;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can advance a phase';
  end if;

  select wp.phase_number into _cur
    from public.athlete_progress ap
    join public.workout_phases wp on wp.id = ap.current_phase_id
   where ap.athlete_id = _athlete and ap.season_id = _season;

  if _cur is null then _cur := 1; end if;

  select id, phase_number into _next, _next_no from public.workout_phases
   where season_id = _season and phase_number = _cur + 1;

  if _next is null then
    return jsonb_build_object('advanced', false, 'reason', 'No further phase in this season');
  end if;

  update public.athlete_progress
     set current_phase_id = _next, phase_started_at = now(), updated_at = now()
   where athlete_id = _athlete and season_id = _season;

  perform public.log_activity('phase.advance','Advanced athlete to phase '||_next_no,'athletes',_athlete);
  return jsonb_build_object('advanced', true, 'phase_number', _next_no);
end $$;

-- Full athlete XP / progression payload
create or replace function public.get_athlete_progress(_athlete uuid)
returns jsonb language sql stable security definer set search_path = public as $$
with s as (select public.current_season_id() as season_id),
p as (
  select ap.* from public.athlete_progress ap, s
   where ap.athlete_id = _athlete and ap.season_id = s.season_id
),
ph as (select wp.* from public.workout_phases wp join p on p.current_phase_id = wp.id),
nxt as (
  select lc.level, lc.xp_required from public.level_config lc, s, p
   where lc.season_id = s.season_id and lc.xp_required > coalesce(p.total_xp,0)
   order by lc.xp_required asc limit 1
),
cur as (
  select lc.level, lc.xp_required, lc.label from public.level_config lc, s, p
   where lc.season_id = s.season_id and lc.xp_required <= coalesce(p.total_xp,0)
   order by lc.xp_required desc limit 1
)
select jsonb_build_object(
  'athlete_id', _athlete,
  'season_id', (select season_id from s),
  'total_xp', coalesce((select total_xp from p),0),
  'workout_xp', coalesce((select workout_xp from p),0),
  'bonus_xp', coalesce((select bonus_xp from p),0),
  'current_level', coalesce((select current_level from p),1),
  'current_level_label', (select label from cur),
  'current_level_xp', coalesce((select xp_required from cur),0),
  'next_level', (select level from nxt),
  'next_level_xp', (select xp_required from nxt),
  'xp_remaining', greatest(coalesce((select xp_required from nxt),0) - coalesce((select total_xp from p),0),0),
  'level_progress_pct', case
      when (select xp_required from nxt) is null then 100
      when (select xp_required from nxt) - coalesce((select xp_required from cur),0) <= 0 then 0
      else round(((coalesce((select total_xp from p),0) - coalesce((select xp_required from cur),0))::numeric
             / ((select xp_required from nxt) - coalesce((select xp_required from cur),0))) * 100, 1)
    end,
  'workout_days_completed', coalesce((select workout_days_completed from p),0),
  'phase_id', (select id from ph),
  'phase_number', coalesce((select phase_number from ph),1),
  'phase_name', (select name from ph),
  'phase_start_day', (select start_day from ph),
  'phase_end_day', (select end_day from ph),
  'phase_duration', coalesce((select duration_days from ph),30),
  'phase_days_completed', least(
      greatest(coalesce((select workout_days_completed from p),0) - (coalesce((select start_day from ph),1) - 1), 0),
      coalesce((select duration_days from ph),30)),
  'phase_days_remaining', greatest(
      coalesce((select duration_days from ph),30)
      - greatest(coalesce((select workout_days_completed from p),0) - (coalesce((select start_day from ph),1) - 1), 0), 0),
  'phase_progress_pct', round((least(
      greatest(coalesce((select workout_days_completed from p),0) - (coalesce((select start_day from ph),1) - 1), 0),
      coalesce((select duration_days from ph),30))::numeric
      / greatest(coalesce((select duration_days from ph),30),1)) * 100, 1),
  'ready_for_next_phase', (
      coalesce((select workout_days_completed from p),0) >= coalesce((select end_day from ph),30)
      and exists (select 1 from public.workout_phases wp2, s
                   where wp2.season_id = s.season_id
                     and wp2.phase_number = coalesce((select phase_number from ph),1) + 1)),
  'exercises', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slot', e.slot, 'display_name', e.display_name,
        'exercise_order', e.exercise_order, 'xp_per_rep', e.xp_per_rep
      ) order by e.exercise_order)
      from public.workout_exercises e where e.phase_id = (select id from ph)), '[]'::jsonb)
);
$$;

-- XP leaderboard (additive — power leaderboards untouched)
drop view if exists public.xp_leaderboard cascade;
create view public.xp_leaderboard as
select
  row_number() over (order by ap.total_xp desc, ap.current_level desc, a.full_name asc)::int as rank,
  a.id as athlete_id, a.slug, a.full_name, a.photo_url,
  ap.total_xp, ap.current_level, ap.workout_days_completed,
  wp.phase_number, wp.name as phase_name
from public.athlete_progress ap
join public.athletes a on a.id = ap.athlete_id and a.is_deleted = false
left join public.workout_phases wp on wp.id = ap.current_phase_id
where ap.season_id = public.current_season_id();

-- ------------------------------------------------------------
-- BACKFILL — no existing progress is lost
-- ------------------------------------------------------------
do $$
declare _a uuid;
begin
  update public.daily_workouts w
     set season_id = public.current_season_id()
   where w.season_id is null;

  update public.daily_workouts w
     set phase_id = (select wp.id from public.workout_phases wp
                      where wp.season_id = public.current_season_id()
                        and w.challenge_day between wp.start_day and wp.end_day
                      order by wp.phase_number limit 1)
   where w.phase_id is null;

  for _a in select id from public.athletes loop
    perform public.recalculate_athlete_xp(_a);
  end loop;
end $$;

-- ------------------------------------------------------------
-- TOUCH TRIGGERS
-- ------------------------------------------------------------
drop trigger if exists trg_seasons_updated on public.seasons;
create trigger trg_seasons_updated before update on public.seasons
for each row execute function public.touch_updated_at();

drop trigger if exists trg_level_config_updated on public.level_config;
create trigger trg_level_config_updated before update on public.level_config
for each row execute function public.touch_updated_at();

drop trigger if exists trg_phases_updated on public.workout_phases;
create trigger trg_phases_updated before update on public.workout_phases
for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- RLS — public read, admin write
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['seasons','level_config','workout_phases','workout_exercises','athlete_progress','xp_history']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t||'_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t||'_read', t);

    execute format('drop policy if exists %I on public.%I', t||'_admin_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))', t||'_admin_write', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- GRANTS
-- ------------------------------------------------------------
grant select on public.seasons, public.level_config, public.workout_phases,
                public.workout_exercises, public.athlete_progress,
                public.xp_history, public.xp_leaderboard to anon, authenticated;
grant insert, update, delete on public.seasons, public.level_config, public.workout_phases,
                public.workout_exercises, public.athlete_progress, public.xp_history to authenticated;
grant all on public.seasons, public.level_config, public.workout_phases,
             public.workout_exercises, public.athlete_progress, public.xp_history to service_role;

grant execute on function public.xp_level(bigint, uuid) to anon, authenticated;
grant execute on function public.get_athlete_progress(uuid) to anon, authenticated;
grant execute on function public.workout_xp(uuid, int, int, int, public.attendance_status) to anon, authenticated;
grant execute on function public.resolve_workout_phase(uuid, int, uuid) to anon, authenticated;
grant execute on function public.recalculate_athlete_xp(uuid) to authenticated;
grant execute on function public.advance_athlete_phase(uuid) to authenticated;
grant execute on function public.current_season_id() to anon, authenticated;

-- ------------------------------------------------------------
-- REALTIME
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['athlete_progress','xp_history','workout_phases','workout_exercises','level_config','seasons']
  loop
    begin execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null; end;
  end loop;
end $$;

-- ------------------------------------------------------------
-- VERIFICATION
-- ------------------------------------------------------------
select 'seasons' o, count(*) from public.seasons
union all select 'level_config', count(*) from public.level_config
union all select 'workout_phases', count(*) from public.workout_phases
union all select 'workout_exercises', count(*) from public.workout_exercises
union all select 'athlete_progress', count(*) from public.athlete_progress
union all select 'xp_history', count(*) from public.xp_history
union all select 'xp_leaderboard', count(*) from public.xp_leaderboard;
