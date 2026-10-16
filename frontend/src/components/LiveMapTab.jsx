import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Battery, 
  Thermometer, 
  Truck, 
  Package, 
  Warehouse, 
  Navigation,
  Compass,
  Radio,
  AlertCircle,
  Clock,
  Satellite
} from 'lucide-react';
import { useIoTData } from '../hooks/useIoTData';

// Custom Leaflet Icons
const palletIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const inTransitIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const depotIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -38],
  shadowSize: [41, 41]
});

// Helper component to smoothly center map
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const CHANDIGARH_CENTER = [30.7333, 76.7794];
const CHANDIGARH_DEPOT = [30.7046, 76.8016];

export default function LiveMapTab({ pallets = [] }) {
  const { latestMap, devices } = useIoTData(3500);

  const [mapCenter, setMapCenter] = useState(CHANDIGARH_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'IN_TRANSIT', 'DEPOT'

  // Merge pallets with real-time IoT device telemetry if available
  const enrichedPallets = pallets.map(p => {
    // Look for matching IoT device
    const matchingDev = devices.find(d => d.pallet_id === p.id || d.device_id === p.id);
    const iotReading = matchingDev ? (matchingDev.latest || latestMap[matchingDev.device_id]) : null;

    if (iotReading) {
      const hasValidGps = iotReading.gps_valid === 1 && iotReading.latitude && iotReading.longitude && (iotReading.latitude !== 0 || iotReading.longitude !== 0);
      return {
        ...p,
        iot_device_id: matchingDev.device_id,
        iot_connected: matchingDev.status === 'online',
        gps_valid: hasValidGps,
        location: hasValidGps ? {
          lat: iotReading.latitude,
          lng: iotReading.longitude,
          address: `Live GPS Fix (${iotReading.satellites || 0} sats)`
        } : (p.location || null),
        satellites: iotReading.satellites || 0,
        temp_celsius: iotReading.temperature !== null && iotReading.temperature !== undefined ? iotReading.temperature : p.temp_celsius,
        humidity: iotReading.humidity,
        movement_detected: iotReading.movement_detected === 1,
        last_updated: iotReading.timestamp || p.last_updated
      };
    }

    // Standard fallback pallet
    const hasValidGps = p.location?.lat && p.location?.lng && (p.location.lat !== 0 || p.location.lng !== 0);
    return {
      ...p,
      gps_valid: Boolean(hasValidGps)
    };
  });

  const displayedPallets = enrichedPallets.filter(p => {
    if (filterMode === 'IN_TRANSIT') return p.status === 'In Transit';
    if (filterMode === 'DEPOT') return p.status === 'Available';
    return true;
  });

  const validGpsPallets = displayedPallets.filter(p => p.gps_valid);
  const unavailableGpsPallets = displayedPallets.filter(p => !p.gps_valid);

  return (
    <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-5 shadow-xl flex flex-col h-[780px] space-y-4">
      {/* Map Control Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">
              Live Geospatial Pallet Tracker & Route Fleet Map
            </h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
              NEO-6M GPS FEED
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Real-time coordinates streamed directly from ESP32 GPS hardware and central logistics depot
          </p>
        </div>

        {/* Filters & Quick Focus Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Filter Pills */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-0.5 flex">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${filterMode === 'ALL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              All Pallets ({pallets.length})
            </button>
            <button
              onClick={() => setFilterMode('IN_TRANSIT')}
              className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${filterMode === 'IN_TRANSIT' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              In Transit ({pallets.filter(p => p.status === 'In Transit').length})
            </button>
            <button
              onClick={() => setFilterMode('DEPOT')}
              className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${filterMode === 'DEPOT' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Depot Stock ({pallets.filter(p => p.status === 'Available').length})
            </button>
          </div>

          {/* Quick Focus Landmarks in Chandigarh */}
          <button
            onClick={() => { setMapCenter(CHANDIGARH_DEPOT); setMapZoom(14); }}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-600 transition flex items-center gap-1 font-medium cursor-pointer"
          >
            <Warehouse className="w-3.5 h-3.5 text-red-400" />
            Depot Hub
          </button>
          <button
            onClick={() => { setMapCenter([30.7415, 76.7850]); setMapZoom(14); }}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-600 transition flex items-center gap-1 font-medium cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            Sector 17
          </button>
          <button
            onClick={() => { setMapCenter([30.7245, 76.8375]); setMapZoom(14); }}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-600 transition flex items-center gap-1 font-medium cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            IT Park
          </button>
        </div>
      </div>

      {/* Main Map Area with Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Left Pallet List / Status Column */}
        <div className="bg-gray-900/90 border border-gray-700 rounded-xl p-3 flex flex-col justify-between overflow-y-auto space-y-3">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              Live Telemetry Units
            </h3>

            <div className="space-y-2">
              {displayedPallets.map(p => {
                const lat = p.location?.lat;
                const lng = p.location?.lng;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (p.gps_valid && lat && lng) {
                        setMapCenter([lat, lng]);
                        setMapZoom(15);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                      p.gps_valid 
                        ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 hover:border-blue-500' 
                        : 'bg-gray-800/50 border-amber-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white flex items-center gap-1">
                        {p.id}
                        {p.iot_device_id && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono">
                            IoT
                          </span>
                        )}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.status === 'In Transit' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    {p.gps_valid && lat && lng ? (
                      <div className="font-mono text-[11px] text-gray-300 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Lat:</span>
                          <span className="text-cyan-400">{Number(lat).toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Lng:</span>
                          <span className="text-cyan-400">{Number(lng).toFixed(6)}</span>
                        </div>
                        {p.satellites !== undefined && (
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Sats:</span>
                            <span className="text-emerald-400 font-bold">{p.satellites} Locked</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-1.5 text-[10px] text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>GPS location unavailable</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* GPS Status Summary Footer */}
          <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-2.5 text-[11px] text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>GPS Fix Valid:</span>
              <strong className="text-emerald-400">{validGpsPallets.length} Pallets</strong>
            </div>
            <div className="flex justify-between">
              <span>GPS Searching:</span>
              <strong className="text-amber-400">{unavailableGpsPallets.length} Units</strong>
            </div>
          </div>
        </div>

        {/* Right Leaflet Map Frame (3 Columns) */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-gray-700 relative shadow-inner h-full">
          <MapContainer 
            center={CHANDIGARH_CENTER} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
          >
            <ChangeView center={mapCenter} zoom={mapZoom} />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors • Smart Pallet Logistics"
            />

            {/* Central Logistics Depot Marker */}
            <Marker position={CHANDIGARH_DEPOT} icon={depotIcon}>
              <Popup>
                <div className="p-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    Headquarters & Central Depot
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm mt-1">Industrial Area Phase 1, Chandigarh</h4>
                  <p className="text-xs text-gray-600 mt-0.5">Primary dispatch and maintenance facility</p>
                  <div className="mt-2 pt-2 border-t text-[11px] text-gray-700">
                    <p>• Latitude: <strong>30.704600</strong></p>
                    <p>• Longitude: <strong>76.801600</strong></p>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Valid GPS Pallet Telemetry Markers */}
            {validGpsPallets.map(pallet => {
              const lat = pallet.location?.lat;
              const lng = pallet.location?.lng;
              if (!lat || !lng) return null;

              const isInTransit = pallet.status === 'In Transit';

              return (
                <Marker 
                  key={pallet.id}
                  position={[lat, lng]}
                  icon={isInTransit ? inTransitIcon : palletIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[220px]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-600 text-sm">{pallet.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isInTransit ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {pallet.status}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-gray-800 mt-1">{pallet.type}</p>
                      
                      {/* Exact GPS Coordinates Display */}
                      <div className="bg-gray-100 p-1.5 rounded-lg my-1.5 text-[11px] font-mono text-gray-800 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Latitude:</span>
                          <strong>{Number(lat).toFixed(6)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Longitude:</span>
                          <strong>{Number(lng).toFixed(6)}</strong>
                        </div>
                        {pallet.satellites !== undefined && (
                          <div className="flex justify-between text-[10px] text-emerald-700">
                            <span>GPS Satellites:</span>
                            <strong>{pallet.satellites} locked</strong>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-xs text-gray-700">
                        <div>
                          <span className="text-gray-400 block text-[10px]">BATTERY</span>
                          <strong>{pallet.battery || 95}%</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">TEMPERATURE</span>
                          <strong className={pallet.temp_celsius < 5 ? 'text-blue-600' : 'text-gray-800'}>
                            {pallet.temp_celsius !== undefined ? `${pallet.temp_celsius}°C` : 'N/A'}
                          </strong>
                        </div>
                      </div>

                      {pallet.last_updated && (
                        <p className="text-[10px] text-gray-400 mt-2 font-mono">
                          Last communication: {pallet.last_updated.substring(11, 19)}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl p-3 z-[1000] text-xs text-gray-300 shadow-xl space-y-1.5">
            <p className="font-bold text-white text-[11px] uppercase tracking-wider">Live Map Legend</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-white/20"></span>
              <span>Central Warehouse Depot</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 border border-white/20"></span>
              <span>Pallet with Live GPS Fix</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white/20"></span>
              <span>GPS Signal Searching (No Fake Coords)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
