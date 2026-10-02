import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, HelpCircle, ChevronDown, Check, CheckCircle2,
  AlertTriangle, ShieldAlert, ArrowRight, ExternalLink, Clock, Sparkles,
  Activity, Server, RefreshCw, Cpu, Bot, LogOut, User, Command,
  Settings, BarChart2, FileText, ChevronRight, Zap, CheckCircle, Radio
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAlertStore } from '../../store/alertStore'
import toast from 'react-hot-toast'

const FLEET_OPTIONS = [
  { id: 'all', name: 'All Fleets', count: '100,000', region: 'All India Logistics Hubs' },
  { id: 'chennai', name: 'Chennai Metro', count: '24,120', region: 'Tamil Nadu Hub' },
  { id: 'bangalore-a', name: 'Bangalore A', count: '18,400', region: 'Karnataka Central' },
  { id: 'mumbai', name: 'Mumbai Central', count: '21,500', region: 'Maharashtra Hub' },
  { id: 'delhi', name: 'Delhi NCR', count: '12,780', region: 'North Corridor' },
  { id: 'bangalore-b', name: 'Bangalore B', count: '15,200', region: 'Karnataka South' },
  { id: 'hyderabad', name: 'Hyderabad Fleet', count: '8,000', region: 'Telangana Transit' },
]

