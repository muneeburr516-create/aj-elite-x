import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mediaLibrary } from "@/data/adminMock";
import { Upload, Image as ImageIcon, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/media")({
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  const [cat, setCat] = useState<"all" | "athlete" | "background" | "logo" | "gallery">("all");
  const [q, setQ] = useState("");

  const items = useMemo(() => mediaLibrary.filter((m) =>
    (cat === "all" || m.category === cat) && m.name.toLowerCase().includes(q.toLowerCase()),
  ), [cat, q]);

  return (
    <AdminShell title="Media Library" subtitle="Central asset store for athletes, gallery & branding">
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Tabs value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
            <TabsList className="glass border border-white/10 bg-transparent flex-wrap h-auto">
              {(["all", "athlete", "background", "logo", "gallery"] as const).map((c) => (
                <TabsTrigger key={c} value={c} className="data-[state=active]:bg-primary data-[state=active]:text-white capitalize">{c}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files..." className="pl-9 bg-white/5 border-white/10" />
          </div>
          <Button className="bg-primary hover:bg-primary/90 glow-red" onClick={() => toast.success("Upload complete")}><Upload className="h-4 w-4 mr-2" /> Upload</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {items.map((m) => (
            <div key={m.id} className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-primary/40 transition">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-red-950/40 flex items-center justify-center relative">
                <ImageIcon className="h-8 w-8 text-primary/50" />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] tracking-widest bg-black/60 text-primary uppercase">{m.category}</div>
              </div>
              <div className="p-2">
                <div className="text-xs truncate" title={m.name}>{m.name}</div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-white/40">
                  <span>{m.size}</span>
                  <button onClick={() => toast("Deleted")} className="text-red-400/70 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 && <div className="text-center py-12 text-white/40 text-sm">No files match your filter.</div>}
      </GlassCard>
    </AdminShell>
  );
}
