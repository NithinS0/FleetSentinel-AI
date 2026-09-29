import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wrench, AlertTriangle, ShieldAlert, TrendingUp, TrendingDown,
  Clock, DollarSign, Activity, Bot, ChevronRight, CheckCircle2,
  Calendar, ArrowRight, Zap, Filter, Search, Sliders, X,
  FileText, ShieldCheck, ChevronDown, ChevronUp, Check,
} from 'lucide-react'
import { TOP_PREDICTIONS, FLEET_VEHICLES, getWhatIfRisk, getWhatIfDowntime } from '../data/demoData'

// Extended predictions dataset
const EXTENDED_PREDICTIONS = [
  ...TOP_PREDICTIONS.map(p => ({
    ...p,
    vin: `VIN${p.vehicle_id}98271`,
    vehicle_type: FLEET_VEHICLES.find(v => v.vehicle_id === p.vehicle_id)?.type || 'ICE',
    depot: FLEET_VEHICLES.find(v => v.vehicle_id === p.vehicle_id)?.fleet || 'Main Hub',
    recommended_action: p.failure_code === 'ENGINE_MISFIRE'
      ? 'Replace cylinder #1 ignition coil and inspect spark plug gap. Check fuel injector pulse width.'
      : p.failure_code === 'BATTERY_DEGRADATION'
      ? 'Schedule cell balancing cycle and conduct DC internal resistance (DCIR) diagnostics.'
      : p.failure_code === 'COOLING_FAILURE'
      ? 'Inspect auxiliary water pump relay and test radiator pressure cap for vapor leaks.'
      : p.failure_code === 'TRANSMISSION_FAULT'
      ? 'Perform transmission fluid flush and inspect solenoid pack shift response.'
      : p.failure_code === 'BRAKE_ISSUE'
      ? 'Replace front brake pad set and inspect disc rotor thickness variance.'
      : 'Flush oil filter housing and check pressure relief valve seating.',
    evidence_signals: p.failure_code === 'ENGINE_MISFIRE'
      ? ['P0301 recurring (8x in 6h)', 'Engine Temp +19% > 104°C', 'RPM variance +27%']
      : p.failure_code === 'BATTERY_DEGRADATION'
      ? ['SOH 58% (–14% in 30d)', 'Cell Delta > 180mV', 'Internal Resistance +32%']
      : p.failure_code === 'COOLING_FAILURE'
      ? ['Coolant temp rising +3.5°C/hr', 'Fan duty cycle 100% continuous', 'Rad core delta 3.1°C']
      : p.failure_code === 'TRANSMISSION_FAULT'
      ? ['Shift flare 2nd->3rd gear (+420ms)', 'Fluid temp 98°C', 'TCM slip flag']
      : p.failure_code === 'BRAKE_ISSUE'
      ? ['Pad sensor 2.1mm', 'Harsh braking frequency +38%', 'Rotor temp asymmetry']
      : ['Oil pressure 21 PSI (norm 35–55)', 'Sump temp 108°C', 'Low pressure warning flag'],
    prevented_cost: p.failure_code === 'ENGINE_MISFIRE' ? 2450 : p.failure_code === 'BATTERY_DEGRADATION' ? 6200 : 1850,
  })),
  {
    vehicle_id: 'KA06GH7890',
    make: 'Tata',
    model: 'Nexon EV',
    failure_type: 'Inverter Overheating',
    failure_code: 'COOLING_FAILURE',
    probability: 62,
    risk_level: 'MEDIUM',
    eta: '6–9 days',
    eta_days: [6, 9],
    status: 'OPEN',
    priority_score: 64,
    location: { lat: 12.8800, lng: 77.6400 },
    fleet: 'Bangalore Fleet A',
    vehicle_type: 'EV',
    depot: 'Bangalore Fleet A',
    recommended_action: 'Purge inverter coolant loop air pockets and inspect inverter pump impeller flow.',
    evidence_signals: ['Inverter junction temp 79°C', 'Pump RPM fluctuating', 'Coolant flow –24%'],
    prevented_cost: 3100,
  },
  {
    vehicle_id: 'GJ07ST7890',
    make: 'Tata',
    model: 'Ace CNG',
    failure_type: 'Fuel Regulator Fault',
    failure_code: 'ENGINE_MISFIRE',
    probability: 58,
    risk_level: 'MEDIUM',
    eta: '7–12 days',
    eta_days: [7, 12],
    status: 'OPEN',
    priority_score: 59,
    location: { lat: 23.0225, lng: 72.5714 },
    fleet: 'Gujarat',
    vehicle_type: 'CNG',
    depot: 'Gujarat Hub',
    recommended_action: 'Replace primary CNG stage-1 pressure regulator diaphragm and clean high-pressure filter.',
    evidence_signals: ['Rail pressure delta –22 PSI', 'Lean fuel trim +14%', 'Cold start stutter'],
    prevented_cost: 950,
  },
]

