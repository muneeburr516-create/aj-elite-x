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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Eye, ArrowUpDown, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAthletes, useLeaderboard, useUpsertAthlete, useDeleteAthlete } from "@/hooks/useElite";
import { initialsFor, mergeAthletesWithLeaderboard } from "@/lib/athlete-adapter";
import type { Athlete } from "@/lib/database.types";

export const Route = createFileRoute("/admin/athletes")({
  component: AthletesPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/i, "lowercase letters, numbers and hyphens only"),
  age: z.coerce.number().min(10).max(80).optional(),
  height: z.coerce.number().min(100).max(230).optional(),
  weight: z.coerce.number().min(30).max(200).optional(),
  trainer: z.string().max(60).optional(),
  short_bio: z.string().max(400).optional(),
  status: z.enum(["active", "inactive", "disqualified"]),
});
type FormV = z.infer<typeof schema>;

function AthletesPage() {
  const { data: athletes = [], isLoading } = useAthletes();
  const { data: board = [] } = useLeaderboard("overall");
  const rows = mergeAthletesWithLeaderboard(athletes, board);
  const upsert = useUpsertAthlete();
  const del = useDeleteAthlete();

  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Athlete | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = rows.filter((r) => [r.name, r.trainer, r.slug].some((x) => x.toLowerCase().includes(q)));
    return list.sort((a, b) => (sortDesc ? b.powerScore - a.powerScore : a.powerScore - b.powerScore));
  }, [rows, query, sortDesc]);

  const form = useForm<FormV>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", slug: "", trainer: "Coach AJ", status: "active" },
  });

  function openAdd() {
    setEditing(null);
    form.reset({ full_name: "", slug: "", trainer: "Coach AJ", status: "active" });
    setOpen(true);
  }
  function openEdit(a: Athlete) {
    setEditing(a);
    form.reset({
      full_name: a.full_name, slug: a.slug,
      age: a.age ?? undefined, height: Number(a.height ?? 0) || undefined, weight: Number(a.weight ?? 0) || undefined,
      trainer: a.trainer ?? "", short_bio: a.short_bio ?? "", status: a.status,
    });
    setOpen(true);
  }
  async function submit(v: FormV) {
    try {
      await upsert.mutateAsync({ ...(editing ? { id: editing.id } : {}), ...v } as any);
      toast.success(editing ? "Athlete updated" : "Athlete added");
      setOpen(false);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  }
  async function remove(id: string) {
    try { await del.mutateAsync(id); toast("Athlete archived"); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  }

  return (
    <AdminShell title="Athletes" subtitle="Manage the Elite X roster">
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
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary inline" /></TableCell></TableRow>
              )}
              {filtered.map((r) => {
                const original = athletes.find((a) => a.slug === r.slug)!;
                return (
                  <TableRow key={r.slug} className="border-white/5 hover:bg-white/[0.03]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center text-xs font-bold`}>{initialsFor(r.name)}</div>
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-white/40">Rank #{r.rank || "—"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{r.age || "—"}</TableCell>
                    <TableCell>{r.height ? `${r.height}cm` : "—"}</TableCell>
                    <TableCell>{r.weight ? `${r.weight}kg` : "—"}</TableCell>
                    <TableCell className="text-white/70">{r.trainer}</TableCell>
                    <TableCell className="font-mono text-primary">{r.powerScore}</TableCell>
                    <TableCell>
                      <Badge className={
                        original.status === "active" ? "bg-primary/20 text-primary border border-primary/40" :
                        original.status === "inactive" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                        "bg-white/10 text-white/60 border border-white/10"
                      }>{original.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8"><Link to="/admin/athletes/$slug" params={{ slug: r.slug }}><Eye className="h-4 w-4" /></Link></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(original)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-strong border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive {r.name}?</AlertDialogTitle>
                              <AlertDialogDescription>Soft-delete only — record is retained for audit.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(original.id)} className="bg-primary hover:bg-primary/90">Archive</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-white/40">No athletes yet. Add the first one to start.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-widest">{editing ? "Edit Athlete" : "Add Athlete"}</DialogTitle>
            <DialogDescription>Writes directly to Supabase. Public site updates instantly.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(submit)} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Full Name</Label><Input {...form.register("full_name")} className="bg-white/5 border-white/10 mt-1" /><FieldError msg={form.formState.errors.full_name?.message} /></div>
            <div className="col-span-2"><Label>Slug (URL id)</Label><Input {...form.register("slug")} placeholder="e.g. muneeb" className="bg-white/5 border-white/10 mt-1" /><FieldError msg={form.formState.errors.slug?.message} /></div>
            <div><Label>Age</Label><Input type="number" {...form.register("age")} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Trainer</Label><Input {...form.register("trainer")} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Height (cm)</Label><Input type="number" {...form.register("height")} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Weight (kg)</Label><Input type="number" {...form.register("weight")} className="bg-white/5 border-white/10 mt-1" /></div>
            <div className="col-span-2">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as FormV["status"])}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="disqualified">Disqualified</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Short Bio</Label><Textarea {...form.register("short_bio")} className="bg-white/5 border-white/10 mt-1" rows={3} /></div>
            <DialogFooter className="col-span-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={upsert.isPending} className="bg-primary hover:bg-primary/90 glow-red">
                {upsert.isPending ? "Saving..." : editing ? "Save changes" : "Add athlete"}
              </Button>
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
