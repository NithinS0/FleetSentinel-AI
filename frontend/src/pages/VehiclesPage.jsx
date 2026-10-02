import { useState, useEffect, useMemo } from 'react'
import {
  Search, Filter, ChevronRight, ChevronLeft, Car, ShieldAlert,
  Activity, AlertTriangle, CheckCircle2, Zap, Fuel, ArrowRight,
  Download, Bot, RefreshCw, SlidersHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fleetApi } from '../services/api'
import { FLEET_SUMMARY, HERO_VEHICLE } from '../data/demoData'
import { downloadCSV } from '../utils/reportTemplateGenerator'

const VEHICLE_MAKES = [
  'Toyota HiAce', 'Tata Winger', 'Mahindra Supro', 'Force Traveller',
  'Ashok Leyland Dost', 'Tata Ace EV', 'BYD T3 Electric', 'Eicher Pro 2049'
]

const SUBSYSTEM_NOTES = [
  'Nominal Powertrain',
  'Engine Misfire (P0301)',
  'Cooling System Delta',
  'Battery SOH Degradation',
  'Transmission Temp Surge',
  'Brake Pad Wear (Front)',
  'Oxygen Sensor Variance',
  'Nominal Powertrain'
]

const FLEET_HUBS = [
  { name: 'Chennai Metro Hub', id: 'fleet_0001' },
  { name: 'Bangalore Logistics Hub', id: 'fleet_0002' },
  { name: 'Mumbai Central Depot', id: 'fleet_0003' },
  { name: 'Delhi NCR Transit Hub', id: 'fleet_0004' },
  { name: 'Hyderabad Fleet Depot', id: 'fleet_0005' },
]

const PAGE_SIZE = 20

