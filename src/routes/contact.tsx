import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, Twitter, MapPin, Mail, Phone, Clock } from "lucide-react";
import { SectionHeading, GlassCard } from "@/components/common/GlassCard";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — AJ Fitness Club | Elite X" },
      { name: "description", content: "Reach AJ Fitness Club. Location, socials and contact details for the home of Elite X." },
      { property: "og:title", content: "Contact AJ Fitness Club" },
    ],
  }),
});

const socials = [
  { icon: Instagram, label: "Instagram", handle: "@ajfitnessclub" },
  { icon: Facebook, label: "Facebook", handle: "AJ Fitness Club" },
  { icon: Youtube, label: "YouTube", handle: "@AJFitness" },
  { icon: Twitter, label: "X / Twitter", handle: "@ajfitness" },
];

function ContactPage() {
  return (
    <div className="px-4 py-16 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="GET IN TOUCH" title="Contact" center subtitle="Home of Elite X — AJ Fitness Club headquarters." />

        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard glow className="lg:col-span-1">
            <h3 className="font-display uppercase text-white mb-5">AJ Fitness Club</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 shrink-0">
                  <MapPin size={15} className="text-primary" />
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.25em] text-white/50">LOCATION</p>
                  <p className="text-white">AJ Fitness Club, Lahore, Pakistan</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 shrink-0">
                  <Phone size={15} className="text-primary" />
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.25em] text-white/50">PHONE</p>
                  <p className="text-white">+92 300 1234567</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 shrink-0">
                  <Mail size={15} className="text-primary" />
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.25em] text-white/50">EMAIL</p>
                  <p className="text-white">elite@ajfitness.club</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 shrink-0">
                  <Clock size={15} className="text-primary" />
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.25em] text-white/50">HOURS</p>
                  <p className="text-white">Sat–Thu · 5AM – 11PM</p>
                  <p className="text-white/50 text-xs">Friday — Recovery Day</p>
                </div>
              </li>
            </ul>
          </GlassCard>

          <GlassCard className="lg:col-span-2 p-0 overflow-hidden min-h-[380px] relative">
            <div className="absolute inset-0 opacity-90">
              <iframe
                title="AJ Fitness Club map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54427.06!2d74.34!3d31.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDMxJzEzLjQiTiA3NMKwMjAnMzYuMCJF!5e0!3m2!1sen!2s!4v1717000000000"
                className="w-full h-full grayscale contrast-125"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent pointer-events-none" />
            <div className="relative p-6 mt-auto h-full flex flex-col justify-end">
              <p className="text-[10px] tracking-[0.3em] text-primary font-display">FIND US</p>
              <h3 className="mt-1 font-display uppercase text-2xl text-white">Home of Elite X</h3>
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {socials.map((s) => (
            <a key={s.label} href="#" className="glass-strong rounded-2xl p-5 flex items-center gap-4 hover:border-primary/60 hover:bg-primary/5 transition-all group">
              <span className="grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-red-900 glow-red">
                <s.icon size={18} className="text-white" />
              </span>
              <div>
                <p className="text-[10px] tracking-[0.25em] text-white/50">{s.label.toUpperCase()}</p>
                <p className="text-white font-display group-hover:text-primary transition-colors">{s.handle}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
