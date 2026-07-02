import logoAsset from "@/assets/aj-logo.png.asset.json";

export function Logo({ className = "h-10 w-10", showText = false }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={logoAsset.url} alt="AJ Fitness Club" className={className} />
      {showText && (
        <div className="hidden sm:flex flex-col leading-none">
          <span className="font-display text-sm tracking-[0.25em] text-white">AJ FITNESS</span>
          <span className="text-[10px] tracking-[0.3em] text-primary">ELITE X</span>
        </div>
      )}
    </div>
  );
}
