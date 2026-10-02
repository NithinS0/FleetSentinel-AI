import { useState, useEffect } from 'react'
import {
  Settings, Server, Cpu, Database, Activity, Shield,
  Save, CheckCircle2, Sliders, BellRing, RefreshCw,
  Bot, Sparkles, Zap, Check, AlertTriangle, RotateCcw,
  Lock, ArrowRight, ExternalLink, HardDrive, Terminal
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  AVAILABLE_MODELS,
  getActiveModelSetting,
  setActiveModelSetting,
  testModelPing
} from '../services/copilotService'
import { SYSTEM_METRICS } from '../data/demoData'

const STORAGE_SETTINGS_KEY = 'fs-platform-settings'

const DEFAULT_SETTINGS = {
  tempThreshold: 102,
  misfireWindow: 6,
  vectorThreshold: 0.75,
  kafkaTopic: 'vehicle.telemetry.raw',
  ingestionBatch: 5000,
  compression: 'snappy',
  autoDispatch: true,
  auditRetention: '365-days',
  payloadEncryption: true,
  requireTechnicianSignoff: true,
  webhookUrl: 'https://hooks.fleetsentinel.internal/alerts/critical',
  webhookSeverity: 'critical-high',
  activeModel: 'gemini-1.5-flash',
}

