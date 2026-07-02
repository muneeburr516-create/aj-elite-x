export type Athlete = {
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
  color: string; // gradient seed
  initials: string;
  bio: string;
  challengeStarted: string;
};

export const athletes: Athlete[] = [
  { slug: "muneeb", name: "Muneeb Ahmad", age: 22, weight: 78, height: 178, trainer: "Coach AJ", rank: 1, attendance: 98, streak: 62, powerScore: 9420, color: "from-red-600 to-red-900", initials: "MA", bio: "Explosive strength specialist chasing back-to-back pull-up records.", challengeStarted: "2026-04-05" },
  { slug: "hamza", name: "Hamza Riaz", age: 25, weight: 82, height: 182, trainer: "Coach AJ", rank: 2, attendance: 96, streak: 60, powerScore: 9210, color: "from-rose-600 to-red-950", initials: "HR", bio: "Endurance monster with the highest pushup volume of the quest.", challengeStarted: "2026-04-05" },
  { slug: "zain", name: "Zain Malik", age: 24, weight: 74, height: 175, trainer: "Coach Bilal", rank: 3, attendance: 95, streak: 58, powerScore: 9080, color: "from-red-700 to-black", initials: "ZM", bio: "Calisthenics purist and reigning chin-up king of week four.", challengeStarted: "2026-04-05" },
  { slug: "ali", name: "Ali Hassan", age: 26, weight: 85, height: 184, trainer: "Coach AJ", rank: 4, attendance: 94, streak: 55, powerScore: 8950, color: "from-red-600 to-neutral-900", initials: "AH", bio: "Powerlifter converting raw strength into complete athletic conditioning.", challengeStarted: "2026-04-05" },
  { slug: "usman", name: "Usman Tariq", age: 23, weight: 76, height: 179, trainer: "Coach Bilal", rank: 5, attendance: 92, streak: 50, powerScore: 8720, color: "from-red-800 to-red-950", initials: "UT", bio: "Silent grinder — never misses a rep, never misses a session.", challengeStarted: "2026-04-05" },
  { slug: "bilal", name: "Bilal Sheikh", age: 21, weight: 71, height: 173, trainer: "Coach AJ", rank: 6, attendance: 91, streak: 48, powerScore: 8510, color: "from-rose-700 to-neutral-950", initials: "BS", bio: "Youngest athlete of the quest, rising fast up the leaderboard.", challengeStarted: "2026-04-05" },
  { slug: "faizan", name: "Faizan Khan", age: 27, weight: 88, height: 186, trainer: "Coach AJ", rank: 7, attendance: 89, streak: 45, powerScore: 8320, color: "from-red-600 to-black", initials: "FK", bio: "Heavy hitter converting mass into pure athletic power.", challengeStarted: "2026-04-05" },
  { slug: "danish", name: "Danish Iqbal", age: 24, weight: 79, height: 180, trainer: "Coach Bilal", rank: 8, attendance: 88, streak: 42, powerScore: 8180, color: "from-red-700 to-neutral-900", initials: "DI", bio: "Precision athlete with laser focus on form and consistency.", challengeStarted: "2026-04-05" },
  { slug: "kamran", name: "Kamran Yousaf", age: 28, weight: 83, height: 181, trainer: "Coach AJ", rank: 9, attendance: 86, streak: 40, powerScore: 7980, color: "from-rose-800 to-black", initials: "KY", bio: "Veteran of the group — mentor to the younger competitors.", challengeStarted: "2026-04-05" },
  { slug: "arsalan", name: "Arsalan Javed", age: 22, weight: 72, height: 176, trainer: "Coach Bilal", rank: 10, attendance: 84, streak: 38, powerScore: 7810, color: "from-red-900 to-neutral-950", initials: "AJ", bio: "Dark horse of the quest — steady climb every single week.", challengeStarted: "2026-04-05" },
];

export const globalStats = {
  currentDay: 62,
  totalAthletes: 10,
  currentLeader: "Muneeb Ahmad",
  averageAttendance: 91,
  highestPushups: 320,
  highestPullups: 48,
  highestChinups: 42,
};

export const missionPoints = [
  { title: "Selection", desc: "Only 10 athletes hand-picked by Coach AJ from hundreds of applicants." },
  { title: "Discipline", desc: "90 days of relentless training. No shortcuts, no excuses, no rest days beyond Friday." },
  { title: "Transformation", desc: "Every rep tracked. Every measurement logged. Every gain earned." },
  { title: "Legacy", desc: "The final champion becomes part of the AJ Fitness Club Hall of Fame." },
];

