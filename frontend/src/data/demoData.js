/**
 * FleetSentinel AI — Demo Data
 * Coherent narrative: TN01AB1234 is the "hero" vehicle in critical state
 */

// ── Fleet Summary ──────────────────────────────────────────────────
export const FLEET_SUMMARY = {
  total: 100000,
  healthy: 91240,
  at_risk: 7840,
  critical: 920,
  events_per_sec: 103482,
  fleet_health_score: 87,
};

// ── Critical Vehicle (Hero) ────────────────────────────────────────
export const HERO_VEHICLE = {
  vehicle_id: 'TN01AB1234',
  vin: 'MBLAA5AA4LW001234',
  make: 'Toyota',
  model: 'HiAce Fleet',
  year: 2021,
  vehicle_type: 'ICE',
  status: 'CRITICAL',
  health_score: 27,
  fleet_id: 'fleet_0001',
  fleet_name: 'Chennai Metro Fleet',
  odo_km: 87432,
  speed_kmh: 48.2,
  engine_temp_c: 104.5,
  fuel_efficiency: 7.8,
  soc_pct: null,
  soh_pct: null,
  last_service_days: 142,
  driver: 'Rajan Kumar',
  location: { lat: 13.0827, lng: 80.2707, address: 'Anna Salai, Chennai' },
  dtc_codes: ['P0301', 'P0302', 'P0300'],
};

// ── Top Predictions ────────────────────────────────────────────────
export const TOP_PREDICTIONS = [
  {
    vehicle_id: 'TN01AB1234',
    make: 'Toyota',
    model: 'HiAce',
    failure_type: 'Engine Misfire',
    failure_code: 'ENGINE_MISFIRE',
    probability: 87,
    risk_level: 'CRITICAL',
    eta: '< 24 hrs',
    eta_days: [1, 2],
    status: 'OPEN',
    priority_score: 94,
    location: { lat: 13.0827, lng: 80.2707 },
    fleet: 'Chennai Metro',
  },
  {
    vehicle_id: 'KA04CD5678',
    make: 'Tata',
    model: 'Winger',
    failure_type: 'Battery Degradation',
    failure_code: 'BATTERY_DEGRADATION',
    probability: 81,
    risk_level: 'CRITICAL',
    eta: '3–7 days',
    eta_days: [3, 7],
    status: 'OPEN',
    priority_score: 88,
    location: { lat: 12.9716, lng: 77.5946 },
    fleet: 'Bangalore Fleet A',
  },
  {
    vehicle_id: 'MH12EF9012',
    make: 'Mahindra',
    model: 'Supro',
    failure_type: 'Cooling System',
    failure_code: 'COOLING_FAILURE',
    probability: 76,
    risk_level: 'HIGH',
    eta: '4–6 days',
    eta_days: [4, 6],
    status: 'ACKNOWLEDGED',
    priority_score: 79,
    location: { lat: 19.0760, lng: 72.8777 },
    fleet: 'Mumbai Central',
  },
  {
    vehicle_id: 'DL09GH3456',
    make: 'Force',
    model: 'Traveller',
    failure_type: 'Transmission Fault',
    failure_code: 'TRANSMISSION_FAULT',
    probability: 72,
    risk_level: 'HIGH',
    eta: '3–5 days',
    eta_days: [3, 5],
    status: 'OPEN',
    priority_score: 74,
    location: { lat: 28.6139, lng: 77.2090 },
    fleet: 'Delhi NCR',
  },
  {
    vehicle_id: 'KA03IJ7890',
    make: 'Ashok Leyland',
    model: 'DOST',
    failure_type: 'Brake System',
    failure_code: 'BRAKE_ISSUE',
    probability: 69,
    risk_level: 'HIGH',
    eta: '5–8 days',
    eta_days: [5, 8],
    status: 'OPEN',
    priority_score: 71,
    location: { lat: 12.9716, lng: 77.5946 },
    fleet: 'Bangalore Fleet B',
  },
  {
    vehicle_id: 'TS09KL1234',
    make: 'Tata',
    model: 'Ace',
    failure_type: 'Oil Pressure Low',
    failure_code: 'OIL_PRESSURE_LOW',
    probability: 64,
    risk_level: 'MEDIUM',
    eta: '7–10 days',
    eta_days: [7, 10],
    status: 'OPEN',
    priority_score: 65,
    location: { lat: 17.3850, lng: 78.4867 },
    fleet: 'Hyderabad Fleet',
  },
];

