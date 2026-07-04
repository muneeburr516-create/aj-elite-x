import { createFileRoute, Outlet, useLocation, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Elite X Admin Console — AJ Fitness Club" },
      { name: "description", content: "Private admin console for managing the Elite X Top 10 transformation quest." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const { user, isAdmin, loading } = useAuth();
  const loc = useLocation();

  // Login page is public
  if (loc.pathname === "/admin/login") return <Outlet />;

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-950">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/admin/login" />;
  return <Outlet />;
}
