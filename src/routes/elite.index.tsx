import { createFileRoute } from "@tanstack/react-router";
import { SectionHeading } from "@/components/common/GlassCard";
import { AthleteCard } from "@/components/elite/AthleteCard";
import { athletes } from "@/data/elite";

export const Route = createFileRoute("/elite/")({
  component: EliteMembers,
  head: () => ({
    meta: [
      { title: "Elite Members — The 10 | Elite X" },
      { name: "description", content: "Meet the 10 hand-picked athletes of the Elite X Top 10 Transformation Quest." },
      { property: "og:title", content: "The 10 Elite X Athletes" },
      { property: "og:description", content: "Meet the athletes fighting for the AJ Fitness Club championship." },
    ],
  }),
});

function EliteMembers() {
  return (
    <section className="px-4 py-16 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="THE ROSTER"
          title="The Elite 10"
          center
          subtitle="Hand-selected by Coach AJ. Ten athletes. One transformation quest. Zero replacements."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {athletes.map((a, i) => (
            <AthleteCard key={a.slug} athlete={a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
