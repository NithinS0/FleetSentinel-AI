import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car, ShieldCheck, AlertTriangle, ShieldAlert, Activity,
  TrendingUp, TrendingDown, ArrowUpRight, ChevronRight,
  Clock, MapPin, Zap, Radio, ArrowRight, Bot, Wrench,
  CheckCircle2, Sparkles, Filter,
} from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  FLEET_SUMMARY, TOP_PREDICTIONS, RECENT_ALERTS,
  generateTelemetrySeries, HERO_VEHICLE,
} from '../data/demoData'
import FleetMap from '../components/dashboard/FleetMap'

// ── Animated counter ───────────────────────────────────────────────
function AnimCounter({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = parseInt(value)
    if (isNaN(end)) { setDisplay(value); return }
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      start = Math.min(start + step, end)
      setDisplay(start)
      if (start >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return typeof display === 'number' ? display.toLocaleString() : display
}

// ── Mini Sparkline ─────────────────────────────────────────────────
function MiniSparkline({ data, color, height = 28 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const mkSpark = (base, noise, n = 10) =>
  Array.from({ length: n }, (_, i) => ({ v: base + (Math.sin(i) * noise) + (Math.random() - 0.5) * (noise / 2) }))

// ── Live Stream Ticker Simulated Events ────────────────────────────
const INITIAL_LIVE_EVENTS = [
  { id: 'ev1', time: '10:24:12.482', vehicle: 'TN01AB1234', event: 'Temperature anomaly detected (> 104.5°C)', severity: 'CRITICAL', type: 'THERMAL' },
  { id: 'ev2', time: '10:24:12.401', vehicle: 'KA04CD5678', event: 'Battery telemetry received (SOH: 58%)', severity: 'HIGH', type: 'BMS' },
  { id: 'ev3', time: '10:24:12.315', vehicle: 'MH12EF9012', event: 'Risk score updated (76% Cooling)', severity: 'HIGH', type: 'MODEL' },
  { id: 'ev4', time: '10:24:11.980', vehicle: 'DL09GH3456', event: 'Transmission slip flag logged', severity: 'MEDIUM', type: 'POWERTRAIN' },
  { id: 'ev5', time: '10:24:11.650', vehicle: 'KA03IJ7890', event: 'Brake wear pad threshold triggered', severity: 'MEDIUM', type: 'BRAKES' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [telemetrySeries, setTelemetrySeries] = useState(generateTelemetrySeries())
  const [liveEvents, setLiveEvents] = useState(INITIAL_LIVE_EVENTS)
  const [selectedVehicle, setSelectedVehicle] = useState(HERO_VEHICLE)
  const [lastUpdatedSec, setLastUpdatedSec] = useState(2)

  // Live timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdatedSec(prev => (prev >= 5 ? 1 : prev + 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Live event ticker push
  useEffect(() => {
    const eventInterval = setInterval(() => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(Math.random() * 900) + 100)}`
      const sampleVehicles = ['TN01AB1234', 'KA04CD5678', 'MH12EF9012', 'DL09GH3456', 'GJ07ST7890', 'TS09KL1234']
      const sampleEvents = [
        { event: 'Telemetry packet ingested (128-byte CAN)', severity: 'NORMAL', type: 'STREAM' },
        { event: 'Engine temperature delta +0.4°C', severity: 'HIGH', type: 'THERMAL' },
        { event: 'Vector similarity recomputed (Cosine 0.91)', severity: 'CRITICAL', type: 'VECTOR' },
        { event: 'State of Health nominal check passed', severity: 'NORMAL', type: 'BMS' },
      ]
      const chosenV = sampleVehicles[Math.floor(Math.random() * sampleVehicles.length)]
      const chosenE = sampleEvents[Math.floor(Math.random() * sampleEvents.length)]

      setLiveEvents(prev => [
        { id: `ev-${Date.now()}`, time: timeStr, vehicle: chosenV, event: chosenE.event, severity: chosenE.severity, type: chosenE.type },
        ...prev.slice(0, 5),
      ])
    }, 3200)

    return () => clearInterval(eventInterval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'relative' }}>
      {/* ── 5. DASHBOARD HERO HEADER ─────────────────────────────────── */}
      <div style={{
        position: 'relative',
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(10,29,44,0.95) 0%, rgba(14,38,56,0.85) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* Subtle Telemetry Waveform Background */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0,
          width: '55%',
          pointerEvents: 'none',
          opacity: 0.15,
          overflow: 'hidden',
        }}>
          <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <path
              d="M0,100 Q100,40 200,100 T400,100 T600,100 T800,100"
              fill="none"
              stroke="#19D3D1"
              strokeWidth="2.5"
            />
            <path
              d="M0,120 Q120,60 240,120 T480,120 T720,120 T800,120"
              fill="none"
              stroke="#1688FF"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                Fleet Intelligence
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 9px',
                borderRadius: 'var(--r-full)',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: 'var(--success)',
                fontSize: 11,
                fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.8s infinite' }} />
                LIVE
              </span>
            </div>

            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginTop: 4 }}>
              100,000 connected vehicles monitored in real time
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={13} color="var(--accent-cyan)" />
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>103,482</strong> events/sec
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} /> Last updated {lastUpdatedSec} seconds ago
              </span>
              <span>•</span>
              <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Radio size={12} /> Ingestion Health 99.98%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/fleet-map')}
              style={{ fontSize: 12, background: 'var(--bg-app)', border: '1px solid var(--border)' }}
            >
              <MapPin size={14} /> Full Geospatial Map
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/copilot')}
              style={{ fontSize: 12, background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-ai) 100%)' }}
            >
              <Bot size={14} /> Launch AI Copilot
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. KPI SECTION UPGRADE (HIERARCHICAL ASYMMETRIC) ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.4fr) repeat(3, 1fr) 1.1fr', gap: 'var(--space-4)', alignItems: 'stretch' }}>
        {/* Primary Large Hero Metric */}
        <div className="card" style={{
          padding: '22px 24px',
          background: 'linear-gradient(135deg, rgba(16,44,64,0.9), rgba(10,29,44,0.9))',
          border: '1px solid rgba(22,136,255,0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
              PRIMARY ASSET BASE
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.1, marginTop: 6 }}>
              <AnimCounter value={FLEET_SUMMARY.total} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Connected Commercial Vehicles
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status coverage:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>100% CAN Telemetry</span>
          </div>
        </div>

        {/* Secondary: 91.2% Healthy */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>FLEET HEALTH</span>
              <span className="badge badge-success" style={{ fontSize: 10 }}>NOMINAL</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)', marginTop: 6 }}>
              91.2%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {FLEET_SUMMARY.healthy.toLocaleString()} Healthy
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <MiniSparkline data={mkSpark(91, 1.2)} color="#22C55E" height={26} />
          </div>
        </div>

        {/* Secondary: 7,840 At Risk */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>ELEVATED RISK</span>
              <span className="badge badge-warning" style={{ fontSize: 10 }}>REVIEW</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--warning)', marginTop: 6 }}>
              <AnimCounter value={FLEET_SUMMARY.at_risk} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              7.8% of fleet units
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <MiniSparkline data={mkSpark(7.8, 0.8)} color="#F59E0B" height={26} />
          </div>
        </div>

        {/* Secondary: 920 Critical */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--critical)' }}>CRITICAL RISK</span>
              <span className="badge badge-critical" style={{ fontSize: 10 }}>URGENT</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--critical)', marginTop: 6 }}>
              <AnimCounter value={FLEET_SUMMARY.critical} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Immediate breakdown window
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <MiniSparkline data={mkSpark(0.9, 0.2)} color="#EF4444" height={26} />
          </div>
        </div>

        {/* Live Ingestion Metric */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(14,38,56,0.6)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-cyan)' }}>THROUGHPUT</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              103,482
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Events / sec streaming
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Kafka consumer lag: 142ms</span>
          </div>
        </div>
      </div>

      {/* ── 7. FLEET HEALTH VISUALIZATION & 9. LIVE TELEMETRY STREAM ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-6)' }}>
        {/* Large Visual Fleet Health Module */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Fleet Health Stability</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target: &gt; 90%</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Aggregated real-time condition index across all 100,000 active powertrain & battery subsystems.
            </p>
          </div>

          {/* Custom Refined Radial Gauge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', position: 'relative' }}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              {/* Outer Track */}
              <circle
                cx="110" cy="110" r="85"
                fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="14"
              />
              {/* Healthy Segment (91.2%) */}
              <circle
                cx="110" cy="110" r="85"
                fill="none" stroke="url(#healthGrad)" strokeWidth="14"
                strokeDasharray="534"
                strokeDashoffset={534 * (1 - 0.912)}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
              />
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#19D3D1" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Label */}
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                91.2%
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Fleet Health
              </div>
            </div>
          </div>

          {/* Surrounding Breakdown Pill Blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>HEALTHY</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>91,240</div>
            </div>
            <div style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>AT RISK</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>7,840</div>
            </div>
            <div style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--critical)', fontWeight: 600 }}>CRITICAL</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>920</div>
            </div>
          </div>
        </div>

        {/* ── 9. REAL-TIME EVENT STREAM ──────────────────────────────── */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={16} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Live Telemetry</h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Stream ingestion: 100K evt/s
            </span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Real-time multi-variate CAN-bus and OBD telemetry frames entering the ingestion pipeline.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
            {liveEvents.map((ev) => (
              <div
                key={ev.id}
                className="telemetry-ticker-row"
                style={{
                  borderLeft: ev.severity === 'CRITICAL' ? '3px solid var(--critical)' : ev.severity === 'HIGH' ? '3px solid var(--warning)' : '3px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {ev.time}
                  </span>
                  <span
                    className="mono"
                    onClick={() => navigate(`/vehicles/${ev.vehicle}`)}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', cursor: 'pointer' }}
                  >
                    {ev.vehicle}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                    {ev.event}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: ev.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : ev.severity === 'HIGH' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                    color: ev.severity === 'CRITICAL' ? 'var(--critical)' : ev.severity === 'HIGH' ? 'var(--warning)' : 'var(--text-muted)',
                  }}>
                    {ev.type}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Sub-second message broker latency (p99 &lt; 240ms)
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/alerts')}
              style={{ fontSize: 11, padding: '4px 8px', color: 'var(--accent-blue)' }}
            >
              View All Alerts <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 10. CRITICAL VEHICLE PANEL & 11. PREDICTION TIMELINE ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: 'var(--space-6)' }}>
        {/* Vehicles Requiring Attention */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color="var(--critical)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Vehicles Requiring Attention</h3>
            </div>
            <span className="badge badge-critical" style={{ fontSize: 10 }}>
              920 High Priority
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TOP_PREDICTIONS.slice(0, 4).map((p) => {
              const isHero = p.vehicle_id === 'TN01AB1234'
              return (
                <div
                  key={p.vehicle_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: isHero ? 'rgba(239,68,68,0.06)' : 'var(--bg-app)',
                    border: isHero ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {p.vehicle_id}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {p.make} {p.model}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {p.failure_type}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: p.risk_level === 'CRITICAL' ? 'var(--critical)' : 'var(--warning)' }}>
                        {p.probability}% Risk
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        ETA: {p.eta}
                      </div>
                    </div>

                    <button
                      className="btn btn-ghost"
                      onClick={() => navigate(`/vehicles/${p.vehicle_id}`)}
                      style={{ fontSize: 11, padding: '4px 10px', color: 'var(--accent-blue)' }}
                    >
                      Investigate →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 11. PREDICTION TIMELINE HORIZON ────────────────────────── */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="var(--accent-blue)" />
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Predicted Breakdown Horizon</h3>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Forecasting Lead Time
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Upcoming breakdown probability timeline predicted prior to catastrophic component failure.
            </p>
          </div>

          {/* Interactive Timeline Track */}
          <div className="horizon-track" style={{ margin: '20px 0' }}>
            <div className="horizon-point">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>NOW</span>
              <div className="horizon-dot" />
              <span style={{ fontSize: 10, color: 'var(--success)' }}>Nominal</span>
            </div>

            <div className="horizon-point">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>24 HRS</span>
              <div className="horizon-dot critical" />
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--critical)' }}>TN01AB1234</span>
            </div>

            <div className="horizon-point">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>3 DAYS</span>
              <div className="horizon-dot critical" />
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--critical)' }}>KA04CD5678</span>
            </div>

            <div className="horizon-point">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>5 DAYS</span>
              <div className="horizon-dot high" />
              <span className="mono" style={{ fontSize: 11, color: 'var(--warning)' }}>MH12EF9012</span>
            </div>

            <div className="horizon-point">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>7 DAYS</span>
              <div className="horizon-dot" />
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>TS09KL1234</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Avg prevention lead time: <strong>4.8 days</strong>
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/predictions')}
              style={{ fontSize: 11, padding: '4px 8px' }}
            >
              Open Predictive Center <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 8. LIVE FLEET MAP — MAJOR UPGRADE ───────────────────────── */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Live Telemetry Geospatial Grid</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Severity-aware active vehicle clusters with MapTiler dark spatial layer.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--critical)', animation: 'pulse 1.5s infinite' }} />
              Critical Breakdown Risk
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
              At Risk Subsystems
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
              Healthy Fleet
            </span>
          </div>
        </div>

        <div style={{ height: 420, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <FleetMap compact={false} />
        </div>
      </div>
    </div>
  )
}
