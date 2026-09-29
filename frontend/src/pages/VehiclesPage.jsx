import { useState, useEffect } from 'react'
import { Search, Filter, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fleetApi } from '../services/api'

const MOCK_VEHICLES = Array.from({ length: 20 }, (_, i) => ({
  vehicle_id: `TN${String(i + 1).padStart(2, '0')}AB${String(1000 + i)}`,
  vehicle_type: ['ICE', 'EV', 'HYBRID'][i % 3],
  status: ['NORMAL', 'NORMAL', 'DEGRADING', 'CRITICAL'][i % 4],
  health_score: Math.floor(30 + Math.random() * 70),
  fleet_id: `fleet_${String(i % 5).padStart(4, '0')}`,
  odo_km: Math.floor(10000 + Math.random() * 140000),
}))

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await fleetApi.getVehicles({ page, page_size: 50, search: search || undefined, status: statusFilter || undefined })
        setVehicles(data.items)
        setTotal(data.total)
      } catch {
        setVehicles(MOCK_VEHICLES)
        setTotal(100000)
      } finally {
        setLoading(false)
      }
    }
    const id = setTimeout(load, 300)
    return () => clearTimeout(id)
  }, [page, search, statusFilter])

  const STATUS_COLOR = { NORMAL: 'normal', DEGRADING: 'medium', CRITICAL: 'critical', FAILED: 'critical' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Fleet Vehicles</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {(total || 0).toLocaleString()} vehicles registered
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search by Vehicle ID or VIN..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="">All Statuses</option>
          <option value="NORMAL">Normal</option>
          <option value="DEGRADING">Degrading</option>
          <option value="CRITICAL">Critical</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Health Score</th>
                <th>Odometer</th>
                <th>Fleet</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(loading ? MOCK_VEHICLES : vehicles).map(v => (
                <tr key={v.vehicle_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}>
                  <td><span className="mono" style={{ color: 'var(--brand-400)' }}>{v.vehicle_id}</span></td>
                  <td><span className="badge badge-normal" style={{ fontSize: 10 }}>{v.vehicle_type}</span></td>
                  <td><span className={`badge badge-${STATUS_COLOR[v.status] || 'normal'}`}>{v.status}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="risk-bar" style={{ width: 60 }}>
                        <div className="risk-bar-fill" style={{ width: `${v.health_score || 80}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{v.health_score || 80}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{(v.odo_km || 0).toLocaleString()} km</td>
                  <td style={{ fontSize: 12 }}>{v.fleet_id}</td>
                  <td><ChevronRight size={14} style={{ color: 'var(--text-muted)' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between" style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Page {page} · {Math.min(page * 50, total).toLocaleString()} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px' }}>Previous</button>
            <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total} style={{ padding: '6px 12px' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
