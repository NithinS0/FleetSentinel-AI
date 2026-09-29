import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Map, Wrench, Fingerprint,
  Bell, Bot, BarChart3, FileText, Settings, LogOut,
  ChevronLeft, ChevronRight, Car, Shield, Activity,
  Search, ShieldAlert, Cpu, HeartPulse,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { FLEET_SUMMARY } from '../../data/demoData'

const NAV = [
  { group: 'OVERVIEW', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/fleet-map',  icon: Map,            label: 'Fleet' },
  ]},
  { group: 'INTELLIGENCE', items: [
    { to: '/vehicles',     icon: Car,         label: 'Vehicle Intelligence' },
    { to: '/predictions',  icon: Wrench,      label: 'Predictive Maintenance' },
    { to: '/fingerprints', icon: Fingerprint, label: 'Failure Fingerprints' },
    { to: '/copilot',      icon: Bot,         label: 'AI Copilot', aiAccent: true },
  ]},
  { group: 'OPERATIONS', items: [
    { to: '/alerts',       icon: Bell,        label: 'Alerts', badge: 6 },
    { to: '/predictions',  icon: ShieldAlert, label: 'Maintenance' },
    { to: '/reports',      icon: FileText,    label: 'Reports' },
  ]},
  { group: 'SYSTEM', items: [
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings',  icon: HeartPulse, label: 'System Health' },
    { to: '/settings',  icon: Settings, label: 'Settings' },
  ]},
]

export default function Sidebar({ collapsed, onToggle, onOpenCmd }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const initial = (user?.full_name || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <aside className="sidebar" style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)' }}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <Shield size={16} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <div className="name">FleetSentinel AI</div>
            <div className="tagline">Connected Intelligence</div>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            marginLeft: collapsed ? 'auto' : undefined,
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '50%', cursor: 'pointer',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Quick Search Shortcut */}
      {!collapsed && onOpenCmd && (
        <div style={{ padding: '8px 12px' }}>
          <button
            onClick={onOpenCmd}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              background: 'rgba(14, 38, 56, 0.6)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={13} /> Search Platform...
            </span>
            <kbd style={{ fontSize: 9, padding: '1px 5px', background: 'var(--bg-elevated)', borderRadius: 3, border: '1px solid var(--border)' }}>
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            {!collapsed && <div className="nav-section-label">{group}</div>}
            {collapsed && <div style={{ height: 10 }} />}
            {items.map(({ to, icon: Icon, label, badge, aiAccent }, idx) => (
              <NavLink
                key={`${to}-${label}-${idx}`}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                title={collapsed ? label : undefined}
                style={aiAccent ? { '--nav-accent': 'var(--accent-purple)' } : {}}
              >
                <Icon
                  size={16}
                  style={{ color: aiAccent ? 'var(--accent-purple)' : undefined, flexShrink: 0 }}
                />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, color: aiAccent ? 'inherit' : undefined, fontSize: 13 }}>{label}</span>
                    {badge && <span className="nav-badge">{badge}</span>}
                  </>
                )}
                {collapsed && badge && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--critical)',
                    border: '1.5px solid var(--bg-surface)',
                  }} />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Profile */}
      <div className="sidebar-bottom">
        <div
          className="user-profile"
          onClick={() => {
            logout()
            navigate('/login')
          }}
          title="Sign out"
        >
          <div className="user-avatar">{initial}</div>
          {!collapsed && (
            <>
              <div className="user-info">
                <div className="user-name">{user?.full_name || 'Fleet Operator'}</div>
                <div className="user-role">{user?.role ? user.role.replace('_', ' ') : 'Fleet Director'}</div>
              </div>
              <LogOut size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
