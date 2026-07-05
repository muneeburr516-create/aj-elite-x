import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Search, Trash2, Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAthletes, useGallery, useUploadImage, useDeleteGalleryImage } from "@/hooks/useElite";

export const Route = createFileRoute("/admin/media")({ component: MediaLibraryPage });

const CATS = ["all", "profile", "baseline", "progress", "achievement", "banner"] as const;
type Cat = typeof CATS[number];

function MediaLibraryPage() {
  const [cat, setCat] = useState<Cat>("all");
  const [q, setQ] = useState("");
  const { data: gallery = [], isLoading } = useGallery();
  const { data: athletes = [] } = useAthletes();
  const upload = useUploadImage();
  const del = useDeleteGalleryImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => gallery.filter((m) =>
    (cat === "all" || m.image_type === cat) &&
    ((m.caption ?? "") + (m.image_url ?? "")).toLowerCase().includes(q.toLowerCase())
  ), [gallery, cat, q]);

  async function handleUpload(file: File) {
    try {
      await upload.mutateAsync({ file, bucket: "gallery", path: `${Date.now()}-${file.name}`, image_type: "progress" });
      toast.success("Upload complete");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
  }

  const athleteName = (id: string | null) => id ? (athletes.find((a) => a.id === id)?.full_name ?? "—") : "Unattached";

  return (
    <AdminShell title="Media Library" subtitle="Central asset store for athletes, gallery & branding">
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Tabs value={cat} onValueChange={(v) => setCat(v as Cat)}>
            <TabsList className="glass border border-white/10 bg-transparent flex-wrap h-auto">
              {CATS.map((c) => (
                <TabsTrigger key={c} value={c} className="data-[state=active]:bg-primary data-[state=active]:text-white capitalize">{c}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files..." className="pl-9 bg-white/5 border-white/10" />
          </div>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <Button className="bg-primary hover:bg-primary/90 glow-red" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Upload
          </Button>
        </div>

        {isLoading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {items.map((m) => (
              <div key={m.id} className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-primary/40 transition">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-red-950/40 flex items-center justify-center relative">
                  {m.image_url ? <img src={m.image_url} alt={m.caption ?? ""} loading="lazy" className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-primary/50" />}
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] tracking-widest bg-black/60 text-primary uppercase">{m.image_type}</div>
                </div>
                <div className="p-2">
                  <div className="text-xs truncate" title={m.caption ?? undefined}>{m.caption ?? athleteName(m.athlete_id)}</div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-white/40">
                    <span>{new Date(m.uploaded_at).toLocaleDateString()}</span>
                    <button onClick={async () => { try { await del.mutateAsync(m.id); toast("Deleted"); } catch (e: any) { toast.error(e.message); } }} className="text-red-400/70 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && items.length === 0 && <div className="text-center py-12 text-white/40 text-sm">No files match your filter.</div>}
      </GlassCard>
    </AdminShell>
  );
}
