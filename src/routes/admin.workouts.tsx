import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { athletes, generateWorkoutLog } from "@/data/elite";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin/workouts")({
  component: WorkoutTrackerPage,
});

function WorkoutTrackerPage() {
  const [slug, setSlug] = useState(athletes[0].slug);
  const [day, setDay] = useState(62);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<"PRESENT" | "ABSENT" | "REST">("PRESENT");
  const [pu, setPu] = useState<[number, number, number]>([50, 45, 40]);
  const [pl, setPl] = useState<[number, number, number]>([12, 10, 8]);
  const [cu, setCu] = useState<[number, number, number]>([10, 8, 6]);
  const [notes, setNotes] = useState("");

  const athlete = athletes.find((a) => a.slug === slug)!;
  const history = useMemo(() => generateWorkoutLog(athlete.slug.charCodeAt(0)).slice(-10).reverse(), [athlete.slug]);

  function reset() {
    setPu([0, 0, 0]); setPl([0, 0, 0]); setCu([0, 0, 0]); setNotes(""); setAttendance("PRESENT");
    toast("Form reset");
  }
  function save() { toast.success(`Workout saved — Day ${day} · ${athlete.name}`); }

  const total = pu.reduce((a, b) => a + b, 0) + pl.reduce((a, b) => a + b, 0) * 6 + cu.reduce((a, b) => a + b, 0) * 5;

  return (
    <AdminShell title="Workout Tracker" subtitle="Log daily sessions rep by rep">
      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <GlassCard>
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <div>
              <Label>Athlete</Label>
              <Select value={slug} onValueChange={setSlug}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{athletes.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Challenge Day</Label><Input type="number" value={day} onChange={(e) => setDay(+e.target.value)} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border-white/10 mt-1" /></div>
          </div>

          <div className="mb-6">
            <Label className="mb-2 block">Attendance</Label>
            <RadioGroup value={attendance} onValueChange={(v) => setAttendance(v as typeof attendance)} className="grid grid-cols-3 gap-2">
              {(["PRESENT", "ABSENT", "REST"] as const).map((v) => (
                <label key={v} className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-medium tracking-wide transition ${
                  attendance === v ? "border-primary bg-primary/15 text-white glow-red" : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                }`}>
                  <RadioGroupItem value={v} className="sr-only" />
                  {v === "REST" ? "FRIDAY OFF" : v}
                </label>
              ))}
            </RadioGroup>
          </div>

          {(["Push-ups", "Pull-ups", "Chin-ups"] as const).map((label, i) => {
            const [state, setter] = [[pu, setPu], [pl, setPl], [cu, setCu]][i] as [number[], (v: [number, number, number]) => void];
            return (
              <div key={label} className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <Label>{label}</Label>
                  <Badge variant="outline" className="border-primary/30 text-primary">Total: {state.reduce((a, b) => a + b, 0)}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="glass rounded-lg p-3">
                      <div className="text-[10px] tracking-widest text-white/40 mb-1">SET {idx + 1}</div>
                      <Input type="number" min={0} disabled={attendance !== "PRESENT"} value={state[idx]}
                        onChange={(e) => { const n = [...state] as [number, number, number]; n[idx] = +e.target.value || 0; setter(n); }}
                        className="bg-transparent border-0 text-2xl font-display font-bold p-0 h-auto focus-visible:ring-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mb-6"><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Form cues, PR call-outs, injuries..." className="bg-white/5 border-white/10 mt-1" rows={3} /></div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              <div className="text-[10px] tracking-widest text-white/40">SESSION POWER</div>
              <div className="font-display text-3xl text-gradient-red">{total}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="border-white/10 bg-white/5"><RotateCcw className="h-4 w-4 mr-2" /> Reset</Button>
              <Button onClick={save} className="bg-primary hover:bg-primary/90 glow-red"><Save className="h-4 w-4 mr-2" /> Save Session</Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg mb-3">{athlete.name} — Last 10</h3>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {history.map((d) => (
              <div key={d.day} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Day {d.day}</div>
                  <Badge variant="outline" className={d.attendance === "REST" ? "border-amber-500/30 text-amber-300" : "border-primary/30 text-primary"}>{d.attendance}</Badge>
                </div>
                <div className="text-xs text-white/50">{d.date}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-white/40">PU</span> {d.pushups.join("·")}</div>
                  <div><span className="text-white/40">PL</span> {d.pullups.join("·")}</div>
                  <div><span className="text-white/40">CU</span> {d.chinups.join("·")}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AdminShell>
  );
}
