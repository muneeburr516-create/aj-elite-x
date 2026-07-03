import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activityFeed } from "@/data/adminMock";
import { Dumbbell, Ruler, Image as ImageIcon, User, Trophy, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/admin/activity")({
  component: ActivityPage,
});

const iconMap = { workout: Dumbbell, measurement: Ruler, photo: ImageIcon, athlete: User, leaderboard: Trophy };

function ActivityPage() {
  const [type, setType] = useState<"all" | "workout" | "measurement" | "photo" | "athlete" | "leaderboard">("all");
  const [q, setQ] = useState("");
  const feed = useMemo(() => activityFeed.filter((a) =>
    (type === "all" || a.type === type) && (a.actor + a.message).toLowerCase().includes(q.toLowerCase())
  ), [type, q]);

  return (
    <AdminShell title="Activity Logs" subtitle="Every change across the Elite X system">
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
            <TabsList className="glass border border-white/10 bg-transparent flex-wrap h-auto">
              {(["all", "workout", "measurement", "photo", "athlete", "leaderboard"] as const).map((t) => (
                <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-white capitalize">{t}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity..." className="pl-9 bg-white/5 border-white/10" />
          </div>
        </div>

        <ol className="relative border-l border-white/10 ml-3 space-y-4">
          {feed.map((a) => {
            const Icon = iconMap[a.type];
            return (
              <li key={a.id} className="ml-6">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 border border-primary/40">
                  <Icon className="h-3 w-3 text-primary" />
                </span>
                <div className="glass rounded-xl p-3 border border-white/10">
                  <div className="text-sm">{a.message}</div>
                  <div className="text-[11px] text-white/40 mt-1">{a.actor} · {a.time}</div>
                </div>
              </li>
            );
          })}
        </ol>
        {feed.length === 0 && <div className="text-center py-12 text-white/40 text-sm">No activity matches your filter.</div>}
      </GlassCard>
    </AdminShell>
  );
}
