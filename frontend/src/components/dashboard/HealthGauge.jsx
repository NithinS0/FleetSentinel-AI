export default function HealthGauge({ score, size = 140 }) {
  const radius = (size / 2) - 12
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, score))
  const strokeDashoffset = circumference * (1 - pct / 100)

  const color =
    pct >= 70 ? '#22C55E' :
    pct >= 45 ? '#F59E0B' :
    pct >= 25 ? '#F97316' :
    '#EF4444'

  const label =
    pct >= 70 ? 'GOOD' :
    pct >= 45 ? 'AT RISK' :
    pct >= 25 ? 'HIGH RISK' :
    'CRITICAL'

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={10}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s var(--ease), stroke 0.5s' }}
          filter={`drop-shadow(0 0 6px ${color})`}
        />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {pct}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>/ 100</div>
        <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </div>
      </div>
    </div>
  )
}
