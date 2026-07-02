import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft, Trophy, Flame, TrendingUp, Calendar, Dumbbell, Ruler, Award,
  Image as ImageIcon, BarChart3, User, Crown, Zap, CalendarCheck,
} from "lucide-react";
import {
  athletes, generateWorkoutLog, generateMeasurements, generateAnalytics,
  achievements, gallery,
} from "@/data/elite";
import { AthleteAvatar } from "@/components/elite/AthleteCard";
import { GlassCard } from "@/components/common/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/elite/$slug")({
  loader: ({ params }) => {
    const athlete = athletes.find((a) => a.slug === params.slug);
    if (!athlete) throw notFound();
    return athlete;
  },
  component: AthleteProfile,
  notFoundComponent: () => (
    <div className="px-4 py-32 text-center">
      <h1 className="font-display text-3xl">Athlete not found</h1>
      <Link to="/elite" className="text-primary mt-4 inline-block">← Back to roster</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="px-4 py-32 text-center text-white/70">
      <p>{error.message}</p>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Athlete"} — Elite X Profile` },
      { name: "description", content: `${loaderData?.name}'s Elite X transformation profile — rank, stats, workouts, measurements and progress.` },
      { property: "og:title", content: `${loaderData?.name} — Elite X` },
    ],
  }),
});

const iconMap = { Dumbbell, CalendarCheck, Crown, Flame, Zap, TrendingUp };

