import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/elite", label: "Elite Members" },
  { to: "/leaderboards", label: "Leaderboards" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

// Challenge starts at day 1 on this date (local time). The quest day
// increments automatically at midnight every night.
const QUEST_START = new Date(2026, 5, 30); // 30 June 2026 = Day 1
const QUEST_DURATION = 90;

function computeQuestDay() {
  const now = new Date();
  const start = new Date(QUEST_START.getFullYear(), QUEST_START.getMonth(), QUEST_START.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.min(Math.max(diff, 1), QUEST_DURATION);
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [questDay, setQuestDay] = useState(computeQuestDay);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-refresh the quest day at the next local midnight, then every 24h.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const timeout = setTimeout(() => {
      setQuestDay(computeQuestDay());
      interval = setInterval(() => setQuestDay(computeQuestDay()), 86_400_000);
    }, nextMidnight.getTime() - now.getTime());
    return () => { clearTimeout(timeout); if (interval) clearInterval(interval); };
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-500",
            scrolled
              ? "glass-strong shadow-[0_10px_40px_-10px_rgba(225,6,0,0.35)]"
              : "border border-white/5 bg-black/20 backdrop-blur-md",
          )}
        >
          <Link to="/" className="flex items-center">
            <Logo showText />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} />
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <span className="px-3 py-1.5 text-[11px] tracking-[0.25em] font-display border border-primary/40 rounded-full text-primary bg-primary/10">
              QUEST DAY {questDay} / {QUEST_DURATION}
          </div>

          <button
            aria-label="Menu"
            className="md:hidden text-white p-2"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden mt-2 glass-strong rounded-2xl p-4 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
            {links.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} mobile />
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function NavItem({ to, label, mobile = false }: { to: string; label: string; mobile?: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative px-4 py-2 text-sm font-medium tracking-wide text-white/70 transition-colors hover:text-white",
        mobile && "rounded-lg hover:bg-white/5",
      )}
      activeProps={{ className: "!text-white [&_.nav-underline]:opacity-100" }}
      activeOptions={{ exact: to === "/" }}
    >
      <span>{label}</span>
      {!mobile && (
        <span className="nav-underline pointer-events-none absolute inset-x-3 -bottom-0.5 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity" />
      )}
    </Link>
  );
}
