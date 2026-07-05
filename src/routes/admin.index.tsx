import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { GlassCard } from "@/components/common/GlassCard";
import { Users, CalendarClock, Crown, TrendingUp, Timer, Activity as ActivityIcon, Dumbbell, Zap, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useDashboardSummary, useActivityLogs, useWorkoutTrend, useAttendanceTrend, useWeeklyPower } from "@/hooks/useElite";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LineChart, Line, Legend } from "recharts";

export const Route = createFileRoute("/admin/")({ component: DashboardPage });

const chartTooltip = {
  contentStyle: { background: "rgba(20,10,10,0.9)", border: "1px solid rgba(225,6,0,0.3)", borderRadius: 12, fontSize: 12 },
  labelStyle: { color: "#fff", fontWeight: 600 },
};

function DashboardPage() {
  const { data: s } = useDashboardSummary();
  const leaderFirst = (s?.current_leader ?? "—").split(" ")[0];
  return (
    <AdminShell title="Dashboard" subtitle="Real-time view of the Elite X quest">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard index={0} label="Challenge Day" value={`${s?.current_day ?? 0}/${s?.challenge_duration ?? 90}`} icon={CalendarClock} hint={`${s?.days_remaining ?? 0} days left`} accent />
        <StatCard index={1} label="Days Remaining" value={`${s?.days_remaining ?? 0}d`} icon={Timer} hint="Until champion crowned" />
        <StatCard index={2} label="Total Athletes" value={s?.total_athletes ?? 0} icon={Users} hint="Active roster" />
        <StatCard index={3} label="Attendance Today" value={s?.attendance_today ?? 0} icon={CheckCircle2} hint="Marked present" />
        <StatCard index={4} label="Workouts Today" value={s?.workouts_today ?? 0} icon={Clock} hint="Logged sessions" />
        <StatCard index={5} label="Pending Today" value={s?.pending_today ?? 0} icon={AlertCircle} hint="Not yet logged" />
        <StatCard index={6} label="Current Leader" value={<span className="text-lg">{leaderFirst}</span>} icon={Crown} hint="By power score" accent />
        <StatCard index={7} label="Highest Push-ups Today" value={s?.highest_pushups_today ?? 0} icon={Dumbbell} />
        <StatCard index={8} label="Highest Pull-ups Today" value={s?.highest_pullups_today ?? 0} icon={TrendingUp} />
        <StatCard index={9} label="Highest Chin-ups Today" value={s?.highest_chinups_today ?? 0} icon={TrendingUp} />
        <StatCard index={10} label="Avg Attendance" value={`${s?.average_attendance ?? 0}%`} icon={ActivityIcon} />
        <StatCard index={11} label="Avg Power" value={s?.average_power ?? 0} icon={Zap} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <GlassCard className="lg:col-span-2">
          <div className="text-[10px] tracking-[0.3em] text-primary">WORKOUT VOLUME</div>
          <h3 className="font-display text-lg mt-1 mb-4">Last 14 Days</h3>
          <div className="h-64"><WorkoutTrendChart /></div>
        </GlassCard>

        <GlassCard>
          <div className="text-[10px] tracking-[0.3em] text-primary">ATTENDANCE</div>
          <h3 className="font-display text-lg mt-1 mb-4">Weekly split</h3>
          <div className="h-64"><AttendanceChart /></div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="text-[10px] tracking-[0.3em] text-primary">WEEKLY POWER</div>
          <h3 className="font-display text-lg mt-1 mb-4">Aggregate progression</h3>
          <div className="h-64"><WeeklyPowerChart /></div>
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

function WorkoutTrendChart() {
  const { data = [] } = useWorkoutTrend(14);
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
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
  );
}

function AttendanceChart() {
  const { data = [] } = useAttendanceTrend(9);
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
        <Tooltip {...chartTooltip} />
        <Bar dataKey="present" stackId="a" fill="#e10600" radius={[4, 4, 0, 0]} />
        <Bar dataKey="absent" stackId="a" fill="#3a1010" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function WeeklyPowerChart() {
  const { data = [] } = useWeeklyPower(9);
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
        <Tooltip {...chartTooltip} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="power" stroke="#e10600" strokeWidth={3} dot={{ fill: "#e10600" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ActivityList() {
  const { data: feed = [] } = useActivityLogs(8);
  if (feed.length === 0) return <div className="text-xs text-white/40 py-4">No activity yet.</div>;
  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {feed.map((a) => (
        <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
            {(a.entity_type ?? a.action).slice(0, 2).toUpperCase()}
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
