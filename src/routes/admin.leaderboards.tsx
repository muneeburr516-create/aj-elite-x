import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getLeaderboard, type LeaderboardCategory } from "@/data/elite";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/leaderboards")({
  component: LeaderboardsPage,
});

const cats: { key: LeaderboardCategory; label: string }[] = [
  { key: "power", label: "Power Score" },
  { key: "pushups", label: "Push-ups" },
  { key: "pullups", label: "Pull-ups" },
  { key: "chinups", label: "Chin-ups" },
  { key: "attendance", label: "Attendance" },
];

function LeaderboardsPage() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "overall">("overall");
  const [cat, setCat] = useState<LeaderboardCategory>("power");
  const rows = getLeaderboard(cat);

  return (
    <AdminShell title="Leaderboards" subtitle="Auto-calculated — recalculates as workout data updates">
      <GlassCard>
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <TabsList className="glass border border-white/10 bg-transparent">
              {(["daily", "weekly", "monthly", "overall"] as const).map((r) => (
                <TabsTrigger key={r} value={r} className="data-[state=active]:bg-primary data-[state=active]:text-white capitalize">{r}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Tabs value={cat} onValueChange={(v) => setCat(v as LeaderboardCategory)}>
            <TabsList className="glass border border-white/10 bg-transparent flex-wrap h-auto">
              {cats.map((c) => (
                <TabsTrigger key={c.key} value={c.key} className="data-[state=active]:bg-primary data-[state=active]:text-white">{c.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

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
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.slug} className={`border-white/5 ${i === 0 ? "bg-primary/5" : ""}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {i === 0 && <Crown className="h-4 w-4 text-primary" />}
                      <span className="font-display text-lg">{i + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center text-[10px] font-bold`}>{r.initials}</div>
                      <div><div className="font-medium">{r.name}</div><div className="text-[10px] text-white/40">{r.trainer}</div></div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{280 - i * 8}</TableCell>
                  <TableCell className="font-mono">{48 - i * 2}</TableCell>
                  <TableCell className="font-mono">{42 - i * 2}</TableCell>
                  <TableCell className="font-mono">{r.attendance}%</TableCell>
                  <TableCell><Badge className="bg-primary/20 text-primary border border-primary/40 font-mono">{r.powerScore}</Badge></TableCell>
                  <TableCell>
                    {r.trend === "up" ? <TrendingUp className="h-4 w-4 text-emerald-400" /> :
                      r.trend === "down" ? <TrendingDown className="h-4 w-4 text-red-400" /> :
                      <Minus className="h-4 w-4 text-white/40" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </AdminShell>
  );
}
