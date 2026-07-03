import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { athletes, generateMeasurements } from "@/data/elite";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/measurements")({
  component: MeasurementsPage,
});

const fields = ["weight", "chest", "waist", "arms", "thighs", "calves"] as const;

function MeasurementsPage() {
  const [slug, setSlug] = useState(athletes[0].slug);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, number>>({ weight: 78, chest: 104, waist: 76, arms: 38, thighs: 60, calves: 40 });

  const seed = slug.charCodeAt(0);
  const current = generateMeasurements(seed);
  const history = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    date: `2026-${String(4 + Math.floor(i / 2)).padStart(2, "0")}-${String(5 + (i % 2) * 15).padStart(2, "0")}`,
    weight: 82 - i * 0.4,
    chest: 100 + i * 0.6,
    waist: 82 - i * 0.7,
  })), [slug]);

  return (
    <AdminShell title="Body Measurements" subtitle="Track physique progression week by week">
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="grid md:grid-cols-2 gap-3 mb-5">
            <div>
              <Label>Athlete</Label>
              <Select value={slug} onValueChange={setSlug}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{athletes.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border-white/10 mt-1" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f}>
                <Label className="capitalize">{f} ({f === "weight" ? "kg" : "cm"})</Label>
                <Input type="number" value={values[f]} onChange={(e) => setValues({ ...values, [f]: +e.target.value })} className="bg-white/5 border-white/10 mt-1" />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => toast.success("Measurements saved")} className="bg-primary hover:bg-primary/90 glow-red"><Save className="h-4 w-4 mr-2" /> Save Measurement</Button>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg mb-3">Progress Cards</h3>
          <div className="grid grid-cols-3 gap-3">
            {current.slice(0, 3).map((m) => {
              const down = m.change.startsWith("-");
              return (
                <div key={m.label} className="rounded-xl p-3 bg-white/5 border border-white/10">
                  <div className="text-[10px] tracking-widest text-white/50">{m.label.toUpperCase()}</div>
                  <div className="font-display text-xl mt-1">{m.value}</div>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${down ? "text-emerald-400" : "text-primary"}`}>
                    {down ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />} {m.change}
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="font-display text-lg mt-6 mb-3">Timeline</h3>
          <ol className="relative border-l border-white/10 ml-2 space-y-4">
            {history.map((h, i) => (
              <li key={i} className="ml-4">
                <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary glow-red mt-1.5" />
                <div className="text-xs text-white/50">{h.date}</div>
                <div className="text-sm mt-1">Weight <span className="text-primary font-mono">{h.weight.toFixed(1)}kg</span> · Chest <span className="text-primary font-mono">{h.chest.toFixed(1)}cm</span> · Waist <span className="text-primary font-mono">{h.waist.toFixed(1)}cm</span></div>
              </li>
            ))}
          </ol>
        </GlassCard>
      </div>
    </AdminShell>
  );
}
