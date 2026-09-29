import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/common/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FleetMapPage from './pages/FleetMapPage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleDetailPage from './pages/VehicleDetailPage'
import AlertsPage from './pages/AlertsPage'
import PredictionsPage from './pages/PredictionsPage'
import FingerprintsPage from './pages/FingerprintsPage'
import CopilotPage from './pages/CopilotPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

import LandingPage from './pages/LandingPage'

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"    element={<DashboardPage />} />
        <Route path="fleet-map"    element={<FleetMapPage />} />
        <Route path="vehicles"     element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="alerts"       element={<AlertsPage />} />
        <Route path="predictions"  element={<PredictionsPage />} />
        <Route path="fingerprints" element={<FingerprintsPage />} />
        <Route path="copilot"      element={<CopilotPage />} />
        <Route path="analytics"    element={<AnalyticsPage />} />
        <Route path="reports"      element={<ReportsPage />} />
        <Route path="settings"     element={<SettingsPage />} />
        <Route path="*"            element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
