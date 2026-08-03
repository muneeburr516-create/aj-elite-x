import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Ruler,
  Images,
  Trophy,
  FileBarChart,
  Settings,
  FolderOpen,
  Activity,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/athletes", label: "Athletes", icon: Users },
  { to: "/admin/workouts", label: "Workout Tracker", icon: Dumbbell },
  { to: "/admin/progression", label: "XP & Progression", icon: Zap },
  { to: "/admin/measurements", label: "Measurements", icon: Ruler },
  { to: "/admin/gallery", label: "Transformation Gallery", icon: Images },
  { to: "/admin/leaderboards", label: "Leaderboards", icon: Trophy },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/settings", label: "Challenge Settings", icon: Settings },
  { to: "/admin/media", label: "Media Library", icon: FolderOpen },
  { to: "/admin/activity", label: "Activity Logs", icon: Activity },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col z-40 p-4">
      <div className="glass-strong rounded-2xl h-full flex flex-col p-4">
        <Link to="/admin" className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-white/10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-red-900 flex items-center justify-center glow-red">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-widest text-gradient-red leading-none">ELITE X</div>
            <div className="text-[10px] tracking-[0.25em] text-white/50 mt-1">ADMIN CONSOLE</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                  active
                    ? "bg-primary/15 text-white border border-primary/40 glow-red"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-white/50 group-hover:text-primary")} />
                <span className="font-medium tracking-wide">{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-xl p-3 border border-white/10 bg-white/5">
          <div className="text-[10px] tracking-[0.25em] text-white/50">LOGGED IN</div>
          <div className="mt-1 text-sm font-medium">Coach AJ</div>
          <div className="text-xs text-white/50">Owner · Head Trainer</div>
        </div>
      </div>
    </aside>
  );
}
