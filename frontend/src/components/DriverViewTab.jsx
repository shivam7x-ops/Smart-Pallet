import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Truck, 
  MapPin, 
  CheckCircle, 
  Play, 
  AlertTriangle, 
  Battery, 
  Thermometer, 
  Clock, 
  ShieldAlert,
  ArrowRight,
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

const activePalletIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CHANDIGARH_DEPOT = [30.7046, 76.8016];

export default function DriverViewTab({ pallets, orders, onUpdateOrderStatus }) {
  const { currentUser } = useAuth();

  // Filter orders assigned to this driver or available in general
  const myOrders = orders.filter(
    o => o.assigned_agent === currentUser?.email || o.assigned_agent === 'driver@smartpallet.io'
  );

  const activeOrder = myOrders.find(o => o.status === 'In Progress') || myOrders[0];

  // Get pallets assigned to the active order
  const assignedPalletIds = activeOrder?.assigned_pallets || [];
  const assignedPallets = pallets.filter(p => assignedPalletIds.includes(p.id));

  const handleStartTrip = (orderId) => {
    onUpdateOrderStatus(orderId, 'In Progress');
  };

  const handleConfirmDelivered = (orderId) => {
    onUpdateOrderStatus(orderId, 'Completed');
  };

  return (
    <div className="space-y-6">
      {/* Driver Status Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-gray-800 to-gray-900 border border-emerald-800/80 p-5 rounded-2xl flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Delivery Agent Cockpit</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full">
                Active Vehicle: {currentUser?.vehicle_id || 'CH-01-TR-4521'}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5">
              Agent: <strong>{currentUser?.name}</strong> • Fleet Hub: {currentUser?.hub || 'Chandigarh Central Fleet'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-gray-900/80 border border-gray-700 px-3 py-2 rounded-xl text-center">
            <span className="text-gray-400 block text-[10px]">ASSIGNED ORDERS</span>
            <span className="text-sm font-bold text-white">{myOrders.length}</span>
          </div>
          <div className="bg-gray-900/80 border border-gray-700 px-3 py-2 rounded-xl text-center">
            <span className="text-gray-400 block text-[10px]">PALLETS ONBOARD</span>
            <span className="text-sm font-bold text-emerald-400">{assignedPallets.length}</span>
          </div>
        </div>
      </div>

      {/* Main Driver Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Orders & Action Controls */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" /> My Assigned Chandigarh Deliveries
          </h3>

          <div className="space-y-3">
            {myOrders.map(order => {
              const isInProgress = order.status === 'In Progress';
              const isCompleted = order.status === 'Completed' || order.status === 'Delivered';

              return (
                <div 
                  key={order.id}
                  className={`p-4 rounded-xl border transition shadow-lg ${
                    isInProgress 
                      ? 'bg-emerald-950/30 border-emerald-600' 
                      : isCompleted 
                      ? 'bg-gray-900/80 border-gray-700 opacity-80' 
                      : 'bg-gray-800/90 border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-400">{order.id}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{order.customer}</h4>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      isCompleted 
                        ? 'bg-green-950 text-green-300 border-green-800' 
                        : isInProgress 
                        ? 'bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse' 
                        : 'bg-gray-800 text-gray-300 border-gray-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 mt-2 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{order.destination?.name || 'Chandigarh Hub'}</span>
                  </div>

                  <div className="text-[11px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-700/60">
                    Cargo: <strong className="text-gray-200">{(order.assigned_pallets || []).join(', ')}</strong>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-700">
                    {!isInProgress && !isCompleted && (
                      <button
                        onClick={() => handleStartTrip(order.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Transit
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => handleConfirmDelivered(order.id)}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirm Drop-off
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Delivery Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cargo Sensor Telemetry Monitor */}
          <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              Onboard Pallet Telemetry & Cold-Chain
            </h4>

            {assignedPallets.length === 0 ? (
              <p className="text-xs text-gray-400">No pallets currently assigned to active trip.</p>
            ) : (
              assignedPallets.map(pallet => (
                <div key={pallet.id} className="bg-gray-900 border border-gray-700/80 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-blue-400 font-mono">{pallet.id}</span>
                    <span className="text-xs text-gray-400">{pallet.type}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-gray-800 p-1.5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">BATTERY</span>
                      <strong className={pallet.battery < 30 ? 'text-red-400' : 'text-green-400'}>
                        {pallet.battery}%
                      </strong>
                    </div>
                    <div className="bg-gray-800 p-1.5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">TEMP</span>
                      <strong className={pallet.type.includes('Refrigerated') && pallet.temp_celsius > 8 ? 'text-red-400' : 'text-cyan-300'}>
                        {pallet.temp_celsius}°C
                      </strong>
                    </div>
                    <div className="bg-gray-800 p-1.5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">SPEED</span>
                      <strong className="text-yellow-400">{pallet.speed_kmh} km/h</strong>
                    </div>
                  </div>

                  {pallet.type.includes('Refrigerated') && (
                    <div className="bg-blue-950/40 border border-blue-800/80 px-2.5 py-1 rounded text-[11px] text-blue-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>Cold-Chain Monitor: Temperature stable (&lt;5°C target)</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Driver Route Navigation Map */}
        <div className="lg:col-span-2 bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl flex flex-col h-[650px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Active Delivery Navigation (Chandigarh)
            </h3>
            {activeOrder && (
              <span className="text-xs text-gray-300 bg-gray-900 border border-gray-700 px-2.5 py-1 rounded-lg">
                Destination: <strong className="text-white">{activeOrder.destination?.name}</strong>
              </span>
            )}
          </div>

          <div className="flex-1 rounded-xl overflow-hidden border border-gray-700 relative">
            <MapContainer
              center={CHANDIGARH_DEPOT}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors • Driver Navigation"
              />

              {/* Depot Marker */}
              <Marker position={CHANDIGARH_DEPOT} icon={depotIcon}>
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold text-red-600">Central Logistics Depot</h4>
                    <p className="text-xs text-gray-700">Industrial Area Phase 1, Chandigarh</p>
                  </div>
                </Popup>
              </Marker>

              {/* Active Order Destination */}
              {activeOrder?.destination?.lat && (
                <Marker 
                  position={[activeOrder.destination.lat, activeOrder.destination.lng]}
                  icon={activePalletIcon}
                >
                  <Popup>
                    <div className="p-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Target Drop-off</span>
                      <h4 className="font-bold text-gray-900 text-xs">{activeOrder.destination.name}</h4>
                      <p className="text-[11px] text-gray-600">Customer: {activeOrder.customer}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Navigation Polyline from Depot to Drop-off */}
              {activeOrder?.destination?.lat && (
                <Polyline 
                  positions={[
                    CHANDIGARH_DEPOT,
                    [activeOrder.destination.lat, activeOrder.destination.lng]
                  ]}
                  color="#10b981"
                  weight={5}
                  dashArray="8, 8"
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
