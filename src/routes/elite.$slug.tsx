import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Flame, Calendar, Dumbbell, Ruler, Image as ImageIcon, BarChart3, User, Loader2 } from "lucide-react";
import { AthleteAvatar } from "@/components/elite/AthleteCard";
import { GlassCard } from "@/components/common/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { useAthlete, useProfileSummary, useWorkouts, useMeasurements, useGallery, useAthleteWeekly, useAthleteStreaks } from "@/hooks/useElite";
import { summaryToDisplay, initialsFor } from "@/lib/athlete-adapter";
import { measurementDiffs, timelinePhases, bestSet } from "@/lib/analytics";

export const Route = createFileRoute("/elite/$slug")({
  component: AthleteProfile,
  notFoundComponent: () => (
    <div className="px-4 py-32 text-center">
      <h1 className="font-display text-3xl">Athlete not found</h1>
      <Link to="/elite" className="text-primary mt-4 inline-block">← Back to roster</Link>
    </div>
  ),
  errorComponent: ({ error }) => <div className="px-4 py-32 text-center text-white/70"><p>{error.message}</p></div>,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Elite X Profile` },
      { name: "description", content: `Elite X transformation profile — rank, stats, workouts, measurements and progress.` },
    ],
  }),
});

function AthleteProfile() {
  const { slug } = Route.useParams();
  const { data: athlete, isLoading } = useAthlete(slug);
  const { data: summary } = useProfileSummary(slug);
  const { data: workouts = [] } = useWorkouts(athlete?.id);
  const { data: measurements = [] } = useMeasurements(athlete?.id);
  const { data: gallery = [] } = useGallery(athlete?.id);
  const { data: weekly = [] } = useAthleteWeekly(athlete?.id);
  const { data: streaks } = useAthleteStreaks(athlete?.id);

  if (isLoading) return <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!athlete) throw notFound();

  const display = summary ? summaryToDisplay(summary) : {
    slug: athlete.slug, name: athlete.full_name, age: athlete.age ?? 0, weight: Number(athlete.weight ?? 0),
    height: Number(athlete.height ?? 0), trainer: athlete.trainer ?? "—", rank: 0, attendance: 0, streak: 0,
    powerScore: 0, color: "from-red-600 to-red-900", initials: initialsFor(athlete.full_name),
    bio: athlete.short_bio ?? "", challengeStarted: athlete.joined_at, photoUrl: athlete.photo_url ?? null,
  };
  const diffs = measurementDiffs(measurements);
  const phases = timelinePhases(gallery.map((g) => ({ uploaded_at: g.uploaded_at, image_url: g.image_url, caption: g.caption })));

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/elite" className="inline-flex items-center gap-2 text-white/60 hover:text-primary transition-colors text-sm mb-6">
          <ArrowLeft size={16} /> Back to Elite Members
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <GlassCard className="relative overflow-hidden p-8">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,rgba(225,6,0,0.6),transparent_60%)]" />
            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
              <AthleteAvatar athlete={display} size="xl" />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Trophy size={14} className="text-primary" />
                  <span className="font-display tracking-[0.35em] text-xs text-primary">RANK #{display.rank || "—"}</span>
                </div>
                <h1 className="mt-2 font-display uppercase text-4xl md:text-6xl font-bold text-gradient-red">{display.name}</h1>
                <p className="mt-3 max-w-xl text-white/60 text-sm md:text-base leading-relaxed">{display.bio}</p>

                <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                  {[
                    { l: "Age", v: display.age || "—" },
                    { l: "Weight", v: display.weight ? `${display.weight} kg` : "—" },
                    { l: "Height", v: display.height ? `${display.height} cm` : "—" },
                    { l: "Trainer", v: display.trainer },
                  ].map((s) => (
                    <div key={s.l} className="glass rounded-lg px-4 py-2">
                      <p className="text-[9px] tracking-[0.25em] text-white/50">{s.l.toUpperCase()}</p>
                      <p className="font-display text-white">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-1 gap-3 w-full md:w-52">
                <BannerStat icon={Trophy} label="Power" value={display.powerScore.toLocaleString()} />
                <BannerStat icon={Flame} label="Streak" value={`${streaks?.current ?? 0}d`} />
                <BannerStat icon={Calendar} label="Attendance" value={`${display.attendance}%`} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="mt-8">
          <Tabs defaultValue="overview">
            <TabsList className="glass-strong h-auto p-1 flex-wrap justify-start gap-1 bg-transparent">
              {[
                ["overview", "Overview", User],
                ["workout", "Workouts", Dumbbell],
                ["measure", "Measurements", Ruler],
                ["gallery", "Gallery", ImageIcon],
                ["analytics", "Analytics", BarChart3],
              ].map(([v, l, Icon]: any) => (
                <TabsTrigger key={v} value={v} className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 rounded-lg px-4 py-2 flex items-center gap-2">
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
                      ["Best Push-up Set", bestSet(workouts, "pushup")],
                      ["Best Pull-up Set", bestSet(workouts, "pullup")],
                      ["Best Chin-up Set", bestSet(workouts, "chinup")],
                      ["Longest Streak", `${streaks?.longest ?? 0} days`],
                      ["Current Streak", `${streaks?.current ?? 0} days`],
                      ["Attendance", `${display.attendance}%`],
                      ["Trainer", display.trainer],
                      ["Challenge Started", display.challengeStarted],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between border-b border-white/5 pb-2">
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
                      { l: "Attendance", v: display.attendance },
                      { l: "Consistency", v: streaks?.perfect ? 100 : Math.min(100, (streaks?.longest ?? 0) * 3) },
                      { l: "Volume", v: Math.min(100, Math.round((summary?.power_score ?? 0) / 100)) },
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
              <GlassCard>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-white/50 uppercase bg-white/5 sticky top-0">
                      <tr><th className="p-2 text-left">Day</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Attend</th><th className="p-2 text-left">Push</th><th className="p-2 text-left">Pull</th><th className="p-2 text-left">Chin</th></tr>
                    </thead>
                    <tbody>
                      {workouts.map((w) => (
                        <tr key={w.id} className="border-t border-white/5">
                          <td className="p-2">{w.challenge_day}</td>
                          <td className="p-2 text-white/60">{w.workout_date}</td>
                          <td className="p-2">{w.attendance}</td>
                          <td className="p-2 font-mono">{w.pushup_set_1}·{w.pushup_set_2}·{w.pushup_set_3}</td>
                          <td className="p-2 font-mono">{w.pullup_set_1}·{w.pullup_set_2}·{w.pullup_set_3}</td>
                          <td className="p-2 font-mono">{w.chinup_set_1}·{w.chinup_set_2}·{w.chinup_set_3}</td>
                        </tr>
                      ))}
                      {workouts.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-white/40">No sessions yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="measure" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {diffs.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                    <GlassCard glow>
                      <p className="text-[10px] tracking-[0.3em] text-white/50">{m.label.toUpperCase()}</p>
                      <p className="mt-2 font-display text-3xl text-white">{m.value != null ? `${m.value}${m.unit}` : "—"}</p>
                      {m.delta != null && <p className={`mt-1 text-xs ${m.delta < 0 ? "text-emerald-400" : "text-primary"}`}>{m.delta > 0 ? "+" : ""}{m.delta}{m.unit}</p>}
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {phases.map((g, i) => (
                  <motion.div key={g.phase} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                    <GlassCard className="p-0 overflow-hidden group">
                      <div className={`relative aspect-[3/4] bg-gradient-to-br ${display.color}`}>
                        {g.image ? <img src={g.image.image_url} loading="lazy" alt={g.phase} className="absolute inset-0 h-full w-full object-cover" /> : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-display text-6xl text-white/20">{display.initials}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="text-[10px] tracking-[0.3em] text-primary">{g.phase.toUpperCase()}</p>
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
                    <AreaChart data={weekly}>
                      <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e10600" stopOpacity={0.6} /><stop offset="100%" stopColor="#e10600" stopOpacity={0} /></linearGradient></defs>
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
                    <AreaChart data={weekly}>
                      <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff3030" stopOpacity={0.5} /><stop offset="100%" stopColor="#ff3030" stopOpacity={0} /></linearGradient></defs>
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
                    <BarChart data={weekly}>
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
