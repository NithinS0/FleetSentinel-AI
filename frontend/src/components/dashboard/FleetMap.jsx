import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_VEHICLES } from '../../data/demoData'

// OpenStreetMap Standard Light Tile Layer (100% free, no API key required, crisp and clean)
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const STATUS_COLOR = {
  HEALTHY:  '#16A34A',
  AT_RISK:  '#D97706',
  CRITICAL: '#DC2626',
}

export default function FleetMap({ compact = false }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [17.5, 78.5],
      zoom: compact ? 5 : 6,
      zoomControl: !compact,
      scrollWheelZoom: !compact,
      attributionControl: false,
    })

    L.tileLayer(TILE_URL, {
      attribution: ATTR,
      maxZoom: 18,
      subdomains: 'abc',
    }).addTo(map)

    MAP_VEHICLES.forEach(v => {
      const color = STATUS_COLOR[v.status] || '#16A34A'
      const isCritical = v.status === 'CRITICAL'
      const el = document.createElement('div')
      el.style.cssText = `
        width: ${isCritical ? '16px' : '12px'};
        height: ${isCritical ? '16px' : '12px'};
        border-radius: 50%;
        background: ${color};
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25), 0 0 0 ${isCritical ? '4px rgba(220,38,38,0.2)' : '2px rgba(22,163,74,0.15)'};
        cursor: pointer;
        transition: transform 0.2s ease;
      `
      const icon = L.divIcon({ html: el, className: 'fleet-marker-icon', iconSize: [16, 16], iconAnchor: [8, 8] })
      const marker = L.marker([v.lat, v.lng], { icon })

      marker.bindPopup(`
        <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:12px 14px;min-width:180px;font-family:Inter,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.1);">
          <div style="font-size:13px;font-weight:700;color:#0F172A;font-family:'JetBrains Mono',monospace;margin-bottom:8px;">${v.id}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:11px;color:#64748B;">Health Score</span>
            <span style="font-size:12px;font-weight:700;color:#0F172A;">${v.health} / 100</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:11px;color:#64748B;">Status</span>
            <span style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;">${v.status.replace('_',' ')}</span>
          </div>
          <div style="height:5px;background:#F1F5F9;border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${v.health}%;background:${color};border-radius:99px;"></div>
          </div>
        </div>
      `, { className: 'fleet-popup', maxWidth: 240 })

      marker.addTo(map)
    })

    // Invalidate size once rendered
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)

    mapInstanceRef.current = map
    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [compact])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: compact ? 340 : 420,
        borderRadius: 'inherit',
      }}
    />
  )
}
