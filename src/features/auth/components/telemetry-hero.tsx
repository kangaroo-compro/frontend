import type { SVGProps } from 'react'

export function TelemetryHero(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 640 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-lg object-contain select-none"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      {...props}
    >
      <defs>
        {/* Subtle background card gradient */}
        <linearGradient id="thCardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FAF9FF" />
        </linearGradient>

        {/* Pulse wave fill gradient */}
        <linearGradient id="thPulseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4F58FF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#4F58FF" stopOpacity="0.0" />
        </linearGradient>

        {/* Grid pattern with sharp crisp dots */}
        <pattern id="thGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1" fill="#4750C9" fillOpacity="0.15" />
        </pattern>
      </defs>

      {/* Outer ambient container */}
      <rect
        x="16"
        y="16"
        width="608"
        height="448"
        rx="24"
        fill="url(#thGrid)"
        stroke="#ECEBFA"
        strokeWidth="1.5"
      />

      {/* Main Console Window Card */}
      <g>
        {/* Shadow base */}
        <rect
          x="44"
          y="44"
          width="552"
          height="392"
          rx="20"
          fill="#1E2378"
          fillOpacity="0.04"
          transform="translate(0, 6)"
        />
        {/* Main surface */}
        <rect
          x="44"
          y="44"
          width="552"
          height="392"
          rx="20"
          fill="url(#thCardBg)"
          stroke="#ECEBFA"
          strokeWidth="1.5"
        />

        {/* Header Bar */}
        <rect x="44" y="44" width="552" height="48" rx="20" fill="#FFFFFF" />
        <path d="M 44 92 L 596 92" stroke="#ECEBFA" strokeWidth="1.5" />

        {/* Window controls */}
        <circle cx="72" cy="68" r="4.5" fill="#EF4444" />
        <circle cx="88" cy="68" r="4.5" fill="#F59E0B" />
        <circle cx="104" cy="68" r="4.5" fill="#10B981" />

        {/* Console Title */}
        <text
          x="320"
          y="72"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fontWeight="700"
          fill="#22288A"
          letterSpacing="0.8"
        >
          PERUM PERURI · TELEMETRY MONITORING
        </text>

        {/* Live Status indicator badge */}
        <rect x="496" y="58" width="76" height="20" rx="10" fill="#E8F8EE" stroke="#A7F3D0" strokeWidth="1" />
        <circle cx="508" cy="68" r="3" fill="#12A150" />
        <text
          x="538"
          y="71.5"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontSize="9.5"
          fontWeight="700"
          fill="#12A150"
        >
          CONNECTED
        </text>

        {/* Row of 3 KPI Cards */}
        {/* KPI 1: Speed */}
        <g transform="translate(68, 110)">
          <rect width="144" height="84" rx="12" fill="#FFFFFF" stroke="#ECEBFA" strokeWidth="1.2" />
          <text x="14" y="24" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="600" fill="#6B6F8D">
            SPEED RATE
          </text>
          <text x="14" y="52" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="800" fill="#22288A">
            1,450
          </text>
          <text x="76" y="52" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="600" fill="#6B6F8D">
            RPM
          </text>
          <rect x="14" y="62" width="56" height="15" rx="7.5" fill="#ECEBFA" />
          <text x="42" y="73" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#4750C9">
            +4.2% NOM
          </text>
        </g>

        {/* KPI 2: Temperature */}
        <g transform="translate(248, 110)">
          <rect width="144" height="84" rx="12" fill="#FFFFFF" stroke="#ECEBFA" strokeWidth="1.2" />
          <text x="14" y="24" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="600" fill="#6B6F8D">
            CORE TEMP
          </text>
          <text x="14" y="52" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="800" fill="#22288A">
            64.8
          </text>
          <text x="64" y="52" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="600" fill="#6B6F8D">
            °C
          </text>
          <rect x="14" y="62" width="60" height="15" rx="7.5" fill="#E8F8EE" stroke="#A7F3D0" strokeWidth="1" />
          <text x="44" y="73" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#12A150">
            OPTIMAL
          </text>
        </g>

        {/* KPI 3: Efficiency */}
        <g transform="translate(428, 110)">
          <rect width="144" height="84" rx="12" fill="#FFFFFF" stroke="#ECEBFA" strokeWidth="1.2" />
          <text x="14" y="24" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="600" fill="#6B6F8D">
            EFFICIENCY
          </text>
          <text x="14" y="52" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="800" fill="#4750C9">
            99.4
          </text>
          <text x="66" y="52" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="600" fill="#4750C9">
            %
          </text>
          <rect x="14" y="62" width="62" height="15" rx="7.5" fill="#F0EEFD" stroke="#DDD8FA" strokeWidth="1" />
          <text x="45" y="73" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#4750C9">
            VERIFIED
          </text>
        </g>

        {/* Large Telemetry Chart Section */}
        <g transform="translate(68, 212)">
          <rect width="504" height="204" rx="14" fill="#FFFFFF" stroke="#ECEBFA" strokeWidth="1.2" />

          {/* Section Heading */}
          <text x="18" y="26" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="700" fill="#22288A">
            Real-Time Pressure &amp; Vibration Telemetry
          </text>
          <text x="18" y="42" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="500" fill="#6B6F8D">
            6 sensor channels active · Sampling rate 100 Hz
          </text>

          {/* Grid lines */}
          <line x1="18" y1="72" x2="486" y2="72" stroke="#F4F3FB" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="18" y1="106" x2="486" y2="106" stroke="#F4F3FB" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="18" y1="140" x2="486" y2="140" stroke="#F4F3FB" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="18" y1="174" x2="486" y2="174" stroke="#ECEBFA" strokeWidth="1.2" />

          {/* Wave Area Fill */}
          <path
            d="M 18 150 Q 80 100 140 120 T 260 85 T 380 110 T 486 70 L 486 174 L 18 174 Z"
            fill="url(#thPulseGrad)"
          />

          {/* Primary Signal Line (Indigo) */}
          <path
            d="M 18 150 Q 80 100 140 120 T 260 85 T 380 110 T 486 70"
            fill="none"
            stroke="#4F58FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secondary Signal Line (Lavender Magenta) */}
          <path
            d="M 18 160 Q 80 135 140 142 T 260 115 T 380 130 T 486 95"
            fill="none"
            stroke="#C968FF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="4 4"
          />

          {/* Data Points on Peaks */}
          <circle cx="260" cy="85" r="4.5" fill="#FFFFFF" stroke="#4F58FF" strokeWidth="2.5" />
          <circle cx="486" cy="70" r="4.5" fill="#FFFFFF" stroke="#C968FF" strokeWidth="2.5" />

          {/* Callout Badge over peak */}
          <g transform="translate(216, 52)">
            <rect width="88" height="22" rx="6" fill="#22288A" />
            <polygon points="40,22 44,26 48,22" fill="#22288A" />
            <text
              x="44"
              y="14.5"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              fontSize="9.5"
              fontWeight="700"
              fill="#FFFFFF"
            >
              3.42 BAR · OK
            </text>
          </g>
        </g>
      </g>
    </svg>
  )
}
