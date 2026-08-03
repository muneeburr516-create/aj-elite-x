import { motion } from "framer-motion";
import { Layers, CalendarCheck, ArrowRightCircle, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { phasePct } from "@/lib/xp";
import type { AthleteProgress } from "@/lib/xp.types";

export function PhaseProgressCard({
  progress,
  athleteName,
  onAdvance,
  advancing = false,
}: {
  progress: AthleteProgress | null | undefined;
  athleteName?: string;
  onAdvance?: () => void;
  advancing?: boolean;
}) {
  const pct = phasePct(progress);
  const ready = !!progress?.ready_for_next_phase;

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-white/50">CURRENT PHASE</div>
          <div className="font-display text-2xl font-bold mt-1">
            {progress?.phase_name ?? "Phase 1 — Foundation"}
          </div>
          <div className="text-xs text-white/50 mt-1">
            Day range {progress?.phase_start_day ?? 1}–{progress?.phase_end_day ?? 30}
          </div>
        </div>
        <Badge className="bg-primary/20 text-primary border border-primary/40">
          PHASE {progress?.phase_number ?? 1}
        </Badge>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
          <span>{progress?.phase_days_completed ?? 0} / {progress?.phase_duration ?? 30} days</span>
          <span>{progress?.phase_days_remaining ?? 30} remaining</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-primary"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <div className="text-[10px] tracking-[0.25em] text-white/40 flex items-center gap-2">
          <Layers className="h-3 w-3 text-primary" /> PHASE EXERCISES
        </div>
        {(progress?.exercises ?? []).map((e) => (
          <div key={e.slot} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <span>{e.display_name}</span>
            <span className="font-mono text-primary text-xs">{e.xp_per_rep} XP / rep</span>
          </div>
        ))}
      </div>

      {onAdvance && (
        <div className="mt-5 pt-4 border-t border-white/10">
          {ready ? (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarCheck className="h-4 w-4 text-primary" /> Phase complete — confirmation required
              </div>
              <p className="text-xs text-white/60 mt-1">
                {athleteName ?? "This athlete"} finished 30 workout days in this phase. Switching is never automatic.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="mt-3 w-full bg-primary hover:bg-primary/90 glow-red" disabled={advancing}>
                    {advancing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRightCircle className="h-4 w-4 mr-2" />}
                    Move to Phase {(progress?.phase_number ?? 1) + 1}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-strong border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Advance to Phase {(progress?.phase_number ?? 1) + 1}?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60">
                      All future workouts for {athleteName ?? "this athlete"} will use the new phase template and its XP
                      rates. Existing XP history stays untouched.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onAdvance} className="bg-primary hover:bg-primary/90">Confirm switch</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <p className="text-xs text-white/40">
              Phase switch unlocks after {progress?.phase_days_remaining ?? 30} more workout day(s).
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
