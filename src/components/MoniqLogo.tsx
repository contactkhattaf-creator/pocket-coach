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
      {/* Rounded square container */}
      <rect x="4" y="4" width="56" height="56" rx="16" stroke="currentColor" strokeWidth="4" fill="none" />
      {/* M letter stylized as moniq symbol with arrow */}
      <path
        d="M16 42V26C16 24 17 22 19 22C21 22 22 24 22 26V34L28 26C29 24.5 30 24 31.5 24C33 24 34 24.5 35 26L41 34V26C41 24 42 22 44 22C46 22 47 24 47 26V42"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arrow pointing up-right */}
      <path
        d="M38 18L46 10M46 10L46 17M46 10L39 10"
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
      <span className="font-display text-xl font-bold tracking-tight">moniq</span>
    </div>
  );
}
