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
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, RotateCcw, Loader2, Zap } from "lucide-react";
import { useAthletes, useSettings, useUpsertWorkout, useWorkouts } from "@/hooks/useElite";
import { useAthleteProgress, useAdvancePhase } from "@/hooks/useXp";
import { XpLevelCard } from "@/components/xp/XpLevelCard";
import { PhaseProgressCard } from "@/components/xp/PhaseProgressCard";
import { FALLBACK_EXERCISES, SLOT_ORDER, exerciseFor, previewWorkoutXp, formatXp } from "@/lib/xp";
import { isFriday, workoutPower } from "@/lib/analytics";

export const Route = createFileRoute("/admin/workouts")({ component: WorkoutTrackerPage });

function WorkoutTrackerPage() {
  const { data: athletes = [] } = useAthletes();
  const { data: settings } = useSettings();
  const upsert = useUpsertWorkout();

  const [athleteId, setAthleteId] = useState<string>("");
  useEffect(() => { if (!athleteId && athletes[0]) setAthleteId(athletes[0].id); }, [athletes, athleteId]);

  const [day, setDay] = useState<number>(settings?.current_day ?? 1);
  useEffect(() => { if (settings) setDay(settings.current_day); }, [settings]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const friday = isFriday(date);
  const [attendance, setAttendance] = useState<"PRESENT" | "ABSENT" | "REST">(friday ? "REST" : "PRESENT");
  useEffect(() => { if (friday) setAttendance("REST"); }, [friday]);

  const [pu, setPu] = useState<[number, number, number]>([0, 0, 0]);
  const [pl, setPl] = useState<[number, number, number]>([0, 0, 0]);
  const [cu, setCu] = useState<[number, number, number]>([0, 0, 0]);
  const [notes, setNotes] = useState("");

  const athlete = athletes.find((a) => a.id === athleteId);
  const { data: history = [] } = useWorkouts(athleteId || undefined);
  const last10 = useMemo(() => [...history].slice(-10).reverse(), [history]);

  // Phase-driven exercise template + XP engine
  const { data: progress } = useAthleteProgress(athleteId || undefined);
  const advance = useAdvancePhase();
  const exercises = progress?.exercises?.length ? progress.exercises : FALLBACK_EXERCISES;

  function reset() {
    setPu([0, 0, 0]); setPl([0, 0, 0]); setCu([0, 0, 0]); setNotes("");
    setAttendance(friday ? "REST" : "PRESENT");
    toast("Form reset");
  }

  async function save() {
    if (!athleteId) return toast.error("Pick an athlete");
    if ([...pu, ...pl, ...cu].some((v) => v < 0)) return toast.error("Reps cannot be negative");
    try {
      await upsert.mutateAsync({
        athlete_id: athleteId, challenge_day: day, workout_date: date, attendance,
        pushup_set_1: pu[0], pushup_set_2: pu[1], pushup_set_3: pu[2],
        pullup_set_1: pl[0], pullup_set_2: pl[1], pullup_set_3: pl[2],
        chinup_set_1: cu[0], chinup_set_2: cu[1], chinup_set_3: cu[2],
        notes: notes || null,
      });
      toast.success(`Workout saved — Day ${day} · ${athlete?.full_name ?? ""} · +${formatXp(xpPreview)} XP`);
    } catch (e: any) {
      const msg = e.message ?? "Save failed";
      toast.error(msg.includes("uniq") ? "This day is already logged for this athlete" : msg);
    }
  }

  const total = workoutPower({
    attendance,
    pushup_set_1: pu[0], pushup_set_2: pu[1], pushup_set_3: pu[2],
    pullup_set_1: pl[0], pullup_set_2: pl[1], pullup_set_3: pl[2],
    chinup_set_1: cu[0], chinup_set_2: cu[1], chinup_set_3: cu[2],
  });

  const xpPreview = previewWorkoutXp(exercises, { pushup: pu, pullup: pl, chinup: cu }, attendance);


  return (
    <AdminShell title="Workout Tracker" subtitle="Log daily sessions rep by rep">
      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <GlassCard>
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <div>
              <Label>Athlete</Label>
              <Select value={athleteId} onValueChange={setAthleteId}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>{athletes.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Challenge Day</Label><Input type="number" min={1} value={day} onChange={(e) => setDay(+e.target.value)} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Date {friday && <span className="text-amber-400 text-[10px] ml-1">FRIDAY · REST</span>}</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border-white/10 mt-1" /></div>
          </div>

          <div className="mb-6">
            <Label className="mb-2 block">Attendance</Label>
            <RadioGroup value={attendance} onValueChange={(v) => setAttendance(v as typeof attendance)} className="grid grid-cols-3 gap-2">
              {(["PRESENT", "ABSENT", "REST"] as const).map((v) => (
                <label key={v} className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-medium tracking-wide transition ${
                  attendance === v ? "border-primary bg-primary/15 text-white glow-red" : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                }`}>
                  <RadioGroupItem value={v} className="sr-only" />
                  {v === "REST" ? "REST/OFF" : v}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="mb-4 flex items-center gap-2 text-[10px] tracking-[0.25em] text-white/40">
            <Zap className="h-3 w-3 text-primary" />
            {(progress?.phase_name ?? "PHASE 1").toUpperCase()} TEMPLATE
          </div>

          {SLOT_ORDER.map((slot) => {
            const ex = exerciseFor(exercises, slot);
            if (!ex) return null;
            const map = { pushup: [pu, setPu], pullup: [pl, setPl], chinup: [cu, setCu] } as const;
            const [state, setter] = map[slot] as unknown as [number[], (v: [number, number, number]) => void];
            const reps = state.reduce((a, b) => a + b, 0);
            return (
              <div key={slot} className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <Label>{ex.display_name} <span className="text-white/40 text-[10px] ml-1">{ex.xp_per_rep} XP/REP</span></Label>
                  <Badge variant="outline" className="border-primary/30 text-primary">Total: {reps} · {reps * ex.xp_per_rep} XP</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="glass rounded-lg p-3">
                      <div className="text-[10px] tracking-widest text-white/40 mb-1">SET {idx + 1}</div>
                      <Input type="number" min={0} disabled={attendance !== "PRESENT"} value={state[idx]}
                        onChange={(e) => { const n = [...state] as [number, number, number]; n[idx] = Math.max(0, +e.target.value || 0); setter(n); }}
                        className="bg-transparent border-0 text-2xl font-display font-bold p-0 h-auto focus-visible:ring-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mb-6"><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Form cues, PR call-outs, injuries..." className="bg-white/5 border-white/10 mt-1" rows={3} /></div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex gap-6">
              <div>
                <div className="text-[10px] tracking-widest text-white/40">SESSION POWER</div>
                <div className="font-display text-3xl text-gradient-red">{total}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-white/40">SESSION XP</div>
                <div className="font-display text-3xl text-gradient-red">+{formatXp(xpPreview)}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="border-white/10 bg-white/5"><RotateCcw className="h-4 w-4 mr-2" /> Reset</Button>
              <Button onClick={save} disabled={upsert.isPending} className="bg-primary hover:bg-primary/90 glow-red">
                {upsert.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Session
              </Button>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
        <XpLevelCard progress={progress} />
        <PhaseProgressCard
          progress={progress}
          athleteName={athlete?.full_name}
          advancing={advance.isPending}
          onAdvance={async () => {
            if (!athleteId) return;
            try {
              const res = await advance.mutateAsync(athleteId);
              if (res.advanced) toast.success(`Moved to Phase ${res.phase_number}`);
              else toast.error(res.reason ?? "Could not advance");
            } catch (e: any) { toast.error(e.message ?? "Could not advance"); }
          }}
        />
        <GlassCard>

          <h3 className="font-display text-lg mb-3">{athlete?.full_name ?? "—"} — Last 10</h3>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {last10.length === 0 && <div className="text-xs text-white/40 py-6 text-center">No sessions logged yet.</div>}
            {last10.map((d) => (
              <div key={d.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Day {d.challenge_day}</div>
                  <Badge variant="outline" className={d.attendance === "REST" ? "border-amber-500/30 text-amber-300" : d.attendance === "ABSENT" ? "border-red-500/30 text-red-300" : "border-primary/30 text-primary"}>{d.attendance}</Badge>
                </div>
                <div className="text-xs text-white/50">{d.workout_date}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-white/40">PU</span> {d.pushup_set_1}·{d.pushup_set_2}·{d.pushup_set_3}</div>
                  <div><span className="text-white/40">PL</span> {d.pullup_set_1}·{d.pullup_set_2}·{d.pullup_set_3}</div>
                  <div><span className="text-white/40">CU</span> {d.chinup_set_1}·{d.chinup_set_2}·{d.chinup_set_3}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AdminShell>
  );
}
