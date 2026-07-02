import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Users, Trophy, Activity, Dumbbell, Target, Flame, Award, Calendar,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { GlassCard, SectionHeading } from "@/components/common/GlassCard";
import { globalStats, missionPoints, timeline, rules } from "@/data/elite";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Elite X — Top 10 Transformation Quest | AJ Fitness Club" },
      { name: "description", content: "The 90-day, invitation-only transformation quest. Meet the 10 elite athletes chasing the AJ Fitness Club championship." },
    ],
  }),
});

const stats = [
  { label: "Quest Day", value: globalStats.currentDay, suffix: "/ 90", icon: Calendar },
  { label: "Athletes", value: globalStats.totalAthletes, icon: Users },
  { label: "Current Leader", value: globalStats.currentLeader, icon: Trophy, wide: true },
  { label: "Avg Attendance", value: globalStats.averageAttendance, suffix: "%", icon: Activity },
  { label: "Peak Push-ups", value: globalStats.highestPushups, icon: Dumbbell },
  { label: "Peak Pull-ups", value: globalStats.highestPullups, icon: Target },
  { label: "Peak Chin-ups", value: globalStats.highestChinups, icon: Flame },
];

function HomePage() {
  return (
    <div className="relative">
      <Hero />
      <Stats />
      <Mission />
      <TimelineSection />
      <RulesSection />
      <CTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center px-4">
      <div className="mx-auto max-w-6xl w-full py-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="glass rounded-full px-4 py-2 flex items-center gap-3">
            <Logo className="h-6 w-6" />
            <span className="text-[11px] tracking-[0.35em] text-white/80 font-display">AJ FITNESS CLUB PRESENTS</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display font-bold tracking-tight uppercase leading-[0.9]"
        >
          <span className="block text-white/95 text-[clamp(3.5rem,12vw,10rem)]">
            ELITE <span className="text-primary drop-shadow-[0_0_40px_rgba(225,6,0,0.6)]">X</span>
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-6 flex items-center justify-center gap-4 text-primary"
        >
          <span className="h-px w-16 bg-primary/60" />
          <span className="font-display tracking-[0.5em] text-sm md:text-base">TOP 10 TRANSFORMATION QUEST</span>
          <span className="h-px w-16 bg-primary/60" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-8 mx-auto max-w-2xl text-white/70 text-base md:text-lg leading-relaxed"
        >
          Ninety days. Ten hand-picked athletes. One champion. Elite X is the invitation-only proving ground
          where AJ Fitness Club forges its next legend.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/elite"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium tracking-wide text-white shadow-[0_10px_40px_-8px_rgba(225,6,0,0.6)] hover:bg-primary/90 transition-all"
          >
            Meet the Athletes
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/leaderboards"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur px-7 py-3.5 text-sm font-medium text-white hover:border-primary/60 hover:bg-primary/10 transition-all"
          >
            View Leaderboards
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-14 font-display tracking-[0.4em] text-xs text-white/50"
        >
          STRONGER TODAY, BETTER TOMORROW.
        </motion.p>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="LIVE QUEST" title="By The Numbers" center subtitle="Real-time snapshot of the 90-day transformation quest." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={s.wide ? "sm:col-span-2" : ""}
            >
              <GlassCard glow className="h-full">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-display tracking-[0.3em] text-white/50">{s.label.toUpperCase()}</p>
                  <s.icon className="text-primary" size={18} />
                </div>
                <p className="mt-4 font-display text-3xl md:text-4xl font-bold text-white">
                  {s.value}
                  {s.suffix && <span className="text-primary text-xl ml-1">{s.suffix}</span>}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mission() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <SectionHeading eyebrow="THE MISSION" title={<>Not a gym.<br/>A proving ground.</>} subtitle="Elite X isn't a training program you sign up for. It's a title you're chosen for — and then you fight for it, day after day, for 90 days straight." />
            <div className="flex gap-4 flex-wrap">
              <div className="glass rounded-xl px-5 py-3">
                <p className="text-primary font-display text-2xl">10</p>
                <p className="text-[10px] tracking-widest text-white/60">ATHLETES</p>
              </div>
              <div className="glass rounded-xl px-5 py-3">
                <p className="text-primary font-display text-2xl">90</p>
                <p className="text-[10px] tracking-widest text-white/60">DAYS</p>
              </div>
              <div className="glass rounded-xl px-5 py-3">
                <p className="text-primary font-display text-2xl">1</p>
                <p className="text-[10px] tracking-widest text-white/60">CHAMPION</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {missionPoints.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <GlassCard glow className="h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-primary font-display text-xs tracking-[0.3em]">0{i + 1}</span>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <h3 className="font-display text-lg uppercase tracking-wide text-white">{m.title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{m.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="THE JOURNEY" title="How Elite X Works" center subtitle="A 90-day arc from baseline to championship." />
        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
          <div className="space-y-8">
            {timeline.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`relative flex md:items-center gap-6 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className="md:w-1/2 md:px-8">
                  <GlassCard glow>
                    <p className="font-display text-primary text-xs tracking-[0.35em]">STAGE {i + 1}</p>
                    <h3 className="mt-2 font-display text-2xl uppercase text-white">{t.label}</h3>
                    <p className="mt-2 text-sm text-white/60">{t.desc}</p>
                  </GlassCard>
                </div>
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 grid place-items-center h-12 w-12 rounded-full bg-primary shadow-[0_0_30px_rgba(225,6,0,0.7)] animate-pulse-glow">
                  <Award size={18} className="text-white" />
                </div>
                <div className="md:w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RulesSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="THE CODE" title="Challenge Rules" center subtitle="Non-negotiables of the Elite X quest." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <GlassCard glow className="h-full group">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-primary text-lg">R.{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(225,6,0,0.9)]" />
                </div>
                <h3 className="font-display uppercase tracking-wide text-white">{r.title}</h3>
                <p className="mt-2 text-sm text-white/60">{r.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <GlassCard className="text-center py-14 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,rgba(225,6,0,0.4),transparent_70%)]" />
          <div className="relative">
            <p className="font-display text-primary tracking-[0.4em] text-xs">ELITE X SEASON 01</p>
            <h2 className="mt-4 font-display text-4xl md:text-6xl uppercase font-bold text-gradient-red">
              Witness the Quest
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-white/70">
              Follow every rep, every measurement, every ranking in real time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/elite" className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-white glow-red hover:bg-primary/90 transition-all">
                Meet the 10
              </Link>
              <Link to="/about" className="rounded-full border border-white/20 px-7 py-3 text-sm font-medium hover:border-primary/60 hover:bg-primary/10 transition-all">
                Learn More
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
