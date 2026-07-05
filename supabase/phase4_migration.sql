-- ============================================================
-- ELITE X — Phase 4 Migration (Live Analytics + Intelligence)
-- Run this ONCE in your Supabase SQL Editor AFTER schema.sql.
-- Idempotent: safe to re-run.
-- ============================================================

-- ----------------------------------------------------------------
-- Prevent duplicate workout entries (same athlete + same date)
-- ----------------------------------------------------------------
do $$ begin
  alter table public.daily_workouts add constraint uniq_workout_athlete_date unique (athlete_id, workout_date);
exception when duplicate_object then null; when duplicate_table then null; when unique_violation then null; end $$;

do $$ begin
  alter table public.body_measurements add constraint uniq_meas_athlete_date unique (athlete_id, measurement_date);
exception when duplicate_object then null; when duplicate_table then null; when unique_violation then null; end $$;

-- Guard: workout rep values cannot be negative
do $$ begin
  alter table public.daily_workouts add constraint chk_reps_nonneg check (
    pushup_set_1>=0 and pushup_set_2>=0 and pushup_set_3>=0 and
    pullup_set_1>=0 and pullup_set_2>=0 and pullup_set_3>=0 and
    chinup_set_1>=0 and chinup_set_2>=0 and chinup_set_3>=0
  );
exception when duplicate_object then null; when check_violation then null; end $$;

-- ============================================================
-- Extended dashboard summary — today-aware
-- ============================================================
create or replace function public.get_dashboard_summary()
returns jsonb language sql stable as $$
with cs as (select current_day, challenge_duration from public.challenge_settings order by updated_at desc limit 1),
today_rows as (
  select w.* from public.daily_workouts w
  join cs on w.challenge_day = cs.current_day
),
today_stats as (
  select
    coalesce(sum(case when attendance='PRESENT' then 1 else 0 end),0)::int as attendance_today,
    count(*)::int as workouts_today,
    coalesce(max(pushup_set_1+pushup_set_2+pushup_set_3),0)::int as highest_pu_today,
    coalesce(max(pullup_set_1+pullup_set_2+pullup_set_3),0)::int as highest_pl_today,
    coalesce(max(chinup_set_1+chinup_set_2+chinup_set_3),0)::int as highest_cu_today
  from today_rows
),
totals as (
  select coalesce(sum(total_pushups),0)::int as tot_pu,
         coalesce(sum(total_pullups),0)::int as tot_pl,
         coalesce(sum(total_chinups),0)::int as tot_cu,
         coalesce(round(avg(nullif(power_score,0))),0)::int as avg_power
  from public.athlete_workout_totals
),
ath_count as (select count(*)::int as total_athletes from public.athletes where is_deleted=false)
select jsonb_build_object(
  'total_athletes', (select total_athletes from ath_count),
  'current_day', (select current_day from cs),
  'challenge_duration', (select challenge_duration from cs),
  'days_remaining', greatest(0, (select challenge_duration - current_day from cs)),
  'current_leader', coalesce((select full_name from public.overall_leaderboard order by rank asc limit 1),'—'),
  'average_attendance', coalesce((select round(avg(attendance_pct),1) from public.overall_leaderboard),0),
  'average_power', (select avg_power from totals),
  'highest_pushups', coalesce((select max(best_pushups) from public.athlete_workout_totals),0),
  'highest_pullups', coalesce((select max(best_pullups) from public.athlete_workout_totals),0),
  'highest_chinups', coalesce((select max(best_chinups) from public.athlete_workout_totals),0),
  'attendance_today', (select attendance_today from today_stats),
  'workouts_today', (select workouts_today from today_stats),
  'pending_today', greatest(0, (select total_athletes from ath_count) - (select workouts_today from today_stats)),
  'highest_pushups_today', (select highest_pu_today from today_stats),
  'highest_pullups_today', (select highest_pl_today from today_stats),
  'highest_chinups_today', (select highest_cu_today from today_stats),
  'total_pushups', (select tot_pu from totals),
  'total_pullups', (select tot_pl from totals),
  'total_chinups', (select tot_cu from totals),
  'total_sessions', (select count(*)::int from public.daily_workouts)
);
$$;

