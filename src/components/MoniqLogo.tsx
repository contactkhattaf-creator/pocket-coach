export function MoniqLogo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rounded square */}
      <rect x="16" y="16" width="480" height="480" rx="112" stroke="currentColor" strokeWidth="28" fill="none" />
      {/* Inner rounded square */}
      <rect x="72" y="72" width="368" height="368" rx="80" stroke="currentColor" strokeWidth="20" fill="none" opacity="0.55" />
      {/* M letterform — fluid monique symbol */}
      <path
        d="M136 352V224c0-28 14-48 34-48s34 20 34 48v52l52-68c8-12 16-16 28-16s20 8 20 24l26 42"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arrow pointing up-right */}
      <path
        d="M290 172L376 86M376 86V152M376 86H310"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoniqWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <MoniqLogo size={36} className="text-violet-bright" />
      <span className="font-display text-xl font-bold tracking-tight">monique</span>
    </div>
  );
}
