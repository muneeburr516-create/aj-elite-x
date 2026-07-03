import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Dumbbell, Trophy, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const mobileNav = [
  { to: "/admin", icon: LayoutDashboard, label: "Home", exact: true },
  { to: "/admin/athletes", icon: Users, label: "Athletes" },
  { to: "/admin/workouts", icon: Dumbbell, label: "Workouts" },
  { to: "/admin/leaderboards", icon: Trophy, label: "Ranks" },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,oklch(0.58_0.24_27/0.14),transparent_50%),radial-gradient(circle_at_85%_90%,oklch(0.4_0.18_25/0.12),transparent_55%)]" />
      <AdminSidebar />

      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Sheet>
          <SheetTrigger className="h-10 w-10 rounded-lg glass border border-white/10 flex items-center justify-center">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-background border-white/10">
            <div className="p-4"><AdminSidebar /></div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="lg:pl-64">
        <div className="px-6 pb-24 lg:pb-8">
          <AdminTopbar title={title} subtitle={subtitle} />
          <div className="mt-6">{children}</div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3">
        <div className="glass-strong rounded-2xl grid grid-cols-4">
          {mobileNav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-widest",
                  active ? "text-primary" : "text-white/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label.toUpperCase()}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
