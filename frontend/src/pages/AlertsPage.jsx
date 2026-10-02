import { useState, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, AlertTriangle, ShieldAlert, CheckCircle2, Clock,
  Filter, Search, Download, RefreshCw, ChevronRight, Check,
  Bot, ArrowUpRight, Wrench, ShieldCheck, X, FileText, Send, Sparkles,
} from 'lucide-react'
import { useAlertStore } from '../store/alertStore'
import toast from 'react-hot-toast'
import {
  generateAlertsAuditReportHTML,
  downloadReportPDF,
  downloadReportHTML,
  openReportPrintWindow,
  downloadCSV,
} from '../utils/reportTemplateGenerator'

export default function AlertsPage() {
  const navigate = useNavigate()
  const { alerts, acknowledgeAlert, acknowledgeAll, resolveAlert, addAlert } = useAlertStore()

  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedAlerts, setSelectedAlerts] = useState([])
  const [groupBy, setGroupBy] = useState('NONE')
  const [activeModalAlert, setActiveModalAlert] = useState(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolveType, setResolveType] = useState('Work Order Dispatched')

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
    const medium = alerts.filter(a => a.severity === 'MEDIUM' && a.status !== 'RESOLVED').length
    const open = alerts.filter(a => a.status === 'OPEN').length
    const resolved = alerts.filter(a => a.status === 'RESOLVED').length
    return { total, critical, high, medium, open, resolved }
  }, [alerts])

  const handleAcknowledge = (id) => {
    acknowledgeAlert(id)
    toast.success(`Alert ${id} acknowledged`)
  }

  const handleAcknowledgeAll = () => {
    acknowledgeAll()
    toast.success('All open alerts have been acknowledged')
  }

  const handleOpenResolveModal = (alert) => {
    setActiveModalAlert(alert)
    setResolveNote(`Preventive service verified on ${alert.vehicle_id}.`)
  }

  const handleConfirmResolve = () => {
    if (!activeModalAlert) return
    resolveAlert(activeModalAlert.id, resolveNote, resolveType)
    toast.success(`Alert ${activeModalAlert.id} marked as RESOLVED`)
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
    addAlert(newAlert)
    toast.error(`⚠️ Live stream ingestion: Critical Alert ${newId} triggered for MH12EF9012!`, { duration: 4000 })
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

  const handleDownloadAuditReport = async () => {
    const filterDesc = `Severity: ${severityFilter} | Status: ${statusFilter} ${search ? `| Search: "${search}"` : ''}`
    const html = generateAlertsAuditReportHTML({
      alerts: filteredAlerts,
      filterInfo: filterDesc,
      generatedBy: 'FleetSentinel SOC Controller (admin)',
    })
    await downloadReportPDF(`Telemetry_Alert_Audit_${new Date().toISOString().slice(0, 10)}.pdf`, html)
  }

  const handleExportCSV = () => {
    const headers = 'Alert ID,Time,Vehicle ID,Severity,Status,DTC,Model,Fleet,Evidence\n'
    const rows = filteredAlerts.map(a =>
      `"${a.id}","${a.time}","${a.vehicle_id}","${a.severity}","${a.status}","${a.dtc || ''}","${a.model}","${a.fleet}","${a.evidence.replace(/"/g, '""')}"`
    ).join('\n')
    downloadCSV(`FleetSentinel_Alerts_${new Date().toISOString().slice(0, 10)}.csv`, headers + rows)
    toast.success('Alert log exported to CSV')
  }

  const SEV_BADGE_STYLE = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#EF4444' },
    HIGH: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', color: '#F97316' },
    MEDIUM: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#F59E0B' },
    LOW: { bg: 'rgba(22,136,255,0.15)', border: 'rgba(22,136,255,0.4)', color: '#1688FF' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Telemetry Alert Center
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#16A34A',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 'var(--r-full)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
              Stream Connected: 103,482 evt/s
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            Real-time anomaly triggers, diagnostic trouble codes, and operational interventions across 100,000 vehicles.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleSimulateNewAlert}
            title="Simulate real-time telemetry stream alert"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={13} style={{ color: '#2563EB' }} />
            Simulate Ingestion Event
          </button>

          <button
            onClick={handleDownloadAuditReport}
            title="Download executive incident & alert audit report (HTML/Printable PDF)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 8,
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={13} />
            Download Audit Report
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={13} />
            Export CSV
          </button>

          <button
            onClick={handleAcknowledgeAll}
            disabled={stats.open === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 16px',
              borderRadius: 8,
              background: stats.open === 0
                ? '#94A3B8'
                : 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
              border: 'none',
              color: '#FFFFFF',
              cursor: stats.open === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <Check size={14} />
            Acknowledge All ({stats.open})
          </button>
        </div>
      </div>

      {/* ── Operational Inbox KPI Banner ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {/* CRITICAL */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderLeft: '4px solid #DC2626',
            background: severityFilter === 'CRITICAL' ? '#FEF2F2' : '#FFFFFF',
            border: `1px solid ${severityFilter === 'CRITICAL' ? '#FCA5A5' : '#E2E8F0'}`,
            borderLeftWidth: 4,
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', letterSpacing: '0.04em' }}>CRITICAL</span>
            <ShieldAlert size={16} color="#DC2626" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#DC2626', marginTop: 4, letterSpacing: '-0.02em' }}>
            {stats.critical}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: 500 }}>
            Immediate intervention required
          </div>
        </div>

        {/* HIGH */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderLeft: '4px solid #EA580C',
            background: severityFilter === 'HIGH' ? '#FFF7ED' : '#FFFFFF',
            border: `1px solid ${severityFilter === 'HIGH' ? '#FDBA74' : '#E2E8F0'}`,
            borderLeftWidth: 4,
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', letterSpacing: '0.04em' }}>HIGH</span>
            <AlertTriangle size={16} color="#EA580C" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#EA580C', marginTop: 4, letterSpacing: '-0.02em' }}>
            {stats.high}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: 500 }}>
            Horizon: 2–5 days
          </div>
        </div>

        {/* MEDIUM */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderLeft: '4px solid #D97706',
            background: severityFilter === 'MEDIUM' ? '#FFFBEB' : '#FFFFFF',
            border: `1px solid ${severityFilter === 'MEDIUM' ? '#FCD34D' : '#E2E8F0'}`,
            borderLeftWidth: 4,
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', letterSpacing: '0.04em' }}>MEDIUM</span>
            <Bell size={16} color="#D97706" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#D97706', marginTop: 4, letterSpacing: '-0.02em' }}>
            {stats.medium}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: 500 }}>
            Sub-threshold telemetry drifts
          </div>
        </div>

        {/* RESOLVED */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderLeft: '4px solid #16A34A',
            background: statusFilter === 'RESOLVED' ? '#F0FDF4' : '#FFFFFF',
            border: `1px solid ${statusFilter === 'RESOLVED' ? '#86EFAC' : '#E2E8F0'}`,
            borderLeftWidth: 4,
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: '0.04em' }}>RESOLVED</span>
            <ShieldCheck size={16} color="#16A34A" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#16A34A', marginTop: 4, letterSpacing: '-0.02em' }}>
            {stats.resolved.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: 500 }}>
            Closed in past 30 days
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar & Grouping Options ───────────────────── */}
      <div
        style={{
          padding: '14px 18px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              placeholder="Search alert, Vehicle ID (e.g. TN01AB1234), DTC code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 36px 9px 34px',
                fontSize: 13,
                borderRadius: 8,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#0F172A',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Group By selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', padding: 4, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', padding: '0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                  background: groupBy === g.id ? '#2563EB' : 'transparent',
                  border: 'none',
                  color: groupBy === g.id ? '#FFFFFF' : '#475569',
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '4px 9px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Severity selector pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', padding: 4, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', padding: '0 6px' }}>SEVERITY:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? '#0F172A' : 'transparent',
                  border: 'none',
                  color: severityFilter === sev ? '#FFFFFF' : '#475569',
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '4px 9px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status selector pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', padding: 4, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', padding: '0 6px' }}>STATUS:</span>
            {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? '#0F172A' : 'transparent',
                  border: 'none',
                  color: statusFilter === st ? '#FFFFFF' : '#475569',
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '4px 9px',
                  borderRadius: 6,
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

      {/* Alerts Table Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Telemetry Event Log</h3>
            <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 999, fontWeight: 500 }}>
              Showing {filteredAlerts.length} of {alerts.length} events
            </span>
          </div>
          {selectedAlerts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB' }}>
                {selectedAlerts.length} selected
              </span>
              <button
                onClick={() => {
                  selectedAlerts.forEach(id => acknowledgeAlert(id))
                  setSelectedAlerts([])
                  toast.success(`${selectedAlerts.length} alerts acknowledged`)
                }}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: 6,
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#2563EB',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Check size={13} /> Acknowledge Selected
              </button>
            </div>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ width: 40, padding: '12px 16px' }}>
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#2563EB' }}
                  />
                </th>
                <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Alert ID & Time</th>
                <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vehicle & Model</th>
                <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Diagnostic Anomaly</th>
                <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Severity</th>
                <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px 16px', color: '#64748B' }}>
                    <ShieldCheck size={40} color="#16A34A" style={{ margin: '0 auto 12px', display: 'block' }} />
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>No matching alerts found</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: '#64748B' }}>All filtered telemetry channels are operating within nominal limits.</div>
                  </td>
                </tr>
              ) : (
                Object.entries(groupedAlerts).map(([groupTitle, groupItems]) => (
                  <Fragment key={groupTitle}>
                    {groupBy !== 'NONE' && (
                      <tr style={{ background: '#F1F5F9', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                        <td colSpan={7} style={{ padding: '8px 16px', fontWeight: 700, fontSize: 12, color: '#2563EB' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span>📁 {groupTitle}</span>
                            <span style={{ background: '#E2E8F0', padding: '1px 8px', borderRadius: 999, fontSize: 11, color: '#475569' }}>
                              {groupItems.length}
                            </span>
                          </span>
                        </td>
                      </tr>
                    )}
                    {groupItems.map(a => {
                      const isCriticalOpen = a.severity === 'CRITICAL' && a.status === 'OPEN'
                      const isHigh = a.severity === 'HIGH'
                      const isMedium = a.severity === 'MEDIUM'

                      // Custom high-contrast light severity styles
                      const sevBadge = a.severity === 'CRITICAL'
                        ? { bg: '#FEF2F2', border: '#FCA5A5', color: '#DC2626' }
                        : isHigh
                        ? { bg: '#FFF7ED', border: '#FDBA74', color: '#EA580C' }
                        : isMedium
                        ? { bg: '#FEFCE8', border: '#FDE047', color: '#CA8A04' }
                        : { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' }

                      return (
                        <tr
                          key={a.id}
                          style={{
                            background: isCriticalOpen ? '#FFF5F5' : '#FFFFFF',
                            borderBottom: '1px solid #E2E8F0',
                            borderLeft: isCriticalOpen ? '4px solid #EF4444' : '4px solid transparent',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <input
                              type="checkbox"
                              checked={selectedAlerts.includes(a.id)}
                              onChange={() => handleToggleSelect(a.id)}
                              style={{ cursor: 'pointer', accentColor: '#2563EB' }}
                            />
                          </td>

                          {/* Alert ID & Time */}
                          <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                                  {a.id}
                                </span>
                                {a.dtc && (
                                  <span style={{
                                    fontSize: 10.5,
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    background: '#F1F5F9',
                                    border: '1px solid #E2E8F0',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    color: '#475569',
                                  }}>
                                    {a.dtc}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: 11.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11.5} /> {a.time}
                              </span>
                            </div>
                          </td>

                          {/* Vehicle & Model */}
                          <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                            <div
                              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
                              onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}
                            >
                              <span style={{ fontFamily: 'var(--font-mono)', color: '#2563EB', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                                {a.vehicle_id}
                              </span>
                              <span style={{ fontSize: 11.5, color: '#64748B' }}>
                                {a.model} · {a.fleet}
                              </span>
                            </div>
                          </td>

                          {/* Anomaly & Evidence */}
                          <td style={{ padding: '14px', maxWidth: 380, verticalAlign: 'middle' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                              {a.alert}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                              <span style={{ color: '#0284C7', fontWeight: 700, flexShrink: 0 }}>Telemetry Evidence:</span>
                              <span>{a.evidence}</span>
                            </div>
                            {a.resolutionNote && (
                              <div style={{ fontSize: 11.5, color: '#16A34A', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                                <Check size={12} /> {a.resolutionNote}
                              </div>
                            )}
                          </td>

                          {/* Severity */}
                          <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 6,
                              background: sevBadge.bg,
                              border: `1px solid ${sevBadge.border}`,
                              color: sevBadge.color,
                            }}>
                              {a.severity === 'CRITICAL' && (
                                <span style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: sevBadge.color,
                                  animation: isCriticalOpen ? 'pulse 1.2s infinite' : 'none',
                                }} />
                              )}
                              {a.severity}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                            {a.status === 'OPEN' && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 10.5,
                                fontWeight: 700,
                                background: '#FEF2F2',
                                border: '1px solid #FCA5A5',
                                color: '#DC2626',
                              }}>
                                OPEN
                              </span>
                            )}
                            {a.status === 'ACKNOWLEDGED' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  background: '#FEFCE8',
                                  border: '1px solid #FDE047',
                                  color: '#B45309',
                                  width: 'fit-content',
                                }}>
                                  ACKNOWLEDGED
                                </span>
                                {a.assignedTo && (
                                  <span style={{ fontSize: 10.5, color: '#64748B' }}>
                                    {a.assignedTo}
                                  </span>
                                )}
                              </div>
                            )}
                            {a.status === 'RESOLVED' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  background: '#F0FDF4',
                                  border: '1px solid #86EFAC',
                                  color: '#16A34A',
                                  width: 'fit-content',
                                }}>
                                  RESOLVED
                                </span>
                                <span style={{ fontSize: 10.5, color: '#64748B' }}>
                                  at {a.resolvedAt}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {a.status === 'OPEN' && (
                                <button
                                  onClick={() => handleAcknowledge(a.id)}
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    padding: '5px 9px',
                                    borderRadius: 6,
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                  }}
                                  title="Acknowledge alert"
                                >
                                  <Check size={13} color="#2563EB" /> Ack
                                </button>
                              )}

                              {a.status !== 'RESOLVED' && (
                                <button
                                  onClick={() => handleOpenResolveModal(a)}
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    padding: '5px 9px',
                                    borderRadius: 6,
                                    background: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    color: '#16A34A',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                  title="Mark resolved with notes"
                                >
                                  <CheckCircle2 size={13} /> Resolve
                                </button>
                              )}

                              <button
                                onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  padding: '5px 9px',
                                  borderRadius: 6,
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  color: '#2563EB',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title="Inspect vehicle telemetry & health"
                              >
                                Inspect <ChevronRight size={13} />
                              </button>

                              <button
                                onClick={() => navigate('/copilot', { state: { initialPrompt: `Why did vehicle ${a.vehicle_id} trigger alert "${a.alert}"? What preventive maintenance is recommended?` } })}
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  background: '#F5F3FF',
                                  border: '1px solid #DDD6FE',
                                  color: '#7C3AED',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                                title="Query FleetSentinel AI Copilot"
                              >
                                <Bot size={14} />
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
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            width: '100%',
            maxWidth: 540,
            padding: 24,
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={20} color="#16A34A" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>Resolve Maintenance Alert</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Record maintenance action and close this event</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalAlert(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 10, marginBottom: 16, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563EB', fontSize: 13 }}>
                  {activeModalAlert.id} · {activeModalAlert.vehicle_id}
                </span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: activeModalAlert.severity === 'CRITICAL' ? '#FEF2F2' : '#FFF7ED',
                  border: `1px solid ${activeModalAlert.severity === 'CRITICAL' ? '#FCA5A5' : '#FDBA74'}`,
                  color: activeModalAlert.severity === 'CRITICAL' ? '#DC2626' : '#EA580C',
                }}>
                  {activeModalAlert.severity}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
                {activeModalAlert.alert}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                Evidence: {activeModalAlert.evidence}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Resolution Action Category
                </label>
                <select
                  value={resolveType}
                  onChange={e => setResolveType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    color: '#0F172A',
                    outline: 'none',
                  }}
                >
                  <option value="Work Order Dispatched">Work Order Dispatched to Depot</option>
                  <option value="Preventive Part Replaced">Component Replaced (Spark plug, filter, coolant)</option>
                  <option value="Sensor Recalibrated">Sensor Re-zeroed & Tested</option>
                  <option value="Software ECU Re-flashed">ECU Diagnostic Cycle & Re-flash</option>
                  <option value="False Alarm / Filtered">Transient Spike / Filter Tuned</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Technician Action Notes
                </label>
                <textarea
                  rows={3}
                  value={resolveNote}
                  onChange={e => setResolveNote(e.target.value)}
                  placeholder="Enter details of parts replaced, mechanic verification, or road test..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    color: '#0F172A',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setActiveModalAlert(null)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResolve}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    background: '#16A34A',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
                  }}
                >
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
