// Lightweight typed shape for our external Supabase project.
// Extend as new tables are added.
export type AttendanceStatus = "PRESENT" | "ABSENT" | "REST";
export type AthleteStatus = "active" | "inactive" | "disqualified";
export type GalleryImageType = "profile" | "baseline" | "progress" | "achievement" | "banner";

export interface Athlete {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  trainer: string | null;
  short_bio: string | null;
  status: AthleteStatus;
  joined_at: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyWorkout {
  id: string;
  athlete_id: string;
  challenge_day: number;
  workout_date: string;
  attendance: AttendanceStatus;
  pushup_set_1: number; pushup_set_2: number; pushup_set_3: number;
  pullup_set_1: number; pullup_set_2: number; pullup_set_3: number;
  chinup_set_1: number; chinup_set_2: number; chinup_set_3: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasurement {
  id: string;
  athlete_id: string;
  measurement_date: string;
  weight: number | null; chest: number | null; waist: number | null;
  arms: number | null; thighs: number | null; calves: number | null;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  athlete_id: string | null;
  image_type: GalleryImageType;
  image_url: string;
  caption: string | null;
  uploaded_at: string;
}

export interface ChallengeSettings {
  id: string;
  challenge_name: string;
  challenge_duration: number;
  current_day: number;
  trainer_name: string;
  friday_off: boolean;
  description: string | null;
  rules: string | null;
  scoring: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardRow {
  rank: number;
  athlete_id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  pushups?: number; pullups?: number; chinups?: number;
  total_pushups?: number; total_pullups?: number; total_chinups?: number;
  days_present?: number; sessions_scheduled?: number;
  attendance_pct?: number;
  power_score: number;
}

export interface ProfileSummary {
  athlete_id: string; slug: string; full_name: string; photo_url: string | null;
  trainer: string | null; short_bio: string | null;
  age: number | null; height: number | null; weight: number | null;
  status: AthleteStatus; joined_at: string;
  current_rank: number | null;
  total_pushups: number; total_pullups: number; total_chinups: number;
  best_pushups: number; best_pullups: number; best_chinups: number;
  days_present: number; sessions_scheduled: number;
  attendance_pct: number; power_score: number;
  current_weight: number | null;
}

// Placeholder Database type for supabase-js generic. We treat tables loosely
// to keep the migration fast; can be regenerated with `supabase gen types` later.
export type Database = any;
