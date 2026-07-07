import type { Athlete as DbAthlete, LeaderboardRow, ProfileSummary } from "@/lib/database.types";

// Legacy display shape used by <AthleteCard/> and other Phase 1 components.
export type DisplayAthlete = {
  slug: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  trainer: string;
  rank: number;
  attendance: number;
  streak: number;
  powerScore: number;
  color: string;
  initials: string;
  bio: string;
  challengeStarted: string;
  photoUrl: string | null;
};

const PALETTE = [
  "from-red-600 to-red-900",
  "from-rose-600 to-red-950",
  "from-red-700 to-black",
  "from-red-600 to-neutral-900",
  "from-red-800 to-red-950",
  "from-rose-700 to-neutral-950",
  "from-red-600 to-black",
  "from-red-700 to-neutral-900",
  "from-rose-800 to-black",
  "from-red-900 to-neutral-950",
];

export function initialsFor(name: string) {
  return name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
}

export function toDisplayAthlete(
  a: DbAthlete,
  ctx?: { rank?: number; powerScore?: number; attendance?: number; index?: number },
): DisplayAthlete {
  const idx = ctx?.index ?? 0;
  return {
    slug: a.slug,
    name: a.full_name,
    age: a.age ?? 0,
    weight: Number(a.weight ?? 0),
    height: Number(a.height ?? 0),
    trainer: a.trainer ?? "—",
    rank: ctx?.rank ?? 0,
    attendance: Math.round(ctx?.attendance ?? 0),
    streak: 0,
    powerScore: ctx?.powerScore ?? 0,
    color: PALETTE[idx % PALETTE.length],
    initials: initialsFor(a.full_name),
    bio: a.short_bio ?? "",
    challengeStarted: a.joined_at,
    photoUrl: a.photo_url ?? null,
  };
}

export function mergeAthletesWithLeaderboard(
  athletes: DbAthlete[],
  board: LeaderboardRow[],
): DisplayAthlete[] {
  const byId = new Map(board.map((r) => [r.athlete_id, r]));
  return athletes
    .map((a, i) => {
      const row = byId.get(a.id);
      return toDisplayAthlete(a, {
        index: i,
        rank: row?.rank ?? 0,
        powerScore: row?.power_score ?? 0,
        attendance: row?.attendance_pct ?? 0,
      });
    })
    .sort((x, y) => (x.rank || 999) - (y.rank || 999));
}

export function summaryToDisplay(s: ProfileSummary, index = 0): DisplayAthlete {
  return {
    slug: s.slug,
    name: s.full_name,
    age: s.age ?? 0,
    weight: Number(s.weight ?? s.current_weight ?? 0),
    height: Number(s.height ?? 0),
    trainer: s.trainer ?? "—",
    rank: s.current_rank ?? 0,
    attendance: Math.round(s.attendance_pct ?? 0),
    streak: 0,
    powerScore: s.power_score ?? 0,
    color: PALETTE[index % PALETTE.length],
    initials: initialsFor(s.full_name),
    bio: s.short_bio ?? "",
    challengeStarted: s.joined_at,
    photoUrl: s.photo_url ?? null,
  };
}
