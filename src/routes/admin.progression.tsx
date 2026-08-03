import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/admin/StatCard";
import { XpLevelCard } from "@/components/xp/XpLevelCard";
import { PhaseProgressCard } from "@/components/xp/PhaseProgressCard";
import { XpHistoryPanel } from "@/components/xp/XpHistoryPanel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Zap, Layers, TrendingUp, Trophy, Search, RefreshCw, Loader2 } from "lucide-react";
import {
  useAllProgress, useAthleteProgress, useXpHistory, useAdvancePhase,
  useRecalculateXp, useCurrentSeason, useWorkoutPhases,
} from "@/hooks/useXp";
import { useAthletes } from "@/hooks/useElite";
import { formatXp } from "@/lib/xp";
import { initialsFor } from "@/lib/athlete-adapter";

export const Route = createFileRoute("/admin/progression")({
  component: ProgressionPage,
  head: () => ({
    meta: [
      { title: "XP & Progression — Elite X Admin" },
      { name: "description", content: "Track XP, levels, workout phases and progression for every Elite X athlete." },
    ],
  }),
});

const PAGE_SIZE = 8;

function ProgressionPage() {
  const { data: athletes = [] } = useAthletes();
  const { data: season } = useCurrentSeason();
  const { data: phases = [] } = useWorkoutPhases();
  const { data: rows = [], isLoading } = useAllProgress();

  const [query, setQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [sort, setSort] = useState<"xp" | "level" | "days" | "name">("xp");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>("");

  const activeId = selected || athletes[0]?.id;
  const activeAthlete = athletes.find((a) => a.id === activeId);
  const { data: progress } = useAthleteProgress(activeId);
  const { data: history = [] } = useXpHistory(activeId);
  const advance = useAdvancePhase();
  const recalc = useRecalculateXp();

  const filtered = useMemo(() => {
    let list = rows.filter((r) => r.athletes.full_name.toLowerCase().includes(query.trim().toLowerCase()));
    if (phaseFilter !== "all") list = list.filter((r) => String(r.workout_phases?.phase_number ?? 1) === phaseFilter);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.athletes.full_name.localeCompare(b.athletes.full_name);
      if (sort === "level") return b.current_level - a.current_level;
      if (sort === "days") return b.workout_days_completed - a.workout_days_completed;
      return b.total_xp - a.total_xp;
    });
    return list;
  }, [rows, query, phaseFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);

  const totalXp = rows.reduce((s, r) => s + Number(r.total_xp || 0), 0);
  const avgLevel = rows.length ? (rows.reduce((s, r) => s + r.current_level, 0) / rows.length).toFixed(1) : "0";
  const readyCount = rows.filter((r) => r.workout_phases && r.workout_days_completed >= r.workout_phases.end_day).length;
  const topXp = filtered[0];

  return (
    <AdminShell
      title="XP & Progression"
      subtitle={`${season?.name ?? "Season 1"} · ${phases.length} phase templates`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <StatCard label="Total XP Earned" value={formatXp(totalXp)} icon={Zap} accent index={0} />
        <StatCard label="Average Level" value={avgLevel} icon={TrendingUp} index={1} />
        <StatCard label="Awaiting Phase Switch" value={readyCount} hint="Needs admin confirmation" icon={Layers} index={2} />
        <StatCard label="XP Leader" value={topXp?.athletes.full_name.split(" ")[0] ?? "—"} hint={topXp ? `${formatXp(topXp.total_xp)} XP` : undefined} icon={Trophy} index={3} />
      </div>

      <div className="grid xl:grid-cols-[1fr_400px] gap-4">
        <GlassCard>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div className="md:col-span-1">
              <Label>Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Athlete name…" className="pl-9 bg-white/5 border-white/10" />
              </div>
            </div>
            <div>
              <Label>Phase</Label>
              <Select value={phaseFilter} onValueChange={(v) => { setPhaseFilter(v); setPage(1); }}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All phases</SelectItem>
                  {phases.map((p) => <SelectItem key={p.id} value={String(p.phase_number)}>Phase {p.phase_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort by</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xp">Total XP</SelectItem>
                  <SelectItem value="level">Level</SelectItem>
                  <SelectItem value="days">Days completed</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="text-xs text-white/50 uppercase bg-white/5">
                <tr>
                  <th className="text-left p-3">Athlete</th>
                  <th className="text-left p-3">Level</th>
                  <th className="text-left p-3">Total XP</th>
                  <th className="text-left p-3">Days</th>
                  <th className="text-left p-3">Phase</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></td></tr>}
                {!isLoading && pageRows.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-xs text-white/40">No progression records found.</td></tr>
                )}
                {pageRows.map((r) => {
                  const ready = r.workout_phases && r.workout_days_completed >= r.workout_phases.end_day;
                  return (
                    <tr key={r.athlete_id} className="border-t border-white/5 hover:bg-white/5 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-red-900 flex items-center justify-center text-xs font-bold overflow-hidden">
                            {r.athletes.photo_url
                              ? <img src={r.athletes.photo_url} alt={r.athletes.full_name} className="h-full w-full object-cover" />
                              : initialsFor(r.athletes.full_name)}
                          </div>
                          <Link to="/admin/athletes/$slug" params={{ slug: r.athletes.slug }} className="font-medium hover:text-primary">
                            {r.athletes.full_name}
                          </Link>
                        </div>
                      </td>
                      <td className="p-3"><Badge className="bg-primary/20 text-primary border border-primary/40">LVL {r.current_level}</Badge></td>
                      <td className="p-3 font-display text-base text-gradient-red">{formatXp(r.total_xp)}</td>
                      <td className="p-3 text-white/70">{r.workout_days_completed}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white/70">Phase {r.workout_phases?.phase_number ?? 1}</span>
                          {ready && <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px]">READY</Badge>}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5" onClick={() => setSelected(r.athlete_id)}>
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-white/50">
            <span>{filtered.length} athlete(s)</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span>Page {Math.min(page, pages)} / {pages}</span>
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-lg">{activeAthlete?.full_name ?? "—"}</div>
            <Button
              size="sm" variant="outline" className="border-white/10 bg-white/5"
              disabled={!activeId || recalc.isPending}
              onClick={async () => {
                try { await recalc.mutateAsync(activeId!); toast.success("XP recalculated"); }
                catch (e: any) { toast.error(e.message ?? "Recalculation failed"); }
              }}
            >
              {recalc.isPending ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />} Recalculate
            </Button>
          </div>
          <XpLevelCard progress={progress} />
          <PhaseProgressCard
            progress={progress}
            athleteName={activeAthlete?.full_name}
            advancing={advance.isPending}
            onAdvance={async () => {
              if (!activeId) return;
              try {
                const res = await advance.mutateAsync(activeId);
                if (res.advanced) toast.success(`Moved to Phase ${res.phase_number}`);
                else toast.error(res.reason ?? "Could not advance");
              } catch (e: any) { toast.error(e.message ?? "Could not advance"); }
            }}
          />
          <XpHistoryPanel rows={history} />
        </div>
      </div>
    </AdminShell>
  );
}
