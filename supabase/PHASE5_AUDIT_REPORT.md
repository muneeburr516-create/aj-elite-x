# Elite X — Phase 5 Audit & Cleanup Report

Audited: live Supabase project `mjlnyvoulsvwlumfovjj` (via Data API introspection) + all
project SQL files + all TypeScript services/hooks/components.

---

## 1. Root cause of `ERROR: 42703: column "workout_id" does not exist`

`public.xp_history` **already exists in the live database**, but with the shape of an
older, abandoned gamification attempt:

```
xp_history(id, athlete_id, source, xp, description, created_at)   -- LEGACY (live)
```

`supabase/phase5a_xp_engine.sql` runs `create table if not exists public.xp_history (...)`,
which is silently skipped because the name is taken, and then fails on:

```sql
create unique index uniq_xp_history_workout on public.xp_history(workout_id) ...
```

There is no `workout_id` in the legacy table → 42703. Every subsequent statement in that
migration (engine functions, backfill, views, grants) never ran. That is why
`seasons`, `level_config`, `workout_phases`, `workout_exercises`, `athlete_progress`
and `xp_leaderboard` do **not** exist while the frontend already queries them.

---

## 2. Objects that exist in the live database

### Core production tables (KEEP — untouched)
`athletes`, `daily_workouts`, `body_measurements`, `gallery_images`,
`challenge_settings`, `admins`, `activity_logs`, `audit_trail`

Live data present: 10 athletes, 19 challenge days of workouts, measurements, photos in
Storage, challenge settings (`current_day = 19`, `friday_off = true`).

### Core views (KEEP — verified in use)
`athlete_workout_totals`, `overall_leaderboard`, `daily_leaderboard`,
`weekly_leaderboard`, `monthly_leaderboard`, `athlete_profile_summary`

Verified: **none of these views reference any XP / level / achievement object**, so the
cleanup cannot break leaderboards, profiles or analytics.

### Core functions (KEEP)
`is_admin`, `workout_power`, `calculate_power_score`, `touch_updated_at`,
`log_activity`, `audit_row_change`, `link_admin_on_signup`, `get_dashboard_summary`,
`get_workout_trend`, `get_attendance_trend`, `get_weekly_power`, `get_athlete_weekly`,
`get_athlete_streaks`

### Legacy Phase-5 / gamification objects (ORPHANED — from earlier failed attempts)

| Object | State | Referenced by app code? |
| --- | --- | --- |
| `xp_history` (legacy shape) | Partially implemented, blocks the new migration | No |
| `athlete_gamification` | Populated, updated by DB triggers only | No |
| `gamification_events` | Populated, never read | No |
| `achievements` | Populated definitions | No |
| `achievement_categories` | Populated definitions | No |
| `athlete_achievements` | Populated unlocks | No |
| `titles` | Populated definitions | No |
| `athlete_titles` | Populated unlocks | No |
| `xp_rules` | Populated rule rows | No |

A repo-wide search for `achievement`, `titles`, `xp_rules`, `athlete_gamification`,
`gamification_events`, `xp_history` found **zero** frontend usages of these tables
(only unrelated gallery image-type strings). The system is dead code at the app layer
but still **live at the DB layer**: `athlete_gamification.updated_at` advances when
workouts are saved, so legacy triggers/functions on `daily_workouts` still fire.

### Missing objects the frontend already expects (BROKEN REFERENCES)
`seasons`, `level_config`, `workout_phases`, `workout_exercises`, `athlete_progress`,
new-shape `xp_history`, view `xp_leaderboard`, RPCs `get_athlete_progress`,
`recalculate_athlete_xp`, `advance_athlete_phase`, `current_season_id`, `xp_level`.

Used by: `src/hooks/useXp.ts`, `src/routes/admin.progression.tsx`,
`src/routes/admin.workouts.tsx`, `src/routes/admin.athletes.$slug.tsx`,
`src/components/xp/*`.

---

## 3. Duplicate / conflicting systems found

1. **Two XP engines.** Legacy: `xp_rules` + `xp_history(xp)` + `athlete_gamification.total_xp`.
   New: `level_config` + `xp_history(xp_amount)` + `athlete_progress.total_xp`.
2. **Two level calculations.** Legacy `level_from_xp()` (already dropped by
   `phase4_fix_level_from_xp.sql`, its callers dropped with it) + `athlete_gamification.current_level`;
   new config-driven `xp_level()`.
3. **Two title/rank concepts.** Legacy `titles` / `athlete_gamification.current_rank`
   vs. new `level_config.label`.
4. **Name collision on `xp_history`** — the actual migration blocker.

## 4. Migration conflicts / non-idempotent statements

- `phase5a_xp_engine.sql`: `create table if not exists` followed by index/constraint
  creation that assumes the new column set (fails on partially-migrated DBs).
- `phase4_fix_level_from_xp.sql`: a one-off hotfix, now folded into the cleanup script.
- No migration ordering or re-run guarantees anywhere.

---

## 5. Recommended fixes (implemented)

| # | Fix | File |
| --- | --- | --- |
| 1 | Drop legacy triggers/functions on `daily_workouts` that reference gamification objects (dynamic discovery, no guessing) | `phase5_00_cleanup.sql` |
| 2 | Move all 9 legacy gamification tables into a private `legacy_phase5` schema — **data preserved**, removed from the API and from Realtime, name collision cleared | `phase5_00_cleanup.sql` |
| 3 | Never touch production tables — the script has an explicit protected-table guard | `phase5_00_cleanup.sql` |
| 4 | Rewrite the XP engine fully idempotent and self-healing: every column via `add column if not exists`, every index/constraint/policy/trigger guarded, safe on fresh **and** partially-migrated databases | `phase5a_xp_engine.sql` |
| 5 | Single source of truth for XP, levels, seasons, phases — with reserved extension points for future Achievements / Titles / Badges (`xp_history.source` enum + `season_id` on every progression table) | `phase5a_xp_engine.sql` |
| 6 | Delete the obsolete one-off hotfix file | removed `phase4_fix_level_from_xp.sql` |

### Frontend audit result
No legacy XP/achievement code exists in `src/`. `src/lib/xp.ts`, `src/lib/xp.types.ts`,
`src/hooks/useXp.ts`, `src/components/xp/*` and `src/routes/admin.progression.tsx` all
target the new schema exactly and were kept as-is (reused, not duplicated). No duplicate
level math lives in the client — `levelPct` / `phasePct` only read server-computed values.

---

## 6. Run order

```
1. supabase/schema.sql                 (already applied)
2. supabase/phase4_migration.sql       (already applied)
3. supabase/phase5_00_cleanup.sql      <-- run this first, once
4. supabase/phase5a_xp_engine.sql      <-- then this
```

Both new scripts are safe to run repeatedly. Neither deletes athletes, workouts,
measurements, gallery images, leaderboard data, analytics, photos, profiles,
admin accounts, or seasons.
