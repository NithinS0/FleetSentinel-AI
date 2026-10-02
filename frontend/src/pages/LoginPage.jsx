import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Zap, Mail, Lock, Eye, EyeOff, CheckCircle2,
  Activity, Radio, ArrowRight, Sparkles, AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const DEMO_ROLES = [
  {
    role: 'Fleet Director',
    email: 'admin@fleetsentinel.ai',
    desc: 'Full executive oversight, AI Copilot, work orders & cost analytics',
  },
  {
    role: 'Operations Lead',
    email: 'ops@fleetsentinel.ai',
    desc: 'Live telemetry stream, geospatial fleet map & active alert triage',
  },
  {
    role: 'Master Mechanic',
    email: 'mechanic@fleetsentinel.ai',
    desc: 'Diagnostic trouble codes, vector failure fingerprints & repair SOPs',
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('admin@fleetsentinel.ai')
  const [password, setPassword] = useState('Sentinel@2026!')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome to FleetSentinel AI Command Center')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const selectRole = (roleEmail) => {
    setEmail(roleEmail)
    setPassword('Sentinel@2026!')
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F6F8FB 50%, #F0F9FF 100%)',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '10%',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(22,119,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '5%',
        right: '10%',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.4,
        pointerEvents: 'none',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Main Login Container */}
      <div style={{
        width: '100%',
        maxWidth: 1040,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 32,
        alignItems: 'center',
        zIndex: 1,
      }}>
        {/* Left Column: Brand & Platform Value Showcase */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          padding: '16px 20px',
        }}>
          {/* Logo Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1688FF 0%, #18D6D1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(22,136,255,0.4)',
              flexShrink: 0,
            }}>
              <Shield size={28} color="white" strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                FleetSentinel AI
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                Connected Vehicle Intelligence
              </div>
            </div>
          </div>

          {/* Headline & Pitch */}
          <div>
            <h1 style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.25,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}>
              Predict. Prevent. <br />
              <span style={{
                background: 'linear-gradient(135deg, #18D6D1 0%, #1688FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Keep Fleets Moving.
              </span>
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 14,
              lineHeight: 1.6,
              marginTop: 12,
            }}>
              Real-time failure intelligence processing 100,000+ events/sec. Detect multi-variate sensor anomalies, match historical failure fingerprints, and dispatch proactive repairs before breakdowns happen.
            </p>
          </div>

          {/* Live Ingestion Health Ticker Card */}
          <div style={{
            background: 'rgba(16,40,60,0.6)',
            border: '1px solid rgba(29,64,87,0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.8s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>
                  STREAM PIPELINE LIVE (103,482 evt/s)
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Kafka v3.6 · TimescaleDB
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CONNECTED FLEET</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>100,000</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>MODEL ACCURACY</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-cyan)' }}>94.6%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AVOIDED COSTS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>$1.84M</div>
              </div>
            </div>
          </div>

          {/* Hackathon Badge */}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="var(--accent-purple)" />
            <span>Motorq Connected Vehicle Intelligence Hackathon 2026</span>
          </div>
        </div>

        {/* Right Column: Authentication Form Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 8px 32px rgba(15,23,42,0.10), 0 1px 3px rgba(15,23,42,0.06)',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Sign In to Command Center
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Select a preconfigured demo role or enter your credentials.
            </p>
          </div>

          {/* Quick Demo Role Switcher */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.04em' }}>
              QUICK DEMO ACCESS (CLICK TO SWITCH ROLE):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO_ROLES.map(r => {
                const isSelected = email === r.email
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => selectRole(r.email)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: isSelected ? '#EFF6FF' : '#F8FAFC',
                      border: isSelected ? '1px solid #BFDBFE' : '1px solid var(--border)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                        {r.role}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {r.email}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} color="var(--accent-blue)" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@fleetsentinel.ai"
                  style={{
                    paddingLeft: 42,
                    paddingTop: 11,
                    paddingBottom: 11,
                    fontSize: 13,
                    borderRadius: 10,
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <span style={{ fontSize: 11, color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => toast('Use default demo password: Sentinel@2026!')}>
                  Forgot Password?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  style={{
                    paddingLeft: 42,
                    paddingRight: 42,
                    paddingTop: 11,
                    paddingBottom: 11,
                    fontSize: 13,
                    borderRadius: 10,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
              />
              <label htmlFor="remember" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Keep me authenticated on this workstation
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 10,
                background: 'var(--accent-blue)',
                boxShadow: '0 4px 16px rgba(22,119,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6,
              }}
            >
              {loading ? 'Authenticating...' : (
                <>
                  Access FleetSentinel AI <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(29,64,87,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            fontSize: 11,
            color: 'var(--text-muted)',
          }}>
            <span>🔒 256-Bit SSL Encrypted</span>
            <span>•</span>
            <span>SOC2 Type II</span>
            <span>•</span>
            <span>OAuth2 & OIDC</span>
          </div>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/landing')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← View Public Product Showcase & Architecture
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
