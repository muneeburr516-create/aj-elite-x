import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { GlassCard } from "@/components/common/GlassCard";
import {
  Users, CalendarClock, ClipboardList, UserCheck, Crown, TrendingUp, Timer, Activity as ActivityIcon,
  Dumbbell, ArrowUp, ArrowDown,
} from "lucide-react";
import { workoutTrend, attendanceTrend, weeklySummary } from "@/data/adminMock";
import { useDashboardSummary, useActivityLogs, useSettings } from "@/hooks/useElite";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, LineChart, Line, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const chartTooltip = {
  contentStyle: {
    background: "rgba(20,10,10,0.9)",
    border: "1px solid rgba(225,6,0,0.3)",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: "#fff", fontWeight: 600 },
};

function DashboardPage() {
  const { data: s } = useDashboardSummary();
  const { data: settings } = useSettings();
  const currentDay = settings?.current_day ?? 1;
  const duration = settings?.challenge_duration ?? 90;
  const daysRemaining = Math.max(0, duration - currentDay);
  const leaderFirst = (s?.current_leader ?? "—").split(" ")[0];
  return (
    <AdminShell title="Dashboard" subtitle="Real-time view of the Elite X quest">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard index={0} label="Total Athletes" value={s?.total_athletes ?? 0} icon={Users} hint="Active roster" accent />
        <StatCard index={1} label="Challenge Day" value={`${currentDay}/${duration}`} icon={CalendarClock} hint={`${daysRemaining} days remaining`} />
        <StatCard index={2} label="Current Leader" value={<span className="text-xl">{leaderFirst}</span>} icon={Crown} hint="By power score" />
        <StatCard index={3} label="Highest Push-ups" value={s?.highest_pushups ?? 0} icon={Dumbbell} hint="Best session" />
        <StatCard index={4} label="Highest Pull-ups" value={s?.highest_pullups ?? 0} icon={TrendingUp} hint="Best session" />
        <StatCard index={5} label="Highest Chin-ups" value={s?.highest_chinups ?? 0} icon={TrendingUp} hint="Best session" />
        <StatCard index={6} label="Avg Attendance" value={`${s?.average_attendance ?? 0}%`} icon={ActivityIcon} hint="Across quest" />
        <StatCard index={7} label="Countdown" value={`${daysRemaining}d`} icon={Timer} hint="Until champion crowned" accent />
      </div>


      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] text-primary">WORKOUT TRENDS</div>
              <h3 className="font-display text-lg mt-1">Last 14 Days Volume</h3>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={workoutTrend}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e10600" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#e10600" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="pushups" stroke="#e10600" strokeWidth={2} fill="url(#gp)" />
                <Area type="monotone" dataKey="pullups" stroke="#ff6b6b" strokeWidth={2} fillOpacity={0} />
                <Area type="monotone" dataKey="chinups" stroke="#ffa8a8" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-[10px] tracking-[0.3em] text-primary">ATTENDANCE</div>
          <h3 className="font-display text-lg mt-1 mb-4">Weekly split</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={attendanceTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="present" stackId="a" fill="#e10600" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" stackId="a" fill="#3a1010" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="text-[10px] tracking-[0.3em] text-primary">WEEKLY POWER SCORE</div>
          <h3 className="font-display text-lg mt-1 mb-4">Aggregate progression</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={weeklySummary}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="power" stroke="#e10600" strokeWidth={3} dot={{ fill: "#e10600" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-[10px] tracking-[0.3em] text-primary">RECENT ACTIVITY</div>
          <h3 className="font-display text-lg mt-1 mb-4">Latest updates</h3>
          <ActivityList />
        </GlassCard>
      </div>
    </AdminShell>
  );
}

function ActivityList() {
  const { data: feed = [] } = useActivityLogs();
  if (feed.length === 0) return <div className="text-xs text-white/40 py-4">No activity yet.</div>;
  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {feed.slice(0, 8).map((a) => (
        <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
            {a.action.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm truncate">{a.description ?? a.action}</div>
            <div className="text-[10px] text-white/40 mt-0.5">{a.admin_email ?? "system"} · {new Date(a.created_at).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
