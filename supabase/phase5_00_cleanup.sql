-- ================================================================
-- ELITE X — PHASE 5 CLEANUP  (run ONCE, before phase5a_xp_engine.sql)
-- Fully idempotent. Safe to re-run any number of times.
-- ================================================================
-- WHAT THIS DOES
--   1. Drops legacy triggers/functions from abandoned XP / achievement
--      / level attempts (discovered dynamically — nothing is guessed).
--   2. Moves the orphaned gamification tables into a private
--      `legacy_phase5` schema. DATA IS PRESERVED, just taken off the
--      API + Realtime so it can no longer conflict.
--   3. Clears the `public.xp_history` name collision that caused
--      `ERROR: 42703: column "workout_id" does not exist`.
--
-- WHAT THIS NEVER TOUCHES
--   athletes · daily_workouts · body_measurements · gallery_images
--   challenge_settings · admins · activity_logs · audit_trail
--   and every view / function built on top of them.
-- ================================================================

create schema if not exists legacy_phase5;
revoke all on schema legacy_phase5 from anon, authenticated;

-- ----------------------------------------------------------------
-- 0. Hard guard: production tables can never be archived
-- ----------------------------------------------------------------
create or replace function legacy_phase5.is_protected(_table text)
returns boolean language sql immutable as $$
  select _table = any (array[
    'athletes','daily_workouts','body_measurements','gallery_images',
    'challenge_settings','admins','activity_logs','audit_trail'
  ]);
$$;

-- ----------------------------------------------------------------
-- 1. Drop legacy triggers + functions (dynamic discovery)
--    Anything whose body references a legacy gamification object or
--    the removed level_from_xp() helper.
-- ----------------------------------------------------------------
do $$
declare
  r record;
  legacy_pattern text := '(level_from_xp|athlete_gamification|gamification_events|'
                      || 'athlete_achievements|achievement_categories|achievements|'
                      || 'athlete_titles|xp_rules)';
begin
  -- triggers first (they depend on the functions)
  for r in
    select tg.tgname as n, c.relname as t, ns.nspname as s
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace ns on ns.oid = c.relnamespace
    join pg_proc p on p.oid = tg.tgfoid
    where not tg.tgisinternal
      and ns.nspname = 'public'
      and (p.proname ~* legacy_pattern
           or pg_get_functiondef(p.oid) ~* legacy_pattern)
  loop
    raise notice 'dropping legacy trigger %.% on %', r.s, r.n, r.t;
    execute format('drop trigger if exists %I on %I.%I;', r.n, r.s, r.t);
  end loop;

  -- then the functions/procedures themselves
  for r in
    select ns.nspname as s, p.proname as fn,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public'
      and p.prokind in ('f','p')
      and (p.proname ~* legacy_pattern
           or pg_get_functiondef(p.oid) ~* legacy_pattern)
  loop
    raise notice 'dropping legacy function %.%(%)', r.s, r.fn, r.args;
    execute format('drop function if exists %I.%I(%s) cascade;', r.s, r.fn, r.args);
  end loop;
end $$;

-- ----------------------------------------------------------------
-- 2. Archive legacy gamification tables (data preserved)
-- ----------------------------------------------------------------
do $$
declare
  t text;
  legacy_tables text[] := array[
    'athlete_gamification','gamification_events',
    'athlete_achievements','achievements','achievement_categories',
    'athlete_titles','titles','xp_rules'
  ];
begin
  foreach t in array legacy_tables loop
    if legacy_phase5.is_protected(t) then
      raise notice 'refusing to archive protected table %', t;  -- can never happen
      continue;
    end if;

    -- already archived?
    if exists (select 1 from pg_tables where schemaname='legacy_phase5' and tablename=t) then
      -- a stale duplicate left in public? drop only the empty duplicate.
      continue;
    end if;

    if exists (select 1 from pg_tables where schemaname='public' and tablename=t) then
      begin execute format('alter publication supabase_realtime drop table public.%I;', t);
      exception when others then null; end;
      execute format('revoke all on public.%I from anon, authenticated;', t);
      execute format('alter table public.%I set schema legacy_phase5;', t);
      raise notice 'archived public.% -> legacy_phase5.%', t, t;
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------
-- 3. Clear the xp_history collision
--    Only the LEGACY shape (no workout_id column) is archived.
--    A correctly shaped xp_history is left alone.
-- ----------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_tables where schemaname='public' and tablename='xp_history')
     and not exists (
       select 1 from information_schema.columns
       where table_schema='public' and table_name='xp_history' and column_name='workout_id')
  then
    begin alter publication supabase_realtime drop table public.xp_history;
    exception when others then null; end;

    revoke all on public.xp_history from anon, authenticated;

    if exists (select 1 from pg_tables where schemaname='legacy_phase5' and tablename='xp_history') then
      execute 'alter table public.xp_history rename to xp_history_'
              || to_char(now(),'YYYYMMDDHH24MISS');
      execute format('alter table public.%I set schema legacy_phase5;',
                     (select tablename from pg_tables
                       where schemaname='public' and tablename like 'xp_history_%'
                       order by tablename desc limit 1));
    else
      alter table public.xp_history set schema legacy_phase5;
    end if;
    raise notice 'archived legacy public.xp_history -> legacy_phase5';
  end if;
end $$;

-- ----------------------------------------------------------------
-- 4. Drop orphaned public views that now reference nothing usable
--    (only views whose definition points at legacy_phase5 objects)
-- ----------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select c.relname as v
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relkind in ('v','m')
      and pg_get_viewdef(c.oid, true) ~* 'legacy_phase5\.'
  loop
    raise notice 'dropping orphaned view public.%', r.v;
    execute format('drop view if exists public.%I cascade;', r.v);
  end loop;
end $$;

-- ----------------------------------------------------------------
-- 5. Verification — all three queries should return 0 rows
-- ----------------------------------------------------------------
-- legacy tables still exposed on the API:
select tablename from pg_tables
 where schemaname='public'
   and tablename in ('athlete_gamification','gamification_events','achievements',
                     'achievement_categories','athlete_achievements','titles',
                     'athlete_titles','xp_rules');

-- legacy functions still present:
select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public'
   and pg_get_functiondef(p.oid) ~* '(level_from_xp|athlete_gamification|xp_rules)';

-- wrong-shaped xp_history still in public:
select 1 from pg_tables t
 where t.schemaname='public' and t.tablename='xp_history'
   and not exists (select 1 from information_schema.columns
                    where table_schema='public' and table_name='xp_history'
                      and column_name='workout_id');

-- Done. Now run supabase/phase5a_xp_engine.sql
