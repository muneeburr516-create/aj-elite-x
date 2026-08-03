// ---------------------------------------------------------------
// Phase 5A — XP & Progression types (mirror of the SQL payloads)
// ---------------------------------------------------------------
export type ExerciseSlot = "pushup" | "pullup" | "chinup";
export type XpSource = "workout" | "manual" | "bonus" | "adjustment";

export interface PhaseExercise {
  slot: ExerciseSlot;
  display_name: string;
  exercise_order: number;
  xp_per_rep: number;
}

export interface Season {
  id: string;
  slug: string;
  name: string;
  season_number: number;
  duration_days: number;
  start_date: string | null;
  status: "upcoming" | "active" | "completed" | "archived";
  is_current: boolean;
}

export interface WorkoutPhase {
  id: string;
  season_id: string;
  phase_number: number;
  name: string;
  start_day: number;
  end_day: number;
  duration_days: number;
  status: "active" | "inactive" | "archived";
}

export interface LevelConfigRow {
  id: string;
  season_id: string | null;
  level: number;
  xp_required: number;
  label: string | null;
}

export interface XpHistoryRow {
  id: string;
  athlete_id: string;
  season_id: string;
  workout_id: string | null;
  phase_id: string | null;
  challenge_day: number | null;
  source: XpSource;
  xp_amount: number;
  breakdown: {
    pushups?: number;
    pullups?: number;
    chinups?: number;
    attendance?: string;
  } | null;
  created_at: string;
}

export interface AthleteProgress {
  athlete_id: string;
  season_id: string;
  total_xp: number;
  workout_xp: number;
  bonus_xp: number;
  current_level: number;
  current_level_label: string | null;
  current_level_xp: number;
  next_level: number | null;
  next_level_xp: number | null;
  xp_remaining: number;
  level_progress_pct: number;
  workout_days_completed: number;
  phase_id: string | null;
  phase_number: number;
  phase_name: string | null;
  phase_start_day: number | null;
  phase_end_day: number | null;
  phase_duration: number;
  phase_days_completed: number;
  phase_days_remaining: number;
  phase_progress_pct: number;
  ready_for_next_phase: boolean;
  exercises: PhaseExercise[];
}

export interface XpLeaderboardRow {
  rank: number;
  athlete_id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  total_xp: number;
  current_level: number;
  workout_days_completed: number;
  phase_number: number | null;
  phase_name: string | null;
}
