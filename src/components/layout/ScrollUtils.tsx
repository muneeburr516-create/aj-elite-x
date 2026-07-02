import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const total = h.scrollHeight - h.clientHeight;
      setP(total > 0 ? (scrolled / total) * 100 : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[2px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-primary via-red-500 to-primary shadow-[0_0_10px_rgba(225,6,0,0.9)]"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center rounded-full glass-strong text-white transition-all duration-300 hover:bg-primary/30 hover:border-primary hover:glow-red",
        show ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-4",
      )}
    >
      <ArrowUp size={18} />
    </button>
  );
}
