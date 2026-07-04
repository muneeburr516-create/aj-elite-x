-- ============================================================
-- ELITE X — Phase 3 Schema (External Supabase)
-- Run this ONCE in your Supabase SQL Editor (single file).
-- Idempotent-ish: safe to re-run in a fresh project.
-- ============================================================

-- Extensions ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums -----------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin','superadmin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.athlete_status as enum ('active','inactive','disqualified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('PRESENT','ABSENT','REST');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gallery_image_type as enum ('profile','baseline','progress','achievement','banner');
exception when duplicate_object then null; end $$;

-- ============================================================
-- TABLES
-- ============================================================

-- Admins (bootstrap allow-list; role source of truth)
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  role public.app_role not null default 'admin',
  created_at timestamptz not null default now()
);

-- Athletes
create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  full_name text not null,
  photo_url text,
  age int,
  height numeric(5,2),
  weight numeric(5,2),
  trainer text,
  short_bio text,
  status public.athlete_status not null default 'active',
  joined_at date not null default current_date,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_athletes_status on public.athletes(status) where is_deleted = false;
create index if not exists idx_athletes_slug on public.athletes(slug);

-- Daily workouts
create table if not exists public.daily_workouts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  challenge_day int not null,
  workout_date date not null,
  attendance public.attendance_status not null default 'PRESENT',
  pushup_set_1 int not null default 0,
  pushup_set_2 int not null default 0,
  pushup_set_3 int not null default 0,
  pullup_set_1 int not null default 0,
  pullup_set_2 int not null default 0,
  pullup_set_3 int not null default 0,
  chinup_set_1 int not null default 0,
  chinup_set_2 int not null default 0,
  chinup_set_3 int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, challenge_day)
);
create index if not exists idx_workouts_athlete on public.daily_workouts(athlete_id);
create index if not exists idx_workouts_date on public.daily_workouts(workout_date desc);

-- Body measurements
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  measurement_date date not null default current_date,
  weight numeric(5,2),
  chest numeric(5,2),
  waist numeric(5,2),
  arms  numeric(5,2),
  thighs numeric(5,2),
  calves numeric(5,2),
  created_at timestamptz not null default now()
);
create index if not exists idx_measurements_athlete_date on public.body_measurements(athlete_id, measurement_date desc);

-- Gallery images
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  image_type public.gallery_image_type not null default 'progress',
  image_url text not null,
  caption text,
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_gallery_athlete on public.gallery_images(athlete_id);

