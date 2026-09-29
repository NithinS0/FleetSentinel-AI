import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Fingerprint, Search, Cpu, Database, Activity, ArrowRight,
  TrendingUp, TrendingDown, CheckCircle2, ChevronRight, Zap,
  AlertTriangle, Wrench, RefreshCw, BarChart2, Shield, Bot,
} from 'lucide-react'
import { FINGERPRINTS, FLEET_VEHICLES, HERO_VEHICLE } from '../data/demoData'

// Extended fingerprint dataset with vector weights & SOP
const DETAILED_FINGERPRINTS = FINGERPRINTS.map(fp => ({
  ...fp,
  matched_vehicles: fp.code === 'ENGINE_MISFIRE'
    ? [
        { id: 'TN01AB1234', sim: 91, model: 'Toyota HiAce', status: 'CRITICAL' },
        { id: 'GJ07ST7890', sim: 74, model: 'Tata Ace CNG', status: 'AT_RISK' },
      ]
    : fp.code === 'BATTERY_DEGRADATION'
    ? [
        { id: 'KA04CD5678', sim: 84, model: 'Tata Winger EV', status: 'CRITICAL' },
        { id: 'KA06GH7890', sim: 68, model: 'Tata Nexon EV', status: 'HEALTHY' },
      ]
    : fp.code === 'COOLING_FAILURE'
    ? [
        { id: 'MH12EF9012', sim: 78, model: 'Mahindra Supro', status: 'AT_RISK' },
      ]
    : fp.code === 'BRAKE_ISSUE'
    ? [
        { id: 'KA03IJ7890', sim: 76, model: 'Ashok Leyland DOST', status: 'AT_RISK' },
      ]
    : fp.code === 'TRANSMISSION_FAULT'
    ? [
        { id: 'DL09GH3456', sim: 71, model: 'Force Traveller', status: 'AT_RISK' },
      ]
    : [
        { id: 'TS09KL1234', sim: 67, model: 'Tata Ace', status: 'AT_RISK' },
      ],
  sop: fp.code === 'ENGINE_MISFIRE'
    ? 'Standard Playbook ENG-04: Hook up OBD-II scanner, verify freeze frame data on cylinder #1/#2. Test spark plug electrode resistance and secondary coil discharge waveform.'
    : fp.code === 'BATTERY_DEGRADATION'
    ? 'Standard Playbook EV-BMS-02: Perform 100% to 10% DC load discharge test. Read individual module voltages. If cell delta > 150mV, trigger automated cell balancing cycle.'
    : fp.code === 'COOLING_FAILURE'
    ? 'Standard Playbook CLG-01: Check thermostat opening temperature via IR pyrometer. Inspect water pump belt tension, radiator flow delta, and coolant concentration.'
    : fp.code === 'BRAKE_ISSUE'
    ? 'Standard Playbook BRK-03: Measure front disc runout and pad lining thickness. Bleed brake hydraulic lines if fluid boiling point is below 160°C.'
    : fp.code === 'TRANSMISSION_FAULT'
    ? 'Standard Playbook TRN-02: Sample automatic transmission fluid for metallic shavings. Conduct hydraulic line pressure test during 2-3 shift sequence.'
    : 'Standard Playbook LUB-01: Connect mechanical master pressure gauge to oil gallery port. If pressure < 25 PSI at 2000 RPM, replace oil pump pickup screen and filter.',
  vector_weights: fp.code === 'ENGINE_MISFIRE'
    ? [
        { name: 'DTC Misfire Rate', weight: 35, color: '#EF4444' },
        { name: 'Coolant/Engine Temp', weight: 28, color: '#F59E0B' },
        { name: 'RPM Crank Variance', weight: 22, color: '#18D6D1' },
        { name: 'Fuel Consumption Δ', weight: 15, color: '#1688FF' },
      ]
    : fp.code === 'BATTERY_DEGRADATION'
    ? [
        { name: 'State of Health (SOH)', weight: 38, color: '#EF4444' },
        { name: 'Cell Voltage Delta', weight: 27, color: '#F59E0B' },
        { name: 'Internal Resistance (DCIR)', weight: 21, color: '#8B5CF6' },
        { name: 'Regen Charge Acceptance', weight: 14, color: '#20C997' },
      ]
    : [
        { name: 'Thermal Influx Rate', weight: 40, color: '#EF4444' },
        { name: 'Pump / Fan Duty Cycle', weight: 30, color: '#F59E0B' },
        { name: 'Flow Rate Delta', weight: 20, color: '#18D6D1' },
        { name: 'Ambient Differential', weight: 10, color: '#1688FF' },
      ],
}))

