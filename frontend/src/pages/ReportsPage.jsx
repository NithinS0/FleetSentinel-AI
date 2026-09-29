import { useState } from 'react'
import {
  FileText, Download, Calendar, Filter, CheckCircle2,
  Clock, Shield, ArrowUpRight, Plus, RefreshCw,
} from 'lucide-react'

const MOCK_REPORTS = [
  {
    id: 'REP-2026-0929',
    title: 'Daily Fleet Failure Risk & Predictive Dispatch Brief',
    category: 'Operational',
    generated_at: '2026-09-29 08:00:00',
    generated_by: 'FleetSentinel AI Automated Cron',
    format: 'PDF',
    size: '2.4 MB',
    status: 'READY',
  },
  {
    id: 'REP-2026-0928',
    title: 'Weekly 100k Connected Vehicle Health & Ingestion Audit',
    category: 'Executive',
    generated_at: '2026-09-28 23:59:00',
    generated_by: 'DevOps / Reliability Team',
    format: 'PDF',
    size: '8.1 MB',
    status: 'READY',
  },
  {
    id: 'REP-2026-0925',
    title: 'High-Dimensional Vector Fingerprint Accuracy Report',
    category: 'ML Research',
    generated_at: '2026-09-25 14:30:00',
    generated_by: 'MLOps Service',
    format: 'CSV',
    size: '14.2 MB',
    status: 'READY',
  },
  {
    id: 'REP-2026-0920',
    title: 'Monthly EV Battery Degradation & SOH Benchmark',
    category: 'EV Fleet',
    generated_at: '2026-09-20 10:15:00',
    generated_by: 'EV Fleet Operations',
    format: 'PDF',
    size: '4.8 MB',
    status: 'READY',
  },
  {
    id: 'REP-2026-0915',
    title: 'Preventive Downtime Cost Savings & ROI Ledger',
    category: 'Financial',
    generated_at: '2026-09-15 09:00:00',
    generated_by: 'Finance & Asset Management',
    format: 'CSV',
    size: '1.2 MB',
    status: 'READY',
  },
]

export default function ReportsPage() {
  const [reports, setReports] = useState(MOCK_REPORTS)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [generating, setGenerating] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleGenerateReport = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      const newRep = {
        id: `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Custom Telemetry & Failure Risk Audit Report',
        category: 'On-Demand',
        generated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        generated_by: 'Current Operator',
        format: 'PDF',
        size: '3.1 MB',
        status: 'READY',
      }
      setReports(prev => [newRep, ...prev])
      showToast('Report generated successfully and ready for download!')
    }, 1000)
  }

  const handleDownload = (rep) => {
    const sampleContent = `FleetSentinel AI — Executive Report\nID: ${rep.id}\nTitle: ${rep.title}\nGenerated: ${rep.generated_at}\nTotal Monitored Vehicles: 100,000\nEvents/sec: 103,482\nCritical Vehicles: 920\nAvoided Downtime: $1.84M\n`
    const blob = new Blob([sampleContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rep.id}.txt`
    a.click()
    showToast(`Downloaded ${rep.id}`)
  }

  const filtered = reports.filter(r =>
    selectedCategory === 'ALL' || r.category === selectedCategory
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--accent-cyan)',
          padding: '12px 20px',
          borderRadius: 'var(--r-md)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Compliance & Operational Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Audit-grade maintenance logs, failure prediction records, and executive fleet performance packages.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerateReport}
          disabled={generating}
          style={{ fontSize: 12 }}
        >
          {generating ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
          {generating ? 'Compiling Report...' : 'Generate New Audit Report'}
        </button>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-app)', padding: 4, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
        {['ALL', 'Operational', 'Executive', 'EV Fleet', 'Financial'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? 'var(--navy-600)' : 'transparent',
              border: selectedCategory === cat ? '1px solid var(--border-light)' : '1px solid transparent',
              color: selectedCategory === cat ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Report ID & Title</th>
                <th>Category</th>
                <th>Generated Timestamp</th>
                <th>Generated By</th>
                <th>Format</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Download</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={18} color="var(--accent-blue)" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                          {r.title}
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {r.id} · {r.size}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-normal" style={{ fontSize: 10 }}>{r.category}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.generated_at}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.generated_by}</td>
                  <td>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      color: 'var(--accent-cyan)'
                    }}>
                      {r.format}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-normal" style={{ fontSize: 10 }}>{r.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDownload(r)}
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      <Download size={13} /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
