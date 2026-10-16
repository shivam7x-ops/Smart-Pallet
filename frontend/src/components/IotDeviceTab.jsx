import React, { useState, useEffect } from 'react';
import { useIoTData } from '../hooks/useIoTData';
import { 
  fetchIoTDevice, 
  registerIoTDevice, 
  sendDeviceCommand, 
  resolveIoTAlert, 
  injectSensorData,
  IOT_API_KEY_FALLBACK 
} from '../services/api';
import {
  Activity,
  Radio,
  Cpu,
  Thermometer,
  Droplets,
  Navigation,
  Compass,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Send,
  Eye,
  EyeOff,
  Shield,
  Layers,
  BarChart3,
  X,
  Smartphone,
  Signal,
  Vibrate
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function IotDeviceTab() {
  const { devices, latestMap, alerts, loading, error, lastUpdated, refresh } = useIoTData(3500);

  // Selected device for modal inspection & charts
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [deviceDetail, setDeviceDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState('temp-hum'); // 'temp-hum', 'accel', 'gyro', 'motion'

  // Device registration modal / form
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    name: '',
    pallet_id: 'P001',
    token: ''
  });
  const [registerStatus, setRegisterStatus] = useState(null);

  // Test data injection state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorPayload, setSimulatorPayload] = useState(JSON.stringify({
    deviceId: "PALLET-001",
    temperature: 29.2,
    humidity: 61.8,
    accel: { x: 0.10, y: 0.02, z: 9.80 },
    gyro: { x: 0.15, y: 0.12, z: 0.05 },
    gps: { latitude: 25.242600, longitude: 86.984200, satellites: 6, valid: true },
    movementDetected: true,
    shockDetected: false,
    gsmStatus: "connected"
  }, null, 2));
  const [simulateStatus, setSimulateStatus] = useState(null);

  // Device token visibility toggle
  const [showTokens, setShowTokens] = useState({});

  // Command input state
  const [commandInput, setCommandInput] = useState('');
  const [commandFeedback, setCommandFeedback] = useState(null);

  // Load detailed telemetry history when a device is selected
  useEffect(() => {
    if (!selectedDeviceId) return;

    let isMounted = true;
    setDetailLoading(true);

    const fetchDetail = async () => {
      try {
        const detail = await fetchIoTDevice(selectedDeviceId);
        if (isMounted) {
          setDeviceDetail(detail);
          setDetailLoading(false);
        }
      } catch (err) {
        if (isMounted) setDetailLoading(false);
      }
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedDeviceId]);

  // Handle register device
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newDevice.device_id.trim()) return;
    try {
      setRegisterStatus('Registering...');
      await registerIoTDevice(newDevice);
      setRegisterStatus('Device successfully registered!');
      setNewDevice({ device_id: '', name: '', pallet_id: 'P001', token: '' });
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegisterStatus(null);
        refresh();
      }, 1200);
    } catch (err) {
      setRegisterStatus(`Error: ${err.message}`);
    }
  };

  // Handle test data injection
  const handleInjectData = async () => {
    try {
      setSimulateStatus('Injecting telemetry...');
      const parsed = JSON.parse(simulatorPayload);
      const res = await injectSensorData(parsed);
      setSimulateStatus(`Success! Reading logged for ${res.deviceId}`);
      refresh();
      setTimeout(() => setSimulateStatus(null), 3000);
    } catch (err) {
      setSimulateStatus(`Error: ${err.message}`);
    }
  };

  // Handle resolve alert
  const handleResolveAlert = async (id) => {
    try {
      await resolveIoTAlert(id);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle send command
  const handleSendCommand = async (deviceId) => {
    if (!commandInput.trim()) return;
    try {
      setCommandFeedback('Sending...');
      const res = await sendDeviceCommand(deviceId, commandInput.trim());
      setCommandFeedback(`Sent: ${res.command}`);
      setCommandInput('');
      setTimeout(() => setCommandFeedback(null), 3000);
    } catch (err) {
      setCommandFeedback(`Failed: ${err.message}`);
    }
  };

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = totalDevices - onlineDevices;
  const activeAlerts = alerts.filter(a => !a.resolved).length;

  // Prepare chart data from selected device history (or fallback)
  const history = deviceDetail?.history ? [...deviceDetail.history].reverse() : [];
  const chartLabels = history.length > 0 
    ? history.map(h => h.timestamp ? h.timestamp.substring(11, 19) : '')
    : ['T-4', 'T-3', 'T-2', 'T-1', 'Now'];

  // 1. Temp & Humidity Chart Data
  const tempHumData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: history.length > 0 ? history.map(h => h.temperature) : [22.1, 23.4, 24.0, 24.8, 25.1],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Humidity (%)',
        data: history.length > 0 ? history.map(h => h.humidity) : [58, 60, 62, 59, 61],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y1',
        fill: true,
        tension: 0.3
      }
    ]
  };

  // 2. Accel Chart Data
  const accelData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Accel X (g)',
        data: history.length > 0 ? history.map(h => h.accel_x) : [0.02, 0.04, 0.12, 0.05, 0.03],
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.2
      },
      {
        label: 'Accel Y (g)',
        data: history.length > 0 ? history.map(h => h.accel_y) : [-0.01, 0.02, -0.05, 0.01, 0.0],
        borderColor: 'rgb(245, 158, 11)',
        tension: 0.2
      },
      {
        label: 'Accel Z (g)',
        data: history.length > 0 ? history.map(h => h.accel_z) : [0.98, 1.01, 0.99, 1.00, 0.98],
        borderColor: 'rgb(168, 85, 247)',
        tension: 0.2
      }
    ]
  };

  // 3. Gyro Chart Data
  const gyroData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Gyro X (deg/s)',
        data: history.length > 0 ? history.map(h => h.gyro_x) : [0.1, 0.3, 0.2, 0.1, 0.1],
        borderColor: 'rgb(6, 182, 212)',
        tension: 0.2
      },
      {
        label: 'Gyro Y (deg/s)',
        data: history.length > 0 ? history.map(h => h.gyro_y) : [0.0, -0.2, 0.1, 0.0, -0.1],
        borderColor: 'rgb(236, 72, 153)',
        tension: 0.2
      },
      {
        label: 'Gyro Z (deg/s)',
        data: history.length > 0 ? history.map(h => h.gyro_z) : [0.2, 0.1, 0.0, 0.1, 0.0],
        borderColor: 'rgb(139, 92, 246)',
        tension: 0.2
      }
    ]
  };

  // 4. Movement / Shock Timeline
  const motionData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Movement Detected (1/0)',
        data: history.length > 0 ? history.map(h => h.movement_detected ? 1 : 0) : [0, 1, 1, 0, 1],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        stepped: true,
        fill: true
      },
      {
        label: 'Shock Event (1/0)',
        data: history.length > 0 ? history.map(h => h.shock_detected ? 1 : 0) : [0, 0, 0, 0, 0],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        stepped: true,
        fill: true
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Live Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/80 rounded-2xl p-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                IoT Telemetry Hub & Hardware Diagnostics
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono font-medium">
                  LIVE STREAM
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                ESP32 (DHT22 • MPU6050/6500 • NEO-6M GPS • SIM800L GSM) Ingestion & Control Hub
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Last Polled Timestamp */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800/90 border border-gray-700 px-3 py-1.5 rounded-xl text-xs text-gray-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Updated: <strong className="text-white font-mono">{lastUpdated || 'Connecting...'}</strong></span>
            <button 
              onClick={refresh}
              title="Force Refresh"
              className="ml-1 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              showSimulator 
                ? 'bg-amber-600 border-amber-500 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-amber-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {showSimulator ? 'Hide Test Simulator' : 'Test Packet Injector'}
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/30 border border-blue-400 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Device
          </button>
        </div>
      </div>

      {/* Simulator / Test Data Drawer (collapsible) */}
      {showSimulator && (
        <div className="bg-gray-900 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Development Test Ingestion (No ESP32 Hardware Required)
              </h3>
            </div>
            <span className="text-[11px] text-gray-400">Endpoint: <code className="text-cyan-400 font-mono">POST /api/iot/data</code></span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Inject sensor test payloads directly into the backend API using the secret key to verify dashboard dials, alerts, and live map updates.
          </p>
          <div className="space-y-3">
            <textarea
              rows={8}
              value={simulatorPayload}
              onChange={(e) => setSimulatorPayload(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs">
                {simulateStatus && (
                  <span className={`font-mono font-medium ${simulateStatus.includes('Success') ? 'text-green-400' : 'text-amber-400'}`}>
                    {simulateStatus}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Quick inject shock test
                    const sample = JSON.parse(simulatorPayload);
                    sample.shockDetected = true;
                    sample.accel = { x: 0.45, y: 0.85, z: 2.85 };
                    sample.movementDetected = true;
                    setSimulatorPayload(JSON.stringify(sample, null, 2));
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-red-400 border border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Load Shock Test
                </button>
                <button
                  onClick={() => {
                    // Quick inject high temp test
                    const sample = JSON.parse(simulatorPayload);
                    sample.temperature = 38.5;
                    sample.humidity = 78.0;
                    setSimulatorPayload(JSON.stringify(sample, null, 2));
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-amber-400 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Load High Temp Test
                </button>
                <button
                  onClick={handleInjectData}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-600/30 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Inject Sensor Packet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. IoT Device Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Devices</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalDevices}</h3>
            <span className="text-[11px] text-gray-400">Registered Telemetry Units</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Online Nodes</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{onlineDevices}</h3>
            <span className="text-[11px] text-emerald-400/80">Active in last 60s</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Offline Nodes</p>
            <h3 className="text-2xl font-black text-gray-400 mt-1">{offlineDevices}</h3>
            <span className="text-[11px] text-gray-500">Awaiting ping</span>
          </div>
          <div className="p-3 bg-gray-700/30 text-gray-400 rounded-xl border border-gray-700">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Alerts</p>
            <h3 className={`text-2xl font-black mt-1 ${activeAlerts > 0 ? 'text-red-400' : 'text-gray-300'}`}>
              {activeAlerts}
            </h3>
            <span className="text-[11px] text-gray-400">Environmental & Motion</span>
          </div>
          <div className={`p-3 rounded-xl border ${activeAlerts > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-700/20 text-gray-400 border-gray-700'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Device Cards Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Monitored Pallet Tracker Units
          </h2>
          <span className="text-xs text-gray-400">Click a device card to inspect detailed sensor graph & downlink commands</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {devices.map(device => {
            const reading = device.latest || latestMap[device.device_id] || {};
            const isOnline = device.status === 'online';
            const temp = reading.temperature;
            const hum = reading.humidity;
            const hasGps = reading.gps_valid === 1;
            const hasMotion = reading.movement_detected === 1;
            const hasShock = reading.shock_detected === 1;

            return (
              <div 
                key={device.device_id}
                className={`bg-gray-800/90 border rounded-2xl p-5 shadow-xl transition hover:shadow-2xl flex flex-col justify-between ${
                  selectedDeviceId === device.device_id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div>
                  {/* Card Header: Device Name & Badges */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        {device.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {device.pallet_id}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          ID: {device.device_id}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
                      isOnline 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-gray-700 text-gray-400 border-gray-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>

                  {/* Primary Sensor Gauges (Temp & Humidity) */}
                  <div className="grid grid-cols-2 gap-2.5 my-3">
                    <div className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-2.5 flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Temperature</span>
                        <span className="text-sm font-bold text-white">
                          {temp !== null && temp !== undefined ? `${Number(temp).toFixed(1)} °C` : 'Not available'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-2.5 flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Humidity</span>
                        <span className="text-sm font-bold text-white">
                          {hum !== null && hum !== undefined ? `${Number(hum).toFixed(1)} %` : 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Sensor Indicators (GPS, Motion, Shock) */}
                  <div className="space-y-2 text-xs border-t border-gray-700/60 pt-3">
                    {/* Location */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                        GPS Coordinates:
                      </span>
                      <span className={`font-mono ${hasGps ? 'text-gray-200 font-semibold' : 'text-amber-400/90 italic'}`}>
                        {hasGps && reading.latitude && reading.longitude 
                          ? `${Number(reading.latitude).toFixed(4)}, ${Number(reading.longitude).toFixed(4)}`
                          : 'GPS location unavailable'}
                      </span>
                    </div>

                    {/* Motion & Shock */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Vibrate className="w-3.5 h-3.5 text-green-400" />
                        Movement Status:
                      </span>
                      <span className={`font-semibold ${hasMotion ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {hasMotion ? 'Active Motion' : 'Stationary'}
                      </span>
                    </div>

                    {hasShock && (
                      <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-lg text-red-400 font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          SHOCK/TILT DETECTED
                        </span>
                        <span>Impact Event</span>
                      </div>
                    )}

                    {/* GSM Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Signal className="w-3.5 h-3.5 text-purple-400" />
                        SIM800L Cellular:
                      </span>
                      <span className="font-mono uppercase text-gray-300">
                        {reading.gsm_status || 'connected'}
                      </span>
                    </div>

                    {/* Device Token Secure Display */}
                    <div className="flex items-center justify-between bg-gray-950/60 border border-gray-800 px-2.5 py-1.5 rounded-lg text-[11px]">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        Auth Token:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-gray-300">
                          {showTokens[device.device_id] ? (device.token || 'DEV_TOKEN_P001_CH') : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => setShowTokens(prev => ({ ...prev, [device.device_id]: !prev[device.device_id] }))}
                          className="text-gray-400 hover:text-white"
                          title="Toggle visibility"
                        >
                          {showTokens[device.device_id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Timestamp & Inspect Button */}
                <div className="mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">
                    Last Seen: {device.last_seen ? device.last_seen.substring(11, 19) : 'N/A'}
                  </span>

                  <button
                    onClick={() => setSelectedDeviceId(device.device_id)}
                    className="bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-blue-500/30 cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Inspect Details & Charts
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Real-Time Telemetry Alerts Feed */}
      <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              System Telemetry Alerts & Exceptions
            </h2>
          </div>
          <span className="text-xs text-gray-400">
            Automated threshold evaluation: Temp (&gt;35°C / &lt;5°C), Humidity (&gt;80%), Shock (&gt;2.2g), GPS & GSM loss
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>All monitored parameters normal. No active threshold violations.</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/60 max-h-60 overflow-y-auto pr-2">
            {alerts.slice(0, 10).map(alert => {
              const isCrit = alert.severity === 'CRITICAL';
              const isWarn = alert.severity === 'WARNING';
              const isResolved = alert.resolved === 1;

              return (
                <div key={alert.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isCrit ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      isWarn ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {alert.type}
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">[{alert.device_id}]</span>
                    <span className="text-gray-200">{alert.message}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {alert.timestamp ? alert.timestamp.substring(11, 19) : ''}
                    </span>
                    {!isResolved ? (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10 cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">Resolved</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Detailed Device Inspection & Telemetry Charts Modal */}
      {selectedDeviceId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {deviceDetail?.name || selectedDeviceId}
                  </h2>
                  <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-mono">
                    Pallet {deviceDetail?.pallet_id}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Full Telemetry History, Dynamic Axes & Downlink Device Control
                </p>
              </div>

              <button
                onClick={() => setSelectedDeviceId(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Sensor Metrics Ribbon */}
            {(() => {
              const latest = deviceDetail?.latest || {};
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Temperature</span>
                    <strong className="text-lg text-white font-mono">
                      {latest.temperature !== undefined ? `${latest.temperature} °C` : 'N/A'}
                    </strong>
                  </div>
                  <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Humidity</span>
                    <strong className="text-lg text-white font-mono">
                      {latest.humidity !== undefined ? `${latest.humidity} %` : 'N/A'}
                    </strong>
                  </div>
                  <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">GPS Satellites</span>
                    <strong className="text-lg text-emerald-400 font-mono">
                      {latest.satellites || 0} Sats {latest.gps_valid ? '• Fix OK' : '• Searching'}
                    </strong>
                  </div>
                  <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Cellular (SIM800L)</span>
                    <strong className="text-lg text-purple-400 font-mono uppercase">
                      {latest.gsm_status || 'Ready'}
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Tri-axis Live Sensor Dials (MPU6050 Accelerometer & Gyroscope) */}
            {(() => {
              const latest = deviceDetail?.latest || {};
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Accelerometer */}
                  <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-300 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        MPU6050 Accelerometer (g)
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">Range ±2g</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="bg-gray-900 border border-gray-800 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">AX</span>
                        <strong className="text-emerald-400">{latest.accel_x !== undefined ? Number(latest.accel_x).toFixed(2) : '0.00'}</strong>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">AY</span>
                        <strong className="text-amber-400">{latest.accel_y !== undefined ? Number(latest.accel_y).toFixed(2) : '0.00'}</strong>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">AZ</span>
                        <strong className="text-purple-400">{latest.accel_z !== undefined ? Number(latest.accel_z).toFixed(2) : '1.00'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Gyroscope */}
                  <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-300 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        MPU6050 Gyroscope (deg/s)
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">Range ±250°/s</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="bg-gray-900 border border-gray-800 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">GX</span>
                        <strong className="text-cyan-400">{latest.gyro_x !== undefined ? Number(latest.gyro_x).toFixed(2) : '0.00'}</strong>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">GY</span>
                        <strong className="text-pink-400">{latest.gyro_y !== undefined ? Number(latest.gyro_y).toFixed(2) : '0.00'}</strong>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">GZ</span>
                        <strong className="text-indigo-400">{latest.gyro_z !== undefined ? Number(latest.gyro_z).toFixed(2) : '0.00'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Interactive Tabbed Chart.js Graphs */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Historical Sensor Analytics
                </span>

                <div className="flex gap-1.5 text-xs bg-gray-900 p-1 rounded-lg border border-gray-800">
                  <button
                    onClick={() => setActiveChartTab('temp-hum')}
                    className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                      activeChartTab === 'temp-hum' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Temp & Humidity
                  </button>
                  <button
                    onClick={() => setActiveChartTab('accel')}
                    className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                      activeChartTab === 'accel' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Acceleration (X/Y/Z)
                  </button>
                  <button
                    onClick={() => setActiveChartTab('gyro')}
                    className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                      activeChartTab === 'gyro' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Gyroscope (X/Y/Z)
                  </button>
                  <button
                    onClick={() => setActiveChartTab('motion')}
                    className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                      activeChartTab === 'motion' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Movement / Shock
                  </button>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-64 w-full">
                {activeChartTab === 'temp-hum' && (
                  <Line 
                    data={tempHumData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: { title: { display: true, text: 'Temp (°C)', color: '#9ca3af' }, grid: { color: '#374151' } },
                        y1: { position: 'right', title: { display: true, text: 'Humidity (%)', color: '#9ca3af' }, grid: { drawOnChartArea: false } },
                        x: { grid: { color: '#374151' } }
                      }
                    }} 
                  />
                )}
                {activeChartTab === 'accel' && (
                  <Line 
                    data={accelData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: { title: { display: true, text: 'Acceleration (g)', color: '#9ca3af' }, grid: { color: '#374151' } },
                        x: { grid: { color: '#374151' } }
                      }
                    }} 
                  />
                )}
                {activeChartTab === 'gyro' && (
                  <Line 
                    data={gyroData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: { title: { display: true, text: 'Angular Rate (°/s)', color: '#9ca3af' }, grid: { color: '#374151' } },
                        x: { grid: { color: '#374151' } }
                      }
                    }} 
                  />
                )}
                {activeChartTab === 'motion' && (
                  <Line 
                    data={motionData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: { min: 0, max: 1.2, ticks: { stepSize: 1 }, grid: { color: '#374151' } },
                        x: { grid: { color: '#374151' } }
                      }
                    }} 
                  />
                )}
              </div>
            </div>

            {/* Downlink Command Terminal */}
            <div className="border-t border-gray-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex-1 w-full flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter device command (e.g., CALIBRATE_MPU, RESTART, SET_INTERVAL:2000)"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleSendCommand(selectedDeviceId)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch
                </button>
              </div>

              {commandFeedback && (
                <span className="text-xs font-mono text-emerald-400 font-medium">
                  {commandFeedback}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Device Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Register New IoT Tracking Unit
              </h3>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Device Hardware ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ESP32-PALLET-004"
                  value={newDevice.device_id}
                  onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Friendly Name</label>
                <input
                  type="text"
                  placeholder="e.g. Refrigerated Logistics Sensor"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Assign to Pallet ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P001"
                  value={newDevice.pallet_id}
                  onChange={(e) => setNewDevice({ ...newDevice, pallet_id: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Device Secret Token (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-generated token"
                  value={newDevice.token}
                  onChange={(e) => setNewDevice({ ...newDevice, token: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              {registerStatus && (
                <p className="text-xs text-blue-400 font-mono mt-2">{registerStatus}</p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
