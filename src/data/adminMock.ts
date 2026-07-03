import { athletes, globalStats } from "./elite";

export type ActivityItem = {
  id: string;
  type: "workout" | "measurement" | "photo" | "athlete" | "leaderboard";
  actor: string;
  message: string;
  time: string;
};

export const activityFeed: ActivityItem[] = [
  { id: "a1", type: "workout", actor: "Muneeb Ahmad", message: "Workout log updated — Day 62", time: "2 min ago" },
  { id: "a2", type: "measurement", actor: "Ali Hassan", message: "Measurements updated — chest +1.2cm", time: "18 min ago" },
  { id: "a3", type: "photo", actor: "Hamza Riaz", message: "New transformation photo uploaded — Month 2", time: "42 min ago" },
  { id: "a4", type: "leaderboard", actor: "System", message: "Leaderboard recalculated for Week 9", time: "1 hr ago" },
  { id: "a5", type: "workout", actor: "Zain Malik", message: "Workout log updated — 48 pull-ups PR", time: "2 hr ago" },
  { id: "a6", type: "athlete", actor: "Coach AJ", message: "Note added to Bilal Sheikh profile", time: "3 hr ago" },
  { id: "a7", type: "workout", actor: "Usman Tariq", message: "Marked absent — Day 61", time: "yesterday" },
  { id: "a8", type: "measurement", actor: "Faizan Khan", message: "Weight down 1.4kg this week", time: "yesterday" },
  { id: "a9", type: "photo", actor: "Danish Iqbal", message: "Baseline photo replaced", time: "2 days ago" },
  { id: "a10", type: "leaderboard", actor: "System", message: "Power scores refreshed", time: "2 days ago" },
];

export type Notification = { id: string; title: string; body: string; time: string; unread: boolean };

export const notifications: Notification[] = [
  { id: "n1", title: "Attendance dip", body: "2 athletes missed Day 61 session", time: "10 min", unread: true },
  { id: "n2", title: "New PR unlocked", body: "Zain Malik — 48 pull-ups", time: "1 hr", unread: true },
  { id: "n3", title: "Measurements due", body: "Weekly measurements for 4 athletes pending", time: "3 hr", unread: false },
  { id: "n4", title: "Backup created", body: "Weekly data snapshot completed", time: "yesterday", unread: false },
];

export type MediaItem = {
  id: string;
  name: string;
  category: "athlete" | "background" | "logo" | "gallery";
  size: string;
  uploaded: string;
};

export const mediaLibrary: MediaItem[] = Array.from({ length: 24 }, (_, i) => ({
  id: `m${i + 1}`,
  name: `elite-x-${i + 1}.jpg`,
  category: (["athlete", "background", "logo", "gallery"] as const)[i % 4],
  size: `${(400 + i * 27) % 1800 + 200} KB`,
  uploaded: `${(i % 30) + 1} days ago`,
}));

export const dashboardStats = () => {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return {
    today,
    totalAthletes: athletes.length,
    challengeDay: globalStats.currentDay,
    workoutsPending: 3,
    attendanceToday: 8,
    currentLeader: globalStats.currentLeader,
    highestPushups: 82,
    highestPullups: 18,
    highestChinups: 14,
    averageAttendance: globalStats.averageAttendance,
    daysRemaining: 90 - globalStats.currentDay,
  };
};

export const workoutTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${globalStats.currentDay - 13 + i}`,
  pushups: 220 + Math.round(Math.sin(i / 2) * 30) + i * 4,
  pullups: 34 + Math.round(Math.cos(i / 2) * 6) + i,
  chinups: 28 + Math.round(Math.sin(i / 3) * 4) + i,
}));

export const attendanceTrend = Array.from({ length: 9 }, (_, i) => ({
  week: `W${i + 1}`,
  present: 88 + i - (i % 3),
  absent: 12 - i + (i % 3),
}));

export const weeklySummary = Array.from({ length: 9 }, (_, i) => ({
  week: `W${i + 1}`,
  power: 6800 + i * 280,
}));

export const challengeSettingsDefault = {
  name: "Elite X",
  duration: 90,
  currentDay: globalStats.currentDay,
  fridayOff: true,
  trainer: "Coach AJ",
  description: "Invitation-only 90-day transformation quest for the hand-picked Top 10 athletes of AJ Fitness Club.",
  rules: "6 days on / Friday off. Daily tracking mandatory. Missed sessions without cause = disqualification.",
  scoring: "Power Score = (pushups × 1) + (pullups × 6) + (chinups × 5) + (attendance × 12).",
};
