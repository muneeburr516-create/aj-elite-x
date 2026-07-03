import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { challengeSettingsDefault } from "@/data/adminMock";
import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useState(challengeSettingsDefault);

  return (
    <AdminShell title="Challenge Settings" subtitle="Configure the Elite X quest">
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-display text-lg mb-4">Core Info</h3>
          <div className="space-y-4">
            <div><Label>Challenge Name</Label><Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} className="bg-white/5 border-white/10 mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (days)</Label><Input type="number" value={s.duration} onChange={(e) => setS({ ...s, duration: +e.target.value })} className="bg-white/5 border-white/10 mt-1" /></div>
              <div><Label>Current Day</Label><Input type="number" value={s.currentDay} onChange={(e) => setS({ ...s, currentDay: +e.target.value })} className="bg-white/5 border-white/10 mt-1" /></div>
            </div>
            <div><Label>Head Trainer</Label><Input value={s.trainer} onChange={(e) => setS({ ...s, trainer: e.target.value })} className="bg-white/5 border-white/10 mt-1" /></div>
            <div className="flex items-center justify-between rounded-xl p-3 bg-white/5 border border-white/10">
              <div><div className="font-medium">Friday OFF</div><div className="text-xs text-white/50">Enforce rest day every Friday.</div></div>
              <Switch checked={s.fridayOff} onCheckedChange={(v) => setS({ ...s, fridayOff: v })} />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg mb-4">Description & Rules</h3>
          <div className="space-y-4">
            <div><Label>Challenge Description</Label><Textarea value={s.description} onChange={(e) => setS({ ...s, description: e.target.value })} rows={3} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Rules</Label><Textarea value={s.rules} onChange={(e) => setS({ ...s, rules: e.target.value })} rows={3} className="bg-white/5 border-white/10 mt-1" /></div>
            <div><Label>Scoring Explanation</Label><Textarea value={s.scoring} onChange={(e) => setS({ ...s, scoring: e.target.value })} rows={3} className="bg-white/5 border-white/10 mt-1" /></div>
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => toast.success("Settings saved")} className="bg-primary hover:bg-primary/90 glow-red"><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
      </div>
    </AdminShell>
  );
}
