import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { athletes as seed, type Athlete } from "@/data/elite";
import { Plus, Search, Pencil, Trash2, Eye, ArrowUpDown } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/athletes")({
  component: AthletesPage,
});

const athleteSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(60),
  age: z.coerce.number().min(16).max(60),
  height: z.coerce.number().min(140).max(220),
  weight: z.coerce.number().min(45).max(150),
  trainer: z.string().min(2).max(40),
  bio: z.string().max(240).optional(),
  status: z.enum(["active", "resting", "disqualified"]),
  notes: z.string().max(500).optional(),
});
type AthleteForm = z.infer<typeof athleteSchema>;

type Row = Athlete & { status: "active" | "resting" | "disqualified"; notes?: string };

function AthletesPage() {
  const [rows, setRows] = useState<Row[]>(() => seed.map((a) => ({ ...a, status: "active" as const })));
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = rows.filter((r) =>
      [r.name, r.trainer, r.slug].some((x) => x.toLowerCase().includes(q)),
    );
    return list.sort((a, b) => (sortDesc ? b.powerScore - a.powerScore : a.powerScore - b.powerScore));
  }, [rows, query, sortDesc]);

  const form = useForm<AthleteForm>({
    resolver: zodResolver(athleteSchema),
    defaultValues: { name: "", age: 22, height: 175, weight: 75, trainer: "Coach AJ", bio: "", status: "active", notes: "" },
  });

  function openAdd() {
    setEditing(null);
    form.reset({ name: "", age: 22, height: 175, weight: 75, trainer: "Coach AJ", bio: "", status: "active", notes: "" });
    setOpen(true);
  }
  function openEdit(row: Row) {
    setEditing(row);
    form.reset({
      name: row.name, age: row.age, height: row.height, weight: row.weight,
      trainer: row.trainer, bio: row.bio, status: row.status, notes: row.notes,
    });
    setOpen(true);
  }
  function submit(v: AthleteForm) {
    if (editing) {
      setRows((r) => r.map((x) => (x.slug === editing.slug ? { ...x, ...v } : x)));
      toast.success("Athlete updated");
    } else {
      const slug = v.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12) || `a${Date.now()}`;
      const newRow: Row = {
        slug, name: v.name, age: v.age, weight: v.weight, height: v.height, trainer: v.trainer,
        rank: rows.length + 1, attendance: 100, streak: 0, powerScore: 6000,
        color: "from-red-800 to-red-950", initials: v.name.split(" ").map((s) => s[0]).slice(0, 2).join(""),
        bio: v.bio || "New Elite X athlete.", challengeStarted: new Date().toISOString().slice(0, 10),
        status: v.status, notes: v.notes,
      };
      setRows((r) => [newRow, ...r]);
      toast.success("Athlete added to Elite X roster");
    }
    setOpen(false);
  }
  function remove(slug: string) {
    setRows((r) => r.filter((x) => x.slug !== slug));
    toast("Athlete removed", { description: "Roster updated" });
  }

  return (
    <AdminShell title="Athletes" subtitle="Manage the hand-picked Top 10 roster">
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, trainer..." className="pl-9 bg-white/5 border-white/10" />
          </div>
          <Button variant="outline" onClick={() => setSortDesc((v) => !v)} className="border-white/10 bg-white/5">
            <ArrowUpDown className="h-4 w-4 mr-2" /> Power {sortDesc ? "↓" : "↑"}
          </Button>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 glow-red">
            <Plus className="h-4 w-4 mr-2" /> Add Athlete
          </Button>
        </div>

        <div className="rounded-xl border border-white/10 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>Athlete</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Height</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Power</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.slug} className="border-white/5 hover:bg-white/[0.03]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center text-xs font-bold`}>{r.initials}</div>
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-white/40">Rank #{r.rank}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{r.age}</TableCell>
                  <TableCell>{r.height}cm</TableCell>
                  <TableCell>{r.weight}kg</TableCell>
                  <TableCell className="text-white/70">{r.trainer}</TableCell>
                  <TableCell className="font-mono text-primary">{r.powerScore}</TableCell>
                  <TableCell>
                    <Badge className={
                      r.status === "active" ? "bg-primary/20 text-primary border border-primary/40" :
                      r.status === "resting" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                      "bg-white/10 text-white/60 border border-white/10"
                    }>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8"><Link to="/admin/athletes/$slug" params={{ slug: r.slug }}><Eye className="h-4 w-4" /></Link></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-strong border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {r.name}?</AlertDialogTitle>
                            <AlertDialogDescription>This removes them from the Elite X roster. This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(r.slug)} className="bg-primary hover:bg-primary/90">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-white/40">No athletes match your search.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-widest">{editing ? "Edit Athlete" : "Add Athlete"}</DialogTitle>
            <DialogDescription>All fields feed the athlete profile and leaderboard calculations.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(submit)} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-[10px] text-white/40 tracking-widest">PHOTO</div>
              <Button type="button" variant="outline" className="border-white/10 bg-white/5">Upload</Button>
            </div>
            <div className="col-span-2"><Label>Full Name</Label><Input {...form.register("name")} className="bg-white/5 border-white/10 mt-1" /><FieldError msg={form.formState.errors.name?.message} /></div>
            <div><Label>Age</Label><Input type="number" {...form.register("age")} className="bg-white/5 border-white/10 mt-1" /><FieldError msg={form.formState.errors.age?.message} /></div>
            <div><Label>Trainer</Label><Input {...form.register("trainer")} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Height (cm)</Label><Input type="number" {...form.register("height")} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Weight (kg)</Label><Input type="number" {...form.register("weight")} className="bg-white/5 border-white/10 mt-1" /></div>
            <div className="col-span-2">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as AthleteForm["status"])}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="resting">Resting</SelectItem><SelectItem value="disqualified">Disqualified</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Short Bio</Label><Textarea {...form.register("bio")} className="bg-white/5 border-white/10 mt-1" rows={2} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea {...form.register("notes")} className="bg-white/5 border-white/10 mt-1" rows={2} /></div>
            <DialogFooter className="col-span-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 glow-red">{editing ? "Save changes" : "Add athlete"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-400 mt-1">{msg}</p>;
}
