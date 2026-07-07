-- ================================================================
-- Phase 4 hotfix — remove leftover references to public.level_from_xp
-- ================================================================
-- Run in Supabase SQL Editor. Safe to re-run.
--
-- Symptom: saving a workout or measurement fails with
--   ERROR: function public.level_from_xp(bigint) does not exist
-- Cause : a legacy trigger/function on daily_workouts or
--         body_measurements still calls level_from_xp() even though the
--         function was removed. This block finds every referencing
--         function/trigger and drops it. XP / power / rankings are all
--         computed by the current views + workout_power(), so nothing
--         downstream depends on it.
-- ================================================================

do $$
declare
  r record;
begin
  -- Drop every trigger whose action references level_from_xp
  for r in
    select event_object_schema as s, event_object_table as t, trigger_name as n
    from information_schema.triggers
    where action_statement ilike '%level_from_xp%'
  loop
    execute format('drop trigger if exists %I on %I.%I;', r.n, r.s, r.t);
  end loop;

  -- Drop every function/procedure whose body references level_from_xp
  for r in
    select n.nspname as s, p.proname as fn,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where pg_get_functiondef(p.oid) ilike '%level_from_xp%'
      and n.nspname not in ('pg_catalog','information_schema')
  loop
    execute format('drop function if exists %I.%I(%s) cascade;', r.s, r.fn, r.args);
  end loop;

  -- Finally drop level_from_xp itself if it still exists in any signature
  for r in
    select n.nspname as s, p.proname as fn,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'level_from_xp'
  loop
    execute format('drop function if exists %I.%I(%s) cascade;', r.s, r.fn, r.args);
  end loop;
end $$;

-- Sanity check — should return 0 rows.
select n.nspname, p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where pg_get_functiondef(p.oid) ilike '%level_from_xp%';
