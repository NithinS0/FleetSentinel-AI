import { useState } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Clock,
  ShieldCheck, AlertTriangle, Activity, Zap, Fuel, ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { generateHealthTrend, FLEET_SUMMARY } from '../data/demoData'

const HEALTH_TREND_DATA = generateHealthTrend(30)

const FAILURE_BREAKDOWN_DATA = [
  { name: 'Engine Misfire', value: 34, color: '#EF4444' },
  { name: 'Battery Degradation', value: 26, color: '#F59E0B' },
  { name: 'Cooling System', value: 18, color: '#18D6D1' },
  { name: 'Transmission Fault', value: 12, color: '#8B5CF6' },
  { name: 'Brake System', value: 7, color: '#F97316' },
  { name: 'Oil Pressure Low', value: 3, color: '#20C997' },
]

const EFFICIENCY_BY_TYPE = [
  { type: 'ICE Fleet', avgEff: '11.8 km/L', costPerKm: '$0.14', count: 62000, trend: '+4.2%' },
  { type: 'EV Fleet', avgEff: '18.4 kWh/100km', costPerKm: '$0.04', count: 24000, trend: '+9.1%' },
  { type: 'Hybrid', avgEff: '19.2 km/L', costPerKm: '$0.08', count: 9500, trend: '+6.4%' },
  { type: 'CNG', avgEff: '15.6 km/kg', costPerKm: '$0.07', count: 4500, trend: '+3.1%' },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Fleet Reliability & Performance Analytics</h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(22,136,255,0.12)',
              border: '1px solid rgba(22,136,255,0.3)',
              color: 'var(--accent-blue)',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 'var(--r-full)',
            }}>
              <Activity size={12} />
              100,000 Connected Assets Analyzed
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Long-term failure trends, MTBF, predictive prevention ROI, and energy efficiency analytics.
          </p>
        </div>

        {/* Time range selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-app)', padding: 4, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
          {['7d', '30d', '90d', '1y'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              style={{
                background: timeRange === r ? 'var(--navy-600)' : 'transparent',
                border: timeRange === r ? '1px solid var(--border-light)' : '1px solid transparent',
                color: timeRange === r ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Mean Time Between Failures</span>
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">1,420 <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>hrs</span></div>
          <div className="stat-sub">
            <span style={{ color: 'var(--success)' }}>↑ 28% extended</span> via preventive fixes
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Mean Time To Repair (MTTR)</span>
            <div className="stat-icon" style={{ background: 'rgba(24,214,209,0.12)', color: 'var(--accent-cyan)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">2.6 <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>hrs</span></div>
          <div className="stat-sub">
            <span style={{ color: 'var(--success)' }}>↓ 42% faster</span> with Copilot playbooks
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Downtime Cost Avoided</span>
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>$1,842,500</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            Across 920 prevented breakdown events
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Unplanned Roadside Stops</span>
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--critical)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="stat-value">14 <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>this mo</span></div>
          <div className="stat-sub">
            <span style={{ color: 'var(--success)' }}>↓ 81% reduction</span> from baseline
          </div>
        </div>
      </div>

      {/* Two Column Charts: 30-Day Health Trend + Failure Mode Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Fleet Health Trend AreaChart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Fleet Health Stability Trend (30 Days)</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Percentage of fleet operating at Healthy (&gt;80) vs At Risk (50–79) vs Critical (&lt;50)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} /> Healthy (91.2%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} /> At Risk (7.8%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--critical)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--critical)' }} /> Critical (0.9%)
              </span>
            </div>
          </div>

          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HEALTH_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[85, 96]} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="healthy" stroke="#22C55E" fill="url(#healthyGrad)" strokeWidth={2} name="Healthy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Mode Distribution Donut */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Failure Mode Distribution</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Predicted failure modes across 920 high-risk vehicles
          </p>

          <div style={{ height: 180, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={FAILURE_BREAKDOWN_DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {FAILURE_BREAKDOWN_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
            {FAILURE_BREAKDOWN_DATA.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Powertrain Energy & Cost Efficiency Table */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Powertrain Operational Efficiency Comparison</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Powertrain Archetype</th>
                <th>Registered Fleet</th>
                <th>Average Energy Efficiency</th>
                <th>Maintenance Cost / km</th>
                <th>Efficiency Trend</th>
              </tr>
            </thead>
            <tbody>
              {EFFICIENCY_BY_TYPE.map(e => (
                <tr key={e.type}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.type}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{e.count.toLocaleString()} vehicles</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{e.avgEff}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{e.costPerKm}</td>
                  <td>
                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={13} /> {e.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
