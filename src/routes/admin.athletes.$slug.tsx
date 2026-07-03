import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { athletes, generateWorkoutLog, generateMeasurements, generateAnalytics, achievements, gallery } from "@/data/elite";
import { ArrowLeft, Trophy, Flame, CalendarCheck, Activity as ActivityIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/athletes/$slug")({
  loader: ({ params }) => {
    const a = athletes.find((x) => x.slug === params.slug);
    if (!a) throw notFound();
    return { athlete: a };
  },
  component: AthleteProfileAdmin,
  notFoundComponent: () => (
    <AdminShell title="Not found"><GlassCard>Athlete not found.</GlassCard></AdminShell>
  ),
});

function AthleteProfileAdmin() {
  const { athlete: a } = Route.useLoaderData();
  const seed = a.slug.charCodeAt(0);
  const log = generateWorkoutLog(seed);
  const measurements = generateMeasurements(seed);
  const analytics = generateAnalytics(seed);
  const [notes, setNotes] = useState("Consistent effort. Watch elbow angle on chin-up top position. Great mental focus this month.");

  return (
    <AdminShell title={a.name} subtitle={`Rank #${a.rank} · ${a.trainer}`}>
      <div className="mb-4">
        <Button asChild variant="ghost" className="text-white/60"><Link to="/admin/athletes"><ArrowLeft className="h-4 w-4 mr-2" /> Back to roster</Link></Button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <GlassCard className="p-6">
          <div className={`h-32 w-32 mx-auto rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-4xl font-display font-bold glow-red`}>{a.initials}</div>
          <div className="text-center mt-4">
            <h2 className="font-display text-xl font-bold">{a.name}</h2>
            <Badge className="mt-2 bg-primary/20 text-primary border border-primary/40">Rank #{a.rank}</Badge>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            {[
              ["Age", `${a.age} yrs`], ["Height", `${a.height} cm`], ["Weight", `${a.weight} kg`],
              ["Trainer", a.trainer], ["Attendance", `${a.attendance}%`], ["Streak", `${a.streak} days`],
              ["Power Score", a.powerScore.toString()],
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
              {["overview", "workouts", "measurements", "gallery", "achievements", "analytics", "notes"].map((t) => (
                <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-white capitalize">{t}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <GlassCard>
                <h3 className="font-display text-lg mb-3">Bio</h3>
                <p className="text-sm text-white/70 leading-relaxed">{a.bio}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {[
                    { icon: Trophy, label: "Rank", val: `#${a.rank}` },
                    { icon: Flame, label: "Streak", val: `${a.streak}d` },
                    { icon: CalendarCheck, label: "Attend", val: `${a.attendance}%` },
                    { icon: ActivityIcon, label: "Power", val: a.powerScore },
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
                <h3 className="font-display text-lg mb-3">Last 30 Sessions</h3>
                <div className="overflow-x-auto rounded-lg border border-white/10 max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-white/50 uppercase bg-white/5 sticky top-0">
                      <tr><th className="text-left p-2">Day</th><th className="text-left p-2">Date</th><th className="text-left p-2">Attendance</th><th className="text-left p-2">Push</th><th className="text-left p-2">Pull</th><th className="text-left p-2">Chin</th></tr>
                    </thead>
                    <tbody>
                      {log.map((d) => (
                        <tr key={d.day} className="border-t border-white/5">
                          <td className="p-2">{d.day}</td>
                          <td className="p-2 text-white/60">{d.date}</td>
                          <td className="p-2"><Badge variant="outline" className={d.attendance === "REST" ? "border-amber-500/30 text-amber-300" : "border-primary/30 text-primary"}>{d.attendance}</Badge></td>
                          <td className="p-2 font-mono">{d.pushups.join("·")}</td>
                          <td className="p-2 font-mono">{d.pullups.join("·")}</td>
                          <td className="p-2 font-mono">{d.chinups.join("·")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="measurements" className="mt-4">
              <GlassCard>
                <h3 className="font-display text-lg mb-3">Current Measurements</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {measurements.map((m) => (
                    <div key={m.label} className="rounded-xl p-4 bg-white/5 border border-white/10">
                      <div className="text-[10px] tracking-widest text-white/50">{m.label.toUpperCase()}</div>
                      <div className="font-display text-2xl mt-1">{m.value}</div>
                      <div className={`text-xs mt-1 ${m.change.startsWith("+") ? "text-primary" : "text-emerald-400"}`}>{m.change}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              <GlassCard>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gallery.map((g) => (
                    <div key={g.week} className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${a.color} border border-white/10 relative overflow-hidden group`}>
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition" />
                      <div className="absolute bottom-0 p-3">
                        <div className="text-[10px] tracking-widest text-primary">{g.week.toUpperCase()}</div>
                        <div className="font-display text-sm">{g.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="achievements" className="mt-4">
              <GlassCard>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievements.map((ach) => (
                    <div key={ach.title} className="flex items-center gap-3 rounded-xl p-3 bg-white/5 border border-white/10">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center"><Trophy className="h-5 w-5 text-primary" /></div>
                      <div><div className="font-medium">{ach.title}</div><div className="text-xs text-white/50">{ach.desc}</div></div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <GlassCard>
                <h3 className="font-display text-lg mb-3">Power Progression</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <LineChart data={analytics}>
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

            <TabsContent value="notes" className="mt-4">
              <GlassCard>
                <h3 className="font-display text-lg mb-3">Coach Notes</h3>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} className="bg-white/5 border-white/10" />
                <div className="mt-3 flex justify-end"><Button className="bg-primary hover:bg-primary/90" onClick={() => toast.success("Notes saved")}>Save notes</Button></div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminShell>
  );
}
