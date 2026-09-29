import { useState } from 'react'
import {
  Settings, Server, Cpu, Database, Activity, Shield,
  Save, CheckCircle2, Sliders, Key, BellRing, RefreshCw,
} from 'lucide-react'
import { SYSTEM_METRICS } from '../data/demoData'

export default function SettingsPage() {
  const [tempThreshold, setTempThreshold] = useState(102)
  const [misfireWindow, setMisfireWindow] = useState(6)
  const [vectorThreshold, setVectorThreshold] = useState(0.75)
  const [ingestionBatch, setIngestionBatch] = useState(5000)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {saved && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--success)',
          padding: '12px 20px',
          borderRadius: 'var(--r-md)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <CheckCircle2 size={18} color="var(--success)" />
          Platform configuration updated and broadcast to ingestion workers!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Platform Settings & Infrastructure</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Telemetry stream ingestion parameters, anomaly detection sensitivity, and microservice cluster health.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleSave} style={{ fontSize: 12 }}>
          <Save size={14} /> Save Configuration
        </button>
      </div>

      {/* Microservice Cluster Health Grid */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Server size={18} color="var(--accent-blue)" />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Distributed System Infrastructure Status</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {SYSTEM_METRICS.map(m => (
            <div key={m.label} style={{ background: 'var(--bg-app)', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.status === 'healthy' ? 'var(--success)' : 'var(--warning)' }} />
                {m.value} {m.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Detection Thresholds */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Telemetry Anomaly Thresholds</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>Engine Temp Critical Threshold:</span>
                <strong style={{ color: 'var(--critical)' }}>{tempThreshold}°C</strong>
              </div>
              <input
                type="range"
                min="95"
                max="115"
                value={tempThreshold}
                onChange={e => setTempThreshold(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--critical)' }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Triggers Critical Alert if sustained above threshold for &gt; 3 minutes.
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>DTC Recurrence Window:</span>
                <strong style={{ color: 'var(--warning)' }}>{misfireWindow} Hours</strong>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={misfireWindow}
                onChange={e => setMisfireWindow(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--warning)' }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Accumulates DTC occurrences (e.g. P0301) to compute failure risk slope.
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>Vector Cosine Similarity Match Cutoff:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{vectorThreshold}</strong>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={vectorThreshold}
                onChange={e => setVectorThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Sensitivity for triggering failure fingerprint match from vector embeddings.
              </div>
            </div>
          </div>
        </div>

        {/* Kafka & Ingestion Engine Config */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} color="var(--accent-purple)" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Stream Pipeline Settings</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Kafka Telemetry Topic
              </label>
              <input className="input" defaultValue="vehicle.telemetry.raw" style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Batch Ingestion Buffer (Events)
              </label>
              <input
                type="number"
                className="input"
                value={ingestionBatch}
                onChange={e => setIngestionBatch(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Active LLM Provider for Copilot
              </label>
              <select className="input" defaultValue="gemini" style={{ width: '100%' }}>
                <option value="gemini">Google Gemini 1.5 Pro / Flash (Recommended)</option>
                <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                <option value="mock">Local Rule-Engine Fallback</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
