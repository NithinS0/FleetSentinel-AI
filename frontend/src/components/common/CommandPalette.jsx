import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Car, AlertTriangle, Wrench, Fingerprint,
  Bot, Map, ArrowRight, X, Sparkles, Activity,
} from 'lucide-react'
import { FLEET_VEHICLES, TOP_PREDICTIONS } from '../../data/demoData'

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Filter items
  const items = [
    { type: 'NAV', label: 'Go to Fleet Intelligence Dashboard', icon: Activity, action: () => navigate('/dashboard') },
    { type: 'NAV', label: 'Open Geospatial Fleet Map', icon: Map, action: () => navigate('/fleet-map') },
    { type: 'NAV', label: 'Inspect Hero Critical Vehicle (TN01AB1234)', icon: Car, action: () => navigate('/vehicles/TN01AB1234'), badge: 'CRITICAL' },
    { type: 'NAV', label: 'Review Active Breakdown Predictions', icon: Wrench, action: () => navigate('/predictions') },
    { type: 'NAV', label: 'Failure Fingerprint Vector Engine', icon: Fingerprint, action: () => navigate('/fingerprints') },
    { type: 'NAV', label: 'Telemetry Anomaly Alert Inbox', icon: AlertTriangle, action: () => navigate('/alerts') },
    { type: 'NAV', label: 'Public Product Showcase & Architecture', icon: Sparkles, action: () => navigate('/landing') },
    { type: 'AI', label: 'Ask Copilot: "Why is TN01AB1234 overheating?"', icon: Bot, action: () => navigate('/copilot', { state: { initialPrompt: 'Why is TN01AB1234 overheating and throwing P0301?' } }) },
    ...FLEET_VEHICLES.map(v => ({
      type: 'VEHICLE',
      label: `${v.vehicle_id} · ${v.make} ${v.model} (${v.status})`,
      icon: Car,
      badge: v.status,
      action: () => navigate(`/vehicles/${v.vehicle_id}`),
    })),
  ].filter(it => !query || it.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(1, items.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + items.length) % Math.max(1, items.length))
      } else if (e.key === 'Enter' && items[selectedIndex]) {
        e.preventDefault()
        items[selectedIndex].action()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, items, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="cmd-palette-backdrop" onClick={onClose}>
      <div className="cmd-palette-box" onClick={e => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={18} color="var(--accent-blue)" />
          <input
            ref={inputRef}
            placeholder="Type a command, vehicle ID, or ask Copilot... (↑↓ to navigate)"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-muted)',
          }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
          {items.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No matching commands or vehicles found.
            </div>
          ) : (
            items.slice(0, 8).map((it, idx) => {
              const isSelected = idx === selectedIndex
              const Icon = it.icon
              return (
                <div
                  key={idx}
                  onClick={() => {
                    it.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isSelected ? 'var(--bg-hover)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: isSelected ? 'rgba(22,136,255,0.2)' : 'var(--bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                    }}>
                      <Icon size={14} />
                    </div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}>
                      {it.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {it.badge && (
                      <span className={`badge badge-${it.badge.toLowerCase()}`} style={{ fontSize: 9 }}>
                        {it.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight size={13} color="var(--accent-blue)" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-app)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          <span>Navigate with <kbd style={{ padding: '1px 4px', background: 'var(--bg-card)', borderRadius: 3, border: '1px solid var(--border)' }}>↑</kbd> <kbd style={{ padding: '1px 4px', background: 'var(--bg-card)', borderRadius: 3, border: '1px solid var(--border)' }}>↓</kbd></span>
          <span>Select <kbd style={{ padding: '1px 4px', background: 'var(--bg-card)', borderRadius: 3, border: '1px solid var(--border)' }}>↵</kbd></span>
        </div>
      </div>
    </div>
  )
}