// ── Recent Alerts ──────────────────────────────────────────────────
export const RECENT_ALERTS = [
  {
    id: 'ALT001',
    time: '10:24:05',
    vehicle_id: 'TN01AB1234',
    alert: 'Engine temperature above critical threshold (104.5°C)',
    severity: 'CRITICAL',
    status: 'OPEN',
    evidence: 'Temp rising at +3.2°C/hr over last 2 hours',
  },
  {
    id: 'ALT002',
    time: '10:23:41',
    vehicle_id: 'KA04CD5678',
    alert: 'Battery State-of-Health below critical threshold (58%)',
    severity: 'CRITICAL',
    status: 'OPEN',
    evidence: 'SOH degraded 14% in 30 days, voltage instability detected',
  },
  {
    id: 'ALT003',
    time: '10:22:17',
    vehicle_id: 'MH12EF9012',
    alert: 'Repeated P0301 diagnostic code — 8 occurrences in 6 hours',
    severity: 'HIGH',
    status: 'ACKNOWLEDGED',
    evidence: 'P0301 recurring every 42 minutes. Cooling fan abnormal.',
  },
  {
    id: 'ALT004',
    time: '10:19:55',
    vehicle_id: 'DL09GH3456',
    alert: 'Transmission fluid temperature elevated (98°C)',
    severity: 'HIGH',
    status: 'OPEN',
    evidence: 'Temp trending upward from 76°C baseline over 90 minutes',
  },
  {
    id: 'ALT005',
    time: '10:15:30',
    vehicle_id: 'KA03IJ7890',
    alert: 'Brake pad wear indicator triggered on rear axle',
    severity: 'HIGH',
    status: 'OPEN',
    evidence: 'Brake sensor readings below minimum threshold (2.1mm)',
  },
  {
    id: 'ALT006',
    time: '10:09:12',
    vehicle_id: 'TS09KL1234',
    alert: 'Oil pressure below normal operating range',
    severity: 'MEDIUM',
    status: 'OPEN',
    evidence: 'Oil pressure: 21 PSI, expected 35–55 PSI at operating temp',
  },
];

// ── Fleet Map Vehicles (India region) ─────────────────────────────
export const MAP_VEHICLES = [
  { id: 'TN01AB1234', lat: 13.0827, lng: 80.2707, status: 'CRITICAL', health: 27 },
  { id: 'TN03CD2345', lat: 13.1200, lng: 80.3100, status: 'HEALTHY', health: 89 },
  { id: 'TN05EF4567', lat: 12.9500, lng: 80.2400, status: 'AT_RISK', health: 54 },
  { id: 'KA04CD5678', lat: 12.9716, lng: 77.5946, status: 'CRITICAL', health: 31 },
  { id: 'KA06GH7890', lat: 12.8800, lng: 77.6400, status: 'HEALTHY', health: 91 },
  { id: 'KA03IJ7890', lat: 13.0500, lng: 77.5200, status: 'AT_RISK', health: 61 },
  { id: 'MH12EF9012', lat: 19.0760, lng: 72.8777, status: 'AT_RISK', health: 58 },
  { id: 'MH14KL3456', lat: 18.9200, lng: 72.8300, status: 'HEALTHY', health: 85 },
  { id: 'DL09GH3456', lat: 28.6139, lng: 77.2090, status: 'AT_RISK', health: 62 },
  { id: 'DL01MN5678', lat: 28.7041, lng: 77.1025, status: 'HEALTHY', health: 94 },
  { id: 'TS09KL1234', lat: 17.3850, lng: 78.4867, status: 'AT_RISK', health: 67 },
  { id: 'TS11OP9012', lat: 17.4500, lng: 78.5200, status: 'HEALTHY', health: 88 },
  { id: 'AP02QR3456', lat: 14.4426, lng: 79.9865, status: 'HEALTHY', health: 82 },
  { id: 'GJ07ST7890', lat: 23.0225, lng: 72.5714, status: 'AT_RISK', health: 51 },
  { id: 'RJ14UV1234', lat: 26.9124, lng: 75.7873, status: 'HEALTHY', health: 90 },
];

