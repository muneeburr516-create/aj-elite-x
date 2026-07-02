import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, Twitter, MapPin, Mail, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo showText />
            <p className="mt-5 max-w-sm text-sm text-white/60 leading-relaxed">
              Elite X is the invitation-only Top 10 Transformation Quest by AJ Fitness Club.
              90 days. 10 athletes. One champion.
            </p>
            <p className="mt-6 font-display tracking-[0.35em] text-primary text-xs">
              STRONGER TODAY, BETTER TOMORROW.
            </p>
          </div>
          <div>
            <h4 className="text-xs tracking-[0.3em] text-white/50 mb-4">EXPLORE</h4>
            <ul className="space-y-2 text-sm">
              {[["/elite", "Elite Members"], ["/leaderboards", "Leaderboards"], ["/about", "About Elite X"], ["/contact", "Contact"]].map(([to, l]) => (
                <li key={to}>
                  <Link to={to} className="text-white/70 hover:text-primary transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs tracking-[0.3em] text-white/50 mb-4">CONTACT</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 text-primary" /> AJ Fitness Club, Lahore</li>
              <li className="flex items-center gap-2"><Phone size={14} className="text-primary" /> +92 300 1234567</li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-primary" /> elite@ajfitness.club</li>
            </ul>
            <div className="mt-5 flex gap-2">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="glass grid place-items-center h-9 w-9 hover:bg-primary/20 hover:border-primary/50 transition-all">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} AJ Fitness Club. All rights reserved.</span>
          <span className="tracking-[0.3em]">ELITE X — TOP 10 TRANSFORMATION QUEST</span>
        </div>
      </div>
    </footer>
  );
}
