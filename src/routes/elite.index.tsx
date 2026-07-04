import { createFileRoute } from "@tanstack/react-router";
import { SectionHeading, GlassCard } from "@/components/common/GlassCard";
import { AthleteCard } from "@/components/elite/AthleteCard";
import { useAthletes, useLeaderboard } from "@/hooks/useElite";
import { mergeAthletesWithLeaderboard } from "@/lib/athlete-adapter";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/elite/")({
  component: EliteMembers,
  head: () => ({
    meta: [
      { title: "Elite Members — The 10 | Elite X" },
      { name: "description", content: "Meet the hand-picked athletes of the Elite X Top 10 Transformation Quest." },
      { property: "og:title", content: "The Elite X Athletes" },
      { property: "og:description", content: "Meet the athletes fighting for the AJ Fitness Club championship." },
    ],
  }),
});

function EliteMembers() {
  const { data: athletes = [], isLoading, error } = useAthletes();
  const { data: board = [] } = useLeaderboard("overall");
  const list = mergeAthletesWithLeaderboard(athletes, board);

  return (
    <section className="px-4 py-16 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="THE ROSTER"
          title="The Elite Roster"
          center
          subtitle="Hand-selected by Coach AJ. One transformation quest. Zero replacements."
        />

        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : error ? (
          <GlassCard className="text-center py-10"><p className="text-red-400 text-sm">Could not load athletes. {String(error)}</p></GlassCard>
        ) : list.length === 0 ? (
          <GlassCard className="text-center py-16">
            <p className="text-white/60">No athletes yet. The roster is being finalized.</p>
          </GlassCard>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((a, i) => <AthleteCard key={a.slug} athlete={a} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}
