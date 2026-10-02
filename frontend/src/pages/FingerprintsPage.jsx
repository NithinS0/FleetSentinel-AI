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
            className="btn btn-secondary"
            onClick={() => navigate('/copilot', {
              state: {
                initialPrompt: 'How does the FleetSentinel Failure Fingerprint matching engine work, and how does it detect failure patterns before traditional DTC check-engine lights illuminate?'
              }
            })}
            style={{ fontSize: 12, padding: '7px 14px', color: '#7C3AED', borderColor: '#DDD6FE', background: '#F5F3FF' }}
          >
            <Bot size={14} color="#7C3AED" /> Explain Vector Architecture
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: '16px 20px', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Indexed Archetypes
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
              <Fingerprint size={17} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4, letterSpacing: '-0.02em' }}>
            6 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Failure Classes</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Powertrain, Thermal, Battery, Brakes
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: '#FFFFFF', borderColor: '#BBF7D0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vector Search Latency
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <Cpu size={17} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--success)', marginTop: 4, letterSpacing: '-0.02em' }}>
            38 <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>ms</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>
            Sub-100ms real-time streaming SLA
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: '#FFFFFF', borderColor: '#FED7AA' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fleet Similarity Matches
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }}>
              <Activity size={17} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#EA580C', marginTop: 4, letterSpacing: '-0.02em' }}>
            920 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>vehicles</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Exceeding 70% cosine similarity
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historical Baseline Cases
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <BarChart2 size={17} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4, letterSpacing: '-0.02em' }}>
            142 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>cases</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Ground-truth breakdowns cataloged
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Fingerprint List + Deep Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left Column: Fingerprint Archetype Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card" style={{ padding: '10px 14px', background: '#FFFFFF', border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                placeholder="Search fingerprints..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36, fontSize: 13, width: '100%', height: 38 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(fp => {
              const isSelected = selectedFp.id === fp.id
              const isCritical = fp.similarity >= 85
              const isWarning = fp.similarity >= 75 && fp.similarity < 85

              return (
                <div
                  key={fp.id}
                  className="card"
                  onClick={() => setSelectedFp(fp)}
                  style={{
                    padding: '16px 18px',
                    cursor: 'pointer',
                    borderRadius: 'var(--r-lg)',
                    border: isSelected ? '2px solid var(--brand-500)' : '1px solid var(--border)',
                    background: '#FFFFFF',
                    boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.12)' : 'var(--shadow-xs)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      color: isCritical ? '#DC2626' : isWarning ? '#D97706' : 'var(--brand-600)',
                    }}>
                      {fp.type}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isCritical ? '#DC2626' : isWarning ? '#D97706' : '#2563EB',
                      background: isCritical ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#EFF6FF',
                      padding: '3px 8px',
                      borderRadius: 'var(--r-full)',
                      border: `1px solid ${isCritical ? '#FECACA' : isWarning ? '#FDE68A' : '#BFDBFE'}`,
                    }}>
                      {fp.similarity}% pattern similarity
                    </span>
                  </div>

                  {/* Signals list with indicators */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '10px 12px',
                    background: '#F8FAFC',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid #E2E8F0',
                    marginBottom: 12,
                  }}>
                    {fp.signals.map((sig, sIdx) => (
                      <div key={sIdx} style={{ fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sig.severity === 'critical' ? '#DC2626' : '#D97706', flexShrink: 0 }} />
                          {sig.label.replace('● ', '')}
                        </span>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 11,
                          color: sig.severity === 'critical' ? '#DC2626' : '#D97706',
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
                    <span style={{ color: 'var(--brand-600)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                      Inspect Cluster <ChevronRight size={13} />
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
          <div className="card" style={{ padding: '24px 28px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedFp.type}</h2>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-600)', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 4 }}>
                    {selectedFp.code}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                  {selectedFp.description}
                </p>
              </div>

              <div style={{
                background: selectedFp.similarity >= 85 ? '#FEF2F2' : selectedFp.similarity >= 75 ? '#FFFBEB' : '#EFF6FF',
                border: `1px solid ${selectedFp.similarity >= 85 ? '#FECACA' : selectedFp.similarity >= 75 ? '#FDE68A' : '#BFDBFE'}`,
                padding: '10px 18px',
                borderRadius: 'var(--r-md)',
                textAlign: 'right',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>MAX FLEET SIMILARITY</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: selectedFp.similarity >= 85 ? '#DC2626' : selectedFp.similarity >= 75 ? '#D97706' : '#2563EB', lineHeight: 1.1, marginTop: 2 }}>
                  {selectedFp.similarity}%
                </div>
              </div>
            </div>

            {/* Contributing Vector Weights Breakdown */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.02em' }}>
                <Activity size={15} color="var(--brand-600)" />
                HIGH-DIMENSIONAL VECTOR ATTRIBUTE WEIGHTS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                {selectedFp.vector_weights.map((vw, i) => (
                  <div key={i} style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{vw.name}</span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{vw.weight}%</strong>
                    </div>
                    <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${vw.weight * 2.5}%`, background: vw.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Telemetry Signals */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '0.02em' }}>
                ANOMALOUS TELEMETRY SENSORS OBSERVED
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                {selectedFp.signals.map((sig, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: '#F8FAFC',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid #E2E8F0',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{sig.label.replace('● ', '')}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: sig.severity === 'critical' ? '#DC2626' : '#D97706',
                      background: sig.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                      border: `1px solid ${sig.severity === 'critical' ? '#FECACA' : '#FDE68A'}`,
                      padding: '3px 8px',
                      borderRadius: 'var(--r-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {sig.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {sig.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Currently Matched Vehicles in Fleet */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '0.02em' }}>
                FLEET VEHICLES CURRENTLY MATCHING THIS FINGERPRINT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedFp.matched_vehicles.map(v => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid #E2E8F0',
                      boxShadow: 'var(--shadow-xs)',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-600)', fontSize: 13 }}>
                        {v.id}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {v.model}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#F1F5F9',
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #E2E8F0',
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cosine Sim:</span>
                        <strong style={{ fontSize: 12, color: v.sim >= 85 ? '#DC2626' : '#D97706' }}>
                          {v.sim}%
                        </strong>
                      </div>
                      <span className={`badge badge-${v.status.toLowerCase()}`}>
                        {v.status}
                      </span>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/vehicles/${v.id}`)}
                        style={{ fontSize: 11, padding: '5px 10px' }}
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
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 'var(--r-md)',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Wrench size={16} color="var(--brand-600)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600)', letterSpacing: '0.03em' }}>
                  PREVENTIVE REPAIR PLAYBOOK (SOP)
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {selectedFp.sop}
              </p>
            </div>
          </div>

          {/* Interactive Vector Cosine Similarity Matcher Box */}
          <div className="card" style={{ padding: '24px 28px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={17} color="#7C3AED" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Live Telemetry Vector Embedding Matcher</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
              Select any connected vehicle in the fleet to project its real-time 128-dimensional telemetry embedding and query the vector store for nearest failure prototypes.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <select
                className="input"
                value={testedVehicle}
                onChange={e => setTestedVehicle(e.target.value)}
                style={{ minWidth: 280, fontSize: 13, height: 38 }}
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
                style={{ fontSize: 12, height: 38, padding: '0 18px', background: '#7C3AED', borderColor: '#6D28D9' }}
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
                marginTop: 18,
                padding: '16px 20px',
                background: '#F8FAFC',
                borderRadius: 'var(--r-lg)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                animation: 'fadeIn 0.2s ease',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.03em' }}>NEAREST FAILURE VECTOR</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    {simScore.code}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--brand-600)', marginTop: 2, fontWeight: 500 }}>
                    {simScore.match}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: simScore.score > 85 ? 'var(--critical)' : 'var(--warning)' }}>
                      {simScore.score}%
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/vehicles/${testedVehicle}`)}
                    style={{ fontSize: 12, padding: '7px 14px' }}
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
