import { useState, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, AlertTriangle, ShieldAlert, CheckCircle2, Clock,
  Filter, Search, Download, RefreshCw, ChevronRight, Check,
  Bot, ArrowUpRight, Wrench, ShieldCheck, X, FileText, Send,
} from 'lucide-react'
import { RECENT_ALERTS, FLEET_VEHICLES } from '../data/demoData'

// Extended realistic fleet alerts dataset
const INITIAL_ALERTS = [
  ...RECENT_ALERTS.map(a => ({
    ...a,
    dtc: a.vehicle_id === 'TN01AB1234' ? 'P0301' : a.vehicle_id === 'KA04CD5678' ? 'BMS04' : a.vehicle_id === 'MH12EF9012' ? 'P0302' : 'DTC99',
    fleet: FLEET_VEHICLES.find(v => v.vehicle_id === a.vehicle_id)?.fleet || 'Regional Fleet',
    model: FLEET_VEHICLES.find(v => v.vehicle_id === a.vehicle_id)?.model || 'Fleet Unit',
    assignedTo: a.status === 'ACKNOWLEDGED' ? 'Suresh M. (Depot 3)' : null,
  })),
  {
    id: 'ALT007',
    time: '10:02:18',
    vehicle_id: 'KA06GH7890',
    alert: 'BMS Cell Voltage Delta exceeds 180mV threshold',
    severity: 'MEDIUM',
    status: 'ACKNOWLEDGED',
    evidence: 'Cell #14 underperforming under high regen braking loads',
    dtc: 'BMS18',
    fleet: 'Bangalore A',
    model: 'Nexon EV',
    assignedTo: 'Vikram S. (EV Bay)',
  },
  {
    id: 'ALT008',
    time: '09:47:50',
    vehicle_id: 'GJ07ST7890',
    alert: 'CNG Rail pressure fluctuation detected during acceleration',
    severity: 'HIGH',
    status: 'OPEN',
    evidence: 'Pressure dropped 22 PSI below regulator nominal during throttle tip-in',
    dtc: 'P0190',
    fleet: 'Gujarat',
    model: 'Ace CNG',
    assignedTo: null,
  },
  {
    id: 'ALT009',
    time: '09:12:04',
    vehicle_id: 'TN03CD2345',
    alert: 'Hybrid Inverter Coolant Flow Rate below minimum threshold',
    severity: 'LOW',
    status: 'RESOLVED',
    evidence: 'Flow rate dipped to 2.4 L/min for 8 mins; returned to nominal',
    dtc: 'P0A93',
    fleet: 'Chennai Metro',
    model: 'Innova',
    assignedTo: 'Anand R. (Depot 1)',
    resolvedAt: '09:35:10',
    resolutionNote: 'Coolant reservoir topped up and air bleed cycle completed.',
  },
]

