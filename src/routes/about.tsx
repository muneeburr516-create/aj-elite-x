import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Users, Calendar, Award, ShieldCheck, Target, Coffee } from "lucide-react";
import { SectionHeading, GlassCard } from "@/components/common/GlassCard";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Elite X — The Quest | AJ Fitness Club" },
      { name: "description", content: "What Elite X is, how the 10 athletes are chosen, how the 90-day quest is scored, and why only 10 make the cut." },
      { property: "og:title", content: "About Elite X" },
    ],
  }),
});

const criteria = [
  { icon: Users, title: "Selection Criteria", desc: "Coach AJ evaluates commitment, baseline performance, growth potential and mentality — not just current strength." },
  { icon: Target, title: "Scoring Philosophy", desc: "Every rep counts, but consistency multiplies the score. Attendance and streaks are weighted heavily." },
  { icon: Calendar, title: "Challenge Format", desc: "90 continuous days of tracked training with weekly measurement checkpoints and monthly benchmark tests." },
  { icon: Coffee, title: "Friday OFF", desc: "One dedicated recovery day. Sleep, mobility, nutrition — recovery is training." },
  { icon: ShieldCheck, title: "Why Only 10", desc: "Coaching depth over crowd size. Ten athletes get individual attention no crowded program can match." },
  { icon: Award, title: "The Prize", desc: "The champion gets the Elite X title, an exclusive kit, and a permanent place in AJ Fitness Club history." },
];

const phases = [
  { week: "WK 1", title: "Baseline", desc: "Measurements, photos, benchmark tests." },
  { week: "WK 2-4", title: "Foundation", desc: "Volume, movement quality, work capacity." },
  { week: "WK 5-8", title: "Strength", desc: "Progressive overload and power development." },
  { week: "WK 9-12", title: "Peak", desc: "Conditioning, aesthetics, championship prep." },
  { week: "DAY 90", title: "Championship", desc: "Final benchmark. Crown the Elite X champion." },
];

function AboutPage() {
  return (
    <div className="px-4 py-16 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="THE QUEST"
          title={<>About<br/>Elite X</>}
          center
          subtitle="Elite X is not a program. It's a title fought for over 90 relentless days by 10 hand-picked athletes."
        />

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <GlassCard className="text-center py-10 mb-16">
            <p className="text-white/70 max-w-3xl mx-auto leading-relaxed">
              Every year, AJ Fitness Club hand-picks ten athletes to enter Elite X — the Top 10 Transformation Quest.
              For ninety days, they train together, are measured together, and are ranked against one another daily.
              Only one walks out as the Elite X champion.
            </p>
          </GlassCard>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-20">
          {criteria.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <GlassCard glow className="h-full">
                <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 mb-4">
                  <c.icon className="text-primary" size={20} />
                </div>
                <h3 className="font-display uppercase text-white">{c.title}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{c.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <SectionHeading eyebrow="THE ARC" title="Championship Timeline" center />
        <div className="grid gap-4 md:grid-cols-5">
          {phases.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <GlassCard glow className="text-center h-full">
                <p className="text-[10px] tracking-[0.3em] text-primary font-display">{p.week}</p>
                <div className="my-3 flex justify-center">
                  <CheckCircle2 className="text-primary" />
                </div>
                <h3 className="font-display uppercase text-white text-sm">{p.title}</h3>
                <p className="mt-2 text-xs text-white/60">{p.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20">
          <GlassCard className="text-center py-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,rgba(225,6,0,0.4),transparent_70%)]" />
            <div className="relative">
              <p className="font-display text-primary tracking-[0.4em] text-xs">THE CREED</p>
              <p className="mt-4 font-display text-2xl md:text-4xl uppercase text-gradient-red max-w-3xl mx-auto">
                Stronger Today, Better Tomorrow.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
