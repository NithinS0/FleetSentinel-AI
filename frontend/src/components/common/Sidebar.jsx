import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Map, Wrench, Fingerprint,
  Bell, Bot, BarChart3, FileText, Settings, LogOut,
  ChevronLeft, ChevronRight, Car, Shield, Activity,
  Search, ShieldAlert, Cpu, HeartPulse,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAlertStore } from '../../store/alertStore'
import { FLEET_SUMMARY } from '../../data/demoData'

export default function Sidebar({ collapsed, onToggle, onOpenCmd }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const openAlertsCount = useAlertStore(s => s.alerts.filter(a => a.status === 'OPEN').length)

  const initial = (user?.full_name || user?.email || 'A').charAt(0).toUpperCase()

  const navGroups = [
    { group: 'OVERVIEW', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/fleet-map',  icon: Map,            label: 'Fleet Map' },
    ]},
    { group: 'INTELLIGENCE', items: [
      { to: '/vehicles',     icon: Car,         label: 'Vehicle Intelligence' },
      { to: '/predictions',  icon: Wrench,      label: 'Predictive Maintenance' },
      { to: '/fingerprints', icon: Fingerprint, label: 'Failure Fingerprints' },
      { to: '/copilot',      icon: Bot,         label: 'AI Copilot', aiAccent: true },
    ]},
    { group: 'OPERATIONS', items: [
      { to: '/alerts',      icon: Bell,     label: 'Alerts', badge: openAlertsCount > 0 ? openAlertsCount : null },
      { to: '/reports',     icon: FileText, label: 'Reports & Audits' },
    ]},
    { group: 'SYSTEM', items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/settings',  icon: Settings,   label: 'Settings & Health' },
    ]},
  ]

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
            background: 'var(--bg-app)', border: '1px solid var(--border)',
            borderRadius: '50%', cursor: 'pointer',
            color: 'var(--text-muted)',
            flexShrink: 0,
            transition: 'all var(--t-std)',
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navGroups.map(({ group, items }) => (
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
