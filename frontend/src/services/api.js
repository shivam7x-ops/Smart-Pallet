// Frontend API Client for Smart Pallet IoT Telemetry Gateway

const API_BASE = "http://127.0.0.1:8000/api";

export const IOT_API_KEY_FALLBACK = "SMART_PALLET_SECRET_KEY_2026";

/**
 * Health check
 */
export async function checkBackendHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch all registered IoT devices with their online status and latest reading
 */
export async function fetchIoTDevices() {
  const res = await fetch(`${API_BASE}/iot/devices`);
  if (!res.ok) throw new Error(`Failed to fetch devices: ${res.status}`);
  return res.json();
}

/**
 * Fetch latest telemetry snapshot across all devices + active alerts count
 */
export async function fetchIoTLatest() {
  const res = await fetch(`${API_BASE}/iot/latest`);
  if (!res.ok) throw new Error(`Failed to fetch latest telemetry: ${res.status}`);
  return res.json();
}

/**
 * Fetch detailed device metadata and recent telemetry history
 */
export async function fetchIoTDevice(deviceId) {
  const res = await fetch(`${API_BASE}/iot/device/${encodeURIComponent(deviceId)}`);
  if (!res.ok) throw new Error(`Failed to fetch device ${deviceId}: ${res.status}`);
  return res.json();
}

/**
 * Register or update an IoT tracking device
 */
export async function registerIoTDevice(deviceData) {
  const res = await fetch(`${API_BASE}/iot/device/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deviceData)
  });
  if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
  return res.json();
}

/**
 * Send downlink command to an IoT device
 */
export async function sendDeviceCommand(deviceId, command, parameters = {}) {
  const res = await fetch(`${API_BASE}/iot/device/${encodeURIComponent(deviceId)}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, parameters })
  });
  if (!res.ok) throw new Error(`Failed to send command: ${res.status}`);
  return res.json();
}

/**
 * Fetch alerts
 */
export async function fetchIoTAlerts(limit = 50, resolved = null) {
  let url = `${API_BASE}/iot/alerts?limit=${limit}`;
  if (resolved !== null) {
    url += `&resolved=${resolved ? "true" : "false"}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`);
  return res.json();
}

/**
 * Resolve an alert
 */
export async function resolveIoTAlert(alertId) {
  const res = await fetch(`${API_BASE}/iot/alerts/${alertId}/resolve`, {
    method: "POST"
  });
  if (!res.ok) throw new Error(`Failed to resolve alert: ${res.status}`);
  return res.json();
}

/**
 * Inject sensor packet (Test mode or ESP32 simulator)
 */
export async function injectSensorData(payload, apiKey = IOT_API_KEY_FALLBACK) {
  const res = await fetch(`${API_BASE}/iot/data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || `Ingest failed: ${res.status}`);
  }
  return res.json();
}
