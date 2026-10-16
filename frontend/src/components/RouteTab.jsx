import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Navigation, 
  CheckCircle, 
  RefreshCw, 
  MapPin, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Clock,
  Warehouse
} from 'lucide-react';

const depotIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -38],
  shadowSize: [41, 41]
});

const stopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CHANDIGARH_DEPOT = { lat: 30.7046, lng: 76.8016, name: "Industrial Area Phase 1 Depot, Chandigarh" };

const PRESET_CHANDIGARH_STOPS = [
  { id: "STOP-1", name: "Sector 17 Commercial Plaza", lat: 30.7415, lng: 76.7850, active: true },
  { id: "STOP-2", name: "Rajiv Gandhi IT Park (Tech Mahindra)", lat: 30.7245, lng: 76.8375, active: true },
  { id: "STOP-3", name: "Mohali Phase 7 Industrial Area", lat: 30.7046, lng: 76.7179, active: true },
  { id: "STOP-4", name: "Panchkula Sector 5 Logistics Park", lat: 30.6942, lng: 76.8606, active: true },
  { id: "STOP-5", name: "Chandigarh Junction Freight Yard", lat: 30.7022, lng: 76.8203, active: false }
];

const API_BASE = "http://127.0.0.1:8000/api";

export default function RouteTab({ orders }) {
  const [stops, setStops] = useState(PRESET_CHANDIGARH_STOPS);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customLat, setCustomLat] = useState('30.7300');
  const [customLng, setCustomLng] = useState('76.7700');

  const toggleStop = (id) => {
    setStops(stops.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const removeStop = (id) => {
    setStops(stops.filter(s => s.id !== id));
  };

  const addCustomStop = (e) => {
    e.preventDefault();
    if (!customName) return;
    const newStop = {
      id: `CUSTOM-${Date.now() % 1000}`,
      name: customName,
      lat: parseFloat(customLat),
      lng: parseFloat(customLng),
      active: true
    };
    setStops([...stops, newStop]);
    setCustomName('');
  };

  const handleOptimizeRoute = async () => {
    setLoading(true);
    const activeStops = stops.filter(s => s.active);
    try {
      const res = await fetch(`${API_BASE}/optimize-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depot: { lat: CHANDIGARH_DEPOT.lat, lng: CHANDIGARH_DEPOT.lng },
          stops: activeStops.map(s => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng }))
        })
      });
      const data = await res.json();
      setOptimizedRoute(data);
    } catch (err) {
      console.error("VRP Optimization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = stops.filter(s => s.active).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration & Controls */}
      <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-400" />
            VRP Route Optimizer (Chandigarh)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Solves Vehicle Routing Problem across Chandigarh, Mohali and Panchkula drop-offs
          </p>
        </div>

        {/* Depot Info Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
            <Warehouse className="w-4 h-4" /> Depot Origin & Terminal
          </div>
          <p className="text-xs text-white font-medium">{CHANDIGARH_DEPOT.name}</p>
          <p className="text-[11px] text-gray-400 font-mono">
            {CHANDIGARH_DEPOT.lat.toFixed(4)}°N, {CHANDIGARH_DEPOT.lng.toFixed(4)}°E
          </p>
        </div>

        {/* Stops Selection */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-300">Select Stops to Deliver:</span>
            <span className="text-blue-400 font-semibold">{activeCount} Selected</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {stops.map(stop => (
              <div 
                key={stop.id}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                  stop.active 
                    ? 'bg-blue-950/40 border-blue-700/80 text-white' 
                    : 'bg-gray-900/60 border-gray-800 text-gray-400'
                }`}
              >
                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                  <input 
                    type="checkbox"
                    checked={stop.active}
                    onChange={() => toggleStop(stop.id)}
                    className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-medium block">{stop.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                    </span>
                  </div>
                </label>
                <button
                  onClick={() => removeStop(stop.id)}
                  className="text-gray-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add custom stop */}
        <form onSubmit={addCustomStop} className="pt-2 border-t border-gray-700 space-y-2">
          <span className="text-xs font-semibold text-gray-300 block">Add Custom Chandigarh Location:</span>
          <input
            type="text"
            placeholder="e.g. Sector 35 Distribution Point"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.0001"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white"
            />
            <input
              type="number"
              step="0.0001"
              value={customLng}
              onChange={(e) => setCustomLng(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-1.5 rounded-lg transition"
          >
            Add Location
          </button>
        </form>

        {/* Run Optimizer Button */}
        <button
          onClick={handleOptimizeRoute}
          disabled={loading || activeCount === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Calculating Nearest Neighbor Path...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              Solve Chandigarh Route ({activeCount} stops)
            </>
          )}
        </button>

        {/* Optimization Metrics Result */}
        {optimizedRoute && (
          <div className="bg-green-950/50 border border-green-800 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-green-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Optimal Route Computed
            </h4>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-gray-200">
              <div className="bg-gray-900/60 p-2 rounded-lg">
                <span className="text-gray-400 block text-[10px]">TOTAL DISTANCE</span>
                <span className="text-base font-bold text-white">{optimizedRoute.total_distance_km} km</span>
              </div>
              <div className="bg-gray-900/60 p-2 rounded-lg">
                <span className="text-gray-400 block text-[10px]">ESTIMATED TIME</span>
                <span className="text-base font-bold text-white">{optimizedRoute.estimated_time_mins} mins</span>
              </div>
            </div>

            {/* Turn by turn order */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-gray-300 mb-1.5">Waypoint Order:</p>
              <ol className="text-xs space-y-1 text-gray-300">
                <li className="text-red-400 font-semibold">• Start: Depot (Ind. Area Phase 1)</li>
                {optimizedRoute.ordered_stops.map((stop, i) => (
                  <li key={i} className="text-gray-200 pl-2">
                    {i + 1}. {stop.name}
                  </li>
                ))}
                <li className="text-red-400 font-semibold">• Return: Depot</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Map visualization */}
      <div className="lg:col-span-2 bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl flex flex-col h-[650px]">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          Optimized Path & Waypoints in Chandigarh
        </h3>
        
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-700 relative">
          <MapContainer 
            center={[CHANDIGARH_DEPOT.lat, CHANDIGARH_DEPOT.lng]} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {/* Depot */}
            <Marker position={[CHANDIGARH_DEPOT.lat, CHANDIGARH_DEPOT.lng]} icon={depotIcon}>
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-red-600">Central Depot Origin</h4>
                  <p className="text-xs text-gray-700">Industrial Area Phase 1, Chandigarh</p>
                </div>
              </Popup>
            </Marker>

            {/* Stops */}
            {stops.filter(s => s.active).map((stop, idx) => (
              <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={stopIcon}>
                <Popup>
                  <div className="p-1">
                    <span className="text-[10px] uppercase font-bold text-blue-600">Delivery Stop</span>
                    <h4 className="font-bold text-gray-900 text-xs">{stop.name}</h4>
                    <p className="text-[11px] text-gray-600">Location: {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route Polyline */}
            {optimizedRoute && (
              <Polyline 
                positions={[
                  [CHANDIGARH_DEPOT.lat, CHANDIGARH_DEPOT.lng],
                  ...optimizedRoute.ordered_stops.map(s => [s.lat, s.lng]),
                  [CHANDIGARH_DEPOT.lat, CHANDIGARH_DEPOT.lng]
                ]}
                color="#3b82f6"
                weight={5}
                dashArray="10, 10"
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
