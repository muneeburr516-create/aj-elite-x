import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { useAthletes, useMeasurements, useUpsertMeasurement } from "@/hooks/useElite";
import { measurementDiffs } from "@/lib/analytics";

export const Route = createFileRoute("/admin/measurements")({ component: MeasurementsPage });

const FIELDS = ["weight", "chest", "waist", "arms", "thighs", "calves"] as const;
type Field = typeof FIELDS[number];

function MeasurementsPage() {
  const { data: athletes = [] } = useAthletes();
  const [athleteId, setAthleteId] = useState<string>("");
  useEffect(() => { if (!athleteId && athletes[0]) setAthleteId(athletes[0].id); }, [athletes, athleteId]);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<Field, string>>({ weight: "", chest: "", waist: "", arms: "", thighs: "", calves: "" });

  const { data: rows = [] } = useMeasurements(athleteId || undefined);
  const upsert = useUpsertMeasurement();
  const diffs = useMemo(() => measurementDiffs(rows), [rows]);
  const history = useMemo(() => [...rows].sort((a, b) => b.measurement_date.localeCompare(a.measurement_date)).slice(0, 8), [rows]);

  async function save() {
    if (!athleteId) return toast.error("Pick an athlete");
    const payload: any = { athlete_id: athleteId, measurement_date: date };
    FIELDS.forEach((f) => { const v = parseFloat(values[f]); if (!isNaN(v) && v > 0) payload[f] = v; });
    try {
      await upsert.mutateAsync(payload);
      toast.success("Measurements saved");
      setValues({ weight: "", chest: "", waist: "", arms: "", thighs: "", calves: "" });
    } catch (e: any) {
      const msg = e.message ?? "Save failed";
      toast.error(msg.includes("uniq") ? "This date already has measurements" : msg);
    }
  }

  return (
    <AdminShell title="Body Measurements" subtitle="Track physique progression week by week">
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="grid md:grid-cols-2 gap-3 mb-5">
            <div>
              <Label>Athlete</Label>
              <Select value={athleteId} onValueChange={setAthleteId}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>{athletes.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border-white/10 mt-1" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f}>
                <Label className="capitalize">{f} ({f === "weight" ? "kg" : "cm"})</Label>
                <Input type="number" step="0.1" min={0} value={values[f]} onChange={(e) => setValues({ ...values, [f]: e.target.value })} className="bg-white/5 border-white/10 mt-1" />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={save} disabled={upsert.isPending} className="bg-primary hover:bg-primary/90 glow-red">
              {upsert.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Measurement
            </Button>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg mb-3">Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {diffs.map((m) => {
              const down = m.delta != null && m.delta < 0;
              return (
                <div key={m.label} className="rounded-xl p-3 bg-white/5 border border-white/10">
                  <div className="text-[10px] tracking-widest text-white/50">{m.label.toUpperCase()}</div>
                  <div className="font-display text-xl mt-1">{m.value != null ? `${m.value}${m.unit}` : "—"}</div>
                  {m.delta != null && (
                    <div className={`text-xs mt-1 flex items-center gap-1 ${down ? "text-emerald-400" : "text-primary"}`}>
                      {down ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />} {m.delta > 0 ? "+" : ""}{m.delta}{m.unit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <h3 className="font-display text-lg mt-6 mb-3">Timeline</h3>
          {history.length === 0 && <div className="text-xs text-white/40">No measurements recorded yet.</div>}
          <ol className="relative border-l border-white/10 ml-2 space-y-4">
            {history.map((h) => (
              <li key={h.id} className="ml-4">
                <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary glow-red mt-1.5" />
                <div className="text-xs text-white/50">{h.measurement_date}</div>
                <div className="text-sm mt-1">
                  {h.weight != null && <>Weight <span className="text-primary font-mono">{Number(h.weight).toFixed(1)}kg</span> · </>}
                  {h.chest != null && <>Chest <span className="text-primary font-mono">{Number(h.chest).toFixed(1)}cm</span> · </>}
                  {h.waist != null && <>Waist <span className="text-primary font-mono">{Number(h.waist).toFixed(1)}cm</span></>}
                </div>
              </li>
            ))}
          </ol>
        </GlassCard>
      </div>
    </AdminShell>
  );
}
