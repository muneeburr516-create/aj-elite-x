import { Bell, Search, CalendarDays, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "@tanstack/react-router";
import { useSettings, useActivityLogs, useAthletes } from "@/hooks/useElite";
import { useMemo, useState } from "react";

export function AdminTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const today = new Date(2026, 6, 1).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const { data: settings } = useSettings();
  const { data: activity = [] } = useActivityLogs(10);
  const { data: athletes = [] } = useAthletes();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const day = settings?.current_day ?? 0;
  const duration = settings?.challenge_duration ?? 90;

  const notifications = useMemo(() => {
    return activity.slice(0, 8).map((a) => ({
      id: a.id,
      title: prettyAction(a.action),
      body: a.description ?? a.action,
      time: relativeTime(a.created_at),
      unread: Date.now() - new Date(a.created_at).getTime() < 1000 * 60 * 60 * 6,
    }));
  }, [activity]);

  const unread = notifications.filter((n) => n.unread).length;

  const searchMatches = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.toLowerCase();
    return athletes.filter((a) => a.full_name.toLowerCase().includes(term) || a.slug.toLowerCase().includes(term)).slice(0, 5);
  }, [q, athletes]);

  return (
    <header className="sticky top-0 z-30 pt-4 pb-3 -mx-6 px-6 backdrop-blur-xl bg-background/60 border-b border-white/5">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.35em] text-primary/80">
            <Flame className="h-3 w-3" /> DAY {day} / {duration}
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight text-gradient-red">{title}</h1>
          {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-white/60 glass px-3 py-2 rounded-lg">
            <CalendarDays className="h-4 w-4 text-primary" />
            {today}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search athletes..."
              className="pl-9 h-10 w-56 md:w-72 bg-white/5 border-white/10 focus-visible:ring-primary/40"
            />
            {searchMatches.length > 0 && (
              <div className="absolute z-40 mt-2 left-0 right-0 glass-strong border border-white/10 rounded-xl overflow-hidden">
                {searchMatches.map((m) => (
                  <button key={m.id} onClick={() => { navigate({ to: "/admin/athletes/$slug", params: { slug: m.slug } }); setQ(""); }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-white/5 last:border-0">
                    <div className="font-medium">{m.full_name}</div>
                    <div className="text-[10px] text-white/40">{m.slug}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative h-10 w-10 rounded-lg glass hover:border-primary/40 border border-white/10 flex items-center justify-center transition">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center glow-red">{unread}</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 glass-strong border-white/10 p-0">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-display tracking-widest text-sm">NOTIFICATIONS</span>
                <Badge variant="outline" className="border-primary/40 text-primary">{unread} new</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 && <div className="p-6 text-center text-xs text-white/40">No recent activity</div>}
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-white/5 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{n.title}</div>
                      {n.unread && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 glow-red" />}
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">{n.body}</div>
                    <div className="text-[10px] text-white/40 mt-1">{n.time}</div>
                  </div>
                ))}
              </div>
              <Link to="/admin/activity" className="block text-center py-2 text-xs text-primary border-t border-white/10 hover:bg-white/5">View all activity →</Link>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}

function prettyAction(a: string) {
  const [tbl, op] = a.split(".");
  const opLabel = op === "insert" ? "Added" : op === "update" ? "Updated" : op === "delete" ? "Removed" : op;
  const tblLabel = tbl.replace(/_/g, " ").replace(/s$/, "");
  return `${tblLabel.charAt(0).toUpperCase() + tblLabel.slice(1)} ${opLabel}`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