function AthleteProfile() {
  const a = Route.useLoaderData();
  const seed = a.age + a.weight;
  const workouts = generateWorkoutLog(seed);
  const measurements = generateMeasurements(seed);
  const analytics = generateAnalytics(seed);

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/elite" className="inline-flex items-center gap-2 text-white/60 hover:text-primary transition-colors text-sm mb-6">
          <ArrowLeft size={16} /> Back to Elite Members
        </Link>

        {/* Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <GlassCard className="relative overflow-hidden p-8">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,rgba(225,6,0,0.6),transparent_60%)]" />
            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
              <AthleteAvatar athlete={a} size="xl" />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Trophy size={14} className="text-primary" />
                  <span className="font-display tracking-[0.35em] text-xs text-primary">RANK #{a.rank}</span>
                </div>
                <h1 className="mt-2 font-display uppercase text-4xl md:text-6xl font-bold text-gradient-red">{a.name}</h1>
                <p className="mt-3 max-w-xl text-white/60 text-sm md:text-base leading-relaxed">{a.bio}</p>

                <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                  {[
                    { l: "Age", v: a.age },
                    { l: "Weight", v: `${a.weight} kg` },
                    { l: "Height", v: `${a.height} cm` },
                    { l: "Trainer", v: a.trainer },
                  ].map((s) => (
                    <div key={s.l} className="glass rounded-lg px-4 py-2">
                      <p className="text-[9px] tracking-[0.25em] text-white/50">{s.l.toUpperCase()}</p>
                      <p className="font-display text-white">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-1 gap-3 w-full md:w-52">
                <BannerStat icon={Trophy} label="Power" value={a.powerScore.toLocaleString()} />
                <BannerStat icon={Flame} label="Streak" value={`${a.streak}d`} />
                <BannerStat icon={Calendar} label="Attendance" value={`${a.attendance}%`} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="overview">
            <TabsList className="glass-strong h-auto p-1 flex-wrap justify-start gap-1 bg-transparent">
              {[
                ["overview", "Overview", User],
                ["workout", "Workout Tracker", Dumbbell],
                ["measure", "Measurements", Ruler],
                ["achievements", "Achievements", Award],
                ["gallery", "Gallery", ImageIcon],
                ["analytics", "Analytics", BarChart3],
              ].map(([v, l, Icon]: any) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 rounded-lg px-4 py-2 flex items-center gap-2"
                >
                  <Icon size={14} /> {l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <GlassCard>
                  <h3 className="font-display uppercase text-lg mb-4">Athlete Summary</h3>
                  <dl className="space-y-3 text-sm">
                    {[
                      ["Weight", `${a.weight} kg`],
                      ["Height", `${a.height} cm`],
                      ["Age", `${a.age} years`],
                      ["Trainer", a.trainer],
                      ["Challenge Started", a.challengeStarted],
                      ["Current Rank", `#${a.rank} of 10`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-white/5 pb-2">
                        <dt className="text-white/50">{k}</dt>
                        <dd className="font-display text-white">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </GlassCard>
                <GlassCard>
                  <h3 className="font-display uppercase text-lg mb-4">Power Breakdown</h3>
                  <div className="space-y-4">
                    {[
                      { l: "Strength", v: 88 },
                      { l: "Endurance", v: 92 },
                      { l: "Consistency", v: a.attendance },
                      { l: "Volume", v: 84 },
                    ].map((r) => (
                      <div key={r.l}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/60">{r.l}</span>
                          <span className="font-display text-white">{r.v}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary via-red-500 to-primary shadow-[0_0_10px_rgba(225,6,0,0.6)]" style={{ width: `${r.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="workout" className="mt-6">
              <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] tracking-[0.2em] text-white/50 border-b border-white/10">
                        <th className="text-left p-3">DAY</th>
                        <th className="text-left p-3">DATE</th>
                        <th className="text-center p-3" colSpan={3}>PUSH-UPS</th>
                        <th className="text-center p-3" colSpan={3}>PULL-UPS</th>
                        <th className="text-center p-3" colSpan={3}>CHIN-UPS</th>
                        <th className="text-center p-3">STATUS</th>
                      </tr>
                      <tr className="text-[9px] text-white/40 border-b border-white/10">
                        <th></th><th></th>
                        {["S1","S2","S3","S1","S2","S3","S1","S2","S3"].map((s, i) => (
                          <th key={i} className="p-1 text-center">{s}</th>
                        ))}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {workouts.map((w) => (
                        <tr key={w.day} className="border-b border-white/5 hover:bg-primary/5 transition-colors">
                          <td className="p-3 font-display text-primary">{w.day}</td>
                          <td className="p-3 text-white/70">{w.date}</td>
                          {w.pushups.map((v, i) => <td key={`pu${i}`} className="p-2 text-center text-white">{v}</td>)}
                          {w.pullups.map((v, i) => <td key={`pl${i}`} className="p-2 text-center text-white">{v}</td>)}
                          {w.chinups.map((v, i) => <td key={`cu${i}`} className="p-2 text-center text-white">{v}</td>)}
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-display tracking-widest px-2 py-1 rounded ${w.attendance === "REST" ? "bg-white/10 text-white/60" : "bg-primary/20 text-primary"}`}>
                              {w.attendance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="measure" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {measurements.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                    <GlassCard glow>
                      <p className="text-[10px] tracking-[0.3em] text-white/50">{m.label.toUpperCase()}</p>
                      <p className="mt-2 font-display text-3xl text-white">{m.value}</p>
                      <p className={`mt-1 text-xs ${m.change.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>{m.change}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((ach, i) => {
                  const Icon = (iconMap as any)[ach.icon] || Award;
                  return (
                    <motion.div key={ach.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                      <GlassCard glow className="flex items-center gap-4 h-full">
                        <div className="grid place-items-center h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-red-900 glow-red shrink-0">
                          <Icon size={22} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-display uppercase text-white">{ach.title}</h4>
                          <p className="text-xs text-white/60 mt-0.5">{ach.desc}</p>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.map((g, i) => (
                  <motion.div key={g.week} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                    <GlassCard className="p-0 overflow-hidden group">
                      <div className={`relative aspect-[3/4] bg-gradient-to-br ${a.color}`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-6xl text-white/20">{a.initials}</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="text-[10px] tracking-[0.3em] text-primary">{g.week.toUpperCase()}</p>
                          <p className="font-display text-white text-lg">{g.label}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <GlassCard>
                  <h3 className="font-display uppercase text-sm text-white/70 mb-4">Weekly Volume Progression</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={analytics}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e10600" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#e10600" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "rgba(20,10,10,0.9)", border: "1px solid rgba(225,6,0,0.4)", borderRadius: 12 }} />
                      <Area type="monotone" dataKey="pushups" stroke="#e10600" fill="url(#g1)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>
                <GlassCard>
                  <h3 className="font-display uppercase text-sm text-white/70 mb-4">Power Score Trend</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={analytics}>
                      <defs>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff3030" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#ff3030" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "rgba(20,10,10,0.9)", border: "1px solid rgba(225,6,0,0.4)", borderRadius: 12 }} />
                      <Area type="monotone" dataKey="power" stroke="#ff3030" fill="url(#g2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>
                <GlassCard className="md:col-span-2">
                  <h3 className="font-display uppercase text-sm text-white/70 mb-4">Strength — Pull-ups vs Chin-ups</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={analytics}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "rgba(20,10,10,0.9)", border: "1px solid rgba(225,6,0,0.4)", borderRadius: 12 }} />
                      <Bar dataKey="pullups" fill="#e10600" radius={[4,4,0,0]} />
                      <Bar dataKey="chinups" fill="#ff6060" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function BannerStat({ icon: Icon, label, value }: any) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <Icon size={16} className="mx-auto text-primary" />
      <p className="mt-1 font-display text-lg text-white">{value}</p>
      <p className="text-[9px] tracking-[0.25em] text-white/50">{label.toUpperCase()}</p>
    </div>
  );
}
