import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { useAthletes, useGallery, useUploadImage, useDeleteGalleryImage } from "@/hooks/useElite";
import type { GalleryImageType } from "@/lib/database.types";
import { timelinePhases } from "@/lib/analytics";

export const Route = createFileRoute("/admin/gallery")({ component: GalleryPage });

const TYPES: GalleryImageType[] = ["profile", "baseline", "progress", "achievement", "banner"];

function GalleryPage() {
  const { data: athletes = [] } = useAthletes();
  const [athleteId, setAthleteId] = useState<string>("");
  const [imgType, setImgType] = useState<GalleryImageType>("progress");
  useEffect(() => { if (!athleteId && athletes[0]) setAthleteId(athletes[0].id); }, [athletes, athleteId]);

  const { data: gallery = [] } = useGallery(athleteId || undefined);
  const upload = useUploadImage();
  const del = useDeleteGalleryImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const phases = timelinePhases(gallery.map((g) => ({ uploaded_at: g.uploaded_at, image_url: g.image_url, caption: g.caption })));

  async function handleUpload(file: File) {
    if (!athleteId) return toast.error("Pick an athlete");
    try {
      await upload.mutateAsync({ file, bucket: "gallery", path: `${athleteId}/${Date.now()}-${file.name}`, athlete_id: athleteId, image_type: imgType });
      toast.success("Photo uploaded");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
  }

  return (
    <AdminShell title="Transformation Gallery" subtitle="Manage before / progress / final imagery">
      <GlassCard>
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="min-w-52">
            <Label>Athlete</Label>
            <Select value={athleteId} onValueChange={setAthleteId}>
              <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue placeholder="Choose..." /></SelectTrigger>
              <SelectContent>{athletes.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-40">
            <Label>Phase</Label>
            <Select value={imgType} onValueChange={(v) => setImgType(v as GalleryImageType)}>
              <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <Button onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="bg-primary hover:bg-primary/90 glow-red">
            {upload.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Upload New
          </Button>
        </div>

        <h3 className="font-display uppercase tracking-widest text-sm text-white/70 mb-3">Transformation Timeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {phases.map((p, i) => (
            <div key={p.phase} className="group relative">
              <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-primary/20 to-red-950/40 border border-white/10 relative overflow-hidden">
                {p.image ? <img src={p.image.image_url} loading="lazy" className="absolute inset-0 h-full w-full object-cover" alt={p.phase} /> : (
                  <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="h-8 w-8 text-white/20" /></div>
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition" />
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] tracking-widest bg-black/60 text-primary border border-primary/40">PHASE {i + 1}</div>
                <div className="absolute bottom-0 p-3">
                  <div className="font-display text-lg">{p.phase}</div>
                  {!p.image && <div className="text-[10px] text-white/60">No photo yet</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-display uppercase tracking-widest text-sm text-white/70 mb-3">All Photos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {gallery.map((g) => (
            <div key={g.id} className="group relative rounded-xl overflow-hidden border border-white/10 aspect-[3/4]">
              <img src={g.image_url} loading="lazy" alt={g.caption ?? ""} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                <Button size="icon" variant="ghost" className="h-7 w-7 bg-black/60 text-red-400" onClick={async () => { try { await del.mutateAsync(g.id); toast("Removed"); } catch (e: any) { toast.error(e.message); } }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] tracking-widest bg-black/60 text-primary uppercase">{g.image_type}</div>
            </div>
          ))}
          {gallery.length === 0 && <div className="col-span-full text-center py-10 text-white/40 text-sm">No photos yet.</div>}
        </div>
      </GlassCard>
    </AdminShell>
  );
}
