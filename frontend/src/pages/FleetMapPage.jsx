import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Map, Filter, Navigation, Car, AlertTriangle, ShieldCheck,
  ChevronRight, ArrowRight, Activity, Radio, MapPin,
} from 'lucide-react'
import FleetMap from '../components/dashboard/FleetMap'
import { MAP_VEHICLES, FLEET_VEHICLES, HERO_VEHICLE } from '../data/demoData'

export default function FleetMapPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedVehicle, setSelectedVehicle] = useState(HERO_VEHICLE)

  const filteredVehicles = MAP_VEHICLES.filter(v =>
    statusFilter === 'ALL' || v.status === statusFilter
  )

  const STATUS_COUNTS = {
    CRITICAL: MAP_VEHICLES.filter(v => v.status === 'CRITICAL').length,
    AT_RISK: MAP_VEHICLES.filter(v => v.status === 'AT_RISK').length,
    HEALTHY: MAP_VEHICLES.filter(v => v.status === 'HEALTHY').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Live Fleet Geospatial Map</h1>
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
              <Radio size={12} className="spin" />
              Live GPS Telemetry Updates (1Hz)
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Geospatial tracking, corridor telemetry health, and emergency location services for active vehicles.
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-app)', padding: 4, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
          {[
            { id: 'ALL', label: 'All Units' },
            { id: 'CRITICAL', label: `Critical (${STATUS_COUNTS.CRITICAL})`, color: 'var(--critical)' },
            { id: 'AT_RISK', label: `At Risk (${STATUS_COUNTS.AT_RISK})`, color: 'var(--warning)' },
            { id: 'HEALTHY', label: `Healthy (${STATUS_COUNTS.HEALTHY})`, color: 'var(--success)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                background: statusFilter === f.id ? 'var(--navy-600)' : 'transparent',
                border: statusFilter === f.id ? '1px solid var(--border-light)' : '1px solid transparent',
                color: statusFilter === f.id ? (f.color || 'var(--text-primary)') : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Layout: Left Map + Right Vehicle Inspector Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', height: 'calc(100vh - 220px)', minHeight: 600 }}>
        {/* Map Container */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%', position: 'relative' }}>
          <FleetMap compact={false} />

          {/* Map Overlay Stats */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            zIndex: 900,
            background: 'rgba(11,30,48,0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--critical)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Critical:</span>
              <strong style={{ color: 'var(--critical)' }}>{STATUS_COUNTS.CRITICAL}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
              <span style={{ color: 'var(--text-muted)' }}>At Risk:</span>
              <strong style={{ color: 'var(--warning)' }}>{STATUS_COUNTS.AT_RISK}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Healthy:</span>
              <strong style={{ color: 'var(--success)' }}>{STATUS_COUNTS.HEALTHY}</strong>
            </div>
          </div>
        </div>

        {/* Selected Vehicle Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)', background: 'var(--bg-app)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
              VEHICLE TELEMETRY INSPECTOR
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-400)' }}>
                {selectedVehicle?.vehicle_id || 'TN01AB1234'}
              </span>
              <span className="badge badge-critical">
                CRITICAL
              </span>
            </div>
          </div>

          <div style={{ padding: 'var(--space-5)', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>VEHICLE SPEC</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.year})
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                VIN: {selectedVehicle?.vin} · {selectedVehicle?.fleet_name}
              </div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Health Score</span>
                <strong style={{ color: 'var(--critical)', fontSize: 14 }}>{selectedVehicle?.health_score}/100</strong>
              </div>
              <div className="risk-bar">
                <div className="risk-bar-fill" style={{ width: `${selectedVehicle?.health_score}%`, background: 'var(--critical)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'var(--bg-app)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SPEED</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {selectedVehicle?.speed_kmh} <span style={{ fontSize: 11, fontWeight: 400 }}>km/h</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ENGINE TEMP</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--critical)', marginTop: 2 }}>
                  {selectedVehicle?.engine_temp_c}°C
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CURRENT LOCATION</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="var(--accent-blue)" /> {selectedVehicle?.location?.address || 'Chennai Highway Corridor'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Lat: {selectedVehicle?.location?.lat}, Lng: {selectedVehicle?.location?.lng}
              </div>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.08)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ fontSize: 11, color: 'var(--critical)', fontWeight: 700, marginBottom: 4 }}>
                ACTIVE ANOMALY PREDICTION
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Engine Misfire (87% Probability)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Failure window: &lt; 24 hrs. Cylinder #1 ignition coil replacement required.
              </div>
            </div>

            {/* List of other vehicles */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
                NEARBY VEHICLES IN REGION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredVehicles.slice(0, 5).map(v => (
                  <div
                    key={v.id}
                    onClick={() => {
                      const found = FLEET_VEHICLES.find(fv => fv.vehicle_id === v.id)
                      setSelectedVehicle({
                        ...HERO_VEHICLE,
                        vehicle_id: v.id,
                        status: v.status,
                        health_score: v.health,
                        make: found?.make || 'Fleet',
                        model: found?.model || 'Unit',
                      })
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: 'var(--bg-app)',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="mono" style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {v.id}
                    </span>
                    <span className={`badge badge-${v.status.toLowerCase()}`} style={{ fontSize: 9 }}>
                      {v.health}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border)', background: 'var(--bg-app)' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/vehicles/${selectedVehicle?.vehicle_id || 'TN01AB1234'}`)}
              style={{ width: '100%', fontSize: 12 }}
            >
              Open Full Vehicle Deep-Dive <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
