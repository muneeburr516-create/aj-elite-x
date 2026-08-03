import { motion } from "framer-motion";
import { Zap, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { formatXp, levelPct } from "@/lib/xp";
import type { AthleteProgress } from "@/lib/xp.types";

export function XpLevelCard({ progress }: { progress: AthleteProgress | null | undefined }) {
  const pct = levelPct(progress);
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-white/50">TOTAL XP</div>
          <div className="font-display text-4xl font-bold text-gradient-red leading-none mt-1">
            {formatXp(progress?.total_xp)}
          </div>
          <div className="text-xs text-white/50 mt-2">
            Workout {formatXp(progress?.workout_xp)} · Bonus {formatXp(progress?.bonus_xp)}
          </div>
        </div>
        <div className="text-right">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-red-900 flex flex-col items-center justify-center glow-red">
            <Zap className="h-4 w-4 text-white" />
            <span className="font-display text-sm font-bold leading-none">{progress?.current_level ?? 1}</span>
          </div>
          <div className="text-[10px] tracking-widest text-white/50 mt-2">LEVEL</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
          <span>{progress?.current_level_label ?? "Initiate"}</span>
          <span>
            {progress?.next_level
              ? `${formatXp(progress.xp_remaining)} XP → LVL ${progress.next_level}`
              : "MAX LEVEL"}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-red-500 glow-red"
          />
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/40">
          <TrendingUp className="h-3 w-3 text-primary" /> {pct}% to next level
        </div>
      </div>
    </GlassCard>
  );
}