-- Challenge settings (single row)
create table if not exists public.challenge_settings (
  id uuid primary key default gen_random_uuid(),
  challenge_name text not null default 'Elite X',
  challenge_duration int not null default 90,
  current_day int not null default 1,
  trainer_name text not null default 'Coach AJ',
  friday_off boolean not null default true,
  description text,
  rules text,
  scoring text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.challenge_settings (challenge_name, description, rules, scoring)
select 'Elite X',
       'Invitation-only 90-day transformation quest for the hand-picked Top 10 athletes of AJ Fitness Club.',
       '6 days on / Friday off. Daily tracking mandatory. Missed sessions without cause = disqualification.',
       'Power Score = (pushups × 1) + (pullups × 6) + (chinups × 5) + (attendance × 12).'
where not exists (select 1 from public.challenge_settings);

-- Activity logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  description text,
  admin_email text,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_created on public.activity_logs(created_at desc);

-- Audit trail (old/new values)
create table if not exists public.audit_trail (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid,
  op text not null, -- INSERT | UPDATE | DELETE
  old_value jsonb,
  new_value jsonb,
  changed_by uuid,
  changed_by_email text,
  changed_at timestamptz not null default now()
);
create index if not exists idx_audit_row on public.audit_trail(table_name, row_id);

-- ============================================================
-- HELPERS
-- ============================================================

create or replace function public.is_admin(_uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = _uid);
$$;

-- Power score for one workout row
create or replace function public.workout_power(pu1 int, pu2 int, pu3 int, pl1 int, pl2 int, pl3 int, cu1 int, cu2 int, cu3 int, att public.attendance_status)
returns int language sql immutable as $$
  select ((coalesce(pu1,0)+coalesce(pu2,0)+coalesce(pu3,0)) * 1)
       + ((coalesce(pl1,0)+coalesce(pl2,0)+coalesce(pl3,0)) * 6)
       + ((coalesce(cu1,0)+coalesce(cu2,0)+coalesce(cu3,0)) * 5)
       + (case when att = 'PRESENT' then 12 else 0 end);
$$;

-- Aggregate power score for an athlete
create or replace function public.calculate_power_score(_athlete_id uuid)
returns int language sql stable as $$
  select coalesce(sum(public.workout_power(
    pushup_set_1,pushup_set_2,pushup_set_3,
    pullup_set_1,pullup_set_2,pullup_set_3,
    chinup_set_1,chinup_set_2,chinup_set_3,
    attendance
  )),0)::int
  from public.daily_workouts where athlete_id = _athlete_id;
$$;

-- ============================================================
-- VIEWS — Leaderboards & Summaries
-- ============================================================

create or replace view public.athlete_workout_totals as
select
  a.id as athlete_id,
  a.slug,
  a.full_name,
  a.photo_url,
  coalesce(sum(w.pushup_set_1+w.pushup_set_2+w.pushup_set_3),0)::int as total_pushups,
  coalesce(sum(w.pullup_set_1+w.pullup_set_2+w.pullup_set_3),0)::int as total_pullups,
  coalesce(sum(w.chinup_set_1+w.chinup_set_2+w.chinup_set_3),0)::int as total_chinups,
  coalesce(max(w.pushup_set_1+w.pushup_set_2+w.pushup_set_3),0)::int as best_pushups,
  coalesce(max(w.pullup_set_1+w.pullup_set_2+w.pullup_set_3),0)::int as best_pullups,
  coalesce(max(w.chinup_set_1+w.chinup_set_2+w.chinup_set_3),0)::int as best_chinups,
  coalesce(sum(case when w.attendance='PRESENT' then 1 else 0 end),0)::int as days_present,
  coalesce(count(w.id) filter (where w.attendance <> 'REST'),0)::int as sessions_scheduled,
  coalesce(public.calculate_power_score(a.id),0) as power_score
from public.athletes a
left join public.daily_workouts w on w.athlete_id = a.id
where a.is_deleted = false
group by a.id, a.slug, a.full_name, a.photo_url;

create or replace view public.overall_leaderboard as
select
  row_number() over (order by power_score desc, total_pushups desc)::int as rank,
  athlete_id, slug, full_name, photo_url,
  total_pushups, total_pullups, total_chinups,
  days_present, sessions_scheduled,
  case when sessions_scheduled > 0 then round((days_present::numeric / sessions_scheduled) * 100, 1) else 0 end as attendance_pct,
  power_score
from public.athlete_workout_totals;

create or replace view public.daily_leaderboard as
with today_scope as (
  select cs.current_day from public.challenge_settings cs order by updated_at desc limit 1
),
day_rows as (
  select a.id as athlete_id, a.slug, a.full_name, a.photo_url,
    coalesce(w.pushup_set_1+w.pushup_set_2+w.pushup_set_3,0)::int as pushups,
    coalesce(w.pullup_set_1+w.pullup_set_2+w.pullup_set_3,0)::int as pullups,
    coalesce(w.chinup_set_1+w.chinup_set_2+w.chinup_set_3,0)::int as chinups,
    coalesce(w.attendance::text,'ABSENT') as attendance,
    coalesce(public.workout_power(w.pushup_set_1,w.pushup_set_2,w.pushup_set_3,w.pullup_set_1,w.pullup_set_2,w.pullup_set_3,w.chinup_set_1,w.chinup_set_2,w.chinup_set_3,w.attendance),0) as power_score
  from public.athletes a
  left join public.daily_workouts w on w.athlete_id = a.id and w.challenge_day = (select current_day from today_scope)
  where a.is_deleted = false
)
select row_number() over (order by power_score desc)::int as rank, * from day_rows;

create or replace view public.weekly_leaderboard as
with week_rows as (
  select a.id as athlete_id, a.slug, a.full_name, a.photo_url,
    coalesce(sum(w.pushup_set_1+w.pushup_set_2+w.pushup_set_3),0)::int as pushups,
    coalesce(sum(w.pullup_set_1+w.pullup_set_2+w.pullup_set_3),0)::int as pullups,
    coalesce(sum(w.chinup_set_1+w.chinup_set_2+w.chinup_set_3),0)::int as chinups,
    coalesce(sum(case when w.attendance='PRESENT' then 1 else 0 end),0)::int as days_present,
    coalesce(sum(public.workout_power(w.pushup_set_1,w.pushup_set_2,w.pushup_set_3,w.pullup_set_1,w.pullup_set_2,w.pullup_set_3,w.chinup_set_1,w.chinup_set_2,w.chinup_set_3,w.attendance)),0)::int as power_score
  from public.athletes a
  left join public.daily_workouts w on w.athlete_id = a.id and w.workout_date >= date_trunc('week', current_date)::date
  where a.is_deleted = false
  group by a.id, a.slug, a.full_name, a.photo_url
)
select row_number() over (order by power_score desc)::int as rank, * from week_rows;

create or replace view public.monthly_leaderboard as
with month_rows as (
  select a.id as athlete_id, a.slug, a.full_name, a.photo_url,
    coalesce(sum(w.pushup_set_1+w.pushup_set_2+w.pushup_set_3),0)::int as pushups,
    coalesce(sum(w.pullup_set_1+w.pullup_set_2+w.pullup_set_3),0)::int as pullups,
    coalesce(sum(w.chinup_set_1+w.chinup_set_2+w.chinup_set_3),0)::int as chinups,
    coalesce(sum(case when w.attendance='PRESENT' then 1 else 0 end),0)::int as days_present,
    coalesce(sum(public.workout_power(w.pushup_set_1,w.pushup_set_2,w.pushup_set_3,w.pullup_set_1,w.pullup_set_2,w.pullup_set_3,w.chinup_set_1,w.chinup_set_2,w.chinup_set_3,w.attendance)),0)::int as power_score
  from public.athletes a
  left join public.daily_workouts w on w.athlete_id = a.id and w.workout_date >= date_trunc('month', current_date)::date
  where a.is_deleted = false
  group by a.id, a.slug, a.full_name, a.photo_url
)
select row_number() over (order by power_score desc)::int as rank, * from month_rows;

create or replace view public.athlete_profile_summary as
select
  a.id as athlete_id, a.slug, a.full_name, a.photo_url, a.trainer, a.short_bio,
  a.age, a.height, a.weight, a.status, a.joined_at,
  ol.rank as current_rank,
  awt.total_pushups, awt.total_pullups, awt.total_chinups,
  awt.best_pushups, awt.best_pullups, awt.best_chinups,
  awt.days_present, awt.sessions_scheduled,
  case when awt.sessions_scheduled > 0 then round((awt.days_present::numeric/awt.sessions_scheduled)*100,1) else 0 end as attendance_pct,
  awt.power_score,
  (select bm.weight from public.body_measurements bm where bm.athlete_id = a.id order by measurement_date desc limit 1) as current_weight
from public.athletes a
left join public.athlete_workout_totals awt on awt.athlete_id = a.id
left join public.overall_leaderboard ol on ol.athlete_id = a.id
where a.is_deleted = false;

-- ============================================================
-- RPCs
-- ============================================================

create or replace function public.get_dashboard_summary()
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'total_athletes', (select count(*) from public.athletes where is_deleted=false),
    'current_day', (select current_day from public.challenge_settings order by updated_at desc limit 1),
    'current_leader', (select full_name from public.overall_leaderboard order by rank asc limit 1),
    'average_attendance', coalesce((select round(avg(attendance_pct),1) from public.overall_leaderboard),0),
    'highest_pushups', coalesce((select max(best_pushups) from public.athlete_workout_totals),0),
    'highest_pullups', coalesce((select max(best_pullups) from public.athlete_workout_totals),0),
    'highest_chinups', coalesce((select max(best_chinups) from public.athlete_workout_totals),0)
  );
