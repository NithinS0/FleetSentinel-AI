import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, HelpCircle, ChevronDown, Check, CheckCircle2,
  AlertTriangle, ShieldAlert, ArrowRight, ExternalLink, Clock, Sparkles
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAlertStore } from '../../store/alertStore'
import toast from 'react-hot-toast'

export default function Topbar({ onOpenCmd }) {
  const navigate = useNavigate()
  const [eventsPerSec] = useState(103482)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const notifRef = useRef(null)

  const { user } = useAuthStore()
  const { alerts, acknowledgeAlert, acknowledgeAll } = useAlertStore()
  const openAlerts = alerts.filter(a => a.status === 'OPEN')
  const initial = (user?.full_name || user?.email || 'A').charAt(0).toUpperCase()

  // Close notifications menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      {/* Right side */}
      <div className="topbar-right">
        {/* Live indicator */}
        <div className="live-indicator">
          <span className="dot" />
          All Systems Operational
        </div>

        {/* Events/sec */}
        <div style={{
          padding: '5px 12px',
          background: '#F1F5F9',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-full)',
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
        }}>
          <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
            {eventsPerSec.toLocaleString()}
          </span>
          <span>ev/s</span>
        </div>

        {/* Help */}
        <button
          className="icon-btn"
          title="Telemetry Help & System Docs"
          onClick={() => navigate('/settings')}
        >
          <HelpCircle size={16} />
        </button>

        {/* Notifications Button & Dropdown Container */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="icon-btn"
            title="Telemetry Alert Notifications"
            onClick={() => setShowNotifMenu(prev => !prev)}
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
                zIndex: 1000,
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

        {/* Fleet selector */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          fontSize: 12, fontWeight: 500,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          transition: 'all var(--t-std)',
        }}>
          All Fleets
          <ChevronDown size={13} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white',
          cursor: 'pointer',
          border: '2px solid var(--border)',
          boxShadow: '0 1px 3px rgba(15,23,42,0.1)',
        }}>
          {initial}
        </div>
      </div>
    </header>
  )
}

