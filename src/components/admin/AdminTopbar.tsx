import { Bell, Search, CalendarDays, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/data/adminMock";
import { globalStats } from "@/data/elite";

export function AdminTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 pt-4 pb-3 -mx-6 px-6 backdrop-blur-xl bg-background/60 border-b border-white/5">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.35em] text-primary/80">
            <Flame className="h-3 w-3" /> DAY {globalStats.currentDay} / 90
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight text-gradient-red">
            {title}
          </h1>
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
              placeholder="Search athletes, sessions..."
              className="pl-9 h-10 w-56 md:w-72 bg-white/5 border-white/10 focus-visible:ring-primary/40"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative h-10 w-10 rounded-lg glass hover:border-primary/40 border border-white/10 flex items-center justify-center transition">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center glow-red">
                    {unread}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 glass-strong border-white/10 p-0">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-display tracking-widest text-sm">NOTIFICATIONS</span>
                <Badge variant="outline" className="border-primary/40 text-primary">{unread} new</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-white/5 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{n.title}</div>
                      {n.unread && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 glow-red" />}
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">{n.body}</div>
                    <div className="text-[10px] text-white/40 mt-1">{n.time} ago</div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