// ── Fingerprints ───────────────────────────────────────────────────
export const FINGERPRINTS = [
  {
    id: 'FP001',
    type: 'ENGINE MISFIRE',
    code: 'ENGINE_MISFIRE',
    color: 'var(--critical)',
    color_bg: 'rgba(239,68,68,0.08)',
    similarity: 91,
    matches: 142,
    signals: [
      { label: 'P0301/P0302 DTC frequency ↑', trend: 'up', severity: 'critical' },
      { label: 'Engine temperature ↑ > 100°C', trend: 'up', severity: 'critical' },
      { label: 'RPM variance ↑ +27%', trend: 'up', severity: 'high' },
      { label: 'Fuel efficiency ↓ –16%', trend: 'down', severity: 'warning' },
    ],
    description: 'Cylinder misfire pattern from DTC codes combined with thermal stress.',
  },
  {
    id: 'FP002',
    type: 'BATTERY DEGRADATION',
    code: 'BATTERY_DEGRADATION',
    color: 'var(--warning)',
    color_bg: 'rgba(245,158,11,0.08)',
    similarity: 84,
    matches: 97,
    signals: [
      { label: 'State-of-Health (SOH) ↓ < 65%', trend: 'down', severity: 'critical' },
      { label: 'Charging cycle anomaly ↑', trend: 'up', severity: 'high' },
      { label: 'Voltage instability ↑', trend: 'up', severity: 'high' },
      { label: 'Regen efficiency ↓', trend: 'down', severity: 'warning' },
    ],
    description: 'Electrochemical degradation pattern from battery management system telemetry.',
  },
  {
    id: 'FP003',
    type: 'COOLING SYSTEM',
    code: 'COOLING_FAILURE',
    color: 'var(--accent-cyan)',
    color_bg: 'rgba(24,214,209,0.08)',
    similarity: 78,
    matches: 63,
    signals: [
      { label: 'Coolant temperature ↑ sustained', trend: 'up', severity: 'critical' },
      { label: 'Coolant level anomaly', trend: 'down', severity: 'high' },
      { label: 'Cooling fan activity ↑ abnormal', trend: 'up', severity: 'warning' },
    ],
    description: 'Thermal management failure from coolant system monitoring and thermostat data.',
  },
  {
    id: 'FP004',
    type: 'BRAKE SYSTEM',
    code: 'BRAKE_ISSUE',
    color: 'var(--risk-high)',
    color_bg: 'rgba(249,115,22,0.08)',
    similarity: 76,
    matches: 81,
    signals: [
      { label: 'Brake pad wear sensor triggered', trend: 'up', severity: 'high' },
      { label: 'Harsh braking events ↑ +38%', trend: 'up', severity: 'warning' },
      { label: 'Brake fluid pressure variance', trend: 'up', severity: 'high' },
    ],
    description: 'Mechanical brake degradation from friction sensors and driving behaviour analysis.',
  },
  {
    id: 'FP005',
    type: 'TRANSMISSION FAULT',
    code: 'TRANSMISSION_FAULT',
    color: 'var(--accent-purple)',
    color_bg: 'rgba(139,92,246,0.08)',
    similarity: 71,
    matches: 44,
    signals: [
      { label: 'Gear shift latency ↑', trend: 'up', severity: 'high' },
      { label: 'Transmission fluid temp ↑', trend: 'up', severity: 'high' },
      { label: 'RPM/speed ratio anomaly', trend: 'up', severity: 'warning' },
    ],
    description: 'Mechanical transmission stress from gear ratio analysis and fluid temperature telemetry.',
  },
  {
    id: 'FP006',
    type: 'OIL PRESSURE LOW',
    code: 'OIL_PRESSURE_LOW',
    color: 'var(--accent-teal)',
    color_bg: 'rgba(32,201,151,0.08)',
    similarity: 67,
    matches: 56,
    signals: [
      { label: 'Oil pressure below range (< 25 PSI)', trend: 'down', severity: 'critical' },
      { label: 'Oil temp ↑ above threshold', trend: 'up', severity: 'high' },
      { label: 'Engine load anomaly ↑', trend: 'up', severity: 'warning' },
    ],
    description: 'Lubrication system failure from oil sensor arrays and pressure monitoring.',
  },
];

