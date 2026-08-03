import { GlassCard } from "@/components/common/GlassCard";
import { Badge } from "@/components/ui/badge";
import { formatXp } from "@/lib/xp";
import type { XpHistoryRow } from "@/lib/xp.types";
import { History } from "lucide-react";

export function XpHistoryPanel({ rows }: { rows: XpHistoryRow[] }) {
  return (
    <GlassCard>
      <h3 className="font-display text-lg mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" /> XP History ({rows.length})
      </h3>
      <div className="overflow-x-auto rounded-lg border border-white/10 max-h-[460px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-white/50 uppercase bg-white/5 sticky top-0">
            <tr>
              <th className="text-left p-2">Day</th>
              <th className="text-left p-2">Source</th>
              <th className="text-left p-2">Push</th>
              <th className="text-left p-2">Pull</th>
              <th className="text-left p-2">3rd</th>
              <th className="text-right p-2">XP</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-xs text-white/40">No XP recorded yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="p-2">{r.challenge_day ?? "—"}</td>
                <td className="p-2">
                  <Badge variant="outline" className="border-primary/30 text-primary text-[10px] uppercase">{r.source}</Badge>
                </td>
                <td className="p-2 font-mono text-white/70">{r.breakdown?.pushups ?? 0}</td>
                <td className="p-2 font-mono text-white/70">{r.breakdown?.pullups ?? 0}</td>
                <td className="p-2 font-mono text-white/70">{r.breakdown?.chinups ?? 0}</td>
                <td className="p-2 text-right font-display text-primary">+{formatXp(r.xp_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
