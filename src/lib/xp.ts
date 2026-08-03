// ---------------------------------------------------------------
// Phase 5A — client-side XP helpers (pure, mirrors the SQL engine)
// ---------------------------------------------------------------
import type { AthleteProgress, ExerciseSlot, PhaseExercise } from "@/lib/xp.types";

export const SLOT_ORDER: ExerciseSlot[] = ["pullup", "pushup", "chinup"];

export const FALLBACK_EXERCISES: PhaseExercise[] = [
  { slot: "pullup", display_name: "Pull-ups", exercise_order: 1, xp_per_rep: 6 },
  { slot: "pushup", display_name: "Push-ups", exercise_order: 2, xp_per_rep: 1 },
  { slot: "chinup", display_name: "Chin-ups", exercise_order: 3, xp_per_rep: 5 },
];

/** XP preview for a session under the athlete's active phase template. */
export function previewWorkoutXp(
  exercises: PhaseExercise[],
  reps: Record<ExerciseSlot, number[]>,
  attendance: string,
): number {
  if (attendance !== "PRESENT") return 0;
  return exercises.reduce((sum, e) => {
    const total = (reps[e.slot] ?? []).reduce((a, b) => a + (b || 0), 0);
    return sum + total * e.xp_per_rep;
  }, 0);
}

export function exerciseFor(exercises: PhaseExercise[], slot: ExerciseSlot): PhaseExercise | undefined {
  return exercises.find((e) => e.slot === slot);
}

export function formatXp(xp: number | null | undefined): string {
  return (xp ?? 0).toLocaleString();
}

export function levelBadgeLabel(p: AthleteProgress | null | undefined): string {
  if (!p) return "LVL 1";
  return `LVL ${p.current_level}`;
}

/** Progress toward the next level, clamped 0-100. */
export function levelPct(p: AthleteProgress | null | undefined): number {
  return Math.max(0, Math.min(100, Number(p?.level_progress_pct ?? 0)));
}

export function phasePct(p: AthleteProgress | null | undefined): number {
  return Math.max(0, Math.min(100, Number(p?.phase_progress_pct ?? 0)));
}