// ── Vehicle Evidence ───────────────────────────────────────────────
export const HERO_EVIDENCE = [
  {
    label: 'Engine Temperature',
    value: '104.5°C',
    baseline: '88°C',
    trend: '+19%',
    direction: 'up',
    severity: 'critical',
    color: 'var(--critical)',
  },
  {
    label: 'P0301 Frequency',
    value: '8 events',
    baseline: '6 hrs',
    trend: '+38%',
    direction: 'up',
    severity: 'critical',
    color: 'var(--critical)',
  },
  {
    label: 'RPM Variance',
    value: '±1,240',
    baseline: '±820 normal',
    trend: '+27%',
    direction: 'up',
    severity: 'high',
    color: 'var(--warning)',
  },
  {
    label: 'Fuel Efficiency',
    value: '7.8 km/L',
    baseline: '12.1 km/L avg',
    trend: '–16%',
    direction: 'down',
    severity: 'warning',
    color: 'var(--warning)',
  },
];

// ── Telemetry Series (24h) ─────────────────────────────────────────
export function generateTelemetrySeries(hours = 24) {
  return Array.from({ length: hours }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    efficiency: parseFloat((12.1 - (i < 20 ? 0 : (i - 18) * 0.25) + (Math.random() - 0.5) * 0.3).toFixed(2)),
    temperature: Math.round(88 + (i > 20 ? (i - 20) * 3.5 : 0) + (Math.random() - 0.5) * 2),
    rpm:  Math.round(2100 + (i > 20 ? (i - 20) * 60 : 0) + (Math.random() - 0.5) * 100),
    speed: Math.round(55 + (Math.random() - 0.5) * 20),
    events: Math.round(103000 + (Math.random() - 0.5) * 8000),
  }));
}

// ── Fleet Health Trend ─────────────────────────────────────────────
export function generateHealthTrend(days = 30) {
  return Array.from({ length: days }, (_, i) => ({
    day: `Day ${i + 1}`,
    healthy: Math.round(91 + (Math.random() - 0.5) * 1.5),
    at_risk: Math.round(7.8 + (Math.random() - 0.5) * 0.8),
    critical: parseFloat((0.9 + (Math.random() - 0.5) * 0.15).toFixed(2)),
  }));
}

// ── Copilot Chat History ───────────────────────────────────────────
export const COPILOT_DEMO = [
  {
    role: 'assistant',
    content: `Good morning. I'm FleetSentinel Copilot.\n\nI'm monitoring **100,000 vehicles** across your fleet. Right now I'm tracking **920 critical-risk vehicles** and have flagged **7,840** at-risk vehicles for review.\n\nYou have **6 open critical alerts** requiring immediate attention. Would you like me to walk you through the highest-priority cases?`,
    sources: [],
    ts: new Date(),
  },
];

// ── What-If Risk Curve ─────────────────────────────────────────────
export function getWhatIfRisk(baseRisk, delay) {
  // Exponential risk growth with delay
  const growth = Math.pow(1.45, delay);
  return Math.min(99, Math.round(baseRisk * growth));
}