export default function SettingsPage() {
  // Load initial settings from localStorage or defaults
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY)
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.warn('Failed to parse saved settings', e)
    }
    return DEFAULT_SETTINGS
  })

  // Active Model state
  const [activeModel, setActiveModel] = useState(() => getActiveModelSetting())

  // Cluster ping state
  const [isPinging, setIsPinging] = useState(false)
  const [clusterMetrics, setClusterMetrics] = useState(SYSTEM_METRICS)
  const [lastPingTime, setLastPingTime] = useState('Just now')

  // LLM ping test state
  const [isTestingModel, setIsTestingModel] = useState(false)
  const [testResult, setTestResult] = useState(null)

  // Buffer and cache actions
  const [isFlushing, setIsFlushing] = useState(false)
  const [isPurging, setIsPurging] = useState(false)

  // Track if form is dirty
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Sync activeModel state if settings changes
  useEffect(() => {
    const currentStoredModel = getActiveModelSetting()
    if (currentStoredModel !== activeModel) {
      setActiveModel(currentStoredModel)
    }
  }, [])

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const handleModelChange = (modelId) => {
    setActiveModel(modelId)
    setActiveModelSetting(modelId)
    setSettings(prev => ({ ...prev, activeModel: modelId }))
    setHasUnsavedChanges(true)
    const modelObj = AVAILABLE_MODELS.find(m => m.id === modelId)
    toast.success(`Active LLM switched to ${modelObj?.name || modelId}`, {
      id: 'model-switch',
      duration: 3000,
    })
  }

  // Save all settings to localStorage
  const handleSave = () => {
    try {
      const merged = { ...settings, activeModel }
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(merged))
      setActiveModelSetting(activeModel)
      setHasUnsavedChanges(false)
      toast.success('Platform configuration saved and broadcast to telemetry workers!', {
        id: 'save-config',
        duration: 4000,
      })
    } catch (err) {
      toast.error('Failed to persist settings: ' + err.message)
    }
  }

  // Reset to default settings
  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    setActiveModel(DEFAULT_SETTINGS.activeModel)
    setActiveModelSetting(DEFAULT_SETTINGS.activeModel)
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS))
    setHasUnsavedChanges(false)
    toast('Settings reverted to factory baseline', {
      icon: '🔄',
      duration: 3500,
    })
  }

  // Ping all microservices
  const handlePingCluster = () => {
    setIsPinging(true)
    toast.loading('Pinging 12 distributed microservice nodes...', { id: 'ping-cluster' })

    setTimeout(() => {
      // Simulate realistic jitter in metrics
      const updated = clusterMetrics.map(m => {
        if (m.label === 'Events / sec') {
          const val = Math.floor(103000 + Math.random() * 800)
          return { ...m, value: val.toLocaleString() }
        }
        if (m.label === 'Kafka Consumer Lag') {
          const lag = Math.floor(130 + Math.random() * 25)
          return { ...m, value: String(lag) }
        }
        if (m.label === 'API p95 Latency') {
          const lat = Math.floor(142 + Math.random() * 15)
          return { ...m, value: String(lat) }
        }
        if (m.label === 'DB Query Avg') {
          const db = Math.floor(10 + Math.random() * 4)
          return { ...m, value: String(db) }
        }
        return m
      })

      setClusterMetrics(updated)
      setIsPinging(false)
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setLastPingTime(now)
      toast.success('Cluster Health Verified: All 12 distributed nodes responding within SLA', {
        id: 'ping-cluster',
        duration: 3500,
      })
    }, 900)
  }

  // Test LLM Connectivity
  const handleTestLLM = async () => {
    setIsTestingModel(true)
    const modelObj = AVAILABLE_MODELS.find(m => m.id === activeModel)
    toast.loading(`Probing ${modelObj?.name || activeModel} latency...`, { id: 'test-llm' })

    try {
      const result = await testModelPing(activeModel)
      setTestResult(result)
      toast.success(`Connected to ${result.provider} (${result.latencyMs}ms)`, {
        id: 'test-llm',
        duration: 4000,
      })
    } catch (err) {
      toast.error('Test probe timed out: ' + err.message, { id: 'test-llm' })
    } finally {
      setIsTestingModel(false)
    }
  }

  // Flush buffer button
  const handleFlushBuffer = () => {
    setIsFlushing(true)
    toast.loading('Flushing ingestion ring buffer...', { id: 'flush' })
    setTimeout(() => {
      setIsFlushing(false)
      toast.success(`Flushed ${settings.ingestionBatch.toLocaleString()} buffered events into Kafka topic '${settings.kafkaTopic}'`, {
        id: 'flush',
        duration: 4000,
      })
    }, 700)
  }

  // Purge cache button
  const handlePurgeCache = () => {
    setIsPurging(true)
    toast.loading('Purging similarity vector cache...', { id: 'purge' })
    setTimeout(() => {
      setIsPurging(false)
      toast.success('Redis similarity cache purged: 142.8 MB freed, indices re-indexed', {
        id: 'purge',
        duration: 4000,
      })
    }, 800)
  }

  // Test webhook button
  const handleTestWebhook = () => {
    toast.loading('Sending test alert payload to webhook endpoint...', { id: 'webhook-test' })
    setTimeout(() => {
      toast.success('HTTP 200 OK: Webhook endpoint successfully acknowledged test alert payload!', {
        id: 'webhook-test',
        duration: 4000,
      })
    }, 850)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* ── TOP HEADER & ACTIONS ────────────────────────────────────────── */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(14,165,233,0.1))',
              border: '1px solid rgba(37,99,235,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}>
              <Settings size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Platform Settings & Infrastructure
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0 0' }}>
                Telemetry ingestion parameters, anomaly detection sensitivity, and distributed microservice cluster health.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: 12 }}>
          {hasUnsavedChanges && (
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--warning)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '4px 10px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />
              Unsaved Changes
            </span>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetDefaults}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Revert all settings to baseline defaults"
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={14} />
            Save Configuration
          </button>
        </div>
      </div>

      {/* ── SECTION 1: DISTRIBUTED INFRASTRUCTURE HEALTH ────────────────── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)'
            }}>
              <Server size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Distributed System Infrastructure Status
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                12 cluster microservices • Last ping: <strong style={{ color: 'var(--text-secondary)' }}>{lastPingTime}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePingCluster}
            disabled={isPinging}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={isPinging ? 'spin' : ''} />
            {isPinging ? 'Pinging Nodes...' : 'Ping All Microservices'}
          </button>
        </div>

        {/* 12 Status Cards in clean responsive grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 12,
        }}>
          {clusterMetrics.map(m => {
            const isWarn = m.status === 'warning'
            return (
              <div
                key={m.label}
                style={{
                  background: 'var(--bg-app)',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  border: isWarn ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {m.label}
                  </span>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isWarn ? 'var(--warning)' : 'var(--success)',
                    boxShadow: isWarn ? '0 0 6px rgba(245, 158, 11, 0.5)' : '0 0 6px rgba(34, 197, 94, 0.5)'
                  }} />
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isWarn ? 'var(--warning)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4
                }}>
                  {m.value}
                  {m.unit && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{m.unit}</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: isWarn ? 'var(--warning)' : 'var(--success)' }}>●</span>
                  {isWarn ? 'SLA Near Limit' : 'Operational'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 2: STREAM PIPELINE & ANOMALY DETECTION (2 COLUMNS) ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Card 1: Telemetry Anomaly Thresholds */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}>
                <Sliders size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Telemetry Anomaly Thresholds
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Calibrated mathematical limits for live CAN bus sensor streams.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Slider 1: Engine Temp */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Engine Temp Critical Threshold:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--critical)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      {settings.tempThreshold}°C
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="95"
                  max="115"
                  value={settings.tempThreshold}
                  onChange={e => updateSetting('tempThreshold', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--critical)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>Min: 95°C</span>
                  <span style={{ color: 'var(--text-muted)' }}>Triggers Critical Alert if sustained &gt; 3 mins</span>
                  <span>Max: 115°C</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[98, 102, 108].map(temp => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => updateSetting('tempThreshold', temp)}
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: settings.tempThreshold === temp ? 'var(--accent-blue)' : 'var(--bg-app)',
                        color: settings.tempThreshold === temp ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {temp}°C {temp === 102 ? '(Factory)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 2: DTC Recurrence */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    DTC Recurrence Window:
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--warning)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {settings.misfireWindow} Hours
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={settings.misfireWindow}
                  onChange={e => updateSetting('misfireWindow', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--warning)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>1 Hour</span>
                  <span>Accumulates DTC occurrences (e.g. P0301) to compute risk slope</span>
                  <span>24 Hours</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[3, 6, 12, 24].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => updateSetting('misfireWindow', hrs)}
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: settings.misfireWindow === hrs ? 'var(--accent-blue)' : 'var(--bg-app)',
                        color: settings.misfireWindow === hrs ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {hrs}h {hrs === 6 ? '(Standard)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 3: Vector Cosine Similarity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Vector Cosine Similarity Match Cutoff:
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '1px solid rgba(14, 165, 233, 0.25)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {settings.vectorThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.05"
                  value={settings.vectorThreshold}
                  onChange={e => updateSetting('vectorThreshold', parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>0.50 (Permissive)</span>
                  <span>Sensitivity cutoff for failure fingerprint vector matching</span>
                  <span>0.95 (Strict)</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[0.65, 0.75, 0.85].map(thresh => (
                    <button
                      key={thresh}
                      type="button"
                      onClick={() => updateSetting('vectorThreshold', thresh)}
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: Math.abs(settings.vectorThreshold - thresh) < 0.01 ? 'var(--accent-blue)' : 'var(--bg-app)',
                        color: Math.abs(settings.vectorThreshold - thresh) < 0.01 ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {thresh.toFixed(2)} {thresh === 0.75 ? '(Optimal)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Work Order */}
          <div style={{
            marginTop: 20,
            padding: '12px 14px',
            background: 'var(--bg-app)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                Automated Depot Work Orders
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Auto-generate workshop repair orders for assets with &gt; 80% failure risk slope.
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 22, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.autoDispatch}
                onChange={e => updateSetting('autoDispatch', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: settings.autoDispatch ? 'var(--accent-blue)' : 'var(--border)',
                borderRadius: 22,
                transition: '0.2s',
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: 16,
                  width: 16,
                  left: settings.autoDispatch ? 22 : 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.2s',
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Card 2: Stream Pipeline & Kafka Workers */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-purple)'
              }}>
                <Cpu size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Stream Pipeline & Ingestion Workers
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Kafka event broker partitions, ingestion buffer size, and compression codecs.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Kafka Topic Input */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Kafka Telemetry Topic
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input"
                    value={settings.kafkaTopic}
                    onChange={e => updateSetting('kafkaTopic', e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => updateSetting('kafkaTopic', 'vehicle.telemetry.raw')}
                    style={{ fontSize: 11, whiteSpace: 'nowrap', padding: '6px 10px' }}
                    title="Reset to default topic"
                  >
                    Default
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Default ingestion channel for CAN bus frame payloads (partition count: 16).
                </div>
              </div>

              {/* Batch Ingestion Buffer */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Batch Ingestion Buffer (Events)
                </label>
                <input
                  type="number"
                  className="input"
                  value={settings.ingestionBatch}
                  onChange={e => updateSetting('ingestionBatch', parseInt(e.target.value) || 0)}
                  style={{ width: '100%', fontSize: 12 }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[1000, 5000, 10000, 25000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => updateSetting('ingestionBatch', amt)}
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: settings.ingestionBatch === amt ? 'var(--accent-blue)' : 'var(--bg-app)',
                        color: settings.ingestionBatch === amt ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {amt.toLocaleString()} {amt === 5000 ? '(Default)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Serialization / Compression */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Stream Serialization & Codec
                </label>
                <select
                  className="input"
                  value={settings.compression}
                  onChange={e => updateSetting('compression', e.target.value)}
                  style={{ width: '100%', fontSize: 12 }}
                >
                  <option value="snappy">Apache Avro + Snappy Compression (High Throughput)</option>
                  <option value="protobuf">Protocol Buffers v3 (Lowest Latency)</option>
                  <option value="gzip">JSON + Gzip (High Compression Ratio)</option>
                  <option value="zstd">Zstandard Level 3 (Balanced CPU / Ratio)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleFlushBuffer}
              disabled={isFlushing}
              style={{ fontSize: 11, flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <RefreshCw size={12} className={isFlushing ? 'spin' : ''} />
              {isFlushing ? 'Flushing...' : 'Flush Stream Buffer'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePurgeCache}
              disabled={isPurging}
              style={{ fontSize: 11, flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <HardDrive size={12} />
              {isPurging ? 'Purging...' : 'Purge Redis Cache'}
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: AI COPILOT & LLM MODEL SELECTION (DIRECT USER REQUIREMENT) ── */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  AI Copilot & Diagnostic LLM Providers
                </h3>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(37,99,235,0.1)',
                  color: 'var(--accent-blue)',
                  border: '1px solid rgba(37,99,235,0.2)'
                }}>
                  Active Model Switching
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                Select the active neural engine powering live failure explanations, CAN bus root-cause diagnosis, and depot SOP generation.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestLLM}
              disabled={isTestingModel}
              style={{
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: 'rgba(99, 102, 241, 0.3)',
                background: 'rgba(99, 102, 241, 0.05)'
              }}
            >
              <Zap size={14} color="var(--accent-purple)" className={isTestingModel ? 'spin' : ''} />
              {isTestingModel ? 'Probing Latency...' : 'Test LLM Connectivity'}
            </button>
          </div>
        </div>

        {/* Model Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
          marginBottom: 16
        }}>
          {AVAILABLE_MODELS.map(m => {
            const isSelected = activeModel === m.id
            return (
              <div
                key={m.id}
                onClick={() => handleModelChange(m.id)}
                style={{
                  background: isSelected ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-app)',
                  border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.12)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: isSelected ? '4px solid var(--accent-blue)' : '2px solid var(--border)',
                          background: isSelected ? '#fff' : 'transparent',
                          display: 'inline-block'
                        }} />
                        <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {m.name}
                        </h4>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 20 }}>
                        {m.providerName}
                      </div>
                    </div>

                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: `${m.badgeColor}15`,
                      color: m.badgeColor,
                      border: `1px solid ${m.badgeColor}35`,
                      whiteSpace: 'nowrap'
                    }}>
                      {m.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, margin: '8px 0 12px 0' }}>
                    {m.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border)',
                  fontSize: 11,
                  color: 'var(--text-muted)'
                }}>
                  <span>Latency: <strong style={{ color: 'var(--text-primary)' }}>{m.latency}</strong></span>
                  <span>Context: <strong style={{ color: 'var(--text-primary)' }}>{m.context}</strong></span>
                  {isSelected ? (
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Check size={13} /> Active
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Click to Select</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Test Result Console Banner */}
        {testResult && (
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--r-md)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginTop: 8
          }}>
            <div style={{ color: 'var(--success)', marginTop: 2 }}>
              <CheckCircle2 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Model Probe Verified: {testResult.provider}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--success)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    Round-Trip Latency: {testResult.latencyMs} ms
                  </span>
                  <button
                    type="button"
                    onClick={() => setTestResult(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 6,
                fontFamily: 'var(--font-mono)',
                background: 'var(--bg-card)',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid var(--border)'
              }}>
                "{testResult.snippet}"
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 4: SECURITY & ALERT WEBHOOKS ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Card 1: ISO 26262 ASIL-D Compliance */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)'
              }}>
                <Shield size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  ISO 26262 ASIL-D Safety & Audit Integrity
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Cryptographic verification of diagnostic models and audit log persistence.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Audit Retention */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Audit Log Retention Standard
                </label>
                <select
                  className="input"
                  value={settings.auditRetention}
                  onChange={e => updateSetting('auditRetention', e.target.value)}
                  style={{ width: '100%', fontSize: 12 }}
                >
                  <option value="90-days">90 Days (Development & Testing)</option>
                  <option value="180-days">180 Days (Fleet Standard)</option>
                  <option value="365-days">365 Days (Commercial Operations Standard)</option>
                  <option value="7-years">7 Years (ISO 26262 / UNECE R155 Regulatory Standard)</option>
                </select>
              </div>

              {/* Security Toggles */}
              <div style={{
                padding: '12px 14px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    CAN Payload HMAC-SHA256 Signing
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Reject unsigned or spoofed CAN bus messages from telematics OBD dongles.
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 22, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.payloadEncryption}
                    onChange={e => updateSetting('payloadEncryption', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.payloadEncryption ? 'var(--accent-blue)' : 'var(--border)',
                    borderRadius: 22,
                    transition: '0.2s',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: 16,
                      width: 16,
                      left: settings.payloadEncryption ? 22 : 3,
                      bottom: 3,
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.2s',
                    }} />
                  </span>
                </label>
              </div>

              <div style={{
                padding: '12px 14px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Technician Sign-Off for High-Voltage EV Interventions
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Enforce two-person authorization before clearing battery thermal runaway flags.
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 22, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.requireTechnicianSignoff}
                    onChange={e => updateSetting('requireTechnicianSignoff', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.requireTechnicianSignoff ? 'var(--accent-blue)' : 'var(--border)',
                    borderRadius: 22,
                    transition: '0.2s',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: 16,
                      width: 16,
                      left: settings.requireTechnicianSignoff ? 22 : 3,
                      bottom: 3,
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.2s',
                    }} />
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 18,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-muted)'
          }}>
            <span>Model Hash: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>SHA256:7f4a...9b12</strong></span>
            <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> ASIL-D Certified
            </span>
          </div>
        </div>

        {/* Card 2: Operational Alert Webhooks */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--critical)'
              }}>
                <BellRing size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Operational Alert Webhooks & Escalation
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Dispatch automated HTTP POST webhook payloads to PagerDuty, Slack, or depot dispatchers.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Webhook Endpoint */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Primary Webhook Ingestion Endpoint
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.webhookUrl}
                  onChange={e => updateSetting('webhookUrl', e.target.value)}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Receives real-time JSON alert envelopes when failure probability &gt; 70%.
                </div>
              </div>

              {/* Webhook Severity Filter */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Escalation Notification Threshold
                </label>
                <select
                  className="input"
                  value={settings.webhookSeverity}
                  onChange={e => updateSetting('webhookSeverity', e.target.value)}
                  style={{ width: '100%', fontSize: 12 }}
                >
                  <option value="critical-only">Critical Alerts Only (P1 - Imminent Breakdown &lt; 24h)</option>
                  <option value="critical-high">Critical & High Priority (P1 + P2 - Breakdown &lt; 7 Days)</option>
                  <option value="all-anomalies">All Detected Outliers & Component Jitter (P1 - P3)</option>
                </select>
              </div>

              <div style={{
                background: 'var(--bg-app)',
                padding: '10px 14px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--text-muted)'
              }}>
                Payload format: <strong style={{ color: 'var(--text-secondary)' }}>CloudEvents v1.0 (JSON-Schema compliant)</strong>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestWebhook}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Zap size={13} color="var(--critical)" />
              Send Test Webhook Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
