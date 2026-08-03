import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/hooks/useElite";
import type {
  AthleteProgress, LevelConfigRow, Season, WorkoutPhase,
  XpHistoryRow, XpLeaderboardRow,
} from "@/lib/xp.types";

// ---------- Season ----------
export function useCurrentSeason() {
  useRealtime("seasons", [["season"]]);
  return useQuery({
    queryKey: ["season"],
    queryFn: async (): Promise<Season | null> => {
      const { data, error } = await supabase
        .from("seasons").select("*").eq("is_current", true).maybeSingle();
      if (error) throw error;
      return (data as Season) ?? null;
    },
  });
}

// ---------- Level config ----------
export function useLevelConfig() {
  useRealtime("level_config", [["level-config"]]);
  return useQuery({
    queryKey: ["level-config"],
    queryFn: async (): Promise<LevelConfigRow[]> => {
      const { data, error } = await supabase
        .from("level_config").select("*").order("level");
      if (error) throw error;
      return (data ?? []) as LevelConfigRow[];
    },
  });
}

// ---------- Phases ----------
export function useWorkoutPhases() {
  useRealtime("workout_phases", [["workout-phases"]]);
  return useQuery({
    queryKey: ["workout-phases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_phases")
        .select("*, workout_exercises(slot, display_name, exercise_order, xp_per_rep)")
        .order("phase_number");
      if (error) throw error;
      return (data ?? []) as Array<WorkoutPhase & {
        workout_exercises: Array<{ slot: string; display_name: string; exercise_order: number; xp_per_rep: number }>;
      }>;
    },
  });
}

// ---------- Athlete progression ----------
export function useAthleteProgress(athleteId: string | undefined) {
  useRealtime("athlete_progress", [["athlete-progress"], ["xp-leaderboard"]]);
  return useQuery({
    queryKey: ["athlete-progress", athleteId],
    enabled: !!athleteId,
    queryFn: async (): Promise<AthleteProgress | null> => {
      const { data, error } = await supabase.rpc("get_athlete_progress", { _athlete: athleteId });
      if (error) throw error;
      return (data as AthleteProgress) ?? null;
    },
  });
}

export function useXpHistory(athleteId: string | undefined, limit = 60) {
  useRealtime("xp_history", [["xp-history"]]);
  return useQuery({
    queryKey: ["xp-history", athleteId, limit],
    enabled: !!athleteId,
    queryFn: async (): Promise<XpHistoryRow[]> => {
      const { data, error } = await supabase
        .from("xp_history").select("*")
        .eq("athlete_id", athleteId!)
        .order("challenge_day", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as XpHistoryRow[];
    },
  });
}

export function useXpLeaderboard() {
  useRealtime("athlete_progress", [["xp-leaderboard"]]);
  return useQuery({
    queryKey: ["xp-leaderboard"],
    queryFn: async (): Promise<XpLeaderboardRow[]> => {
      const { data, error } = await supabase.from("xp_leaderboard").select("*").order("rank");
      if (error) throw error;
      return (data ?? []) as XpLeaderboardRow[];
    },
  });
}

/** All athletes' progression rows in one shot (admin progression board). */
export function useAllProgress() {
  useRealtime("athlete_progress", [["all-progress"]]);
  return useQuery({
    queryKey: ["all-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_progress")
        .select("*, athletes!inner(id, slug, full_name, photo_url, is_deleted), workout_phases(phase_number, name, start_day, end_day, duration_days)")
        .eq("athletes.is_deleted", false);
      if (error) throw error;
      return (data ?? []) as Array<{
        athlete_id: string; season_id: string; total_xp: number; current_level: number;
        workout_days_completed: number; current_phase_id: string | null; phase_started_at: string;
        athletes: { id: string; slug: string; full_name: string; photo_url: string | null };
        workout_phases: { phase_number: number; name: string; start_day: number; end_day: number; duration_days: number } | null;
      }>;
    },
  });
}

// ---------- Mutations ----------
export function useAdvancePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (athleteId: string) => {
      const { data, error } = await supabase.rpc("advance_athlete_phase", { _athlete: athleteId });
      if (error) throw error;
      return data as { advanced: boolean; phase_number?: number; reason?: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athlete-progress"] });
      qc.invalidateQueries({ queryKey: ["all-progress"] });
      qc.invalidateQueries({ queryKey: ["xp-leaderboard"] });
    },
  });
}

export function useRecalculateXp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (athleteId: string) => {
      const { error } = await supabase.rpc("recalculate_athlete_xp", { _athlete: athleteId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athlete-progress"] });
      qc.invalidateQueries({ queryKey: ["all-progress"] });
      qc.invalidateQueries({ queryKey: ["xp-history"] });
      qc.invalidateQueries({ queryKey: ["xp-leaderboard"] });
    },
  });
}
