import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Zap, Activity, Cpu, ArrowRight, CheckCircle2, ChevronRight,
  TrendingUp, AlertTriangle, Layers, Lock, Server, BarChart3, Database,
  Terminal, Bot, RefreshCw, Eye, Sparkles, Radio, Check, Globe
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [eventCount, setEventCount] = useState(103482)
  const [activeTab, setActiveTab] = useState('pipeline')
  const [simRisk, setSimRisk] = useState(23)
  const [simDowntime, setSimDowntime] = useState(2.1)
  const [simSlider, setSimSlider] = useState(0)

  // Live telemetry pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setEventCount(prev => prev + Math.floor(Math.random() * 9 - 4))
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const handleSliderChange = (val) => {
    setSimSlider(val)
    if (val === 0) {
      setSimRisk(23)
      setSimDowntime(2.1)
    } else if (val === 1) {
      setSimRisk(41)
      setSimDowntime(5.7)
    } else if (val === 2) {
      setSimRisk(64)
      setSimDowntime(8.9)
    } else {
      setSimRisk(78)
      setSimDowntime(11.4)
    }
  }

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      {/* Top Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/landing')}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(37,99,235,0.3)',
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6, color: '#0F172A' }}>
              FleetSentinel <span style={{ color: '#2563EB' }}>AI</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}>
              AUTOMOTIVE INTELLIGENCE
            </div>
          </div>
        </div>

        <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 13, fontWeight: 600, color: '#475569' }}>
          <button onClick={() => scrollToSection('problem')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }}>The Problem</button>
          <button onClick={() => scrollToSection('how-it-works')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }}>Intelligence</button>
          <button onClick={() => scrollToSection('fingerprints')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }}>Fingerprints</button>
          <button onClick={() => scrollToSection('simulator')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }}>Simulator</button>
          <button onClick={() => scrollToSection('architecture')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }}>Architecture</button>
          <button onClick={() => scrollToSection('security')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }}>Security</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: 8,
              background: '#2563EB',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            Launch Console <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section style={{
        position: 'relative',
        padding: '90px 24px 70px',
        maxWidth: 1280,
        margin: '0 auto',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Subtle radial backdrop glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 400,
          background: 'radial-gradient(ellipse at center, rgba(22,136,255,0.12), transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 'var(--r-full)',
            background: 'rgba(25, 211, 209, 0.08)',
            border: '1px solid rgba(25, 211, 209, 0.25)',
            color: 'var(--accent-cyan)',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 24,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulse 1.8s infinite' }} />
            Next-Gen Connected Vehicle Command Center
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 960,
            margin: '0 auto 20px',
          }}>
            Predict failures before they become <span style={{
              background: 'linear-gradient(135deg, #1688FF 0%, #19D3D1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>downtime.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'var(--text-secondary)',
            maxWidth: 760,
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}>
            FleetSentinel AI turns real-time connected-vehicle telemetry into predictive maintenance intelligence. 
            Identify subtle pre-failure signatures days before DTCs illuminate.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
              style={{
                fontSize: 15,
                fontWeight: 700,
                padding: '14px 30px',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 0 24px rgba(22,136,255,0.4)',
              }}
            >
              Explore the Platform <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => scrollToSection('architecture')}
              style={{
                fontSize: 15,
                fontWeight: 600,
                padding: '14px 26px',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              View Architecture <Layers size={16} />
            </button>
          </div>

          {/* TELEMETRY KPI BANNER */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            maxWidth: 1060,
            margin: '60px auto 0',
          }}>
            <div style={{ padding: '20px 24px', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginBottom: 4 }}>
                CONNECTED ASSETS
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                100,000+
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Real-time edge telemetry
              </div>
            </div>

            <div style={{ padding: '20px 24px', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginBottom: 4 }}>
                INGESTION THROUGHPUT
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0284C7', letterSpacing: '-0.02em' }}>
                100K+
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                {eventCount.toLocaleString()} events/sec live
              </div>
            </div>

            <div style={{ padding: '20px 24px', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginBottom: 4 }}>
                CRITICAL ALERT LATENCY
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#2563EB', letterSpacing: '-0.02em' }}>
                &lt; 5s
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                Sub-second edge anomaly detection
              </div>
            </div>

            <div style={{ padding: '20px 24px', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', marginBottom: 4 }}>
                AVAILABILITY TARGET
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.02em' }}>
                99.9%
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                High-availability cluster SLA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <section id="problem" style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 54 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--critical)', letterSpacing: '0.08em', marginBottom: 8 }}>
            THE CHALLENGE OF SCALE
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Why Traditional Fleet Maintenance Fails
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 620, margin: '12px auto 0' }}>
            Commercial operators lose billions annually to unscheduled roadside breakdowns that could have been predicted.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="card" style={{ padding: 32, background: 'var(--bg-card)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'rgba(239,68,68,0.12)', color: 'var(--critical)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Reactive DTC Blindness</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Diagnostic Trouble Codes (DTCs) only illuminate when damage has already occurred. By the time a check-engine light appears on cylinder #1, piston and catalytic damage is already underway.
            </p>
          </div>

          <div className="card" style={{ padding: 32, background: 'var(--bg-card)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Unplanned Roadside Downtime</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Roadside breakdowns cost up to 4× more than scheduled workshop interventions, incurring towing fees, missed delivery windows, driver overtime, and emergency repairs.
            </p>
          </div>

          <div className="card" style={{ padding: 32, background: 'var(--bg-card)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'rgba(139,92,246,0.12)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Database size={22} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Telemetry Data Overload</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              100,000 vehicles emit over 100K data points every second. Human dispatchers and traditional static threshold rules drown in noise, missing subtle cross-sensor correlation shifts.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW FLEETSENTINEL THINKS */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 54 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.08em', marginBottom: 8 }}>
            INTELLIGENCE PIPELINE
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
            How FleetSentinel Thinks
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 660, margin: '12px auto 0' }}>
            A continuous mathematical reasoning pipeline transforming high-velocity sensor streams into predictive failure action.
          </p>
        </div>

        {/* EVIDENCE CHAIN DIAGRAM */}
        <div className="card" style={{ padding: '36px 32px', background: 'var(--bg-surface)' }}>
          <div className="evidence-chain" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div className="evidence-node" style={{ padding: '16px 14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>STAGE 1</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)', margin: '6px 0 4px' }}>Telemetry Stream</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ingestion via Aiven Kafka & Redis Stream at 100K+ evt/s</p>
            </div>

            <div className="evidence-node" style={{ padding: '16px 14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>STAGE 2</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)', margin: '6px 0 4px' }}>Anomaly Detection</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Isolation Forest & rolling z-score baseline normalization</p>
            </div>

            <div className="evidence-node" style={{ padding: '16px 14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>STAGE 3</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-purple)', margin: '6px 0 4px' }}>Vector Embedding</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>128-dimensional latent vector projection in pgvector</p>
            </div>

            <div className="evidence-node" style={{ padding: '16px 14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>STAGE 4</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', margin: '6px 0 4px' }}>Fingerprint Match</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cosine similarity query against 142 historical breakdown archetypes</p>
            </div>

            <div className="evidence-node" style={{ padding: '16px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ fontSize: 11, color: 'var(--critical)', fontWeight: 700 }}>STAGE 5</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--critical)', margin: '6px 0 4px' }}>Predictive Action</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>2–5 day advance warning with SOP repair playbook dispatched</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FAILURE FINGERPRINTS */}
      <section id="fingerprints" style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.08em', marginBottom: 8 }}>
              FAILURE INTELLIGENCE
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Patterns Learned from Historical Vehicle Behaviour
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginTop: 16 }}>
              Vehicles do not fail randomly. Components follow recognizable mathematical trajectories days before mechanical seizure. 
              Our vector search identifies these subtle multidimensional fingerprints across temperature, vibration, voltage, and combustion metrics.
            </p>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <CheckCircle2 size={18} color="var(--accent-cyan)" />
                <span>142 Ground-truth breakdown archetypes cataloged</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <CheckCircle2 size={18} color="var(--accent-cyan)" />
                <span>Cosine similarity scoring across 128 sensor dimensions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <CheckCircle2 size={18} color="var(--accent-cyan)" />
                <span>Automatic mapping to standard repair playbooks (SOP)</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate('/fingerprints')}
              style={{ marginTop: 28, fontSize: 14, padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Explore Fingerprint Library <ArrowRight size={14} />
            </button>
          </div>

          {/* CLUSTER PREVIEW CARD */}
          <div className="card" style={{ padding: 28, background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>ENGINE MISFIRE</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>[ENG_01]</span>
              </div>
              <span className="badge badge-critical">91% PATTERN SIMILARITY</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>● Engine Temperature</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--critical)' }}>↑ +12.4% abnormal rise</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>● RPM Crank Variance</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)' }}>↑ +27% micro-fluctuation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>● P0301 Pending Count</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--critical)' }}>↑ +38% sub-threshold events</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>● Fuel Efficiency</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>↓ -14% thermal loss</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>142 Historical Ground-Truth Cases</span>
              <span className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>ETA to failure: 2–5 days</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: WHAT-IF MAINTENANCE SIMULATOR */}
      <section id="simulator" style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.08em', marginBottom: 8 }}>
            MAINTENANCE SCENARIO SIMULATOR
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Explore the Impact of Delaying Intervention
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 640, margin: '12px auto 0' }}>
            Interactive Monte Carlo simulation calculating failure probability and downtime costs as maintenance is deferred.
          </p>
        </div>

        <div className="card" style={{ maxWidth: 760, margin: '0 auto', padding: 36, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>DEFERRED TIMELINE:</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {simSlider === 0 ? 'INTERVENE NOW' : simSlider === 1 ? '+1 DAY DELAY' : simSlider === 2 ? '+3 DAYS DELAY' : '+7 DAYS DELAY'}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={simSlider}
            onChange={e => handleSliderChange(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer', marginBottom: 28 }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>PREDICTED FAILURE RISK</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: simRisk > 50 ? 'var(--critical)' : 'var(--warning)', marginTop: 4 }}>
                {simRisk}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                {simRisk < 30 ? 'Low catastrophic probability' : 'High likelihood of roadside stall'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>POTENTIAL FLEET DOWNTIME</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--accent-blue)', marginTop: 4 }}>
                {simDowntime}h
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                Estimated shop bay time + logistics
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: AI COPILOT */}
      <section style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', letterSpacing: '0.08em', marginBottom: 8 }}>
              CONTEXTUAL AI ASSISTANT
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              FleetSentinel Copilot
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginTop: 16 }}>
              A specialized automotive AI copilot powered by Google Gemini and live vehicle telemetry embeddings. 
              Ask complex fleet questions in plain English and receive scannable, evidence-backed diagnostic answers.
            </p>

            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span className="badge" style={{ background: 'rgba(22,136,255,0.12)', color: 'var(--accent-blue)', border: '1px solid rgba(22,136,255,0.3)' }}>LIVE TELEMETRY</span>
              <span className="badge" style={{ background: 'rgba(25,211,209,0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(25,211,209,0.3)' }}>FAILURE HISTORY</span>
              <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.3)' }}>ML PREDICTION</span>
              <span className="badge" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.3)' }}>MAINTENANCE DATA</span>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate('/copilot')}
              style={{ marginTop: 28, fontSize: 14, padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Open AI Copilot <Bot size={16} />
            </button>
          </div>

          {/* COPILOT CHAT PREVIEW */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <Bot size={18} color="var(--accent-purple)" />
              <span style={{ fontSize: 14, fontWeight: 700 }}>FleetSentinel Copilot</span>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: 13, marginBottom: 14, border: '1px solid var(--border)' }}>
                <strong>Operator:</strong> Why is vehicle TN01AB1234 at 87% high risk?
              </div>

              <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.25)', padding: 16, borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>
                  The vehicle currently has an <strong>87% predicted failure risk</strong> for Engine Misfire within 2–5 days.
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', marginBottom: 8 }}>
                  3 STRONG SIGNALS DETECTED
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>↑ 12.4% Engine Temperature</span>
                    <strong style={{ color: 'var(--critical)' }}>Abnormal</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>↑ 38% P0301 Pending Frequency</span>
                    <strong style={{ color: 'var(--warning)' }}>Elevated</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>↑ 27% RPM Crank Variance</span>
                    <strong style={{ color: 'var(--warning)' }}>Elevated</strong>
                  </div>
                </div>

                <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 12, color: 'var(--accent-cyan)' }}>
                  <strong>Recommended Action:</strong> Schedule cylinder #1 inspection within 24 hours.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: ENTERPRISE ARCHITECTURE */}
      <section id="architecture" style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 54 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.08em', marginBottom: 8 }}>
            SYSTEM TOPOLOGY
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Enterprise Automotive AI Architecture
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 660, margin: '12px auto 0' }}>
            Built for extreme throughput, sub-second latency, and fault tolerance across 100,000 active connected vehicles.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: 24, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Radio size={20} color="var(--accent-blue)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Telemetry Ingestion</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Aiven Apache Kafka distributed cluster partitioned by Vehicle VIN with Upstash Redis memory buffer handling 100,000+ events/sec.
            </p>
          </div>

          <div className="card" style={{ padding: 24, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Cpu size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>ML Inference Engine</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              FastAPI asynchronous microservices running Isolation Forest anomaly scoring and XGBoost RUL (Remaining Useful Life) regression.
            </p>
          </div>

          <div className="card" style={{ padding: 24, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Database size={20} color="var(--accent-purple)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>pgvector Database</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Supabase PostgreSQL instance with pgvector indexing 128-dimensional failure prototype vectors with HNSW sub-50ms query latency.
            </p>
          </div>

          <div className="card" style={{ padding: 24, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Bot size={20} color="var(--success)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Automotive LLM</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Google Gemini 3 Flash / Groq LLM integration with custom fleet system prompt and deterministic RAG context grounding.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8: ENTERPRISE SECURITY */}
      <section id="security" style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', letterSpacing: '0.08em', marginBottom: 8 }}>
            SECURITY & COMPLIANCE
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Built for Mission-Critical Fleets
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 640, margin: '12px auto 0' }}>
            Enterprise-grade data isolation, encrypted transport, and comprehensive auditability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: 24, background: 'var(--bg-surface)' }}>
            <Lock size={20} color="var(--success)" style={{ marginBottom: 12 }} />
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>End-to-End Encryption</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              All vehicle CAN-bus payloads and API requests encrypted via TLS 1.3 in transit and AES-256 at rest.
            </p>
          </div>

          <div className="card" style={{ padding: 24, background: 'var(--bg-surface)' }}>
            <Shield size={20} color="var(--accent-blue)" style={{ marginBottom: 12 }} />
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Granular RBAC</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Role-based access control separating Fleet Operators, Maintenance Technicians, and Depot Managers.
            </p>
          </div>

          <div className="card" style={{ padding: 24, background: 'var(--bg-surface)' }}>
            <Server size={20} color="var(--accent-cyan)" style={{ marginBottom: 12 }} />
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Air-Gapped Deployment Option</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Deployable on VPC or on-premise hardware for government, defense, and strictly isolated private networks.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 9: FINAL CTA */}
      <section style={{
        padding: '100px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)',
        borderTop: '1px solid #E2E8F0',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 18, color: '#0F172A' }}>
            Ready to Keep Your Fleet Moving?
          </h2>
          <p style={{ fontSize: 16, color: '#475569', marginBottom: 36, lineHeight: 1.6 }}>
            Join leading enterprise logistics, EV fleets, and transit operators using FleetSentinel AI to eliminate roadside breakdowns.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                fontSize: 15,
                fontWeight: 700,
                padding: '14px 32px',
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#2563EB',
                border: 'none',
                color: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                cursor: 'pointer',
              }}
            >
              Launch Live Console <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                fontSize: 15,
                fontWeight: 600,
                padding: '14px 28px',
                borderRadius: 10,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                cursor: 'pointer',
              }}
            >
              Sign In to Workspace
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 12,
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="var(--accent-blue)" />
          <strong style={{ color: 'var(--text-primary)' }}>FleetSentinel AI</strong> — Automotive Intelligence Platform
        </div>
        <div>
          © 2026 FleetSentinel AI Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
