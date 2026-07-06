import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Athlete, DailyWorkout, BodyMeasurement, GalleryImage,
  ChallengeSettings, LeaderboardRow, ProfileSummary,
} from "@/lib/database.types";

// ---------- Realtime helper ----------
// Each hook instance gets a UNIQUE channel name so that duplicate hook usages
// (e.g. multiple widgets subscribing to `daily_workouts`) don't collide on a
// shared topic — which triggers Supabase's "cannot add postgres_changes
// callbacks ... after subscribe()" error. All .on() listeners are registered
// before .subscribe(), and channels are torn down on unmount.
export function useRealtime(table: string, keys: unknown[][]) {
  const qc = useQueryClient();
  const id = useId();
  useEffect(() => {
    const channel = supabase.channel(`rt-${table}-${id}-${Math.random().toString(36).slice(2, 8)}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => { keys.forEach((k) => qc.invalidateQueries({ queryKey: k })); },
    );
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, id]);
}

// ---------- Athletes ----------
export function useAthletes() {
  useRealtime("athletes", [["athletes"]]);
  return useQuery({
    queryKey: ["athletes"],
    queryFn: async (): Promise<Athlete[]> => {
      const { data, error } = await supabase
        .from("athletes").select("*").eq("is_deleted", false)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Athlete[];
    },
  });
}

export function useAthlete(slug: string | undefined) {
  return useQuery({
    queryKey: ["athlete", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Athlete | null> => {
      const { data, error } = await supabase
        .from("athletes").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return (data as Athlete) ?? null;
    },
  });
}

export function useProfileSummary(slug: string | undefined) {
  return useQuery({
    queryKey: ["profile-summary", slug],
    enabled: !!slug,
    queryFn: async (): Promise<ProfileSummary | null> => {
      const { data, error } = await supabase
        .from("athlete_profile_summary").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return (data as ProfileSummary) ?? null;
    },
  });
}

export function useUpsertAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Partial<Athlete> & { full_name: string; slug: string }) => {
      const { data, error } = await supabase.from("athletes").upsert(a).select().single();
      if (error) throw error;
      return data as Athlete;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["athletes"] }),
  });
}

export function useDeleteAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("athletes")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["athletes"] }),
  });
}

// ---------- Workouts ----------
export function useWorkouts(athleteId?: string) {
  useRealtime("daily_workouts", [["workouts", athleteId ?? "all"], ["leaderboard"]]);
  return useQuery({
    queryKey: ["workouts", athleteId ?? "all"],
    queryFn: async (): Promise<DailyWorkout[]> => {
      let q = supabase.from("daily_workouts").select("*").order("challenge_day", { ascending: true });
      if (athleteId) q = q.eq("athlete_id", athleteId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DailyWorkout[];
    },
  });
}

export function useUpsertWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (w: Partial<DailyWorkout> & { athlete_id: string; challenge_day: number; workout_date: string }) => {
      const { data, error } = await supabase
        .from("daily_workouts")
        .upsert(w, { onConflict: "athlete_id,challenge_day" })
        .select().single();
      if (error) throw error;
      return data as DailyWorkout;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workouts"] }); qc.invalidateQueries({ queryKey: ["leaderboard"] }); },
  });
}

// ---------- Measurements ----------
export function useMeasurements(athleteId?: string) {
  useRealtime("body_measurements", [["measurements", athleteId ?? "all"]]);
  return useQuery({
    queryKey: ["measurements", athleteId ?? "all"],
    queryFn: async (): Promise<BodyMeasurement[]> => {
      let q = supabase.from("body_measurements").select("*").order("measurement_date", { ascending: false });
      if (athleteId) q = q.eq("athlete_id", athleteId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BodyMeasurement[];
    },
  });
}

export function useUpsertMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<BodyMeasurement> & { athlete_id: string; measurement_date: string }) => {
      const { data, error } = await supabase.from("body_measurements").upsert(m).select().single();
      if (error) throw error;
      return data as BodyMeasurement;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["measurements"] }),
  });
}

export function useDeleteMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("body_measurements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["measurements"] }),
  });
}

// ---------- Gallery ----------
export function useGallery(athleteId?: string) {
  useRealtime("gallery_images", [["gallery", athleteId ?? "all"]]);
  return useQuery({
    queryKey: ["gallery", athleteId ?? "all"],
    queryFn: async (): Promise<GalleryImage[]> => {
      let q = supabase.from("gallery_images").select("*").order("uploaded_at", { ascending: false });
      if (athleteId) q = q.eq("athlete_id", athleteId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as GalleryImage[];
    },
  });
}

export function useUploadImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, bucket, path, athlete_id, image_type = "progress", caption }:
      { file: File; bucket: "athletes" | "gallery" | "branding"; path: string; athlete_id?: string; image_type?: GalleryImage["image_type"]; caption?: string; }) => {
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      if (bucket === "gallery") {
        const { data, error } = await supabase.from("gallery_images")
          .insert({ athlete_id: athlete_id ?? null, image_url: pub.publicUrl, image_type, caption: caption ?? null })
          .select().single();
        if (error) throw error;
        return data as GalleryImage;
      }
      return { url: pub.publicUrl } as any;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });
}

// ---------- Leaderboards ----------
export type LeaderboardScope = "daily" | "weekly" | "monthly" | "overall";
export function useLeaderboard(scope: LeaderboardScope = "overall") {
  useRealtime("daily_workouts", [["leaderboard", scope]]);
  return useQuery({
    queryKey: ["leaderboard", scope],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const view = `${scope}_leaderboard`;
      const { data, error } = await supabase.from(view).select("*").order("rank");
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
  });
}

// ---------- Settings ----------
export function useSettings() {
  useRealtime("challenge_settings", [["settings"]]);
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<ChallengeSettings | null> => {
      const { data, error } = await supabase.from("challenge_settings").select("*")
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return (data as ChallengeSettings) ?? null;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ChallengeSettings> & { id: string }) => {
      const { data, error } = await supabase.from("challenge_settings")
        .update(patch).eq("id", patch.id).select().single();
      if (error) throw error;
      return data as ChallengeSettings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

// ---------- Dashboard ----------
export type DashboardSummary = {
  total_athletes: number; current_day: number; challenge_duration: number; days_remaining: number;
  current_leader: string; average_attendance: number; average_power: number;
  highest_pushups: number; highest_pullups: number; highest_chinups: number;
  attendance_today: number; workouts_today: number; pending_today: number;
  highest_pushups_today: number; highest_pullups_today: number; highest_chinups_today: number;
  total_pushups: number; total_pullups: number; total_chinups: number; total_sessions: number;
};

export function useDashboardSummary() {
  useRealtime("daily_workouts", [["dashboard-summary"]]);
  useRealtime("athletes", [["dashboard-summary"]]);
  useRealtime("challenge_settings", [["dashboard-summary"]]);
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async (): Promise<DashboardSummary> => {
      const { data, error } = await supabase.rpc("get_dashboard_summary");
      if (error) throw error;
      return data as DashboardSummary;
    },
  });
}

export function useWorkoutTrend(days = 14) {
  useRealtime("daily_workouts", [["workout-trend", days]]);
  return useQuery({
    queryKey: ["workout-trend", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_workout_trend", { _days: days });
      if (error) throw error;
      return (data ?? []) as Array<{ day: string; pushups: number; pullups: number; chinups: number }>;
    },
  });
}

export function useAttendanceTrend(weeks = 9) {
  useRealtime("daily_workouts", [["attendance-trend", weeks]]);
  return useQuery({
    queryKey: ["attendance-trend", weeks],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_attendance_trend", { _weeks: weeks });
      if (error) throw error;
      return (data ?? []) as Array<{ week: string; present: number; absent: number }>;
    },
  });
}

export function useWeeklyPower(weeks = 9) {
  useRealtime("daily_workouts", [["weekly-power", weeks]]);
  return useQuery({
    queryKey: ["weekly-power", weeks],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_weekly_power", { _weeks: weeks });
      if (error) throw error;
      return (data ?? []) as Array<{ week: string; power: number }>;
    },
  });
}

export function useAthleteWeekly(athleteId: string | undefined) {
  return useQuery({
    queryKey: ["athlete-weekly", athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_athlete_weekly", { _athlete: athleteId });
      if (error) throw error;
      return (data ?? []) as Array<{ week: string; pushups: number; pullups: number; chinups: number; power: number; attendance: number }>;
    },
  });
}

export function useAthleteStreaks(athleteId: string | undefined) {
  return useQuery({
    queryKey: ["athlete-streaks", athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_athlete_streaks", { _athlete: athleteId });
      if (error) throw error;
      return data as { current: number; longest: number; broken: number; perfect: boolean };
    },
  });
}

// ---------- Activity ----------
export function useActivityLogs(limit = 100) {
  useRealtime("activity_logs", [["activity"]]);
  return useQuery({
    queryKey: ["activity", limit],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_logs")
        .select("*").order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data as Array<{ id: string; action: string; description: string | null; admin_email: string | null; entity_type: string | null; created_at: string }>;
    },
  });
}

