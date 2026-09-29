import { useState } from 'react'
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function Topbar({ onOpenCmd }) {
  const [eventsPerSec] = useState(103482)
  const { user } = useAuthStore()
  const initial = (user?.full_name || user?.email || 'A').charAt(0).toUpperCase()

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
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-full)',
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
        }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            {eventsPerSec.toLocaleString()}
          </span>
          <span>ev/s</span>
        </div>

        {/* Help */}
        <button className="icon-btn" title="Help">
          <HelpCircle size={16} />
        </button>

        {/* Notifications */}
        <button className="icon-btn" title="Notifications">
          <Bell size={16} />
          <span className="notif-badge" />
        </button>

        {/* Fleet selector */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          fontSize: 12, fontWeight: 500,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
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
          cursor: 'pointer', border: '2px solid var(--border)',
        }}>
          {initial}
        </div>
      </div>
    </header>
  )
}