export default function AlertsPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedAlerts, setSelectedAlerts] = useState([])
  const [groupBy, setGroupBy] = useState('NONE')
  const [activeModalAlert, setActiveModalAlert] = useState(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolveType, setResolveType] = useState('Work Order Dispatched')
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchSearch =
        !search ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        a.vehicle_id.toLowerCase().includes(search.toLowerCase()) ||
        a.alert.toLowerCase().includes(search.toLowerCase()) ||
        a.evidence.toLowerCase().includes(search.toLowerCase()) ||
        (a.dtc && a.dtc.toLowerCase().includes(search.toLowerCase()))

      const matchSev = severityFilter === 'ALL' || a.severity === severityFilter
      const matchStat = statusFilter === 'ALL' || a.status === statusFilter
      return matchSearch && matchSev && matchStat
    })
  }, [alerts, search, severityFilter, statusFilter])

  // Grouped alerts for operational inbox
  const groupedAlerts = useMemo(() => {
    if (groupBy === 'NONE') return { 'All Operational Alerts': filteredAlerts }

    const groups = {}
    filteredAlerts.forEach(a => {
      let key = 'Other'
      if (groupBy === 'VEHICLE') {
        key = `Vehicle: ${a.vehicle_id} (${a.model})`
      } else if (groupBy === 'FAILURE_TYPE') {
        key = a.dtc?.startsWith('P03') ? 'Engine Misfire & Ignition' :
              a.dtc?.startsWith('BMS') ? 'Battery Degradation & BMS' :
              a.dtc?.startsWith('P00B') || a.dtc?.startsWith('P0A') ? 'Cooling & Thermal System' :
              a.dtc?.startsWith('P0190') ? 'Fuel & CNG Rail Pressure' : 'General Telemetry Anomaly'
      } else if (groupBy === 'SEVERITY') {
        key = `${a.severity} Priority`
      } else if (groupBy === 'TIME') {
        key = a.time > '10:00:00' ? 'Recent (Last Hour)' : 'Earlier Today'
      }
      if (!groups[key]) groups[key] = []
      groups[key].push(a)
    })
    return groups
  }, [filteredAlerts, groupBy])

  // Statistics
  const stats = useMemo(() => {
    const total = alerts.length
    const critical = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length
    const high = alerts.filter(a => a.severity === 'HIGH' && a.status !== 'RESOLVED').length
    const open = alerts.filter(a => a.status === 'OPEN').length
    const resolved = alerts.filter(a => a.status === 'RESOLVED').length
    return { total, critical, high, open, resolved }
  }, [alerts])

  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED', assignedTo: 'Current User (Operations)' } : a))
    showToast(`Alert ${id} acknowledged. Status set to In Progress.`)
  }

  const handleAcknowledgeAll = () => {
    setAlerts(prev => prev.map(a => a.status === 'OPEN' ? { ...a, status: 'ACKNOWLEDGED', assignedTo: 'Operations Center' } : a))
    showToast('All open alerts have been acknowledged.')
  }

  const handleOpenResolveModal = (alert) => {
    setActiveModalAlert(alert)
    setResolveNote(`Preventive service verified on ${alert.vehicle_id}.`)
  }

  const handleConfirmResolve = () => {
    if (!activeModalAlert) return
    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false })
    setAlerts(prev => prev.map(a => a.id === activeModalAlert.id ? {
      ...a,
      status: 'RESOLVED',
      resolvedAt: nowStr,
      resolutionNote: `${resolveType}: ${resolveNote}`,
    } : a))
    showToast(`Alert ${activeModalAlert.id} marked as RESOLVED.`)
    setActiveModalAlert(null)
  }

  const handleSimulateNewAlert = () => {
    const newId = `ALT${String(alerts.length + 1).padStart(3, '0')}`
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false })
    const newAlert = {
      id: newId,
      time: timeNow,
      vehicle_id: 'MH12EF9012',
      alert: 'High thermal gradient detected across radiator core',
      severity: 'CRITICAL',
      status: 'OPEN',
      evidence: 'Core inlet/outlet delta is 3.1°C (expected >= 15°C). Coolant pump failure imminent.',
      dtc: 'P00B7',
      fleet: 'Mumbai Central',
      model: 'Supro',
      assignedTo: null,
    }
    setAlerts(prev => [newAlert, ...prev])
    showToast(`⚠️ Live stream ingestion: Critical Alert ${newId} triggered for MH12EF9012!`)
  }

  const handleToggleSelect = (id) => {
    setSelectedAlerts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAlerts(filteredAlerts.map(a => a.id))
    } else {
      setSelectedAlerts([])
    }
  }

  const handleExportCSV = () => {
    const headers = 'Alert ID,Time,Vehicle ID,Severity,Status,DTC,Model,Fleet,Evidence\n'
    const rows = filteredAlerts.map(a =>
      `"${a.id}","${a.time}","${a.vehicle_id}","${a.severity}","${a.status}","${a.dtc || ''}","${a.model}","${a.fleet}","${a.evidence.replace(/"/g, '""')}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `FleetSentinel_Alerts_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    showToast('Alert log exported to CSV.')
  }

  const SEV_BADGE_STYLE = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#EF4444' },
    HIGH: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', color: '#F97316' },
    MEDIUM: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#F59E0B' },
    LOW: { bg: 'rgba(22,136,255,0.15)', border: 'rgba(22,136,255,0.4)', color: '#1688FF' },
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

      {/* Page Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Telemetry Alert Center</h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: 'var(--success)',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 'var(--r-full)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
              Stream Connected: 103,482 evt/s
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Real-time anomaly triggers, diagnostic trouble codes, and operational interventions across 100,000 vehicles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={handleSimulateNewAlert}
            title="Simulate telemetry stream spike"
            style={{ fontSize: 12 }}
          >
            <RefreshCw size={14} /> Simulate Ingestion Event
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleExportCSV}
            style={{ fontSize: 12 }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAcknowledgeAll}
            disabled={stats.open === 0}
            style={{ fontSize: 12 }}
          >
            <Check size={14} /> Acknowledge All ({stats.open})
          </button>
        </div>
      </div>

      {/* Operational Inbox KPI Banner (Section 19: Critical 12, High 48, Medium 124, Resolved 1,284) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-4)' }}>
        <div
          className="card"
          onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderLeft: '4px solid var(--critical)',
            background: severityFilter === 'CRITICAL' ? 'var(--bg-elevated)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>CRITICAL</span>
            <ShieldAlert size={16} color="var(--critical)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--critical)', marginTop: 4, letterSpacing: '-0.02em' }}>
            12
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Immediate intervention required
          </div>
        </div>

        <div
          className="card"
          onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderLeft: '4px solid var(--risk-high)',
            background: severityFilter === 'HIGH' ? 'var(--bg-elevated)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>HIGH</span>
            <AlertTriangle size={16} color="var(--risk-high)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--risk-high)', marginTop: 4, letterSpacing: '-0.02em' }}>
            48
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Horizon: 2–5 days
          </div>
        </div>

        <div
          className="card"
          onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderLeft: '4px solid var(--warning)',
            background: severityFilter === 'MEDIUM' ? 'var(--bg-elevated)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>MEDIUM</span>
            <Bell size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--warning)', marginTop: 4, letterSpacing: '-0.02em' }}>
            124
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Sub-threshold telemetry drifts
          </div>
        </div>

        <div
          className="card"
          onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderLeft: '4px solid var(--success)',
            background: statusFilter === 'RESOLVED' ? 'var(--bg-elevated)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>RESOLVED</span>
            <ShieldCheck size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--success)', marginTop: 4, letterSpacing: '-0.02em' }}>
            1,284
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Closed in past 30 days
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Grouping Options */}
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search alert, Vehicle ID (e.g. TN01AB1234), DTC code..."
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

          {/* Group By selector (Section 19: Vehicle, Failure type, Severity, Time) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-app)', padding: 4, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', padding: '0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={12} /> GROUP:
            </span>
            {[
              { id: 'NONE', label: 'None' },
              { id: 'VEHICLE', label: 'Vehicle' },
              { id: 'FAILURE_TYPE', label: 'Failure Type' },
              { id: 'SEVERITY', label: 'Severity' },
              { id: 'TIME', label: 'Time' },
            ].map(g => (
              <button
                key={g.id}
                onClick={() => setGroupBy(g.id)}
                style={{
                  background: groupBy === g.id ? 'var(--accent-blue)' : 'transparent',
                  border: 'none',
                  color: groupBy === g.id ? '#fff' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Severity selector pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-app)', padding: 4, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '0 6px' }}>SEVERITY:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? 'var(--navy-600)' : 'transparent',
                  border: severityFilter === sev ? '1px solid var(--border-light)' : '1px solid transparent',
                  color: severityFilter === sev ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status selector pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-app)', padding: 4, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '0 6px' }}>STATUS:</span>
            {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'var(--navy-600)' : 'transparent',
                  border: statusFilter === st ? '1px solid var(--border-light)' : '1px solid transparent',
                  color: statusFilter === st ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Telemetry Event Log</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {filteredAlerts.length} of {alerts.length} events
            </span>
          </div>
          {selectedAlerts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>
                {selectedAlerts.length} selected
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setAlerts(prev => prev.map(a => selectedAlerts.includes(a.id) ? { ...a, status: 'ACKNOWLEDGED' } : a))
                  setSelectedAlerts([])
                  showToast(`Selected alerts acknowledged.`)
                }}
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                Acknowledge Selected
              </button>
            </div>
          )}
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Alert ID & Time</th>
                <th>Vehicle & Model</th>
                <th>Diagnostic Anomaly</th>
                <th>Severity</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={36} color="var(--success)" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>No matching alerts found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>All filtered systems are operating within nominal telemetry limits.</div>
                  </td>
                </tr>
              ) : (
                Object.entries(groupedAlerts).map(([groupTitle, groupItems]) => (
                  <Fragment key={groupTitle}>
                    {groupBy !== 'NONE' && (
                      <tr style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={7} style={{ padding: '8px 16px', fontWeight: 700, fontSize: 12, color: 'var(--accent-cyan)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span>📁 {groupTitle}</span>
                            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 'var(--r-full)', fontSize: 11, color: 'var(--text-secondary)' }}>
                              {groupItems.length}
                            </span>
                          </span>
                        </td>
                      </tr>
                    )}
                    {groupItems.map(a => {
                      const sevStyle = SEV_BADGE_STYLE[a.severity] || SEV_BADGE_STYLE.LOW
                      const isCriticalOpen = a.severity === 'CRITICAL' && a.status === 'OPEN'

                      return (
                        <tr
                          key={a.id}
                          style={{
                            background: isCriticalOpen ? 'rgba(239,68,68,0.03)' : undefined,
                            borderLeft: isCriticalOpen ? '3px solid var(--critical)' : '3px solid transparent',
                          }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedAlerts.includes(a.id)}
                              onChange={() => handleToggleSelect(a.id)}
                            />
                          </td>

                          {/* Alert ID & Time */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="mono" style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
                                  {a.id}
                                </span>
                                {a.dtc && (
                                  <span style={{
                                    fontSize: 10,
                                    fontFamily: 'var(--font-mono)',
                                    background: 'rgba(255,255,255,0.06)',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    color: 'var(--text-secondary)'
                                  }}>
                                    {a.dtc}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} /> {a.time}
                              </span>
                            </div>
                          </td>

                          {/* Vehicle & Model */}
                          <td>
                            <div
                              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
                              onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}
                            >
                              <span className="mono" style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: 12 }}>
                                {a.vehicle_id}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {a.model} · {a.fleet}
                              </span>
                            </div>
                          </td>

                          {/* Anomaly & Evidence */}
                          <td style={{ maxWidth: 380 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                              {a.alert}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Telemetry Evidence:</span>
                              <span>{a.evidence}</span>
                            </div>
                            {a.resolutionNote && (
                              <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Check size={11} /> {a.resolutionNote}
                              </div>
                            )}
                          </td>

                          {/* Severity */}
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 'var(--r-sm)',
                              background: sevStyle.bg,
                              border: `1px solid ${sevStyle.border}`,
                              color: sevStyle.color,
                            }}>
                              {a.severity === 'CRITICAL' && (
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sevStyle.color, animation: isCriticalOpen ? 'pulse 1.2s infinite' : 'none' }} />
                              )}
                              {a.severity}
                            </span>
                          </td>

                          {/* Status */}
                          <td>
                            {a.status === 'OPEN' && (
                              <span className="badge badge-critical" style={{ fontSize: 10 }}>
                                OPEN
                              </span>
                            )}
                            {a.status === 'ACKNOWLEDGED' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span className="badge badge-medium" style={{ fontSize: 10 }}>
                                  ACKNOWLEDGED
                                </span>
                                {a.assignedTo && (
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                    {a.assignedTo}
                                  </span>
                                )}
                              </div>
                            )}
                            {a.status === 'RESOLVED' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span className="badge badge-normal" style={{ fontSize: 10 }}>
                                  RESOLVED
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  at {a.resolvedAt}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {a.status === 'OPEN' && (
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => handleAcknowledge(a.id)}
                                  style={{ fontSize: 11, padding: '4px 8px' }}
                                  title="Acknowledge alert"
                                >
                                  <Check size={13} /> Ack
                                </button>
                              )}

                              {a.status !== 'RESOLVED' && (
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => handleOpenResolveModal(a)}
                                  style={{ fontSize: 11, padding: '4px 8px', color: 'var(--success)' }}
                                  title="Mark resolved with notes"
                                >
                                  <CheckCircle2 size={13} /> Resolve
                                </button>
                              )}

                              <button
                                className="btn btn-ghost"
                                onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}
                                style={{ fontSize: 11, padding: '4px 8px' }}
                                title="Inspect vehicle telemetry & health"
                              >
                                Inspect <ChevronRight size={13} />
                              </button>

                              <button
                                className="btn btn-ghost"
                                onClick={() => navigate('/copilot', { state: { initialPrompt: `Why did vehicle ${a.vehicle_id} trigger alert "${a.alert}"? What preventive maintenance is recommended?` } })}
                                style={{ fontSize: 11, padding: '4px 8px', color: 'var(--accent-purple)' }}
                                title="Query FleetSentinel AI Copilot"
                              >
                                <Bot size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {activeModalAlert && (
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
                <CheckCircle2 size={20} color="var(--success)" />
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Resolve Maintenance Alert</h3>
              </div>
              <button
                onClick={() => setActiveModalAlert(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: 14, borderRadius: 'var(--r-md)', marginBottom: 16, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: 13 }}>
                  {activeModalAlert.id} · {activeModalAlert.vehicle_id}
                </span>
                <span className={`badge badge-${activeModalAlert.severity.toLowerCase()}`}>
                  {activeModalAlert.severity}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {activeModalAlert.alert}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Evidence: {activeModalAlert.evidence}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Resolution Action Category
                </label>
                <select
                  className="input"
                  value={resolveType}
                  onChange={e => setResolveType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Work Order Dispatched">Work Order Dispatched to Depot</option>
                  <option value="Preventive Part Replaced">Component Replaced (Spark plug, filter, coolant)</option>
                  <option value="Sensor Recalibrated">Sensor Re-zeroed & Tested</option>
                  <option value="Software ECU Re-flashed">ECU Diagnostic Cycle & Re-flash</option>
                  <option value="False Alarm / Filtered">Transient Spike / Filter Tuned</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Technician Action Notes
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={resolveNote}
                  onChange={e => setResolveNote(e.target.value)}
                  placeholder="Enter details of parts replaced, mechanic verification, or road test..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setActiveModalAlert(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleConfirmResolve}>
                  Confirm & Close Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
