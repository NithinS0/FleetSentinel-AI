import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Bot, AlertTriangle, TrendingUp, TrendingDown,
  Gauge, Thermometer, Fuel, Zap, MapPin, Clock, Wrench, ChevronRight,
  ShieldAlert, Activity, ArrowRight, CheckCircle2, Sliders,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceArea,
} from 'recharts'
import { HERO_VEHICLE, HERO_EVIDENCE, generateTelemetrySeries, TOP_PREDICTIONS } from '../data/demoData'

const TELEMETRY = generateTelemetrySeries(24)

export default function VehicleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const v = HERO_VEHICLE
  const [activeTab, setActiveTab] = useState('Temperature')

  // Telemetry metric configuration
  const METRIC_CONFIG = {
    Temperature: { dataKey: 'temperature', name: 'Engine Temp', unit: '°C', color: '#EF4444', baseline: 88, threshold: 100 },
    RPM: { dataKey: 'rpm', name: 'Engine RPM', unit: 'RPM', color: '#F59E0B', baseline: 2100, threshold: 2800 },
    Speed: { dataKey: 'speed', name: 'Vehicle Speed', unit: 'km/h', color: '#1688FF', baseline: 55, threshold: 85 },
    Fuel: { dataKey: 'efficiency', name: 'Fuel Efficiency', unit: 'km/L', color: '#19D3D1', baseline: 12.1, threshold: 9 },
    Battery: { dataKey: 'efficiency', name: 'Aux Battery Voltage', unit: 'V', color: '#8B5CF6', baseline: 13.8, threshold: 11.5 },
    DTC: { dataKey: 'rpm', name: 'Diagnostic Misfire Events', unit: 'counts', color: '#EF4444', baseline: 0, threshold: 5 },
  }

  const currentMetric = METRIC_CONFIG[activeTab] || METRIC_CONFIG.Temperature

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── 12. HEADER: ADVANCED VEHICLE COMMAND PANEL ─────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/vehicles')}
          style={{ fontSize: 12, padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={14} /> ← Fleet
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/copilot', {
              state: {
                initialPrompt: `Vehicle ${v.vehicle_id} has an 87% risk of engine misfire within 2–5 days. Diagnose the root cause and recommend immediate maintenance actions.`
              }
            })}
            style={{ fontSize: 12, color: 'var(--accent-purple)', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <Bot size={14} /> Query Copilot for {v.vehicle_id}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/predictions')}
            style={{ fontSize: 12 }}
          >
            <Wrench size={14} /> Dispatch Work Order
          </button>
        </div>
      </div>

      {/* Hero Vehicle Identification Bar */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--critical)',
          }}>
            <ShieldAlert size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="mono" style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>
                {v.vehicle_id}
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 'var(--r-full)',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: 'var(--success)',
                fontSize: 10,
                fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.8s infinite' }} />
                CONNECTED ●
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {v.make} {v.model} ({v.year}) · VIN: <span className="mono">{v.vin}</span> · {v.fleet_name}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CURRENT OPERATOR</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v.driver}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>LAST SERVICE</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>{v.last_service_days} days ago</div>
          </div>
        </div>
      </div>

      {/* ── 12. HERO METRIC SPLIT PANEL ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Left: Vehicle Health Score */}
        <div className="card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(16,44,64,0.95), rgba(10,29,44,0.95))',
          border: '1px solid rgba(239,68,68,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              VEHICLE HEALTH SCORE
            </div>
            <div style={{ fontSize: 54, fontWeight: 900, color: 'var(--critical)', lineHeight: 1.1, marginTop: 4 }}>
              27 <span style={{ fontSize: 20, color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span className="badge badge-critical" style={{ fontSize: 11 }}>
                HIGH RISK
              </span>
              <span style={{ fontSize: 12, color: 'var(--critical)', fontWeight: 600 }}>
                ↓ -42 pts over 72h
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Baseline: 85/100</span>
            <div className="risk-bar" style={{ width: 120, height: 8 }}>
              <div className="risk-bar-fill" style={{ width: '27%', background: 'var(--critical)' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Thermal stress active</span>
          </div>
        </div>

        {/* Right: Failure Probability & ETA Horizon */}
        <div className="card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(16,44,64,0.95), rgba(10,29,44,0.95))',
          border: '1px solid rgba(245,158,11,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              FAILURE PROBABILITY
            </div>
            <div style={{ fontSize: 54, fontWeight: 900, color: 'var(--warning)', lineHeight: 1.1, marginTop: 4 }}>
              87%
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
              ENGINE MISFIRE
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ESTIMATED HORIZON</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--critical)', marginTop: 2 }}>
              2–5 days
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 160 }}>
              Prescribed action: Spark plug & coil #1 replacement
            </div>
          </div>
        </div>
      </div>

      {/* ── 14. "WHY THIS VEHICLE IS AT RISK?" (EVIDENCE CHAIN GRAPH) ── */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Why is this vehicle at risk?</h2>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            AI Multi-Variate Causal Chain
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          FleetSentinel AI correlates streaming sensor telemetry, diagnostic DTC recurrence, and vector failure fingerprints to establish causal evidence.
        </p>

        {/* Connected Nodes Chain */}
        <div className="evidence-chain">
          {/* Node 1 */}
          <div className="evidence-node active-risk">
            <div className="evidence-node-step">1. SENSOR DRIFT</div>
            <div className="evidence-node-val" style={{ color: 'var(--critical)' }}>104.5°C</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Temperature Rising (+19%)</div>
          </div>

          <div className="evidence-connector">
            <ArrowRight size={16} />
          </div>

          {/* Node 2 */}
          <div className="evidence-node active-risk">
            <div className="evidence-node-step">2. DIAGNOSTIC FLAG</div>
            <div className="evidence-node-val" style={{ color: 'var(--critical)' }}>P0301 (8x)</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Cylinder #1 DTC Recurrence</div>
          </div>

          <div className="evidence-connector">
            <ArrowRight size={16} />
          </div>

          {/* Node 3 */}
          <div className="evidence-node">
            <div className="evidence-node-step">3. CRANK ANOMALY</div>
            <div className="evidence-node-val" style={{ color: 'var(--warning)' }}>±1,240 RPM</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Crankshaft RPM Variance (+27%)</div>
          </div>

          <div className="evidence-connector">
            <ArrowRight size={16} />
          </div>

          {/* Node 4 */}
          <div className="evidence-node">
            <div className="evidence-node-step">4. EFFICIENCY DROP</div>
            <div className="evidence-node-val" style={{ color: 'var(--warning)' }}>7.8 km/L</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Fuel Economy Declining (–16%)</div>
          </div>

          <div className="evidence-connector">
            <ArrowRight size={16} />
          </div>

          {/* Node 5 */}
          <div className="evidence-node" style={{ borderColor: 'var(--accent-cyan)' }}>
            <div className="evidence-node-step">5. VECTOR MATCH</div>
            <div className="evidence-node-val" style={{ color: 'var(--accent-cyan)' }}>91% Cosine</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Historical Pattern FP001</div>
          </div>

          <div className="evidence-connector">
            <ArrowRight size={16} />
          </div>

          {/* Node 6 */}
          <div className="evidence-node active-risk" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <div className="evidence-node-step">6. MODEL PREDICTION</div>
            <div className="evidence-node-val" style={{ color: 'var(--critical)' }}>87% Risk</div>
            <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>Engine Misfire in 2–5d</div>
          </div>
        </div>
      </div>

      {/* ── 13. TELEMETRY CHARTS WITH TABS & ANOMALY REGION OVERLAY ──── */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>24-Hour Telemetry Multi-Stream</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Continuous sensor timeseries with real-time anomaly region detection.
            </p>
          </div>

          {/* Telemetry Metric Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-app)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
            {['Temperature', 'RPM', 'Speed', 'Fuel', 'Battery', 'DTC'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'var(--navy-600)' : 'transparent',
                  border: activeTab === tab ? '1px solid var(--border-light)' : '1px solid transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Anomaly Indicator Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, marginBottom: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: currentMetric.color }}>
            <span style={{ width: 12, height: 3, background: currentMetric.color }} /> {currentMetric.name} ({currentMetric.unit})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <span style={{ width: 12, height: 1, background: 'var(--text-muted)', borderTop: '1px dashed var(--text-muted)' }} /> Nominal Baseline ({currentMetric.baseline} {currentMetric.unit})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--critical)' }}>
            <span style={{ width: 10, height: 10, background: 'rgba(239,68,68,0.2)', border: '1px solid var(--critical)' }} /> Highlighted Anomaly Region (Hours 20:00–24:00)
          </span>
        </div>

        {/* Chart */}
        <div style={{ height: 280, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TELEMETRY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              {/* Anomaly region highlight overlay */}
              <ReferenceArea
                x1="20:00"
                x2="23:00"
                fill="rgba(239, 68, 68, 0.12)"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeDasharray="3 3"
              />
              <Area
                type="monotone"
                dataKey={currentMetric.dataKey}
                stroke={currentMetric.color}
                fill="url(#metricGrad)"
                strokeWidth={2}
                name={currentMetric.name}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diagnostic Trouble Codes (DTC) Active Table */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Active Diagnostic Trouble Codes (DTC)</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>DTC Code</th>
                <th>Subsystem</th>
                <th>Diagnostic Description</th>
                <th>Frequency</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="mono" style={{ color: 'var(--critical)', fontWeight: 700 }}>P0301</span></td>
                <td>Powertrain / Ignition</td>
                <td>Cylinder 1 Misfire Detected — secondary ignition failure</td>
                <td>8 events in 6 hrs</td>
                <td><span className="badge badge-critical">CRITICAL</span></td>
              </tr>
              <tr>
                <td><span className="mono" style={{ color: 'var(--warning)', fontWeight: 700 }}>P0302</span></td>
                <td>Powertrain / Ignition</td>
                <td>Cylinder 2 Misfire Detected — intermittent spark collapse</td>
                <td>3 events in 6 hrs</td>
                <td><span className="badge badge-warning">HIGH</span></td>
              </tr>
              <tr>
                <td><span className="mono" style={{ color: 'var(--text-secondary)' }}>P0300</span></td>
                <td>Powertrain / ECU</td>
                <td>Random/Multiple Cylinder Misfire Detected</td>
                <td>12 events in 24 hrs</td>
                <td><span className="badge badge-warning">HIGH</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
