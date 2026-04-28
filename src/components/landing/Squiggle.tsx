export function Squiggle({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 24" fill="none" aria-hidden>
      <path d="M2 12 C 14 2, 26 22, 38 12 S 62 2, 74 12 S 98 22, 118 12" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Star({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 0c.6 6.5 5 10.9 12 12-7 1.1-11.4 5.5-12 12-.6-6.5-5-10.9-12-12C7 10.9 11.4 6.5 12 0z" />
    </svg>
  );
}

export function Blob({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden>
      <path fill={color} d="M44.6,-65.9C57.2,-58.7,66.1,-44.7,71.7,-29.7C77.3,-14.7,79.5,1.4,75.1,15.5C70.7,29.6,59.7,41.7,46.7,52.1C33.7,62.5,18.7,71.2,2.2,68.4C-14.3,65.6,-32.2,51.3,-46.4,36.6C-60.6,21.9,-71.2,6.7,-71.2,-9.1C-71.2,-25,-60.6,-41.6,-46.7,-49C-32.8,-56.5,-15.5,-54.8,0.6,-55.7C16.7,-56.6,33.4,-60.1,44.6,-65.9Z" transform="translate(100 100)"/>
    </svg>
  );
}
