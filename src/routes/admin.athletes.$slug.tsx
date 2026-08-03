import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Flame, CalendarCheck, Activity as ActivityIcon, Loader2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useAthlete, useProfileSummary, useWorkouts, useMeasurements, useGallery, useAthleteWeekly, useAthleteStreaks } from "@/hooks/useElite";
import { measurementDiffs, bestSet, highestDaily } from "@/lib/analytics";
import { toast } from "sonner";
import { useAthleteProgress, useXpHistory, useAdvancePhase } from "@/hooks/useXp";
import { XpLevelCard } from "@/components/xp/XpLevelCard";
import { PhaseProgressCard } from "@/components/xp/PhaseProgressCard";
import { XpHistoryPanel } from "@/components/xp/XpHistoryPanel";
import { initialsFor } from "@/lib/athlete-adapter";

export const Route = createFileRoute("/admin/athletes/$slug")({
  component: AthleteProfileAdmin,
  notFoundComponent: () => <AdminShell title="Not found"><GlassCard>Athlete not found.</GlassCard></AdminShell>,
});

function AthleteProfileAdmin() {
  const { slug } = Route.useParams();
  const { data: athlete, isLoading } = useAthlete(slug);
  const { data: summary } = useProfileSummary(slug);
  const { data: workouts = [] } = useWorkouts(athlete?.id);
  const { data: measurements = [] } = useMeasurements(athlete?.id);
  const { data: gallery = [] } = useGallery(athlete?.id);
  const { data: weekly = [] } = useAthleteWeekly(athlete?.id);
  const { data: streaks } = useAthleteStreaks(athlete?.id);
  const { data: progress } = useAthleteProgress(athlete?.id);
  const { data: xpHistory = [] } = useXpHistory(athlete?.id);
  const advance = useAdvancePhase();

  if (isLoading) return <AdminShell title="Loading…"><div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AdminShell>;
  if (!athlete) throw notFound();

  const diffs = measurementDiffs(measurements);
  const bestPU = bestSet(workouts, "pushup");
  const bestPL = bestSet(workouts, "pullup");
  const bestCU = bestSet(workouts, "chinup");
  const highDaily = highestDaily(workouts);

  return (
    <AdminShell title={athlete.full_name} subtitle={`Rank #${summary?.current_rank ?? "—"} · ${athlete.trainer ?? "—"}`}>
      <div className="mb-4">
        <Button asChild variant="ghost" className="text-white/60"><Link to="/admin/athletes"><ArrowLeft className="h-4 w-4 mr-2" /> Back to roster</Link></Button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <GlassCard className="p-6">
          <div className="h-32 w-32 mx-auto rounded-2xl bg-gradient-to-br from-primary to-red-900 flex items-center justify-center text-4xl font-display font-bold glow-red overflow-hidden">
            {athlete.photo_url ? (
              <img src={athlete.photo_url} alt={athlete.full_name} className="h-full w-full object-cover" />
            ) : initialsFor(athlete.full_name)}
          </div>
          <div className="text-center mt-4">
            <h2 className="font-display text-xl font-bold">{athlete.full_name}</h2>
            <Badge className="mt-2 bg-primary/20 text-primary border border-primary/40">Rank #{summary?.current_rank ?? "—"}</Badge>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            {[
              ["Age", athlete.age ? `${athlete.age} yrs` : "—"],
              ["Height", athlete.height ? `${athlete.height} cm` : "—"],
              ["Weight", athlete.weight ? `${athlete.weight} kg` : "—"],
              ["Trainer", athlete.trainer ?? "—"],
              ["Attendance", `${summary?.attendance_pct ?? 0}%`],
              ["Current Streak", `${streaks?.current ?? 0}d`],
              ["Longest Streak", `${streaks?.longest ?? 0}d`],
              ["Power Score", String(summary?.power_score ?? 0)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/5 pb-1.5">
                <dt className="text-white/50">{k}</dt><dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>

        <div>
          <Tabs defaultValue="overview">
            <TabsList className="glass border border-white/10 bg-transparent flex-wrap h-auto">
              {["overview", "workouts", "measurements", "gallery", "analytics", "progression"].map((t) => (
                <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-white capitalize">{t}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <GlassCard>
                <h3 className="font-display text-lg mb-3">Bio</h3>
                <p className="text-sm text-white/70 leading-relaxed">{athlete.short_bio ?? "No bio yet."}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {[
                    { icon: Trophy, label: "Best Push", val: bestPU },
                    { icon: Trophy, label: "Best Pull", val: bestPL },
                    { icon: Trophy, label: "Best Chin", val: bestCU },
                    { icon: ActivityIcon, label: "Highest Daily", val: highDaily },
                    { icon: Flame, label: "Streak", val: `${streaks?.current ?? 0}d` },
                    { icon: Flame, label: "Longest", val: `${streaks?.longest ?? 0}d` },
                    { icon: CalendarCheck, label: "Attend", val: `${summary?.attendance_pct ?? 0}%` },
                    { icon: ActivityIcon, label: "Power", val: summary?.power_score ?? 0 },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3 bg-white/5 border border-white/10">
                      <s.icon className="h-4 w-4 text-primary mb-2" />
                      <div className="text-[10px] tracking-widest text-white/50">{s.label.toUpperCase()}</div>
                      <div className="font-display text-xl">{s.val}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="workouts" className="mt-4">
              <GlassCard>
                <h3 className="font-display text-lg mb-3">Sessions ({workouts.length})</h3>
                <div className="overflow-x-auto rounded-lg border border-white/10 max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-white/50 uppercase bg-white/5 sticky top-0">
                      <tr><th className="text-left p-2">Day</th><th className="text-left p-2">Date</th><th className="text-left p-2">Attendance</th><th className="text-left p-2">Push</th><th className="text-left p-2">Pull</th><th className="text-left p-2">Chin</th></tr>
                    </thead>
                    <tbody>
                      {workouts.map((d) => (
                        <tr key={d.id} className="border-t border-white/5">
                          <td className="p-2">{d.challenge_day}</td>
                          <td className="p-2 text-white/60">{d.workout_date}</td>
                          <td className="p-2"><Badge variant="outline" className={d.attendance === "REST" ? "border-amber-500/30 text-amber-300" : d.attendance === "ABSENT" ? "border-red-500/30 text-red-300" : "border-primary/30 text-primary"}>{d.attendance}</Badge></td>
                          <td className="p-2 font-mono">{d.pushup_set_1}·{d.pushup_set_2}·{d.pushup_set_3}</td>
                          <td className="p-2 font-mono">{d.pullup_set_1}·{d.pullup_set_2}·{d.pullup_set_3}</td>
                          <td className="p-2 font-mono">{d.chinup_set_1}·{d.chinup_set_2}·{d.chinup_set_3}</td>
                        </tr>
                      ))}
                      {workouts.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-white/40">No sessions yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="measurements" className="mt-4">
              <GlassCard>
                <h3 className="font-display text-lg mb-3">Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {diffs.map((m) => (
                    <div key={m.label} className="rounded-xl p-4 bg-white/5 border border-white/10">
                      <div className="text-[10px] tracking-widest text-white/50">{m.label.toUpperCase()}</div>
                      <div className="font-display text-2xl mt-1">{m.value != null ? `${m.value}${m.unit}` : "—"}</div>
                      {m.delta != null && <div className={`text-xs mt-1 ${m.delta < 0 ? "text-emerald-400" : "text-primary"}`}>{m.delta > 0 ? "+" : ""}{m.delta}{m.unit}</div>}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              <GlassCard>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gallery.map((g) => (
                    <div key={g.id} className="aspect-[3/4] rounded-xl border border-white/10 relative overflow-hidden">
                      <img src={g.image_url} loading="lazy" alt={g.caption ?? ""} className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute bottom-0 p-3 bg-gradient-to-t from-black/80 w-full">
                        <div className="text-[10px] tracking-widest text-primary uppercase">{g.image_type}</div>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && <div className="col-span-full text-white/40 text-sm text-center py-8">No photos yet.</div>}
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <GlassCard>
                <h3 className="font-display text-lg mb-3">Weekly Power Progression</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <LineChart data={weekly}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "rgba(20,10,10,0.9)", border: "1px solid rgba(225,6,0,0.3)", borderRadius: 12 }} />
                      <Line type="monotone" dataKey="power" stroke="#e10600" strokeWidth={3} dot={{ fill: "#e10600" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </TabsContent>
            <TabsContent value="progression" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <XpLevelCard progress={progress} />
                <PhaseProgressCard
                  progress={progress}
                  athleteName={athlete.full_name}
                  advancing={advance.isPending}
                  onAdvance={async () => {
                    try {
                      const res = await advance.mutateAsync(athlete.id);
                      if (res.advanced) toast.success(`Moved to Phase ${res.phase_number}`);
                      else toast.error(res.reason ?? "Could not advance");
                    } catch (e: any) { toast.error(e.message ?? "Could not advance"); }
                  }}
                />
              </div>
              <div className="mt-4"><XpHistoryPanel rows={xpHistory} /></div>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </AdminShell>
  );
}