export default function FingerprintsPage() {
  const navigate = useNavigate()
  const [fingerprints, setFingerprints] = useState(DETAILED_FINGERPRINTS)
  const [search, setSearch] = useState('')
  const [selectedFp, setSelectedFp] = useState(DETAILED_FINGERPRINTS[0])
  const [testedVehicle, setTestedVehicle] = useState('TN01AB1234')
  const [simScore, setSimScore] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const filtered = useMemo(() => {
    return fingerprints.filter(f =>
      !search ||
      f.type.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
    )
  }, [fingerprints, search])

  const handleTestMatch = () => {
    setIsCalculating(true)
    setTimeout(() => {
      setIsCalculating(false)
      const targetVehicle = testedVehicle
      if (targetVehicle === 'TN01AB1234') {
        setSimScore({
          code: 'ENGINE_MISFIRE',
          score: 91.4,
          match: 'Critical Match (Cosine: 0.914)',
          status: 'CRITICAL',
        })
      } else if (targetVehicle === 'KA04CD5678') {
        setSimScore({
          code: 'BATTERY_DEGRADATION',
          score: 84.2,
          match: 'High Match (Cosine: 0.842)',
          status: 'CRITICAL',
        })
      } else {
        setSimScore({
          code: 'COOLING_FAILURE',
          score: 78.1,
          match: 'Elevated Match (Cosine: 0.781)',
          status: 'AT_RISK',
        })
      }
    }, 600)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Failure Intelligence</h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(24,214,209,0.12)',
              border: '1px solid rgba(24,214,209,0.3)',
              color: 'var(--accent-cyan)',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 'var(--r-full)',
            }}>
              <Database size={12} />
              Vector Store: 142 Historical Signatures
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Patterns learned from historical vehicle behaviour
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/copilot', {
              state: {
                initialPrompt: 'How does the FleetSentinel Failure Fingerprint matching engine work, and how does it detect failure patterns before traditional DTC check-engine lights illuminate?'
              }
            })}
            style={{ fontSize: 12, color: 'var(--accent-purple)' }}
          >
            <Bot size={14} /> Explain Vector Architecture
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Indexed Archetypes</span>
            <div className="stat-icon" style={{ background: 'rgba(22,136,255,0.12)', color: 'var(--accent-blue)' }}>
              <Fingerprint size={18} />
            </div>
          </div>
          <div className="stat-value">6 <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Failure Classes</span></div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            Powertrain, Thermal, Battery, Brakes
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Vector Search Latency</span>
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div className="stat-value">38 <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>ms</span></div>
          <div className="stat-sub">
            <span style={{ color: 'var(--success)' }}>Sub-100ms</span> real-time streaming SLA
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Fleet Similarity Matches</span>
            <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--risk-high)' }}>
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--risk-high)' }}>920</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            Vehicles exceeding 70% cosine similarity
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Historical Baseline Cases</span>
            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--accent-purple)' }}>
              <BarChart2 size={18} />
            </div>
          </div>
          <div className="stat-value">142</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            Ground-truth breakdowns cataloged
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Fingerprint List + Deep Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left Column: Fingerprint Archetype Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card" style={{ padding: 'var(--space-3)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                placeholder="Search fingerprints..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32, fontSize: 12, width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(fp => {
              const isSelected = selectedFp.id === fp.id
              return (
                <div
                  key={fp.id}
                  className="card"
                  onClick={() => setSelectedFp(fp)}
                  style={{
                    padding: '16px 18px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border)',
                    background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    boxShadow: isSelected ? '0 0 16px rgba(22,136,255,0.18)' : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color: fp.color,
                      }}>
                        {fp.type}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: fp.color,
                      background: fp.color_bg,
                      padding: '3px 8px',
                      borderRadius: 'var(--r-full)',
                      border: `1px solid ${fp.color}40`,
                    }}>
                      {fp.similarity}% pattern similarity
                    </span>
                  </div>

                  {/* Signals list with arrows */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    marginBottom: 10,
                  }}>
                    {fp.signals.map((sig, sIdx) => (
                      <div key={sIdx} style={{ fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>● {sig.label}</span>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 11,
                          color: sig.severity === 'critical' ? 'var(--critical)' : 'var(--warning)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}>
                          {sig.trend === 'up' ? '↑' : '↓'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{fp.matches} historical cases</span>
                    <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      Inspect Cluster <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Deep Fingerprint Details & Live Vector Matcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Selected Fingerprint Spec Card */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selectedFp.type}</h2>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    [{selectedFp.code}]
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                  {selectedFp.description}
                </p>
              </div>

              <div style={{
                background: selectedFp.color_bg,
                border: `1px solid ${selectedFp.color}`,
                padding: '8px 16px',
                borderRadius: 'var(--r-md)',
                textAlign: 'right',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>MAX FLEET SIMILARITY</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: selectedFp.color }}>
                  {selectedFp.similarity}%
                </div>
              </div>
            </div>

            {/* Contributing Vector Weights Breakdown */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="var(--accent-cyan)" />
                HIGH-DIMENSIONAL VECTOR ATTRIBUTE WEIGHTS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {selectedFp.vector_weights.map((vw, i) => (
                  <div key={i} style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{vw.name}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{vw.weight}%</strong>
                    </div>
                    <div className="risk-bar" style={{ height: 6 }}>
                      <div className="risk-bar-fill" style={{ width: `${vw.weight * 2.5}%`, background: vw.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Telemetry Signals */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                ANOMALOUS TELEMETRY SENSORS OBSERVED
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {selectedFp.signals.map((sig, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-app)',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{sig.label}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: sig.severity === 'critical' ? 'var(--critical)' : 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {sig.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {sig.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Currently Matched Vehicles in Fleet */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                FLEET VEHICLES CURRENTLY MATCHING THIS FINGERPRINT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedFp.matched_vehicles.map(v => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-app)',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: 13 }}>
                        {v.id}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {v.model}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cosine Sim:</span>
                        <strong style={{ fontSize: 13, color: v.sim >= 85 ? 'var(--critical)' : 'var(--warning)' }}>
                          {v.sim}%
                        </strong>
                      </div>
                      <span className={`badge badge-${v.status.toLowerCase()}`}>
                        {v.status}
                      </span>
                      <button
                        className="btn btn-ghost"
                        onClick={() => navigate(`/vehicles/${v.id}`)}
                        style={{ fontSize: 11, padding: '4px 8px' }}
                      >
                        Inspect Telemetry <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Standard Operating Procedure Playbook */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(22,136,255,0.08), rgba(24,214,209,0.04))',
              border: '1px solid rgba(22,136,255,0.3)',
              borderRadius: 'var(--r-md)',
              padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Wrench size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  PREVENTIVE REPAIR PLAYBOOK (SOP)
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {selectedFp.sop}
              </p>
            </div>
          </div>

          {/* Interactive Vector Cosine Similarity Matcher Box */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Cpu size={18} color="var(--accent-purple)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Live Telemetry Vector Embedding Matcher</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Select any connected vehicle in the fleet to project its real-time 128-dimensional telemetry embedding and query the vector store for nearest failure prototypes.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <select
                className="input"
                value={testedVehicle}
                onChange={e => setTestedVehicle(e.target.value)}
                style={{ minWidth: 260, fontSize: 13 }}
              >
                {FLEET_VEHICLES.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.vehicle_id} · {v.make} {v.model} ({v.status})
                  </option>
                ))}
              </select>

              <button
                className="btn btn-primary"
                onClick={handleTestMatch}
                disabled={isCalculating}
                style={{ fontSize: 12, background: 'var(--gradient-purple)' }}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw size={14} className="spin" /> Computing Cosine Vector...
                  </>
                ) : (
                  <>
                    <Zap size={14} /> Calculate Vector Similarity
                  </>
                )}
              </button>
            </div>

            {/* Calculation Result */}
            {simScore && !isCalculating && (
              <div style={{
                marginTop: 16,
                padding: 14,
                background: 'var(--bg-app)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                animation: 'fadeIn 0.2s ease',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>NEAREST FAILURE VECTOR</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    {simScore.code}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--accent-cyan)', marginTop: 2 }}>
                    {simScore.match}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: simScore.score > 85 ? 'var(--critical)' : 'var(--warning)' }}>
                      {simScore.score}%
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => navigate(`/vehicles/${testedVehicle}`)}
                    style={{ fontSize: 12 }}
                  >
                    Open Vehicle Deep-Dive <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