-- ============================================================
-- Weekly volume trend (last 14 days) & weekly power aggregates
-- ============================================================
create or replace function public.get_workout_trend(_days int default 14)
returns table(day text, pushups int, pullups int, chinups int)
language sql stable as $$
  select
    to_char(d::date, 'DD Mon') as day,
    coalesce(sum(w.pushup_set_1+w.pushup_set_2+w.pushup_set_3),0)::int,
    coalesce(sum(w.pullup_set_1+w.pullup_set_2+w.pullup_set_3),0)::int,
    coalesce(sum(w.chinup_set_1+w.chinup_set_2+w.chinup_set_3),0)::int
  from generate_series(current_date - (_days-1), current_date, interval '1 day') d
  left join public.daily_workouts w on w.workout_date = d::date
  group by d order by d;
$$;

create or replace function public.get_attendance_trend(_weeks int default 9)
returns table(week text, present int, absent int)
language sql stable as $$
  with weeks as (
    select generate_series(0, _weeks-1) as offs
  )
  select
    'W'||(_weeks - offs)::text,
    coalesce(sum(case when w.attendance='PRESENT' then 1 else 0 end),0)::int,
    coalesce(sum(case when w.attendance='ABSENT' then 1 else 0 end),0)::int
  from weeks
  left join public.daily_workouts w
    on w.workout_date >= (date_trunc('week', current_date) - (offs || ' week')::interval)::date
   and w.workout_date <  (date_trunc('week', current_date) - ((offs-1) || ' week')::interval)::date
  group by offs order by offs desc;
$$;

create or replace function public.get_weekly_power(_weeks int default 9)
returns table(week text, power int)
language sql stable as $$
  with weeks as (select generate_series(0,_weeks-1) as offs)
  select
    'W'||(_weeks-offs)::text,
    coalesce(sum(public.workout_power(
      w.pushup_set_1,w.pushup_set_2,w.pushup_set_3,
      w.pullup_set_1,w.pullup_set_2,w.pullup_set_3,
      w.chinup_set_1,w.chinup_set_2,w.chinup_set_3, w.attendance
    )),0)::int
  from weeks
  left join public.daily_workouts w
    on w.workout_date >= (date_trunc('week', current_date) - (offs || ' week')::interval)::date
   and w.workout_date <  (date_trunc('week', current_date) - ((offs-1) || ' week')::interval)::date
  group by offs order by offs desc;
$$;

-- ============================================================
-- Per-athlete analytics (weekly grouping)
-- ============================================================
create or replace function public.get_athlete_weekly(_athlete uuid)
returns table(week text, pushups int, pullups int, chinups int, power int, attendance int)
language sql stable as $$
  select
    'W'||extract(week from workout_date)::text,
    coalesce(sum(pushup_set_1+pushup_set_2+pushup_set_3),0)::int,
    coalesce(sum(pullup_set_1+pullup_set_2+pullup_set_3),0)::int,
    coalesce(sum(chinup_set_1+chinup_set_2+chinup_set_3),0)::int,
    coalesce(sum(public.workout_power(pushup_set_1,pushup_set_2,pushup_set_3,pullup_set_1,pullup_set_2,pullup_set_3,chinup_set_1,chinup_set_2,chinup_set_3,attendance)),0)::int,
    coalesce(round(avg(case when attendance='PRESENT' then 100 else 0 end)),0)::int
  from public.daily_workouts
  where athlete_id = _athlete
  group by extract(week from workout_date)
  order by extract(week from workout_date);
$$;

-- ============================================================
-- Attendance & streak intelligence (skip Fridays)
-- ============================================================
create or replace function public.get_athlete_streaks(_athlete uuid)
returns jsonb language plpgsql stable as $$
declare
  rec record; cur int := 0; longest int := 0; running int := 0;
  broken int := 0; perfect boolean := true;
begin
  for rec in
    select workout_date, attendance
    from public.daily_workouts
    where athlete_id = _athlete
    order by workout_date asc
  loop
    if extract(dow from rec.workout_date) = 5 then continue; end if; -- skip friday
    if rec.attendance = 'PRESENT' then
      running := running + 1;
      if running > longest then longest := running; end if;
    else
      if running > 0 then broken := broken + 1; end if;
      running := 0;
      perfect := false;
    end if;
  end loop;
  cur := running;
  return jsonb_build_object('current', cur, 'longest', longest, 'broken', broken, 'perfect', perfect);
end $$;

-- Grants
grant execute on function public.get_dashboard_summary() to anon, authenticated;
grant execute on function public.get_workout_trend(int) to anon, authenticated;
grant execute on function public.get_attendance_trend(int) to anon, authenticated;
grant execute on function public.get_weekly_power(int) to anon, authenticated;
grant execute on function public.get_athlete_weekly(uuid) to anon, authenticated;
grant execute on function public.get_athlete_streaks(uuid) to anon, authenticated;
