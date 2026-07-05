import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLeaderboard, type LeaderboardScope } from "@/hooks/useElite";
import type { LeaderboardRow } from "@/lib/database.types";
import { initialsFor } from "@/lib/athlete-adapter";

export const Route = createFileRoute("/admin/leaderboards")({ component: LeaderboardsPage });

type Cat = "power" | "pushups" | "pullups" | "chinups" | "attendance";
const cats: { key: Cat; label: string }[] = [
  { key: "power", label: "Power Score" },
  { key: "pushups", label: "Push-ups" },
  { key: "pullups", label: "Pull-ups" },
  { key: "chinups", label: "Chin-ups" },
  { key: "attendance", label: "Attendance" },
];

function scoreOf(r: LeaderboardRow, c: Cat) {
  switch (c) {
    case "power": return r.power_score;
    case "pushups": return r.total_pushups ?? r.pushups ?? 0;
    case "pullups": return r.total_pullups ?? r.pullups ?? 0;
    case "chinups": return r.total_chinups ?? r.chinups ?? 0;
    case "attendance": return r.attendance_pct ?? 0;
  }
}

function LeaderboardsPage() {
  const [range, setRange] = useState<LeaderboardScope>("overall");
  const [cat, setCat] = useState<Cat>("power");
  const { data = [], isLoading } = useLeaderboard(range);

  const rows = useMemo(() => [...data].sort((a, b) => scoreOf(b, cat) - scoreOf(a, cat)), [data, cat]);

  return (
    <AdminShell title="Leaderboards" subtitle="Auto-calculated live — updates as workouts are logged">
      <GlassCard>
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <Tabs value={range} onValueChange={(v) => setRange(v as LeaderboardScope)}>
            <TabsList className="glass border border-white/10 bg-transparent">
              {(["daily", "weekly", "monthly", "overall"] as const).map((r) => (
                <TabsTrigger key={r} value={r} className="data-[state=active]:bg-primary data-[state=active]:text-white capitalize">{r}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Tabs value={cat} onValueChange={(v) => setCat(v as Cat)}>
            <TabsList className="glass border border-white/10 bg-transparent flex-wrap h-auto">
              {cats.map((c) => (
                <TabsTrigger key={c.key} value={c.key} className="data-[state=active]:bg-primary data-[state=active]:text-white">{c.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="rounded-xl border border-white/10 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Push-ups</TableHead>
                  <TableHead>Pull-ups</TableHead>
                  <TableHead>Chin-ups</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Power Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.athlete_id} className={`border-white/5 ${i === 0 ? "bg-primary/5" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {i === 0 && <Crown className="h-4 w-4 text-primary" />}
                        <span className="font-display text-lg">{i + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-red-900 flex items-center justify-center text-[10px] font-bold">{initialsFor(r.full_name)}</div>
                        <div className="font-medium">{r.full_name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{r.total_pushups ?? r.pushups ?? 0}</TableCell>
                    <TableCell className="font-mono">{r.total_pullups ?? r.pullups ?? 0}</TableCell>
                    <TableCell className="font-mono">{r.total_chinups ?? r.chinups ?? 0}</TableCell>
                    <TableCell className="font-mono">{r.attendance_pct ?? 0}%</TableCell>
                    <TableCell><Badge className="bg-primary/20 text-primary border border-primary/40 font-mono">{r.power_score}</Badge></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-12 text-white/40">No data yet for this period.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </AdminShell>
  );
}
