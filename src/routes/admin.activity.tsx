import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActivityLogs } from "@/hooks/useElite";
import { Dumbbell, Ruler, Image as ImageIcon, User, Settings as SettingsIcon, Search, Activity } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/admin/activity")({ component: ActivityPage });

const CATS = ["all", "athletes", "daily_workouts", "body_measurements", "gallery_images", "challenge_settings"] as const;
type Cat = typeof CATS[number];

const iconFor = (entity: string | null) => {
  switch (entity) {
    case "daily_workouts": return Dumbbell;
    case "body_measurements": return Ruler;
    case "gallery_images": return ImageIcon;
    case "athletes": return User;
    case "challenge_settings": return SettingsIcon;
    default: return Activity;
  }
};

function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActivityPage() {
  const [cat, setCat] = useState<Cat>("all");
  const [q, setQ] = useState("");
  const { data = [] } = useActivityLogs(200);

  const feed = useMemo(() => data.filter((a) =>
    (cat === "all" || a.entity_type === cat) &&
    ((a.description ?? "") + (a.admin_email ?? "") + (a.action ?? "")).toLowerCase().includes(q.toLowerCase())
  ), [data, cat, q]);

  return (
    <AdminShell title="Activity Logs" subtitle="Every change across the Elite X system">
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Tabs value={cat} onValueChange={(v) => setCat(v as Cat)}>
            <TabsList className="glass border border-white/10 bg-transparent flex-wrap h-auto">
              {CATS.map((t) => (
                <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-white capitalize">
                  {t.replace(/_/g, " ")}
                </TabsTrigger>
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
            const Icon = iconFor(a.entity_type);
            return (
              <li key={a.id} className="ml-6">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 border border-primary/40">
                  <Icon className="h-3 w-3 text-primary" />
                </span>
                <div className="glass rounded-xl p-3 border border-white/10">
                  <div className="text-sm">{a.description ?? a.action}</div>
                  <div className="text-[11px] text-white/40 mt-1">{a.admin_email ?? "system"} · {relTime(a.created_at)}</div>
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