// Generates a unique, realistic slice of vehicles for any given page
function generateVehiclesForPage(pageNumber, pageSize = PAGE_SIZE) {
  const startIndex = (pageNumber - 1) * pageSize
  return Array.from({ length: pageSize }, (_, i) => {
    const globalIdx = startIndex + i
    if (globalIdx === 0) {
      return {
        vehicle_id: HERO_VEHICLE.vehicle_id,
        vin: HERO_VEHICLE.vin,
        make_model: `${HERO_VEHICLE.make} ${HERO_VEHICLE.model}`,
        vehicle_type: HERO_VEHICLE.vehicle_type,
        status: 'CRITICAL',
        health_score: 27,
        subsystem: 'Engine Misfire (P0301)',
        fleet_name: 'Chennai Metro Hub',
        fleet_id: 'fleet_0001',
        odo_km: HERO_VEHICLE.odo_km,
        last_ping: 'Just now',
        driver: HERO_VEHICLE.driver,
      }
    }

    const vTypes = ['ICE', 'EV', 'HYBRID', 'EV', 'ICE']
    const statuses = ['NORMAL', 'NORMAL', 'DEGRADING', 'NORMAL', 'CRITICAL']
    const vType = vTypes[globalIdx % vTypes.length]
    const status = statuses[globalIdx % statuses.length]
    const score = status === 'CRITICAL'
      ? Math.floor(22 + ((globalIdx * 7) % 24))
      : status === 'DEGRADING'
        ? Math.floor(52 + ((globalIdx * 11) % 22))
        : Math.floor(82 + ((globalIdx * 13) % 17))
    const hub = FLEET_HUBS[globalIdx % FLEET_HUBS.length]
    const numPart = String(1000 + globalIdx)
    const prefixNum = String((globalIdx % 30) + 1).padStart(2, '0')

    return {
      vehicle_id: `TN${prefixNum}AB${numPart}`,
      vin: `MAT${String(482910 + globalIdx * 23)}`,
      make_model: VEHICLE_MAKES[globalIdx % VEHICLE_MAKES.length],
      vehicle_type: vType,
      status,
      health_score: score,
      subsystem: status === 'NORMAL' ? 'Nominal Powertrain' : SUBSYSTEM_NOTES[globalIdx % SUBSYSTEM_NOTES.length],
      fleet_name: hub.name,
      fleet_id: hub.id,
      odo_km: 18450 + (globalIdx * 4820),
      last_ping: `${((globalIdx % 45) + 1)}m ago`,
      driver: ['Rajesh Kumar', 'Arun Patel', 'Vikram Singh', 'Manoj Sharma', 'Suresh Reddy', 'Karthik Raja', 'Deepak Verma'][globalIdx % 7],
    }
  })
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState(() => generateVehiclesForPage(1, PAGE_SIZE))
  const [total, setTotal] = useState(100000)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await fleetApi.getVehicles({
          page,
          page_size: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter
        })
        if (isMounted) {
          if (data && data.items && data.items.length > 0) {
            setVehicles(data.items)
            setTotal(data.total || 100000)
          } else {
            setVehicles(generateVehiclesForPage(page, PAGE_SIZE))
            setTotal(100000)
          }
        }
      } catch {
        if (isMounted) {
          setVehicles(generateVehiclesForPage(page, PAGE_SIZE))
          setTotal(100000)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    const id = setTimeout(load, 150)
    return () => {
      isMounted = false
      clearTimeout(id)
    }
  }, [page, search, statusFilter, typeFilter])

  // Filter vehicles locally if search/filter applied
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch = !search ||
        v.vehicle_id.toLowerCase().includes(search.toLowerCase()) ||
        (v.make_model && v.make_model.toLowerCase().includes(search.toLowerCase())) ||
        (v.fleet_name && v.fleet_name.toLowerCase().includes(search.toLowerCase())) ||
        (v.subsystem && v.subsystem.toLowerCase().includes(search.toLowerCase()))
      
      const matchStatus = statusFilter === 'ALL' || v.status === statusFilter
      const matchType = typeFilter === 'ALL' || v.vehicle_type === typeFilter

      return matchSearch && matchStatus && matchType
    })
  }, [vehicles, search, statusFilter, typeFilter])

  const exportCSV = () => {
    const headers = ['Vehicle ID,Model,Powertrain,Status,Health Score,Odometer (km),Fleet,Driver']
    const rows = filteredVehicles.map(v =>
      `"${v.vehicle_id}","${v.make_model || ''}","${v.vehicle_type}","${v.status}",${v.health_score},${v.odo_km},"${v.fleet_name || v.fleet_id}","${v.driver || ''}"`
    )
    const csvContent = [...headers, ...rows].join('\n')
    downloadCSV(`FleetSentinel_Vehicles_${new Date().toISOString().slice(0, 10)}.csv`, csvContent)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── 1. HEADER SECTION ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        padding: '20px 24px',
        background: '#FFFFFF',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Vehicle Intelligence & Fleet Registry
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 'var(--r-full)',
              background: '#DCFCE7',
              border: '1px solid #BBF7D0',
              color: '#15803D',
              fontSize: 11,
              fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.8s infinite' }} />
              100,000 Units Monitored
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            High-frequency CAN-bus sensor telemetry, AI component degradation metrics, and fleet health diagnostics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={exportCSV}
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            <Download size={14} /> Export Telemetry (CSV)
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/copilot')}
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            <Bot size={14} /> Launch Diagnostic Copilot
          </button>
        </div>
      </div>

      {/* ── 2. METRIC SUMMARY STRIP ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: '16px 20px', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Registered
            </span>
            <Car size={16} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4, letterSpacing: '-0.02em' }}>
            100,000
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            100% Active CAN Telemetry
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nominal Status
            </span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--success)', marginTop: 4, letterSpacing: '-0.02em' }}>
            91,240
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            91.2% Subsystems optimal
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Elevated Degradation
            </span>
            <AlertTriangle size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--warning)', marginTop: 4, letterSpacing: '-0.02em' }}>
            7,840
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            7.8% Review recommended
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', background: '#FFFFFF', borderColor: '#FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--critical)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Critical Risk
            </span>
            <ShieldAlert size={16} color="var(--critical)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--critical)', marginTop: 4, letterSpacing: '-0.02em' }}>
            920
          </div>
          <div style={{ fontSize: 11, color: 'var(--critical)', marginTop: 4, fontWeight: 600 }}>
            Immediate repair required (&lt; 72h)
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTER TOOLBAR ───────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 18px',
        background: '#FFFFFF',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="input"
              placeholder="Search by Vehicle ID, Model, Subsystem, or Hub..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 36, height: 38, fontSize: 13, background: '#F8FAFC' }}
            />
          </div>

          {/* Status Filter */}
          <select
            className="input"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: 160, height: 38, fontSize: 13, background: '#F8FAFC' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NORMAL">Normal (Optimal)</option>
            <option value="DEGRADING">Degrading (Review)</option>
            <option value="CRITICAL">Critical (Urgent)</option>
          </select>

          {/* Powertrain Type Filter */}
          <select
            className="input"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ width: 150, height: 38, fontSize: 13, background: '#F8FAFC' }}
          >
            <option value="ALL">All Powertrains</option>
            <option value="ICE">ICE (Diesel/Petrol)</option>
            <option value="EV">EV (Electric)</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredVehicles.length}</strong> matching vehicles</span>
          {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button
              className="btn btn-ghost"
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setTypeFilter('ALL'); }}
              style={{ fontSize: 11, padding: '3px 8px', color: 'var(--accent-blue)' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── 4. VEHICLES DATA TABLE ───────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Vehicle & Model</th>
                <th style={{ width: '11%' }}>Powertrain</th>
                <th style={{ width: '18%' }}>Health Score</th>
                <th style={{ width: '14%' }}>Telemetry Status</th>
                <th style={{ width: '13%' }}>Odometer</th>
                <th style={{ width: '14%' }}>Assigned Fleet Hub</th>
                <th style={{ width: '8%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={16} className="spin" />
                      Loading telemetry streaming records...
                    </div>
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>No matching vehicles found</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search criteria or clearing active filters.</div>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => {
                  const isCritical = v.status === 'CRITICAL'
                  const isDegrading = v.status === 'DEGRADING'
                  const scoreColor = v.health_score >= 80 ? '#16A34A' : v.health_score >= 50 ? '#D97706' : '#DC2626'
                  const scoreBg = v.health_score >= 80 ? '#DCFCE7' : v.health_score >= 50 ? '#FEF3C7' : '#FEE2E2'

                  return (
                    <tr
                      key={v.vehicle_id}
                      onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}
                      style={{
                        cursor: 'pointer',
                        background: isCritical ? '#FFF8F8' : undefined,
                      }}
                    >
                      {/* Vehicle & Model */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            className="mono"
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: isCritical ? '#DC2626' : 'var(--accent-blue)',
                              background: isCritical ? '#FEE2E2' : '#EFF6FF',
                              padding: '3px 8px',
                              borderRadius: 6,
                              border: `1px solid ${isCritical ? '#FECACA' : '#BFDBFE'}`,
                            }}
                          >
                            {v.vehicle_id}
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {v.make_model || 'Commercial Fleet Unit'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              VIN: {v.vin || 'MAT847120'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Powertrain */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: v.vehicle_type === 'EV' ? '#F0FDF4' : v.vehicle_type === 'HYBRID' ? '#F5F3FF' : '#F1F5F9',
                          border: `1px solid ${v.vehicle_type === 'EV' ? '#BBF7D0' : v.vehicle_type === 'HYBRID' ? '#DDD6FE' : '#E2E8F0'}`,
                          color: v.vehicle_type === 'EV' ? '#15803D' : v.vehicle_type === 'HYBRID' ? '#6D28D9' : '#475569',
                        }}>
                          {v.vehicle_type === 'EV' ? <Zap size={11} /> : <Fuel size={11} />}
                          {v.vehicle_type}
                        </span>
                      </td>

                      {/* Health Score */}
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, maxWidth: 160 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)' }}>
                              {v.health_score}%
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {v.health_score >= 80 ? 'Optimal' : v.health_score >= 50 ? 'Moderate' : 'Critical'}
                            </span>
                          </div>
                          <div style={{ width: 160, height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.max(5, v.health_score)}%`,
                                background: scoreColor,
                                borderRadius: 99,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 10, color: isCritical ? '#DC2626' : 'var(--text-muted)', marginTop: 4 }}>
                            {v.subsystem || 'Nominal Subsystems'}
                          </div>
                        </div>
                      </td>

                      {/* Telemetry Status */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 'var(--r-full)',
                          fontSize: 11,
                          fontWeight: 700,
                          background: isCritical ? '#FEE2E2' : isDegrading ? '#FEF3C7' : '#DCFCE7',
                          border: `1px solid ${isCritical ? '#FECACA' : isDegrading ? '#FDE68A' : '#BBF7D0'}`,
                          color: isCritical ? '#B91C1C' : isDegrading ? '#B45309' : '#15803D',
                        }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: isCritical ? '#DC2626' : isDegrading ? '#D97706' : '#16A34A',
                              animation: isCritical ? 'pulse 1.5s infinite' : undefined,
                            }}
                          />
                          {v.status}
                        </span>
                      </td>

                      {/* Odometer */}
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {(v.odo_km || 0).toLocaleString()} km
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          Ping: {v.last_ping || 'Just now'}
                        </div>
                      </td>

                      {/* Assigned Fleet Hub */}
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {v.fleet_name || 'Chennai Metro Hub'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          {v.fleet_id}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost"
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            color: 'var(--accent-blue)',
                            fontWeight: 600,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/vehicles/${v.vehicle_id}`)
                          }}
                        >
                          Diagnose <ChevronRight size={13} style={{ marginLeft: 2 }} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. PAGINATION FOOTER ────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          background: '#F8FAFC',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Showing <strong>{((page - 1) * PAGE_SIZE) + 1} – {Math.min(page * PAGE_SIZE, total).toLocaleString()}</strong> of <strong>{total.toLocaleString()}</strong> registered commercial units (Page {page} of {Math.ceil(total / PAGE_SIZE).toLocaleString()})
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {/* Quick Page Number Pills */}
            {[1, 2, 3, 4, 5].map(pNum => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                style={{
                  fontSize: 12,
                  fontWeight: page === pNum ? 700 : 500,
                  padding: '5px 11px',
                  background: page === pNum ? '#EFF6FF' : '#FFFFFF',
                  color: page === pNum ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: page === pNum ? '1px solid #BFDBFE' : '1px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pNum}
              </button>
            ))}

            <span style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 2px' }}>...</span>

            <button
              className="btn btn-secondary"
              onClick={() => setPage(p => p + 1)}
              disabled={page * PAGE_SIZE >= total}
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
