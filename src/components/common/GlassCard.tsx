import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function GlassCard({
  className,
  glow = false,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { glow?: boolean; children: ReactNode }) {
  return (
    <div
      {...rest}
      className={cn(
        "relative glass-strong rounded-2xl p-6 transition-all duration-500",
        "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none",
        "before:bg-[linear-gradient(135deg,rgba(225,6,0,0.25),transparent_40%,rgba(255,255,255,0.05))] before:opacity-40 before:[mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] before:[mask-composite:exclude] before:p-px",
        glow && "hover:glow-red hover:border-primary/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-12", center && "text-center mx-auto max-w-2xl")}>
      {eyebrow && (
        <div className={cn("flex items-center gap-3 mb-4", center && "justify-center")}>
          <span className="h-px w-8 bg-primary" />
          <span className="text-xs font-display tracking-[0.4em] text-primary">{eyebrow}</span>
          <span className="h-px w-8 bg-primary" />
        </div>
      )}
      <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-gradient-red">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-white/60 text-sm md:text-base leading-relaxed">{subtitle}</p>}
    </div>
  );
}