export const timeline = [
  { label: "Day 1", desc: "Baseline measurements, photos, strength benchmarks." },
  { label: "Month 1", desc: "Foundation phase. Volume, endurance, movement quality." },
  { label: "Month 2", desc: "Strength phase. Progressive overload, power development." },
  { label: "Month 3", desc: "Peak phase. Conditioning, aesthetics, championship prep." },
  { label: "Champion", desc: "The Elite X title, prize package, and legacy." },
];

export const rules = [
  { title: "Only 10 Athletes", desc: "No exceptions. No replacements. The full quest is these 10." },
  { title: "90 Day Challenge", desc: "The clock starts Day 1 and never resets." },
  { title: "Friday OFF", desc: "One day of recovery. Six days of pure work." },
  { title: "Daily Tracking", desc: "Every set, every rep, every gram logged." },
  { title: "Consistency Matters", desc: "Attendance streaks weigh heavily on the final power score." },
  { title: "Zero Tolerance", desc: "Missed sessions without cause = disqualification." },
];

export function generateWorkoutLog(seed: number) {
  const days = 30;
  const log = [];
  for (let i = 1; i <= days; i++) {
    const base = 40 + (seed % 20) + Math.floor(Math.sin(i + seed) * 6);
    const pu = [base + 5, base, base - 5];
    const pl = [Math.floor(base / 4), Math.floor(base / 4) - 1, Math.floor(base / 5)];
    const cu = [Math.floor(base / 5) + 2, Math.floor(base / 5), Math.floor(base / 6) + 1];
    const date = new Date(2026, 3, 5 + i - 1);
    log.push({
      day: i,
      date: date.toISOString().slice(0, 10),
      pushups: pu,
      pullups: pl,
      chinups: cu,
      attendance: i % 6 === 0 ? "REST" : "PRESENT",
    });
  }
  return log;
}

export function generateMeasurements(seed: number) {
  return [
    { label: "Weight", value: `${70 + (seed % 15)} kg`, change: "-2.1 kg" },
    { label: "Chest", value: `${100 + (seed % 10)} cm`, change: "+3.4 cm" },
    { label: "Waist", value: `${78 - (seed % 6)} cm`, change: "-4.2 cm" },
    { label: "Arms", value: `${36 + (seed % 4)} cm`, change: "+1.8 cm" },
    { label: "Thighs", value: `${58 + (seed % 5)} cm`, change: "+2.1 cm" },
    { label: "Calves", value: `${38 + (seed % 3)} cm`, change: "+0.9 cm" },
  ];
}

export function generateAnalytics(seed: number) {
  const weeks = Array.from({ length: 9 }, (_, i) => ({
    week: `W${i + 1}`,
    pushups: 200 + i * 15 + (seed % 20),
    pullups: 20 + i * 3 + (seed % 5),
    chinups: 18 + i * 2 + (seed % 4),
    power: 6500 + i * 320 + (seed % 200),
    attendance: Math.min(100, 80 + i * 2 + (seed % 5)),
  }));
  return weeks;
}

export const achievements = [
  { title: "Iron Arms", desc: "500 pull-ups in a single week", icon: "Dumbbell" },
  { title: "Perfect Attendance", desc: "30 consecutive sessions", icon: "CalendarCheck" },
  { title: "Pull-up King", desc: "Highest pull-ups of the month", icon: "Crown" },
  { title: "Consistency Monster", desc: "60-day streak unlocked", icon: "Flame" },
  { title: "Strength Beast", desc: "Power score above 9000", icon: "Zap" },
  { title: "Volume Champion", desc: "10,000 push-ups milestone", icon: "TrendingUp" },
];

export const gallery = [
  { week: "Week 1", label: "Baseline" },
  { week: "Week 4", label: "Foundation" },
  { week: "Week 8", label: "Strength Phase" },
  { week: "Week 12", label: "Championship Form" },
];

export type LeaderboardCategory = "pushups" | "pullups" | "chinups" | "power" | "attendance";

export function getLeaderboard(category: LeaderboardCategory) {
  const scored = athletes.map((a, i) => {
    const base = a.powerScore;
    const map: Record<LeaderboardCategory, number> = {
      pushups: 280 - i * 8 + (a.age % 5),
      pullups: 48 - i * 2,
      chinups: 42 - i * 2,
      power: base,
      attendance: a.attendance,
    };
    return { ...a, score: map[category], trend: i % 3 === 0 ? "up" : i % 3 === 1 ? "flat" : "down" };
  });
  return scored.sort((a, b) => b.score - a.score);
}
