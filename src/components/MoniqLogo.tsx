export function MoniqLogo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rounded square */}
      <rect x="3" y="3" width="58" height="58" rx="16" stroke="currentColor" strokeWidth="3.5" fill="none" />
      {/* Inner rounded square */}
      <rect x="10" y="10" width="44" height="44" rx="11" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.5" />
      {/* M letterform — fluid monique symbol */}
      <path
        d="M17 42V28C17 25 18.5 23 21 23C23.5 23 25 25 25 28V34L31 26C32 24.5 33 24 34.5 24C36 24 37 25 37 26L40 31"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arrow pointing up-right */}
      <path
        d="M36 22L46 12M46 12V20M46 12H38"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoniqWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MoniqLogo size={32} className="text-violet-bright" />
      <span className="font-display text-xl font-bold tracking-tight">monique</span>
    </div>
  );
}
