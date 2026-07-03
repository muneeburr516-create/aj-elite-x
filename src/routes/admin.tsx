import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Elite X Admin Console — AJ Fitness Club" },
      { name: "description", content: "Private admin console for managing the Elite X Top 10 transformation quest." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <Outlet />,
});
