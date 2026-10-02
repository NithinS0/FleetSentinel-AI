import { useState, useMemo } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Clock,
  ShieldCheck, AlertTriangle, Activity, Zap, Fuel, ArrowUpRight,
  Download, Sparkles, CheckCircle2, ChevronRight, Layers, Car,
  Calendar, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { generateHealthTrend, FLEET_SUMMARY } from '../data/demoData'
import { downloadReportPDF, downloadCSV } from '../utils/reportTemplateGenerator'
import toast from 'react-hot-toast'

const FAILURE_BREAKDOWN_DATA = [
  { name: 'Engine Misfire', count: 313, value: 34, color: '#EF4444' },
  { name: 'Battery Degradation', count: 239, value: 26, color: '#F59E0B' },
  { name: 'Cooling System Delta', count: 166, value: 18, color: '#06B6D4' },
  { name: 'Transmission Slip', count: 110, value: 12, color: '#8B5CF6' },
  { name: 'Brake Pad Wear', count: 64, value: 7, color: '#F97316' },
  { name: 'Oil Pressure Low', count: 28, value: 3, color: '#10B981' },
]

const EFFICIENCY_BY_TYPE = [
  {
    type: 'ICE Commercial Fleet',
    icon: Fuel,
    iconColor: '#EA580C',
    iconBg: '#FFF7ED',
    count: 62000,
    share: 62,
    avgEff: '11.8 km/L',
    costPerKm: '$0.14 / km',
    healthScore: 84,
    trend: '+4.2%',
    trendPositive: true,
  },
  {
    type: 'EV Urban Delivery',
    icon: Zap,
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    count: 24000,
    share: 24,
    avgEff: '18.4 kWh/100km',
    costPerKm: '$0.04 / km',
    healthScore: 92,
    trend: '+9.1%',
    trendPositive: true,
  },
  {
    type: 'Hybrid Corridors',
    icon: Activity,
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    count: 9500,
    share: 9.5,
    avgEff: '19.2 km/L',
    costPerKm: '$0.08 / km',
    healthScore: 89,
    trend: '+6.4%',
    trendPositive: true,
  },
  {
    type: 'CNG Transit Lines',
    icon: Car,
    iconColor: '#7C3AED',
    iconBg: '#F5F3FF',
    count: 4500,
    share: 4.5,
    avgEff: '15.6 km/kg',
    costPerKm: '$0.07 / km',
    healthScore: 86,
    trend: '+3.1%',
    trendPositive: true,
  },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [exporting, setExporting] = useState(false)

  // Generate responsive trend data based on selected time range
  const trendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 180
    return generateHealthTrend(days)
  }, [timeRange])

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: 8,
          padding: '10px 14px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          fontSize: 12,
          border: '1px solid #334155',
        }}>
          <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: 4 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            <span>Healthy Fleet: <strong>{payload[0].value}%</strong></span>
          </div>
        </div>
      )
    }
    return null
  }

  // Handle Export Analytics
  const handleExportAnalytics = async () => {
    setExporting(true)
    const toastId = toast.loading('Compiling Fleet Analytics Dossier...')
    try {
      const csvData = [
        'Powertrain Type,Registered Vehicles,Fleet Share (%),Average Efficiency,Maintenance Cost per Km,Health Score,Efficiency Trend',
        ...EFFICIENCY_BY_TYPE.map(
          e => `"${e.type}",${e.count},${e.share}%,"${e.avgEff}","${e.costPerKm}",${e.healthScore},"${e.trend}"`
        )
      ].join('\n')
      
      downloadCSV(`FleetSentinel_Analytics_Performance_${new Date().toISOString().slice(0, 10)}.csv`, csvData)
      toast.success('Fleet Performance Analytics exported successfully!', { id: toastId })
    } catch (err) {
      toast.error('Failed to export analytics ledger.', { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Fleet Reliability & Performance Analytics
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', animation: 'pulse 1.8s infinite' }} />
              100,000 Connected Assets Analyzed
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 4, margin: 0 }}>
            Long-term failure trajectories, MTBF benchmarks, predictive prevention ROI, and energy efficiency analytics.
          </p>
        </div>

        {/* Action Controls & Time Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: '#FFFFFF',
            padding: 3,
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          }}>
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: '1y', label: '1Y' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                style={{
                  background: timeRange === r.id ? '#0F172A' : 'transparent',
                  border: 'none',
                  color: timeRange === r.id ? '#FFFFFF' : '#64748B',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportAnalytics}
            disabled={exporting}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#0F172A',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            }}
          >
            <Download size={13} color="#2563EB" />
            {exporting ? 'Exporting...' : 'Export Analytics'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards Row ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {/* Card 1: MTBF */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Mean Time Between Failures
            </span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#F0FDF4',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1 }}>
            1,420 <span style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>hrs</span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 12,
            padding: '3px 8px',
            borderRadius: 6,
            background: '#F0FDF4',
            color: '#15803D',
            fontSize: 11.5,
            fontWeight: 700,
          }}>
            <TrendingUp size={13} /> ↑ 28% extended
            <span style={{ fontWeight: 500, color: '#64748B', marginLeft: 4 }}>via predictive fixes</span>
          </div>
        </div>

        {/* Card 2: MTTR */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Mean Time To Repair (MTTR)
            </span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1 }}>
            2.6 <span style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>hrs</span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 12,
            padding: '3px 8px',
            borderRadius: 6,
            background: '#EFF6FF',
            color: '#1D4ED8',
            fontSize: 11.5,
            fontWeight: 700,
          }}>
            <TrendingDown size={13} /> ↓ 42% faster
            <span style={{ fontWeight: 500, color: '#64748B', marginLeft: 4 }}>with Copilot playbooks</span>
          </div>
        </div>

        {/* Card 3: Downtime Cost Avoided */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #BBF7D0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#15803D', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Downtime Cost Avoided
            </span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#16A34A', letterSpacing: '-0.02em', lineHeight: 1 }}>
            $1,842,500
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={13} color="#16A34A" /> Across 920 prevented breakdown events
          </div>
        </div>

        {/* Card 4: Unplanned Roadside Stops */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #FECACA',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Unplanned Roadside Stops
            </span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1 }}>
            14 <span style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>this mo</span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 12,
            padding: '3px 8px',
            borderRadius: 6,
            background: '#F0FDF4',
            color: '#15803D',
            fontSize: 11.5,
            fontWeight: 700,
          }}>
            <TrendingDown size={13} /> ↓ 81% reduction
            <span style={{ fontWeight: 500, color: '#64748B', marginLeft: 4 }}>from baseline</span>
          </div>
        </div>
      </div>

      {/* ── Middle Grid: Health Stability Trend + Failure Distribution ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1.15fr)',
        gap: 20,
      }}>
        {/* Left Chart: 30-Day Fleet Stability Trend */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Fleet Health Stability Trend ({timeRange.toUpperCase()})
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0 0' }}>
                Percentage of active fleet operating at Healthy (&gt;80), At Risk (50–79), and Critical (&lt;50)
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 6,
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#15803D',
                fontSize: 11.5,
                fontWeight: 700,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A' }} />
                Healthy (91.2%)
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 6,
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#B45309',
                fontSize: 11.5,
                fontWeight: 700,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B' }} />
                At Risk (7.8%)
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 6,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontSize: 11.5,
                fontWeight: 700,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />
                Critical (0.9%)
              </span>
            </div>
          </div>

          <div style={{ height: 300, width: '100%', marginTop: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  domain={[85, 96]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="healthy"
                  stroke="#16A34A"
                  fill="url(#healthyAreaGrad)"
                  strokeWidth={2.5}
                  name="Healthy %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Failure Mode Donut & Breakdown */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Failure Mode Distribution
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0 0' }}>
              Predicted failure archetypes across 920 high-risk vehicles
            </p>
          </div>

          {/* Donut Chart with Centered Number */}
          <div style={{ height: 180, position: 'relative', margin: '10px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={FAILURE_BREAKDOWN_DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {FAILURE_BREAKDOWN_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#FFFFFF',
                  }}
                  formatter={(val, name) => [`${val}% of high-risk assets`, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Label */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>920</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                High Risk
              </div>
            </div>
          </div>

          {/* Structured Legend List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
            {FAILURE_BREAKDOWN_DATA.map(item => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 6,
                  transition: 'background 0.15s ease',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ color: '#334155', fontWeight: 600 }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{item.count} units</span>
                  <strong style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: '#0F172A',
                    minWidth: 32,
                    textAlign: 'right',
                  }}>
                    {item.value}%
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Powertrain Efficiency Table + ROI Widget ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1.15fr)',
        gap: 20,
      }}>
        {/* Left: Powertrain Operational Efficiency Comparison Table */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Powertrain Operational Efficiency Comparison
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0 0' }}>
                Benchmarking fuel economy, electrification benefits, and lifecycle wear across 100,000 assets
              </p>
            </div>
            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
              Updated Hourly
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Powertrain Archetype
                  </th>
                  <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Fleet Count
                  </th>
                  <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Energy Efficiency
                  </th>
                  <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Maint. Cost / km
                  </th>
                  <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Health Index
                  </th>
                  <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {EFFICIENCY_BY_TYPE.map(e => {
                  const Icon = e.icon
                  return (
                    <tr
                      key={e.type}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: e.iconBg,
                            color: e.iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{e.type}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{e.share}% of total fleet</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px', fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                        <div>{e.count.toLocaleString()} units</div>
                        <div style={{
                          width: 80,
                          height: 4,
                          background: '#E2E8F0',
                          borderRadius: 2,
                          marginTop: 4,
                          overflow: 'hidden',
                        }}>
                          <div style={{ width: `${e.share}%`, height: '100%', background: e.iconColor }} />
                        </div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: '#0F172A',
                        }}>
                          {e.avgEff}
                        </span>
                      </td>

                      <td style={{ padding: '14px', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>
                        {e.costPerKm}
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#16A34A' }}>{e.healthScore}</span>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>/ 100</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#16A34A',
                          fontWeight: 700,
                          fontSize: 12,
                          background: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}>
                          <TrendingUp size={12} /> {e.trend}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Predictive ROI & Diagnostic Insights */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sparkles size={16} color="#7C3AED" />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Predictive Maintenance ROI
              </h3>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
              Calculated savings across 920 prevented breakdown events
            </p>

            {/* Savings Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Emergency Towing Avoided</span>
                  <strong style={{ color: '#0F172A', fontWeight: 800 }}>$460,000</strong>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>920 roadside dispatches prevented at $500/call</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Emergency Labor Surcharge</span>
                  <strong style={{ color: '#0F172A', fontWeight: 800 }}>$622,500</strong>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Repaired during scheduled depot off-peak bays</div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Transit Delivery SLA Fines</span>
                  <strong style={{ color: '#0F172A', fontWeight: 800 }}>$760,000</strong>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Zero shipment default penalties sustained</div>
              </div>
            </div>
          </div>

          {/* AI Observation Card */}
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
            border: '1px solid #BFDBFE',
            borderRadius: 12,
            padding: '14px 16px',
            marginTop: 18,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              AI Copilot Diagnostic Insight
            </div>
            <div style={{ fontSize: 12, color: '#1E293B', lineHeight: 1.5 }}>
              Electric vehicles have achieved a <strong>71% lower maintenance cost per kilometer</strong> compared to ICE commercial units, with zero battery thermal anomalies recorded over the past 30 days.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

