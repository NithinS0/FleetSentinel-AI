import { useEffect, useRef } from 'react'
import { MAP_VEHICLES } from '../../data/demoData'

// MapTiler Dark Matter Tile Layer (Fallback to CartoDB)
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '5tT0gM0nX5N39k8ZyjfH'
const TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/basic-v2-dark/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTR = '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const STATUS_COLOR = {
  HEALTHY:  '#22C55E',
  AT_RISK:  '#F59E0B',
  CRITICAL: '#EF4444',
}

export default function FleetMap({ compact = false }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (mapInstanceRef.current || typeof window === 'undefined') return

    // Dynamically load Leaflet
    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, {
      center: [17.5, 78.5],
      zoom: compact ? 5 : 6,
      zoomControl: !compact,
      scrollWheelZoom: !compact,
      attributionControl: false,
    })

    L.tileLayer(TILE_URL, { attribution: ATTR, maxZoom: 18 }).addTo(map)

    MAP_VEHICLES.forEach(v => {
      const color = STATUS_COLOR[v.status] || '#22C55E'
      const el = document.createElement('div')
      el.style.cssText = `
        width:${v.status === 'CRITICAL' ? 14 : 10}px;
        height:${v.status === 'CRITICAL' ? 14 : 10}px;
        border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,0.7);
        box-shadow:0 0 ${v.status === 'CRITICAL' ? '12px' : '6px'} ${color};
        cursor:pointer;
        ${v.status === 'CRITICAL' ? 'animation:pulse 1.5s ease infinite;' : ''}
      `
      const icon = L.divIcon({ html: el, className: '', iconSize: [14, 14], iconAnchor: [7, 7] })
      const marker = L.marker([v.lat, v.lng], { icon })

      marker.bindPopup(`
        <div style="background:#10283C;border:1px solid #1D4057;border-radius:10px;padding:14px;min-width:180px;font-family:Inter,sans-serif;">
          <div style="font-size:13px;font-weight:700;color:#18D6D1;font-family:monospace;margin-bottom:10px;">${v.id}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:#64798A;">Health Score</span>
            <span style="font-size:12px;font-weight:700;color:#F8FAFC;">${v.health} / 100</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:#64798A;">Status</span>
            <span style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;">${v.status.replace('_',' ')}</span>
          </div>
          <div style="height:4px;background:#1D4057;border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${v.health}%;background:${color};border-radius:99px;"></div>
          </div>
        </div>
      `, { className: 'fleet-popup' })

      marker.addTo(map)
    })

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', minHeight: compact ? 340 : 500, borderRadius: 'var(--r-lg)', overflow: 'hidden' }}
    />
  )
}