$$;

-- ============================================================
-- TRIGGERS — updated_at, activity logging, audit
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_athletes_updated on public.athletes;
create trigger trg_athletes_updated before update on public.athletes
for each row execute function public.touch_updated_at();

drop trigger if exists trg_workouts_updated on public.daily_workouts;
create trigger trg_workouts_updated before update on public.daily_workouts
for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_updated on public.challenge_settings;
create trigger trg_settings_updated before update on public.challenge_settings
for each row execute function public.touch_updated_at();

-- Activity log helper
create or replace function public.log_activity(_action text, _description text, _entity_type text, _entity_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _email text;
begin
  select email into _email from auth.users where id = auth.uid();
  insert into public.activity_logs(action, description, admin_email, entity_type, entity_id)
  values (_action, _description, _email, _entity_type, _entity_id);
end $$;

-- Generic audit trigger
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare _email text;
begin
  select email into _email from auth.users where id = auth.uid();
  if TG_OP = 'DELETE' then
    insert into public.audit_trail(table_name,row_id,op,old_value,changed_by,changed_by_email)
    values (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid(), _email);
    perform public.log_activity(TG_TABLE_NAME||'.delete','Deleted '||TG_TABLE_NAME, TG_TABLE_NAME, OLD.id);
    return OLD;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_trail(table_name,row_id,op,old_value,new_value,changed_by,changed_by_email)
    values (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), _email);
    perform public.log_activity(TG_TABLE_NAME||'.update','Updated '||TG_TABLE_NAME, TG_TABLE_NAME, NEW.id);
    return NEW;
  else
    insert into public.audit_trail(table_name,row_id,op,new_value,changed_by,changed_by_email)
    values (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid(), _email);
    perform public.log_activity(TG_TABLE_NAME||'.insert','Created '||TG_TABLE_NAME, TG_TABLE_NAME, NEW.id);
    return NEW;
  end if;
