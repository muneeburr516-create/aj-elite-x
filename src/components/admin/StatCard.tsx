import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
  index = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  accent?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={cn(
        "glass-strong rounded-2xl p-5 relative overflow-hidden group hover:border-primary/40 transition-colors",
        accent && "glow-red",
      )}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/25 transition" />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold text-white leading-none">{value}</div>
          {hint && <div className="mt-2 text-xs text-white/50">{hint}</div>}
        </div>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-red-900/30 flex items-center justify-center border border-primary/30">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
