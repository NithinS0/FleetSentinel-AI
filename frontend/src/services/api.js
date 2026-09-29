import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
})

// Response interceptor for 401 handling
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fs-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ── Fleet API helpers ─────────────────────────────────────────────
export const fleetApi = {
  // Dashboard
  getDashboardMetrics: () => api.get('/metrics-api/dashboard'),

  // Vehicles
  getVehicles: (params) => api.get('/vehicles/', { params }),
  getVehicle: (id) => api.get(`/vehicles/${id}`),
  getVehicleHealth: (id) => api.get(`/vehicles/${id}/health`),
  getVehicleState: (id) => api.get(`/vehicles/${id}/state`),
  getVehiclePredictions: (id) => api.get(`/vehicles/${id}/predictions`),
  getVehicleAlerts: (id) => api.get(`/vehicles/${id}/alerts`),

  // Alerts
  getAlerts: (params) => api.get('/alerts/', { params }),
  getAlertStats: () => api.get('/alerts/stats'),
  acknowledgeAlert: (id, note) => api.post(`/alerts/${id}/acknowledge`, { note }),
  resolveAlert: (id, note) => api.post(`/alerts/${id}/resolve`, { resolution_note: note }),

  // Predictions
  getPredictions: (params) => api.get('/predictions/', { params }),
  getHighRiskVehicles: () => api.get('/predictions/high-risk'),

  // Fingerprints
  getFingerprints: () => api.get('/fingerprints/'),
}

// ── Copilot API ───────────────────────────────────────────────────
export const copilotApi = {
  query: (payload) => {
    const copilotUrl = import.meta.env.VITE_COPILOT_URL
    const endpoint = copilotUrl
      ? `${copilotUrl}/query`
      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/copilot/query`
    return axios.post(endpoint, payload)
  },
}
