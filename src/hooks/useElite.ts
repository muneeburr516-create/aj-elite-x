import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Athlete, DailyWorkout, BodyMeasurement, GalleryImage,
  ChallengeSettings, LeaderboardRow, ProfileSummary,
} from "@/lib/database.types";

// ---------- Realtime helper ----------
export function useRealtime(table: string, keys: unknown[][]) {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`rt-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
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
export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_summary");
      if (error) throw error;
      return data as {
        total_athletes: number; current_day: number; current_leader: string;
        average_attendance: number; highest_pushups: number;
        highest_pullups: number; highest_chinups: number;
      };
    },
  });
}

// ---------- Activity ----------
export function useActivityLogs() {
  useRealtime("activity_logs", [["activity"]]);
  return useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_logs")
        .select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Array<{ id: string; action: string; description: string | null; admin_email: string | null; created_at: string }>;
    },
  });
}
