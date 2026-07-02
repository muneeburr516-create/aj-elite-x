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

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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
              QUEST DAY 62 / 90
            </span>
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
        "relative px-4 py-2 text-sm font-medium tracking-wide text-white/70 transition-colors hover:text-white",
        mobile && "rounded-lg hover:bg-white/5",
      )}
      activeProps={{ className: "!text-white" }}
      activeOptions={{ exact: to === "/" }}
    >
      {({ isActive }) => (
        <>
          <span>{label}</span>
          {isActive && !mobile && (
            <span className="absolute inset-x-3 -bottom-0.5 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          )}
        </>
      )}
    </Link>
  );
}
