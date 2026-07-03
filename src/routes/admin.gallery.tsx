import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { athletes } from "@/data/elite";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Eye, Trash2, Repeat2 } from "lucide-react";

export const Route = createFileRoute("/admin/gallery")({
  component: GalleryPage,
});

const phases = ["Before", "Month 1", "Month 2", "Month 3", "Final"];

function GalleryPage() {
  const [slug, setSlug] = useState(athletes[0].slug);
  const athlete = athletes.find((a) => a.slug === slug)!;

  return (
    <AdminShell title="Transformation Gallery" subtitle="Manage before / progress / final imagery">
      <GlassCard>
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="min-w-52">
            <Label>Athlete</Label>
            <Select value={slug} onValueChange={setSlug}>
              <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{athletes.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={() => toast.success("Photo uploaded")} className="bg-primary hover:bg-primary/90 glow-red"><Upload className="h-4 w-4 mr-2" /> Upload New</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {phases.map((p, i) => (
            <div key={p} className="group relative">
              <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${athlete.color} border border-white/10 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/70 transition" />
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] tracking-widest bg-black/60 text-primary border border-primary/40">PHASE {i + 1}</div>
                <div className="absolute bottom-0 p-3">
                  <div className="font-display text-lg">{p}</div>
                  <div className="text-xs text-white/60">{athlete.name}</div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/60 backdrop-blur"><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/60 backdrop-blur"><Repeat2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/60 backdrop-blur text-red-400" onClick={() => toast("Removed photo")}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </AdminShell>
  );
}
