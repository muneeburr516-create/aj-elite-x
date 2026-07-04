import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Trophy, Loader2 } from "lucide-react";
import { SectionHeading, GlassCard } from "@/components/common/GlassCard";
import { AthleteAvatar } from "@/components/elite/AthleteCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLeaderboard, type LeaderboardScope } from "@/hooks/useElite";
import { toDisplayAthlete } from "@/lib/athlete-adapter";
import type { LeaderboardRow } from "@/lib/database.types";

export const Route = createFileRoute("/leaderboards")({
  component: LeaderboardsPage,
  head: () => ({
    meta: [
      { title: "Leaderboards — Elite X | AJ Fitness Club" },
      { name: "description", content: "Live Elite X leaderboards across daily, weekly, monthly and overall standings." },
      { property: "og:title", content: "Elite X Leaderboards" },
    ],
  }),
});

const periods: { v: LeaderboardScope; l: string }[] = [
  { v: "daily", l: "Daily" }, { v: "weekly", l: "Weekly" },
  { v: "monthly", l: "Monthly" }, { v: "overall", l: "Overall" },
];

type Category = "power" | "pushups" | "pullups" | "chinups" | "attendance";
const categories: { v: Category; l: string; suffix?: string }[] = [
  { v: "power", l: "Power Score" },
  { v: "pushups", l: "Push-ups" },
  { v: "pullups", l: "Pull-ups" },
  { v: "chinups", l: "Chin-ups" },
  { v: "attendance", l: "Attendance", suffix: "%" },
];

function scoreOf(r: LeaderboardRow, cat: Category): number {
  switch (cat) {
    case "power": return r.power_score ?? 0;
    case "pushups": return (r.total_pushups ?? r.pushups ?? 0) as number;
    case "pullups": return (r.total_pullups ?? r.pullups ?? 0) as number;
    case "chinups": return (r.total_chinups ?? r.chinups ?? 0) as number;
    case "attendance": return r.attendance_pct ?? 0;
  }
}

function LeaderboardsPage() {
  return (
    <section className="px-4 py-16 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="THE STANDINGS" title="Leaderboards" center
          subtitle="Live rankings, calculated in the database." />
        <Tabs defaultValue="overall">
          <TabsList className="glass-strong h-auto p-1 flex flex-wrap justify-center gap-1 bg-transparent mb-8">
            {periods.map((p) => (
              <TabsTrigger key={p.v} value={p.v}
                className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 rounded-lg px-4 py-2">
                {p.l}
              </TabsTrigger>
            ))}
          </TabsList>
          {periods.map((p) => (
            <TabsContent key={p.v} value={p.v}><Board scope={p.v} /></TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

function Board({ scope }: { scope: LeaderboardScope }) {
  const [cat, setCat] = useState<Category>("power");
  const { data = [], isLoading } = useLeaderboard(scope);
  const suffix = categories.find((c) => c.v === cat)?.suffix ?? "";

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => scoreOf(b, cat) - scoreOf(a, cat));
  }, [data, cat]);

  if (isLoading) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (sorted.length === 0) return <GlassCard className="text-center py-16"><p className="text-white/60">No data yet for this period.</p></GlassCard>;

  const asDisplay = (r: LeaderboardRow, i: number) =>
    toDisplayAthlete(
      { id: r.athlete_id, slug: r.slug, full_name: r.full_name, photo_url: r.photo_url, age: 0, height: 0, weight: 0, trainer: null, short_bio: null, status: "active", joined_at: "", is_deleted: false, created_at: "", updated_at: "" },
      { index: i, powerScore: r.power_score, attendance: r.attendance_pct ?? 0 },
    );

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map((c) => (
          <button key={c.v} onClick={() => setCat(c.v)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-display tracking-[0.2em] transition-all border",
              cat === c.v ? "bg-primary border-primary text-white glow-red"
                : "border-white/10 bg-white/5 text-white/60 hover:border-primary/50 hover:text-white",
            )}>
            {c.l.toUpperCase()}
          </button>
        ))}
      </div>

      <Podium top={sorted.slice(0, 3)} suffix={suffix} cat={cat} asDisplay={asDisplay} />

      <div className="mt-10 space-y-3">
        {sorted.slice(3).map((r, i) => {
          const a = asDisplay(r, i + 3);
          return (
            <motion.div key={r.athlete_id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="font-display text-2xl text-white/40 w-10 text-center">#{i + 4}</div>
                <AthleteAvatar athlete={a} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-white uppercase truncate">{a.name}</p>
                </div>
                <div className="font-display text-xl text-primary min-w-[80px] text-right">
                  {scoreOf(r, cat).toLocaleString()}{suffix}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Podium({ top, suffix, cat, asDisplay }: { top: LeaderboardRow[]; suffix: string; cat: Category; asDisplay: (r: LeaderboardRow, i: number) => any }) {
  const order = [top[1], top[0], top[2]];
  const heights = ["h-40 md:h-48", "h-52 md:h-64", "h-32 md:h-40"];
  const ranks = [2, 1, 3];
  const colors = ["from-white/30 to-white/5", "from-primary to-red-900", "from-amber-700/60 to-amber-950/40"];
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-3xl mx-auto">
      {order.map((r, i) => r && (
        <motion.div key={r.athlete_id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }} className="flex flex-col items-center">
          <div className="mb-3 flex flex-col items-center">
            {ranks[i] === 1 && <Crown className="text-primary mb-1 drop-shadow-[0_0_15px_rgba(225,6,0,0.9)]" />}
            <AthleteAvatar athlete={asDisplay(r, i)} size={ranks[i] === 1 ? "lg" : "md"} />
            <p className="mt-2 font-display uppercase text-xs md:text-sm text-white text-center leading-tight">{r.full_name}</p>
            <p className="text-primary font-display text-lg md:text-2xl">{scoreOf(r, cat).toLocaleString()}{suffix}</p>
          </div>
          <div className={cn("w-full rounded-t-xl bg-gradient-to-b glass-strong border-b-0 flex items-start justify-center pt-4", heights[i], colors[i])}>
            <span className="font-display text-4xl md:text-6xl text-white/90 drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]">{ranks[i]}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