end $$;

drop trigger if exists trg_audit_athletes on public.athletes;
create trigger trg_audit_athletes after insert or update or delete on public.athletes
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_workouts on public.daily_workouts;
create trigger trg_audit_workouts after insert or update or delete on public.daily_workouts
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_measurements on public.body_measurements;
create trigger trg_audit_measurements after insert or update or delete on public.body_measurements
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_gallery on public.gallery_images;
create trigger trg_audit_gallery after insert or update or delete on public.gallery_images
for each row execute function public.audit_row_change();

-- ============================================================
-- GRANTS
-- ============================================================
grant usage on schema public to anon, authenticated;

grant select on public.athletes to anon, authenticated;
grant insert, update, delete on public.athletes to authenticated;

grant select on public.daily_workouts to anon, authenticated;
grant insert, update, delete on public.daily_workouts to authenticated;

grant select on public.body_measurements to anon, authenticated;
grant insert, update, delete on public.body_measurements to authenticated;

grant select on public.gallery_images to anon, authenticated;
grant insert, update, delete on public.gallery_images to authenticated;

grant select on public.challenge_settings to anon, authenticated;
grant update on public.challenge_settings to authenticated;

grant select on public.activity_logs to authenticated;
grant select on public.audit_trail to authenticated;
grant select on public.admins to authenticated;

grant select on public.overall_leaderboard, public.daily_leaderboard,
  public.weekly_leaderboard, public.monthly_leaderboard,
  public.athlete_workout_totals, public.athlete_profile_summary to anon, authenticated;