export default function Topbar({ onOpenCmd }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { alerts, acknowledgeAlert, acknowledgeAll } = useAlertStore()

  // State for menus
  const [showHealthMenu, setShowHealthMenu] = useState(false)
  const [showStreamMenu, setShowStreamMenu] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [showFleetMenu, setShowFleetMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Fleet Selection
  const [selectedFleet, setSelectedFleet] = useState(() => {
    return localStorage.getItem('fs-selected-fleet') || 'All Fleets'
  })

  // Simulated live events per second with subtle dynamic pulse
  const [eventsPerSec, setEventsPerSec] = useState(103482)
  const [isPinging, setIsPinging] = useState(false)

  // Container refs for clicking outside
  const healthRef = useRef(null)
  const streamRef = useRef(null)
  const helpRef = useRef(null)
  const notifRef = useRef(null)
  const fleetRef = useRef(null)
  const userRef = useRef(null)

  const openAlerts = alerts.filter(a => a.status === 'OPEN')
  const initial = (user?.full_name || user?.email || 'F').charAt(0).toUpperCase()

  // Close other menus when one is opened
  const toggleMenu = (menuSetter, currentState) => {
    setShowHealthMenu(false)
    setShowStreamMenu(false)
    setShowHelpMenu(false)
    setShowNotifMenu(false)
    setShowFleetMenu(false)
    setShowUserMenu(false)
    menuSetter(!currentState)
  }

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (healthRef.current && !healthRef.current.contains(event.target)) setShowHealthMenu(false)
      if (streamRef.current && !streamRef.current.contains(event.target)) setShowStreamMenu(false)
      if (helpRef.current && !helpRef.current.contains(event.target)) setShowHelpMenu(false)
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifMenu(false)
      if (fleetRef.current && !fleetRef.current.contains(event.target)) setShowFleetMenu(false)
      if (userRef.current && !userRef.current.contains(event.target)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Dynamic telemetry event rate jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setEventsPerSec(prev => {
        const delta = Math.floor(Math.random() * 21) - 10
        return Math.max(103200, Math.min(103900, prev + delta))
      })
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Fleet selection handler
  const handleSelectFleet = (fleet) => {
    setSelectedFleet(fleet.name)
    localStorage.setItem('fs-selected-fleet', fleet.name)
    setShowFleetMenu(false)
    toast.success(`Active Fleet: ${fleet.name} (${fleet.count} assets)`, {
      id: 'fleet-switch',
      duration: 3000,
    })
    window.dispatchEvent(new CustomEvent('fleetFilterChanged', { detail: fleet.name }))
  }

  // Quick cluster ping
  const handleQuickPing = (e) => {
    e.stopPropagation()
    setIsPinging(true)
    toast.loading('Pinging 12 distributed cluster microservices...', { id: 'topbar-ping' })
    setTimeout(() => {
      setIsPinging(false)
      toast.success('All 12 microservices optimal (p95: 142ms, Lag: 138ms)', {
        id: 'topbar-ping',
        duration: 3500,
      })
    }, 750)
  }

  // Notification handlers
  const handleAckFromMenu = (e, id) => {
    e.stopPropagation()
    acknowledgeAlert(id)
    toast.success(`Alert ${id} acknowledged`)
  }

  const handleAckAllFromMenu = (e) => {
    e.stopPropagation()
    acknowledgeAll()
    toast.success('All open alerts acknowledged')
  }

  // Logout handler
  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    toast('Signed out of FleetSentinel AI', { icon: '👋' })
    navigate('/login')
  }

  return (
    <header className="topbar">
      {/* Search */}
      <div className="search-bar" onClick={onOpenCmd} style={{ cursor: 'pointer' }}>
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          placeholder="Search vehicles, VINs, drivers, alerts... (Press ⌘K)"
          readOnly
          style={{ cursor: 'pointer' }}
        />
        <kbd style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', flexShrink: 0 }}>
          ⌘K
        </kbd>
      </div>

      {/* Right side buttons */}
      <div className="topbar-right">
        {/* ── 1. LIVE SYSTEM STATUS BADGE & POPOVER ────────────────────────── */}
        <div style={{ position: 'relative' }} ref={healthRef}>
          <button
            type="button"
            className="live-indicator"
            onClick={() => toggleMenu(setShowHealthMenu, showHealthMenu)}
            style={{
              cursor: 'pointer',
              border: showHealthMenu ? '1px solid #16A34A' : '1px solid #BBF7D0',
              background: showHealthMenu ? '#DCFCE7' : '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
            title="Click to view Distributed Cluster Health"
          >
            <span className="dot" />
            <span>All Systems Operational</span>
          </button>

          {showHealthMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 330,
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12), 0 8px 10px -6px rgba(15,23,42,0.06)',
              zIndex: 1100,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}>
              {/* Popover Header */}
              <div style={{
                padding: '12px 16px',
                background: '#F8FAFC',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: 'rgba(34, 197, 94, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--success)'
                  }}>
                    <Server size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      Cluster Health Status
                    </div>
                    <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                      12/12 Services Operational
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickPing}
                  disabled={isPinging}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <RefreshCw size={11} className={isPinging ? 'spin' : ''} />
                  Ping
                </button>
              </div>

              {/* Cluster items */}
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Telemetry Stream Ingestion</span>
                  <strong style={{ color: '#16A34A' }}>99.98% (0ms lag)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Kafka Partition Broker Quorum</span>
                  <strong style={{ color: '#0F172A' }}>3 / 3 Active</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>API Ingestion p95 Latency</span>
                  <strong style={{ color: '#0F172A' }}>148 ms (Nominal)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>TimescaleDB Query Avg</span>
                  <strong style={{ color: '#0F172A' }}>12 ms</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>AI Copilot Diagnostic Engine</span>
                  <strong style={{ color: '#2563EB' }}>Online</strong>
                </div>
              </div>

              {/* Popover Footer */}
              <div
                onClick={() => {
                  setShowHealthMenu(false)
                  navigate('/settings')
                }}
                style={{
                  padding: '10px 16px',
                  background: '#F8FAFC',
                  borderTop: '1px solid #F1F5F9',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#2563EB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>Open Full Infrastructure Console</span>
                <ChevronRight size={13} />
              </div>
            </div>
          )}
        </div>

        {/* ── 2. LIVE EVENTS/SEC RATE & THROUGHPUT POPOVER ───────────────── */}
        <div style={{ position: 'relative' }} ref={streamRef}>
          <button
            type="button"
            onClick={() => toggleMenu(setShowStreamMenu, showStreamMenu)}
            style={{
              padding: '5px 12px',
              background: showStreamMenu ? '#E2E8F0' : '#F1F5F9',
              border: showStreamMenu ? '1px solid #94A3B8' : '1px solid var(--border)',
              borderRadius: 'var(--r-full)',
              fontSize: 12,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
            title="Click to view Live Stream Pipeline Throughput"
          >
            <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
              {eventsPerSec.toLocaleString()}
            </span>
            <span>ev/s</span>
          </button>

          {showStreamMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 320,
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12), 0 8px 10px -6px rgba(15,23,42,0.06)',
              zIndex: 1100,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}>
              <div style={{
                padding: '12px 16px',
                background: '#F8FAFC',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'rgba(37, 99, 235, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-blue)'
                }}>
                  <Cpu size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    Live Ingestion Pipeline
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    CAN bus telemetry event throughput
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(14,165,233,0.06))',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(37,99,235,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: 12, color: '#1E293B', fontWeight: 600 }}>Active Stream Rate</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                    {eventsPerSec.toLocaleString()} ev/s
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Kafka Ingestion Topic</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#0F172A', fontWeight: 600 }}>
                    vehicle.telemetry.raw
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Partition Count</span>
                  <strong style={{ color: '#0F172A' }}>16 Partitions</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Batch Buffer Size</span>
                  <strong style={{ color: '#0F172A' }}>5,000 events / batch</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Compression Codec</span>
                  <strong style={{ color: '#059669' }}>Avro + Snappy</strong>
                </div>
              </div>

              <div
                onClick={() => {
                  setShowStreamMenu(false)
                  navigate('/settings')
                }}
                style={{
                  padding: '10px 16px',
                  background: '#F8FAFC',
                  borderTop: '1px solid #F1F5F9',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#2563EB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>Tune Pipeline Parameters</span>
                <ChevronRight size={13} />
              </div>
            </div>
          )}
        </div>

        {/* ── 3. HELP & DOCUMENTATION POPOVER ─────────────────────────────── */}
        <div style={{ position: 'relative' }} ref={helpRef}>
          <button
            type="button"
            className="icon-btn"
            title="Platform Help & Quick Navigation"
            onClick={() => toggleMenu(setShowHelpMenu, showHelpMenu)}
            style={{
              background: showHelpMenu ? '#EFF6FF' : undefined,
              borderColor: showHelpMenu ? '#BFDBFE' : undefined,
              color: showHelpMenu ? '#2563EB' : undefined,
            }}
          >
            <HelpCircle size={16} />
          </button>

          {showHelpMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 320,
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12), 0 8px 10px -6px rgba(15,23,42,0.06)',
              zIndex: 1100,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}>
              <div style={{
                padding: '12px 16px',
                background: '#F8FAFC',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'rgba(37, 99, 235, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-blue)'
                }}>
                  <Command size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    Help & Platform Shortcuts
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    Keyboard shortcuts and quick guides
                  </div>
                </div>
              </div>

              <div style={{ padding: '8px 0' }}>
                <div
                  onClick={() => {
                    setShowHelpMenu(false)
                    if (onOpenCmd) onOpenCmd()
                  }}
                  style={{
                    padding: '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Search size={14} color="#64748B" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B' }}>
                      Command Palette
                    </span>
                  </div>
                  <kbd style={{ fontSize: 10, padding: '2px 6px', background: '#F1F5F9', borderRadius: 4, border: '1px solid #CBD5E1', color: '#475569' }}>
                    ⌘K / Ctrl+K
                  </kbd>
                </div>

                <div
                  onClick={() => {
                    setShowHelpMenu(false)
                    navigate('/copilot')
                  }}
                  style={{
                    padding: '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Bot size={14} color="#7C3AED" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B' }}>
                      Ask AI Copilot
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>Direct Query</span>
                </div>

                <div
                  onClick={() => {
                    setShowHelpMenu(false)
                    navigate('/reports')
                  }}
                  style={{
                    padding: '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={14} color="#059669" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B' }}>
                      Executive PDF Audits
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Exportable</span>
                </div>

                <div
                  onClick={() => {
                    setShowHelpMenu(false)
                    navigate('/settings')
                  }}
                  style={{
                    padding: '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Settings size={14} color="#D97706" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B' }}>
                      Platform Settings & Docs
                    </span>
                  </div>
                  <ChevronRight size={13} color="#94A3B8" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. NOTIFICATIONS BELL & POPOVER ─────────────────────────────── */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className="icon-btn"
            title="Telemetry Alert Notifications"
            onClick={() => toggleMenu(setShowNotifMenu, showNotifMenu)}
            style={{
              background: showNotifMenu ? '#EFF6FF' : undefined,
              borderColor: showNotifMenu ? '#BFDBFE' : undefined,
              color: showNotifMenu ? '#2563EB' : undefined,
            }}
          >
            <Bell size={16} />
            {openAlerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 17,
                  height: 17,
                  borderRadius: 9,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 1px 2px rgba(239,68,68,0.3)',
                }}
              >
                {openAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 380,
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12), 0 8px 10px -6px rgba(15,23,42,0.06)',
                zIndex: 1100,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease',
              }}
            >
              {/* Popover Header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#F8FAFC',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    Telemetry Notifications
                  </span>
                  {openAlerts.length > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: 'var(--r-full)',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                      }}
                    >
                      {openAlerts.length} Active
                    </span>
                  )}
                </div>

                {openAlerts.length > 0 && (
                  <button
                    onClick={handleAckAllFromMenu}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    <Check size={12} /> Ack All
                  </button>
                )}
              </div>

              {/* Popover Notification List */}
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {openAlerts.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B' }}>
                    <CheckCircle2 size={32} style={{ color: '#10B981', margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>All caught up!</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      No unacknowledged telemetry alerts in your fleet.
                    </div>
                  </div>
                ) : (
                  openAlerts.slice(0, 6).map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifMenu(false)
                        navigate('/alerts')
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          marginTop: 5,
                          flexShrink: 0,
                          background: alert.severity === 'CRITICAL' ? '#EF4444' : alert.severity === 'HIGH' ? '#F97316' : '#F59E0B',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                            {alert.vehicle_id}
                          </span>
                          <span style={{ fontSize: 10, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} /> {alert.time}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#334155', fontWeight: 500, lineHeight: 1.4, marginBottom: 4 }}>
                          {alert.alert}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: alert.severity === 'CRITICAL' ? '#FEF2F2' : alert.severity === 'HIGH' ? '#FFFBEB' : '#F1F5F9',
                              color: alert.severity === 'CRITICAL' ? '#DC2626' : alert.severity === 'HIGH' ? '#D97706' : '#475569',
                              border: `1px solid ${alert.severity === 'CRITICAL' ? '#FECACA' : alert.severity === 'HIGH' ? '#FDE68A' : '#E2E8F0'}`,
                            }}
                          >
                            {alert.severity}
                          </span>
                          <button
                            onClick={(e) => handleAckFromMenu(e, alert.id)}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #E2E8F0',
                              borderRadius: 4,
                              padding: '2px 8px',
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Check size={11} /> Ack
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div
                onClick={() => {
                  setShowNotifMenu(false)
                  navigate('/alerts')
                }}
                style={{
                  padding: '11px 16px',
                  background: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#2563EB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC' }}
              >
                <span>Go to Telemetry Alert Center</span>
                <ArrowRight size={13} />
              </div>
            </div>
          )}
        </div>

        {/* ── 5. ALL FLEETS DROPDOWN SELECTOR ─────────────────────────────── */}
        <div style={{ position: 'relative' }} ref={fleetRef}>
          <button
            type="button"
            onClick={() => toggleMenu(setShowFleetMenu, showFleetMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: showFleetMenu ? '#F8FAFC' : '#FFFFFF',
              border: showFleetMenu ? '1px solid #2563EB' : '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
            title="Switch Fleet Scope"
          >
            <span>{selectedFleet}</span>
            <ChevronDown size={13} style={{ transform: showFleetMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {showFleetMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 270,
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12), 0 8px 10px -6px rgba(15,23,42,0.06)',
              zIndex: 1100,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}>
              <div style={{
                padding: '10px 14px',
                background: '#F8FAFC',
                borderBottom: '1px solid #F1F5F9',
                fontSize: 11,
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Select Active Fleet Scope
              </div>

              <div style={{ padding: '6px 0', maxHeight: 280, overflowY: 'auto' }}>
                {FLEET_OPTIONS.map(f => {
                  const isSelected = selectedFleet === f.name
                  return (
                    <div
                      key={f.id}
                      onClick={() => handleSelectFleet(f)}
                      style={{
                        padding: '9px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(37, 99, 235, 0.05)' : '#FFFFFF',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#FFFFFF' }}
                    >
                      <div>
                        <div style={{
                          fontSize: 12.5,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#2563EB' : '#1E293B',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          {f.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                          {f.count} vehicles • {f.region}
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 6. USER AVATAR & ACCOUNT PROFILE MENU ───────────────────────── */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <div
            onClick={() => toggleMenu(setShowUserMenu, showUserMenu)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: 'white',
              cursor: 'pointer',
              border: showUserMenu ? '2px solid #2563EB' : '2px solid var(--border)',
              boxShadow: '0 1px 3px rgba(15,23,42,0.1)',
              transition: 'all 0.15s ease'
            }}
            title="User Profile & Settings"
          >
            {initial}
          </div>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 280,
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12), 0 8px 10px -6px rgba(15,23,42,0.06)',
              zIndex: 1100,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}>
              {/* User Bio Card */}
              <div style={{
                padding: '14px 16px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(14,165,233,0.04))',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  {initial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.full_name || 'Fleet Director'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email || 'admin@fleetsentinel.ai'}
                  </div>
                  <div style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#2563EB',
                    marginTop: 3,
                    display: 'inline-block',
                    background: 'rgba(37,99,235,0.08)',
                    padding: '1px 6px',
                    borderRadius: 4
                  }}>
                    ASIL-D Chief Administrator
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div style={{ padding: '6px 0' }}>
                <div
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/settings')
                  }}
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#1E293B',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                >
                  <Settings size={14} color="#64748B" />
                  <span>Platform Settings & Health</span>
                </div>

                <div
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/analytics')
                  }}
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#1E293B',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                >
                  <BarChart2 size={14} color="#64748B" />
                  <span>Analytics & Financial ROI</span>
                </div>

                <div
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/reports')
                  }}
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#1E293B',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                >
                  <FileText size={14} color="#64748B" />
                  <span>Executive Audit Reports</span>
                </div>

                <div
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/copilot')
                  }}
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#1E293B',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
                >
                  <Bot size={14} color="#7C3AED" />
                  <span>AI Copilot Diagnostics</span>
                </div>
              </div>

              {/* Logout button */}
              <div style={{ padding: '6px 12px 10px 12px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '7px 12px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 6,
                    color: '#DC2626',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2' }}
                >
                  <LogOut size={13} />
                  <span>Sign Out / Switch Operator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
