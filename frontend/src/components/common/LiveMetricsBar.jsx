import { useEffect, useState } from 'react'
import { Activity, Zap, AlertTriangle } from 'lucide-react'
import { fleetApi } from '../../services/api'

export default function LiveMetricsBar() {
  const [metrics, setMetrics] = useState({ events_per_sec: 0, active_alerts: 0, vehicles_at_risk: 0 })

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await fleetApi.getDashboardMetrics()
        setMetrics(data)
      } catch {}
    }
    fetch()
    const id = setInterval(fetch, 5000)
    return () => clearInterval(id)
  }, [])

  const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n

  return (
    <div className="flex items-center gap-6">
      <Metric icon={<Activity size={14} />} label="Events/sec" value={fmt(metrics.events_per_sec || 0)} color="var(--brand-400)" pulse />
      <Metric icon={<AlertTriangle size={14} />} label="Active Alerts" value={metrics.active_alerts || 0} color="var(--risk-high)" />
      <Metric icon={<Zap size={14} />} label="At Risk" value={metrics.vehicles_at_risk || 0} color="var(--risk-critical)" />
    </div>
  )
}

function Metric({ icon, label, value, color, pulse }) {
  return (
    <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
      {pulse && <span className="live-dot" />}
      <span style={{ color }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}
