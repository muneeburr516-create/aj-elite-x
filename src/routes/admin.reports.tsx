import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, Sheet as SheetIcon, ClipboardList, Dumbbell, Ruler, Trophy, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

const reports = [
  { key: "attendance", label: "Attendance Report", icon: CalendarCheck, desc: "Present/absent breakdown per athlete across 90 days.", rows: 10, size: "2.1 MB" },
  { key: "workout", label: "Workout Report", icon: Dumbbell, desc: "Every rep, every set, every session across the roster.", rows: 540, size: "8.6 MB" },
  { key: "strength", label: "Strength Report", icon: Trophy, desc: "PR tracking and power-score progression by week.", rows: 90, size: "1.4 MB" },
  { key: "measurement", label: "Measurement Report", icon: Ruler, desc: "Full body-composition timeline for all athletes.", rows: 120, size: "1.9 MB" },
  { key: "leaderboard", label: "Leaderboard Report", icon: ClipboardList, desc: "Daily · weekly · monthly · overall rankings snapshot.", rows: 42, size: "0.9 MB" },
];

function ReportsPage() {
  return (
    <AdminShell title="Reports" subtitle="Generate & export official Elite X data">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((r) => (
          <GlassCard key={r.key} glow>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/30 to-red-900/30 border border-primary/30 flex items-center justify-center">
                <r.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg">{r.label}</h3>
                <p className="text-xs text-white/50 mt-1">{r.desc}</p>
                <div className="mt-3 flex gap-2 text-[11px] text-white/50">
                  <span>{r.rows} rows</span><span>·</span><span>{r.size}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => toast.success(`${r.label} — PDF generated`)} className="bg-primary hover:bg-primary/90"><FileText className="h-4 w-4 mr-1" /> PDF</Button>
              <Button size="sm" variant="outline" onClick={() => toast.success(`${r.label} — Excel generated`)} className="border-white/10 bg-white/5"><SheetIcon className="h-4 w-4 mr-1" /> Excel</Button>
              <Button size="sm" variant="ghost" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </AdminShell>
  );
}
