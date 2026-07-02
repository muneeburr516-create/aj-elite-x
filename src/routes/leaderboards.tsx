import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { SectionHeading, GlassCard } from "@/components/common/GlassCard";
import { AthleteAvatar } from "@/components/elite/AthleteCard";
import { getLeaderboard, type LeaderboardCategory } from "@/data/elite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboards")({
  component: LeaderboardsPage,
  head: () => ({
    meta: [
      { title: "Leaderboards — Elite X | AJ Fitness Club" },
      { name: "description", content: "Live Elite X leaderboards: push-ups, pull-ups, chin-ups, power score and attendance across daily, weekly, monthly and overall standings." },
      { property: "og:title", content: "Elite X Leaderboards" },
    ],
  }),
});

const periods = [
  { v: "daily", l: "Daily" },
  { v: "weekly", l: "Weekly" },
  { v: "monthly", l: "Monthly" },
  { v: "overall", l: "Overall (90 Days)" },
] as const;

const categories: { v: LeaderboardCategory; l: string; suffix?: string }[] = [
  { v: "power", l: "Power Score" },
  { v: "pushups", l: "Push-ups" },
  { v: "pullups", l: "Pull-ups" },
  { v: "chinups", l: "Chin-ups" },
  { v: "attendance", l: "Attendance", suffix: "%" },
];

function LeaderboardsPage() {
  return (
    <section className="px-4 py-16 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="THE STANDINGS"
          title="Leaderboards"
          center
          subtitle="Live rankings across every metric of the Elite X quest."
        />
        <Tabs defaultValue="overall">
          <TabsList className="glass-strong h-auto p-1 flex flex-wrap justify-center gap-1 bg-transparent mb-8">
            {periods.map((p) => (
              <TabsTrigger
                key={p.v}
                value={p.v}
                className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 rounded-lg px-4 py-2"
              >
                {p.l}
              </TabsTrigger>
            ))}
          </TabsList>
          {periods.map((p) => (
            <TabsContent key={p.v} value={p.v}>
              <CategoryTabs />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

function CategoryTabs() {
  const [cat, setCat] = useState<LeaderboardCategory>("power");
  const data = getLeaderboard(cat);
  const suffix = categories.find((c) => c.v === cat)?.suffix ?? "";
  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map((c) => (
          <button
            key={c.v}
            onClick={() => setCat(c.v)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-display tracking-[0.2em] transition-all border",
              cat === c.v
                ? "bg-primary border-primary text-white glow-red"
                : "border-white/10 bg-white/5 text-white/60 hover:border-primary/50 hover:text-white",
            )}
          >
            {c.l.toUpperCase()}
          </button>
        ))}
      </div>

      <Podium top={data.slice(0, 3)} suffix={suffix} />

      <div className="mt-10 space-y-3">
        {data.slice(3).map((a, i) => (
          <motion.div key={a.slug} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="flex items-center gap-4 py-4">
              <div className="font-display text-2xl text-white/40 w-10 text-center">#{i + 4}</div>
              <AthleteAvatar athlete={a} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-display text-white uppercase truncate">{a.name}</p>
                <p className="text-xs text-white/50">{a.trainer}</p>
              </div>
              <TrendIcon trend={a.trend} />
              <div className="font-display text-xl text-primary min-w-[80px] text-right">
                {a.score.toLocaleString()}{suffix}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Podium({ top, suffix }: { top: ReturnType<typeof getLeaderboard>; suffix: string }) {
  const order = [top[1], top[0], top[2]]; // 2 - 1 - 3 layout
  const heights = ["h-40 md:h-48", "h-52 md:h-64", "h-32 md:h-40"];
  const ranks = [2, 1, 3];
  const colors = [
    "from-white/30 to-white/5",
    "from-primary to-red-900",
    "from-amber-700/60 to-amber-950/40",
  ];
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-3xl mx-auto">
      {order.map((a, i) => a && (
        <motion.div
          key={a.slug}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="mb-3 flex flex-col items-center">
            {ranks[i] === 1 && <Crown className="text-primary mb-1 drop-shadow-[0_0_15px_rgba(225,6,0,0.9)]" />}
            <AthleteAvatar athlete={a} size={ranks[i] === 1 ? "lg" : "md"} />
            <p className="mt-2 font-display uppercase text-xs md:text-sm text-white text-center leading-tight">{a.name}</p>
            <p className="text-primary font-display text-lg md:text-2xl">{a.score.toLocaleString()}{suffix}</p>
          </div>
          <div className={cn("w-full rounded-t-xl bg-gradient-to-b glass-strong border-b-0 flex items-start justify-center pt-4", heights[i], colors[i])}>
            <span className="font-display text-4xl md:text-6xl text-white/90 drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]">
              {ranks[i]}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp size={18} className="text-emerald-400" />;
  if (trend === "down") return <TrendingDown size={18} className="text-red-400" />;
  return <Minus size={18} className="text-white/40" />;
}