grant all on all tables in schema public to service_role;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.athletes enable row level security;
alter table public.daily_workouts enable row level security;
alter table public.body_measurements enable row level security;
alter table public.gallery_images enable row level security;
alter table public.challenge_settings enable row level security;
alter table public.admins enable row level security;
alter table public.activity_logs enable row level security;
alter table public.audit_trail enable row level security;

-- Athletes: public read active+not-deleted, admin full
drop policy if exists athletes_public_read on public.athletes;
create policy athletes_public_read on public.athletes for select
  using (is_deleted = false);
drop policy if exists athletes_admin_all on public.athletes;
create policy athletes_admin_all on public.athletes for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Daily workouts
drop policy if exists workouts_public_read on public.daily_workouts;
create policy workouts_public_read on public.daily_workouts for select using (true);
drop policy if exists workouts_admin_all on public.daily_workouts;
create policy workouts_admin_all on public.daily_workouts for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Measurements
drop policy if exists measurements_public_read on public.body_measurements;
create policy measurements_public_read on public.body_measurements for select using (true);
drop policy if exists measurements_admin_all on public.body_measurements;
create policy measurements_admin_all on public.body_measurements for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Gallery
drop policy if exists gallery_public_read on public.gallery_images;
create policy gallery_public_read on public.gallery_images for select using (true);
drop policy if exists gallery_admin_all on public.gallery_images;
create policy gallery_admin_all on public.gallery_images for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Settings
drop policy if exists settings_public_read on public.challenge_settings;
create policy settings_public_read on public.challenge_settings for select using (true);
drop policy if exists settings_admin_update on public.challenge_settings;
create policy settings_admin_update on public.challenge_settings for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Admins: only admins can see the list; user can see their own row
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Activity / audit: admin only
drop policy if exists activity_admin_read on public.activity_logs;
create policy activity_admin_read on public.activity_logs for select
  using (public.is_admin(auth.uid()));
drop policy if exists audit_admin_read on public.audit_trail;
create policy audit_admin_read on public.audit_trail for select
  using (public.is_admin(auth.uid()));

-- ============================================================
-- AUTH → link admins.user_id when someone signs up with a whitelisted email
-- ============================================================
create or replace function public.link_admin_on_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.admins set user_id = NEW.id where lower(email) = lower(NEW.email) and user_id is null;
  return NEW;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.link_admin_on_signup();

-- ============================================================
-- BOOTSTRAP ADMIN
-- ============================================================
insert into public.admins(email, role) values ('muneeburr516@gmail.com','superadmin')
on conflict (email) do nothing;

-- If admin already signed up, link the existing user
update public.admins a
set user_id = u.id
from auth.users u
where lower(u.email) = lower(a.email) and a.user_id is null;

-- ============================================================
-- STORAGE BUCKETS (public read; admin write via RLS below)
-- ============================================================
insert into storage.buckets (id,name,public) values ('athletes','athletes',true) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values ('gallery','gallery',true) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values ('branding','branding',true) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values ('exports','exports',false) on conflict (id) do nothing;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects for select
  using (bucket_id in ('athletes','gallery','branding'));

drop policy if exists storage_admin_write on storage.objects;
create policy storage_admin_write on storage.objects for insert
  with check (public.is_admin(auth.uid()) and bucket_id in ('athletes','gallery','branding','exports'));
drop policy if exists storage_admin_update on storage.objects;
create policy storage_admin_update on storage.objects for update
  using (public.is_admin(auth.uid()));
drop policy if exists storage_admin_delete on storage.objects;
create policy storage_admin_delete on storage.objects for delete
  using (public.is_admin(auth.uid()));

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.athletes;
alter publication supabase_realtime add table public.daily_workouts;
alter publication supabase_realtime add table public.body_measurements;
alter publication supabase_realtime add table public.gallery_images;
alter publication supabase_realtime add table public.challenge_settings;

-- Done ------------------------------------------------------------------
