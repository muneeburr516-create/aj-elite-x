import { useEffect, useState } from "react";

type Particle = { id: number; left: number; delay: number; duration: number; size: number };

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const arr: Particle[] = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 16,
      size: 2 + Math.random() * 4,
    }));
    setParticles(arr);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base */}
      <div className="absolute inset-0 bg-background" />
      {/* smoke blobs */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/20 blur-[140px] animate-drift" />
      <div className="absolute top-1/3 -right-40 h-[560px] w-[560px] rounded-full bg-primary/15 blur-[160px] animate-drift" style={{ animationDelay: "-6s" }} />
      <div className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[140px] animate-drift" style={{ animationDelay: "-12s" }} />
      {/* grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.7)_100%)]" />
      {/* particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-primary/60"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            bottom: 0,
            boxShadow: "0 0 12px rgba(225,6,0,0.8)",
            animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
