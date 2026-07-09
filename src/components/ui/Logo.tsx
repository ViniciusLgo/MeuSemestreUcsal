interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

const dimensions = {
  sm: 28,
  md: 36,
  lg: 48,
}

export function Logo({ size = 'md' }: LogoProps) {
  const d = dimensions[size]

  return (
    <svg
      width={d}
      height={d}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MeuSemestreUCSAL logo"
    >
      {/* Background rounded rect */}
      <rect width="36" height="36" rx="9" fill="#161b22" />
      <rect width="36" height="36" rx="9" fill="url(#logo-grad)" fillOpacity="0.15" />

      {/* Grid lines — horizontal */}
      <line x1="8" y1="14" x2="28" y2="14" stroke="#238636" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="19" x2="28" y2="19" stroke="#238636" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="8" y1="24" x2="22" y2="24" stroke="#238636" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35" />

      {/* Top accent bar */}
      <rect x="8" y="9" width="6" height="3" rx="1.5" fill="#3fb950" />
      <rect x="16" y="9" width="4" height="3" rx="1.5" fill="#3fb950" fillOpacity="0.5" />
      <rect x="22" y="9" width="6" height="3" rx="1.5" fill="#3fb950" fillOpacity="0.25" />

      {/* Green dot accent */}
      <circle cx="26" cy="24" r="3" fill="#3fb950" />

      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3fb950" />
          <stop offset="1" stopColor="#58a6ff" />
        </linearGradient>
      </defs>
    </svg>
  )
}