export function getWhatIfDowntime(baseRisk, delay) {
  return (2.8 + delay * 1.4 + (baseRisk / 100) * delay * 0.5).toFixed(1);
}

// ── System Metrics ─────────────────────────────────────────────────
export const SYSTEM_METRICS = [
  { label: 'Events / sec',         value: '103,482',  status: 'healthy', unit: '' },
  { label: 'Kafka Consumer Lag',    value: '142',      status: 'healthy', unit: 'ms' },
  { label: 'Stream Processing',     value: '99.98%',   status: 'healthy', unit: '' },
  { label: 'API p95 Latency',       value: '148',      status: 'healthy', unit: 'ms' },
  { label: 'API p99 Latency',       value: '381',      status: 'warning', unit: 'ms' },
  { label: 'DB Query Avg',          value: '12',       status: 'healthy', unit: 'ms' },
  { label: 'ML Prediction Engine',  value: 'Healthy',  status: 'healthy', unit: '' },
  { label: 'AI Copilot Service',    value: 'Healthy',  status: 'healthy', unit: '' },
  { label: 'Vector Similarity DB',  value: 'Healthy',  status: 'healthy', unit: '' },
  { label: 'Redis Cache Hit Rate',  value: '98.4%',    status: 'healthy', unit: '' },
  { label: 'Kafka Brokers',         value: '3 / 3',    status: 'healthy', unit: '' },
  { label: 'Connected Vehicles',    value: '99,841',   status: 'healthy', unit: '' },
];

// ── Fleet Vehicles (table) ─────────────────────────────────────────
export const FLEET_VEHICLES = [
  { vehicle_id: 'TN01AB1234', make: 'Toyota',  model: 'HiAce Fleet',  type: 'ICE',    status: 'CRITICAL', health: 27, fleet: 'Chennai Metro',     odo: 87432 },
  { vehicle_id: 'KA04CD5678', make: 'Tata',    model: 'Winger',       type: 'EV',     status: 'CRITICAL', health: 31, fleet: 'Bangalore A',       odo: 64220 },
  { vehicle_id: 'MH12EF9012', make: 'Mahindra',model: 'Supro',        type: 'ICE',    status: 'AT_RISK',  health: 58, fleet: 'Mumbai Central',    odo: 112300 },
  { vehicle_id: 'DL09GH3456', make: 'Force',   model: 'Traveller',    type: 'ICE',    status: 'AT_RISK',  health: 62, fleet: 'Delhi NCR',         odo: 55100 },
  { vehicle_id: 'KA03IJ7890', make: 'Ashok L.',model: 'DOST',         type: 'ICE',    status: 'AT_RISK',  health: 61, fleet: 'Bangalore B',       odo: 78900 },
  { vehicle_id: 'TS09KL1234', make: 'Tata',    model: 'Ace',          type: 'ICE',    status: 'AT_RISK',  health: 67, fleet: 'Hyderabad',         odo: 34567 },
  { vehicle_id: 'TN03CD2345', make: 'Toyota',  model: 'Innova',       type: 'HYBRID', status: 'HEALTHY',  health: 89, fleet: 'Chennai Metro',     odo: 42300 },
  { vehicle_id: 'KA06GH7890', make: 'Tata',    model: 'Nexon EV',     type: 'EV',     status: 'HEALTHY',  health: 91, fleet: 'Bangalore A',       odo: 28100 },
  { vehicle_id: 'AP02QR3456', make: 'Mahindra',model: 'eVerito',      type: 'EV',     status: 'HEALTHY',  health: 82, fleet: 'Andhra Pradesh',    odo: 61200 },
  { vehicle_id: 'GJ07ST7890', make: 'Tata',    model: 'Ace CNG',      type: 'CNG',    status: 'AT_RISK',  health: 51, fleet: 'Gujarat',           odo: 99810 },
];
