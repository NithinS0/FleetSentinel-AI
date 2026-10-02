import { create } from 'zustand'
import { RECENT_ALERTS, FLEET_VEHICLES } from '../data/demoData'

const STORAGE_KEY = 'fs-alerts-data'

const DEFAULT_ALERTS = [
  ...RECENT_ALERTS.map(a => ({
    ...a,
    dtc: a.vehicle_id === 'TN01AB1234' ? 'P0301' : a.vehicle_id === 'KA04CD5678' ? 'BMS04' : a.vehicle_id === 'MH12EF9012' ? 'P0302' : 'DTC99',
    fleet: FLEET_VEHICLES.find(v => v.vehicle_id === a.vehicle_id)?.fleet || 'Regional Fleet',
    model: FLEET_VEHICLES.find(v => v.vehicle_id === a.vehicle_id)?.model || 'Fleet Unit',
    assignedTo: a.status === 'ACKNOWLEDGED' ? 'Suresh M. (Depot 3)' : null,
  })),
  {
    id: 'ALT007',
    time: '10:02:18',
    vehicle_id: 'KA06GH7890',
    alert: 'BMS Cell Voltage Delta exceeds 180mV threshold',
    severity: 'MEDIUM',
    status: 'ACKNOWLEDGED',
    evidence: 'Cell #14 underperforming under high regen braking loads',
    dtc: 'BMS18',
    fleet: 'Bangalore A',
    model: 'Nexon EV',
    assignedTo: 'Vikram S. (EV Bay)',
  },
  {
    id: 'ALT008',
    time: '09:47:50',
    vehicle_id: 'GJ07ST7890',
    alert: 'CNG Rail pressure fluctuation detected during acceleration',
    severity: 'HIGH',
    status: 'OPEN',
    evidence: 'Pressure dropped 22 PSI below regulator nominal during throttle tip-in',
    dtc: 'P0190',
    fleet: 'Gujarat',
    model: 'Ace CNG',
    assignedTo: null,
  },
  {
    id: 'ALT009',
    time: '09:12:04',
    vehicle_id: 'TN03CD2345',
    alert: 'Hybrid Inverter Coolant Flow Rate below minimum threshold',
    severity: 'LOW',
    status: 'RESOLVED',
    evidence: 'Flow rate dipped to 2.4 L/min for 8 mins; returned to nominal',
    dtc: 'P0A93',
    fleet: 'Chennai Metro',
    model: 'Innova',
    assignedTo: 'Anand R. (Depot 1)',
    resolvedAt: '09:35:10',
    resolutionNote: 'Coolant reservoir topped up and air bleed cycle completed.',
  },
]

function loadStoredAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load alerts from localStorage:', e)
  }
  return DEFAULT_ALERTS
}

function saveAlertsToStorage(alerts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
  } catch (e) {
    console.warn('Failed to save alerts to localStorage:', e)
  }
}

export const useAlertStore = create((set, get) => ({
  alerts: loadStoredAlerts(),

  // Computed counts
  getOpenCount: () => {
    return get().alerts.filter(a => a.status === 'OPEN').length
  },

  getCriticalCount: () => {
    return get().alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length
  },

  // Actions
  acknowledgeAlert: (id) => {
    const updated = get().alerts.map(a =>
      a.id === id ? { ...a, status: 'ACKNOWLEDGED', assignedTo: 'Current User (Operations)' } : a
    )
    saveAlertsToStorage(updated)
    set({ alerts: updated })
  },

  acknowledgeAll: () => {
    const updated = get().alerts.map(a =>
      a.status === 'OPEN' ? { ...a, status: 'ACKNOWLEDGED', assignedTo: 'Operations Center' } : a
    )
    saveAlertsToStorage(updated)
    set({ alerts: updated })
  },

  resolveAlert: (id, resolutionNote, resolveType) => {
    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false })
    const updated = get().alerts.map(a =>
      a.id === id ? {
        ...a,
        status: 'RESOLVED',
        resolvedAt: nowStr,
        resolutionNote: `${resolveType}: ${resolutionNote}`,
      } : a
    )
    saveAlertsToStorage(updated)
    set({ alerts: updated })
  },

  addAlert: (newAlert) => {
    const updated = [newAlert, ...get().alerts]
    saveAlertsToStorage(updated)
    set({ alerts: updated })
  },

  resetAlerts: () => {
    saveAlertsToStorage(DEFAULT_ALERTS)
    set({ alerts: DEFAULT_ALERTS })
  },
}))
