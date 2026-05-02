import moniqueLogo from "@/assets/monique-logo.jpeg";

export function MoniqLogo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src={moniqueLogo}
      alt="Monique"
      width={size}
      height={size}
      className={`rounded-xl object-cover ${className}`}
    />
  );
}

export function MoniqWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <MoniqLogo size={36} />
      <span className="font-display text-xl font-bold tracking-tight">monique</span>
    </div>
  );
}