export default function PredictionsPage() {
  const navigate = useNavigate()
  const [predictions, setPredictions] = useState(EXTENDED_PREDICTIONS)
  const [search, setSearch] = useState('')
  const [failureTypeFilter, setFailureTypeFilter] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [minProb, setMinProb] = useState(50)
  const [expandedId, setExpandedId] = useState('TN01AB1234')
  const [workOrderModal, setWorkOrderModal] = useState(null)
  const [delayDays, setDelayDays] = useState(0)
  const [toastMessage, setToastMessage] = useState(null)

  // Work order form state
  const [woPriority, setWoPriority] = useState('URGENT')
  const [woAssignedBay, setWoAssignedBay] = useState('Bay 2 - Electrical & Engine Diagnostic')
  const [woNotes, setWoNotes] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered predictions
  const filteredPredictions = useMemo(() => {
    return predictions.filter(p => {
      const matchSearch =
        !search ||
        p.vehicle_id.toLowerCase().includes(search.toLowerCase()) ||
        p.make.toLowerCase().includes(search.toLowerCase()) ||
        p.model.toLowerCase().includes(search.toLowerCase()) ||
        p.failure_type.toLowerCase().includes(search.toLowerCase())

      const matchType = failureTypeFilter === 'ALL' || p.failure_code === failureTypeFilter
      const matchRisk = riskFilter === 'ALL' || p.risk_level === riskFilter
      const matchProb = p.probability >= minProb

      return matchSearch && matchType && matchRisk && matchProb
    })
  }, [predictions, search, failureTypeFilter, riskFilter, minProb])

  // Summary KPIs
  const kpis = useMemo(() => {
    const totalCritical = predictions.filter(p => p.risk_level === 'CRITICAL').length
    const totalHigh = predictions.filter(p => p.risk_level === 'HIGH').length
    const totalPreventedCost = predictions.reduce((sum, p) => sum + (p.prevented_cost || 0), 0)
    return { totalCritical, totalHigh, totalPreventedCost }
  }, [predictions])

  const handleOpenWorkOrder = (pred) => {
    setWorkOrderModal(pred)
    setWoPriority(pred.risk_level === 'CRITICAL' ? 'URGENT' : 'HIGH')
    setWoNotes(`Proactive preventive service for predicted ${pred.failure_type}. Action: ${pred.recommended_action}`)
  }

  const handleConfirmWorkOrder = () => {
    if (!workOrderModal) return
    setPredictions(prev => prev.map(p =>
      p.vehicle_id === workOrderModal.vehicle_id ? { ...p, status: 'WORK_ORDER_DISPATCHED' } : p
    ))
    showToast(`Work Order WO-${Math.floor(1000 + Math.random() * 9000)} created for ${workOrderModal.vehicle_id} on ${woAssignedBay}!`)
    setWorkOrderModal(null)
  }

  const RISK_BADGE = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'rgba(239,68,68,0.4)' },
    HIGH: { bg: 'rgba(249,115,22,0.15)', color: '#F97316', border: 'rgba(249,115,22,0.4)' },
    MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.4)' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--accent-cyan)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--r-md)',
          padding: '12px 20px',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeIn 0.2s ease',
        }}>
          <CheckCircle2 size={18} color="var(--accent-cyan)" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Predictive Maintenance Intelligence</h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: 'var(--accent-purple)',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 'var(--r-full)',
            }}>
              <Zap size={12} />
              AI Failure Forecasting Horizon: 1–14 Days
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Continuous failure risk scoring, remaining useful life (RUL) estimation, and prescheduled maintenance intervention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => showToast('Fleet Risk Model Retrained with latest 2.4M telemetry points.')}
            style={{ fontSize: 12 }}
          >
            <Activity size={14} /> Retrain ML Models
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/copilot', { state: { initialPrompt: 'Give me an executive summary of the top 3 vehicle failure risks in our fleet and the recommended work orders to dispatch today.' } })}
            style={{ fontSize: 12, background: 'var(--gradient-purple)' }}
          >
            <Bot size={14} /> Ask Copilot to Plan Work Orders
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="stat-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="stat-header">
            <span className="stat-title">Critical Failure ETA &lt; 48h</span>
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--critical)' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--critical)' }}>
            920 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>vehicles</span>
          </div>
          <div className="stat-sub">
            <span style={{ color: 'var(--critical)', fontWeight: 600 }}>Urgent intervention</span> required
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Estimated Cost Avoided</span>
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            $1.84M
          </div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            Prevented engine seizures & breakdowns
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Prediction Accuracy</span>
            <div className="stat-icon" style={{ background: 'rgba(24,214,209,0.12)', color: 'var(--accent-cyan)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value">94.6%</div>
          <div className="stat-sub">
            <span style={{ color: 'var(--accent-cyan)' }}>Validated</span> against 142 historical failure cases
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Avg Lead Time to Breakdown</span>
            <div className="stat-icon" style={{ background: 'rgba(22,136,255,0.12)', color: 'var(--accent-blue)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">4.8 <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>days</span></div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            Sufficient buffer for scheduled depot servicing
          </div>
        </div>
      </div>

      {/* Interactive What-If Scenario Simulator Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16,40,60,0.9), rgba(19,47,69,0.9))',
        border: '1px solid rgba(24,214,209,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(24,214,209,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div className="flex items-center gap-2">
            <Sliders size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Interactive Maintenance Delay "What-If" Impact Simulator</h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Simulating impact on Hero Vehicle: <strong style={{ color: 'var(--brand-400)' }}>TN01AB1234 (Toyota HiAce)</strong>
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Adjust the maintenance dispatch delay to observe the non-linear compounding risk curve and exponential roadside failure probability.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Dispatch Postponement:</span>
              <span style={{ color: delayDays === 0 ? 'var(--success)' : delayDays <= 2 ? 'var(--warning)' : 'var(--critical)', fontWeight: 700 }}>
                {delayDays === 0 ? 'Immediate Intervention (Today)' : `Delayed by +${delayDays} Days`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={delayDays}
              onChange={e => setDelayDays(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: delayDays === 0 ? 'var(--success)' : 'var(--critical)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Day 0 (Now)</span>
              <span>+1 Day</span>
              <span>+2 Days</span>
              <span>+3 Days</span>
              <span>+4 Days</span>
              <span>+5 Days (Catastrophic)</span>
            </div>
          </div>

          {/* Dynamic Calculated Outcomes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            background: 'var(--bg-app)',
            padding: 14,
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ROAD FAILURE PROB</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: getWhatIfRisk(87, delayDays) > 95 ? 'var(--critical)' : 'var(--warning)' }}>
                {getWhatIfRisk(87, delayDays)}%
              </div>
              <div style={{ fontSize: 10, color: delayDays > 0 ? 'var(--critical)' : 'var(--success)' }}>
                {delayDays === 0 ? 'Minimal in-depot risk' : `+${getWhatIfRisk(87, delayDays) - 87}% escalated`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>DOWNTIME IMPACT</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {getWhatIfDowntime(87, delayDays)} <span style={{ fontSize: 12, fontWeight: 500 }}>hrs</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Depot vs roadside tow
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMATED REPAIR</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: delayDays > 2 ? 'var(--critical)' : 'var(--text-primary)' }}>
                ${(240 * Math.pow(1.65, delayDays)).toFixed(0)}
              </div>
              <div style={{ fontSize: 10, color: delayDays > 0 ? 'var(--critical)' : 'var(--text-muted)' }}>
                {delayDays === 0 ? 'Preventive parts only' : `+${((Math.pow(1.65, delayDays) - 1) * 100).toFixed(0)}% collateral`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search vehicle, make, failure mode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, fontSize: 13, width: '100%' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Failure mode filter */}
          <select
            className="input"
            value={failureTypeFilter}
            onChange={e => setFailureTypeFilter(e.target.value)}
            style={{ width: 190, fontSize: 13 }}
          >
            <option value="ALL">All Failure Modes</option>
            <option value="ENGINE_MISFIRE">Engine Misfire</option>
            <option value="BATTERY_DEGRADATION">Battery Degradation</option>
            <option value="COOLING_FAILURE">Cooling System</option>
            <option value="TRANSMISSION_FAULT">Transmission Fault</option>
            <option value="BRAKE_ISSUE">Brake System</option>
            <option value="OIL_PRESSURE_LOW">Oil Pressure Low</option>
          </select>

          {/* Risk Level Filter */}
          <select
            className="input"
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            style={{ width: 150, fontSize: 13 }}
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
          </select>

          {/* Min probability slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Min Prob: <strong style={{ color: 'var(--text-primary)' }}>{minProb}%</strong>
            </span>
            <input
              type="range"
              min="50"
              max="90"
              value={minProb}
              onChange={e => setMinProb(parseInt(e.target.value))}
              style={{ width: 90, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* Predictions Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filteredPredictions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={36} color="var(--success)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>No vehicle predictions match filters</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try lowering the probability threshold or clearing filters.</div>
          </div>
        ) : (
          filteredPredictions.map(p => {
            const isExpanded = expandedId === p.vehicle_id
            const riskStyle = RISK_BADGE[p.risk_level] || RISK_BADGE.MEDIUM
            const isDispatched = p.status === 'WORK_ORDER_DISPATCHED'

            return (
              <div
                key={p.vehicle_id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  borderColor: isExpanded ? 'var(--border-light)' : undefined,
                  boxShadow: isExpanded ? 'var(--shadow-md)' : undefined,
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--bg-hover)' : 'transparent',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : p.vehicle_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Probability radial / badge */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 'var(--r-md)',
                      background: riskStyle.bg,
                      border: `1.5px solid ${riskStyle.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: riskStyle.color, lineHeight: 1 }}>
                        {p.probability}%
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: riskStyle.color, letterSpacing: 0.5, marginTop: 2 }}>
                        {p.risk_level}
                      </span>
                    </div>

                    {/* Vehicle info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-400)' }}>
                          {p.vehicle_id}
                        </span>
                        <span className="badge badge-normal" style={{ fontSize: 10 }}>
                          {p.vehicle_type}
                        </span>
                        {isDispatched && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--success)',
                            background: 'rgba(34,197,94,0.12)',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}>
                            <Check size={11} /> WORK ORDER DISPATCHED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.make} {p.model} · {p.depot}
                      </div>
                    </div>
                  </div>

                  {/* Failure Mode & ETA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>FAILURE MODE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.failure_type}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMATED HORIZON</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: p.risk_level === 'CRITICAL' ? 'var(--critical)' : 'var(--text-primary)' }}>
                        {p.eta}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>PRIORITY SCORE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.priority_score}/100
                      </div>
                    </div>

                    {/* Toggle expand */}
                    <div style={{ color: 'var(--text-muted)', paddingLeft: 8 }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div style={{
                    padding: '20px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-app)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}>
                    {/* Evidence & Recommended action grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                      {/* Left: Contributing Telemetry Evidence */}
                      <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                          <Activity size={15} color="var(--accent-cyan)" />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            PRIMARY TELEMETRY ANOMALY TRIGGERS
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {p.evidence_signals.map((sig, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              background: 'rgba(255,255,255,0.03)',
                              padding: '6px 10px',
                              borderRadius: 4,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                              {sig}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Prescribed Preventive Action */}
                      <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                          <Wrench size={15} color="var(--success)" />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            PRESCRIBED PREVENTIVE REPAIR ACTION
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 12 }}>
                          {p.recommended_action}
                        </p>
                        <div style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShieldCheck size={14} />
                          <span>Estimated roadside tow & collateral breakdown savings: <strong>${p.prevented_cost?.toLocaleString()}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => navigate(`/vehicles/${p.vehicle_id}`)}
                        style={{ fontSize: 12 }}
                      >
                        Deep Vehicle Telemetry <ArrowRight size={13} />
                      </button>

                      <button
                        className="btn btn-ghost"
                        onClick={() => navigate('/copilot', {
                          state: {
                            initialPrompt: `Vehicle ${p.vehicle_id} has an ${p.probability}% risk of ${p.failure_type} in ${p.eta}. Analyze the root cause and provide step-by-step diagnostic instructions for depot mechanics.`
                          }
                        })}
                        style={{ fontSize: 12, color: 'var(--accent-purple)' }}
                      >
                        <Bot size={14} /> Query Copilot Diagnostics
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenWorkOrder(p)}
                        style={{ fontSize: 12 }}
                      >
                        <Wrench size={14} /> {isDispatched ? 'Update Work Order' : 'Dispatch Work Order'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Work Order Modal */}
      {workOrderModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3,13,22,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 540, padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench size={20} color="var(--brand-400)" />
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Dispatch Proactive Work Order</h3>
              </div>
              <button
                onClick={() => setWorkOrderModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: 14, borderRadius: 'var(--r-md)', marginBottom: 16, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-400)', fontSize: 14 }}>
                  {workOrderModal.vehicle_id} ({workOrderModal.make} {workOrderModal.model})
                </span>
                <span className="badge badge-critical">
                  {workOrderModal.probability}% Risk · {workOrderModal.eta}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Target Failure Mode: {workOrderModal.failure_type}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Work Order Priority
                </label>
                <select
                  className="input"
                  value={woPriority}
                  onChange={e => setWoPriority(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="URGENT">URGENT (Ground vehicle within 4 hours)</option>
                  <option value="HIGH">HIGH (Schedule at next shift handover)</option>
                  <option value="NORMAL">NORMAL (Bundle with scheduled 30-day PM)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Assigned Maintenance Bay & Depot
                </label>
                <select
                  className="input"
                  value={woAssignedBay}
                  onChange={e => setWoAssignedBay(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Bay 2 - Electrical & Engine Diagnostic">Bay 2 - Electrical & Engine Diagnostic (Chennai Main)</option>
                  <option value="Bay 4 - EV High Voltage & Battery Diagnostics">Bay 4 - EV High Voltage & Battery Diagnostics (Bangalore)</option>
                  <option value="Bay 1 - Quick Service & Fluid Flush">Bay 1 - Quick Service & Fluid Flush (Mumbai Central)</option>
                  <option value="Mobile Service Unit 03">Mobile Roadside Technician Van 03</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Technician Instructions & Parts Requisition
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={woNotes}
                  onChange={e => setWoNotes(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setWorkOrderModal(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleConfirmWorkOrder}>
                  Confirm & Dispatch Work Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
