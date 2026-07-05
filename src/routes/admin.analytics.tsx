import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/admin/StatCard";
import { useDashboardSummary, useWorkoutTrend, useAttendanceTrend, useWeeklyPower, useLeaderboard } from "@/hooks/useElite";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Dumbbell, TrendingUp, Users, Activity, Zap, Target } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({ component: AnalyticsPage });

const tt = { contentStyle: { background: "rgba(20,10,10,0.9)", border: "1px solid rgba(225,6,0,0.3)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "#fff" } };

function AnalyticsPage() {
  const { data: s } = useDashboardSummary();
  const { data: volume = [] } = useWorkoutTrend(30);
  const { data: att = [] } = useAttendanceTrend(9);
  const { data: power = [] } = useWeeklyPower(9);
  const { data: board = [] } = useLeaderboard("overall");

  const radar = board.slice(0, 6).map((r) => ({ athlete: r.full_name.split(" ")[0], power: Math.round((r.power_score / Math.max(1, ...board.map((b) => b.power_score))) * 100) }));

  return (
    <AdminShell title="Analytics" subtitle="Live intelligence across the Elite X quest">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard index={0} label="Total Push-ups" value={s?.total_pushups ?? 0} icon={Dumbbell} />
        <StatCard index={1} label="Total Pull-ups" value={s?.total_pullups ?? 0} icon={TrendingUp} />
        <StatCard index={2} label="Total Chin-ups" value={s?.total_chinups ?? 0} icon={TrendingUp} />
        <StatCard index={3} label="Total Sessions" value={s?.total_sessions ?? 0} icon={Activity} />
        <StatCard index={4} label="Active Athletes" value={s?.total_athletes ?? 0} icon={Users} />
        <StatCard index={5} label="Avg Power" value={s?.average_power ?? 0} icon={Zap} accent />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <GlassCard>
          <h3 className="font-display text-lg mb-4">30-day Volume</h3>
          <div className="h-72"><ResponsiveContainer><AreaChart data={volume}>
            <defs><linearGradient id="a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e10600" stopOpacity={0.5} /><stop offset="100%" stopColor="#e10600" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} /><YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} /><Tooltip {...tt} />
            <Area type="monotone" dataKey="pushups" stroke="#e10600" fill="url(#a1)" strokeWidth={2} />
          </AreaChart></ResponsiveContainer></div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg mb-4">Weekly Attendance</h3>
          <div className="h-72"><ResponsiveContainer><BarChart data={att}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} /><YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} /><Tooltip {...tt} />
            <Bar dataKey="present" stackId="a" fill="#e10600" radius={[4,4,0,0]} />
            <Bar dataKey="absent" stackId="a" fill="#3a1010" radius={[4,4,0,0]} />
          </BarChart></ResponsiveContainer></div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg mb-4">Weekly Power</h3>
          <div className="h-72"><ResponsiveContainer><LineChart data={power}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} /><YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} /><Tooltip {...tt} />
            <Line type="monotone" dataKey="power" stroke="#e10600" strokeWidth={3} dot={{ fill: "#e10600" }} />
          </LineChart></ResponsiveContainer></div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg mb-4"><Target className="inline h-4 w-4 mr-1 text-primary" /> Top 6 Power Profile</h3>
          <div className="h-72"><ResponsiveContainer><RadarChart data={radar}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" /><PolarAngleAxis dataKey="athlete" stroke="rgba(255,255,255,0.5)" fontSize={11} /><Tooltip {...tt} />
            <Radar dataKey="power" stroke="#e10600" fill="#e10600" fillOpacity={0.4} />
          </RadarChart></ResponsiveContainer></div>
        </GlassCard>
      </div>
    </AdminShell>
  );
}
