// Pure calculation utilities — reusable across UI.
// Server-side has authoritative equivalents; these mirror them for
// client-side derived views (weekly progress, measurement diffs, etc.).

import type { DailyWorkout, BodyMeasurement } from "@/lib/database.types";

// ---- Power ----
export function repTotal(a: number, b: number, c: number) {
  return (a || 0) + (b || 0) + (c || 0);
}

export function workoutPower(w: Partial<DailyWorkout>) {
  const pu = repTotal(w.pushup_set_1 ?? 0, w.pushup_set_2 ?? 0, w.pushup_set_3 ?? 0);
  const pl = repTotal(w.pullup_set_1 ?? 0, w.pullup_set_2 ?? 0, w.pullup_set_3 ?? 0);
  const cu = repTotal(w.chinup_set_1 ?? 0, w.chinup_set_2 ?? 0, w.chinup_set_3 ?? 0);
  const att = w.attendance === "PRESENT" ? 12 : 0;
  return pu * 1 + pl * 6 + cu * 5 + att;
}

// ---- Friday detection ----
export function isFriday(d: string | Date) {
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return date.getDay() === 5;
}

// ---- Attendance ----
export function attendancePct(workouts: DailyWorkout[]) {
  const scheduled = workouts.filter((w) => !isFriday(w.workout_date) && w.attendance !== "REST");
  if (scheduled.length === 0) return 0;
  const present = scheduled.filter((w) => w.attendance === "PRESENT").length;
  return Math.round((present / scheduled.length) * 100);
}

// ---- Streak (skip Fridays) ----
export function computeStreak(workouts: DailyWorkout[]) {
  const sorted = [...workouts].sort((a, b) => a.workout_date.localeCompare(b.workout_date));
  let cur = 0, longest = 0, broken = 0, perfect = true;
  for (const w of sorted) {
    if (isFriday(w.workout_date)) continue;
    if (w.attendance === "PRESENT") {
      cur += 1;
      if (cur > longest) longest = cur;
    } else {
      if (cur > 0) broken += 1;
      cur = 0;
      perfect = false;
    }
  }
  return { current: cur, longest, broken, perfect };
}

// ---- Best sets ----
export function bestSet(workouts: DailyWorkout[], kind: "pushup" | "pullup" | "chinup") {
  const key1 = `${kind}_set_1` as const, key2 = `${kind}_set_2` as const, key3 = `${kind}_set_3` as const;
  return workouts.reduce((max, w) => Math.max(max, (w as any)[key1] || 0, (w as any)[key2] || 0, (w as any)[key3] || 0), 0);
}

export function highestDaily(workouts: DailyWorkout[]) {
  return workouts.reduce((max, w) => Math.max(max, workoutPower(w)), 0);
}

// ---- Weekly bucketing ----
export function weeklyProgress(workouts: DailyWorkout[]) {
  const buckets = new Map<string, { week: string; pushups: number; pullups: number; chinups: number; power: number; attendance: number; sessions: number }>();
  for (const w of workouts) {
    const d = new Date(w.workout_date + "T00:00:00");
    const y = d.getFullYear();
    const first = new Date(y, 0, 1);
    const week = Math.ceil(((d.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7);
    const key = `${y}-W${week}`;
    const b = buckets.get(key) ?? { week: `W${week}`, pushups: 0, pullups: 0, chinups: 0, power: 0, attendance: 0, sessions: 0 };
    b.pushups += repTotal(w.pushup_set_1, w.pushup_set_2, w.pushup_set_3);
    b.pullups += repTotal(w.pullup_set_1, w.pullup_set_2, w.pullup_set_3);
    b.chinups += repTotal(w.chinup_set_1, w.chinup_set_2, w.chinup_set_3);
    b.power += workoutPower(w);
    b.sessions += 1;
    if (w.attendance === "PRESENT") b.attendance += 1;
    buckets.set(key, b);
  }
  return Array.from(buckets.values()).map((b) => ({
    ...b,
    attendance: b.sessions ? Math.round((b.attendance / b.sessions) * 100) : 0,
  }));
}

// ---- Measurement diffs ----
export type MeasurementDiff = { label: string; unit: string; value: number | null; delta: number | null };

const FIELDS: { key: keyof BodyMeasurement; label: string; unit: string }[] = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "arms", label: "Arms", unit: "cm" },
  { key: "thighs", label: "Thighs", unit: "cm" },
  { key: "calves", label: "Calves", unit: "cm" },
];

export function measurementDiffs(rows: BodyMeasurement[]): MeasurementDiff[] {
  if (rows.length === 0) return FIELDS.map((f) => ({ label: f.label, unit: f.unit, value: null, delta: null }));
  const sorted = [...rows].sort((a, b) => b.measurement_date.localeCompare(a.measurement_date));
  const latest = sorted[0];
  const first = sorted[sorted.length - 1];
  return FIELDS.map((f) => {
    const cur = latest[f.key] as number | null;
    const base = first[f.key] as number | null;
    const delta = cur != null && base != null ? Number((cur - base).toFixed(1)) : null;
    return { label: f.label, unit: f.unit, value: cur, delta };
  });
}

// ---- Transformation timeline from gallery ----
export function timelinePhases(uploaded: { uploaded_at: string; image_url: string; caption: string | null }[]) {
  if (uploaded.length === 0) return [];
  const sorted = [...uploaded].sort((a, b) => a.uploaded_at.localeCompare(b.uploaded_at));
  const first = new Date(sorted[0].uploaded_at).getTime();
  const buckets: Record<string, typeof uploaded[number] | null> = {
    Before: null, "Month 1": null, "Month 2": null, "Month 3": null, Final: null,
  };
  const labels = Object.keys(buckets);
  for (const img of sorted) {
    const days = (new Date(img.uploaded_at).getTime() - first) / 86400000;
    const idx = days < 15 ? 0 : days < 45 ? 1 : days < 75 ? 2 : days < 90 ? 3 : 4;
    buckets[labels[idx]] = img;
  }
  return labels.map((l) => ({ phase: l, image: buckets[l] }));
}
