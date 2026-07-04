import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { Shield, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Elite X" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const { signIn, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [loading, user, isAdmin, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) return toast.error(error);
    toast.success("Signed in");
    router.invalidate();
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-neutral-950">
      <GlassCard className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 grid place-items-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display uppercase text-lg tracking-widest">Elite X Admin</h1>
            <p className="text-xs text-white/50">Restricted access</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="bg-white/5 border-white/10 mt-1" />
          </div>
          <div>
            <Label>Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="bg-white/5 border-white/10 mt-1" />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-primary hover:bg-primary/90 glow-red">
            {busy ? "Signing in..." : (<>Enter Console <ArrowRight className="h-4 w-4 ml-2" /></>)}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-white/50 hover:text-white">← Back to public site</Link>
        </div>
      </GlassCard>
    </div>
  );
}
