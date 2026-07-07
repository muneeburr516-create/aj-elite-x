import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Trophy, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import type { DisplayAthlete as Athlete } from "@/lib/athlete-adapter";
export type { DisplayAthlete } from "@/lib/athlete-adapter";
import { cn } from "@/lib/utils";

export function AthleteAvatar({ athlete, size = "md" }: { athlete: Athlete; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "h-10 w-10 text-xs", md: "h-16 w-16 text-lg", lg: "h-24 w-24 text-2xl", xl: "h-40 w-40 text-5xl" };
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-gradient-to-br grid place-items-center font-display font-bold text-white ring-1 ring-white/10 overflow-hidden shrink-0",
        athlete.color,
        sizes[size],
      )}
    >
      {athlete.photoUrl ? (
        <img src={athlete.photoUrl} alt={athlete.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <>
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,white,transparent_60%)]" />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.4)_6px,rgba(0,0,0,0.4)_7px)]" />
          <span className="relative">{athlete.initials}</span>
        </>
      )}
    </div>
  );
}

export function AthleteCard({ athlete, index = 0 }: { athlete: Athlete; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <GlassCard glow className="group h-full flex flex-col relative overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center gap-1 font-display text-xs">
          <Trophy size={12} className="text-primary" />
          <span className="text-primary">RANK #{athlete.rank}</span>
        </div>
        <div className="flex items-center gap-4">
          <AthleteAvatar athlete={athlete} size="lg" />
          <div className="min-w-0">
            <h3 className="font-display uppercase text-xl text-white truncate">{athlete.name}</h3>
            <p className="text-xs tracking-widest text-white/50 mt-1">TRAINER · {athlete.trainer}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat label="Age" value={athlete.age} />
          <Stat label="Weight" value={`${athlete.weight}kg`} />
          <Stat label="Height" value={`${athlete.height}cm`} />
        </div>

        <div className="mt-4 space-y-2.5">
          <ProgressRow label="Attendance" value={athlete.attendance} suffix="%" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60 flex items-center gap-1.5"><Flame size={13} className="text-primary" /> Streak</span>
            <span className="text-white font-display">{athlete.streak} days</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60 flex items-center gap-1.5"><TrendingUp size={13} className="text-primary" /> Power Score</span>
            <span className="text-white font-display text-lg">{athlete.powerScore.toLocaleString()}</span>
          </div>
        </div>

        <Link
          to="/elite/$slug"
          params={{ slug: athlete.slug }}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium tracking-wide text-white group-hover:bg-primary group-hover:border-primary transition-all"
        >
          View Full Profile <ArrowUpRight size={14} />
        </Link>
      </GlassCard>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-lg py-2">
      <p className="font-display text-white text-base">{value}</p>
      <p className="text-[9px] tracking-[0.2em] text-white/50 mt-0.5">{label.toUpperCase()}</p>
    </div>
  );
}

function ProgressRow({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-white/60">{label}</span>
        <span className="text-white font-display">{value}{suffix}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-red-800 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
