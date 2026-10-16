import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  MapPin, 
  Clock, 
  Thermometer, 
  Battery, 
  ArrowUpRight,
  ShieldCheck,
  Warehouse,
  AlertTriangle
} from 'lucide-react';

export default function OverviewTab({ pallets, orders, onUpdateOrderStatus, onNavigateTab }) {
  const { role, isAdmin, isManager, isDriver, currentUser } = useAuth();

  const totalPallets = pallets.length;
  const inTransitCount = pallets.filter(p => p.status === 'In Transit').length;
  const availableCount = pallets.filter(p => p.status === 'Available').length;
  const deliveredCount = pallets.filter(p => p.status === 'Delivered').length;

  return (
    <div className="space-y-6">
      {/* Role Context Alert Banner */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
        isAdmin 
          ? 'bg-purple-950/30 border-purple-800/80 text-purple-200' 
          : isManager 
          ? 'bg-blue-950/30 border-blue-800/80 text-blue-200' 
          : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-900/80 border border-gray-700">
            {isAdmin && <ShieldCheck className="w-5 h-5 text-purple-400" />}
            {isManager && <Warehouse className="w-5 h-5 text-blue-400" />}
            {isDriver && <Truck className="w-5 h-5 text-emerald-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Active Session: {currentUser?.name}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                {role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {isAdmin && 'Full administrator privilege: manage users, register/delete pallets, manage all orders & run VRP.'}
              {isManager && 'Warehouse manager workspace: monitor depot inventory, register new pallets, and dispatch deliveries.'}
              {isDriver && 'Delivery agent view: switch to "My Deliveries" tab for turn-by-turn routes and live cargo status.'}
            </p>
          </div>
        </div>

        {isDriver && (
          <button
            onClick={() => onNavigateTab('driver-view')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
          >
            Open Driver Cockpit <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/90 border border-gray-700 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Registered Pallets</p>
            <p className="text-3xl font-bold mt-1 text-white">{totalPallets}</p>
            <span className="text-[11px] text-blue-400">All registered in Chandigarh</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800/90 border border-gray-700 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-gray-400 font-medium">In Transit (Active IoT)</p>
            <p className="text-3xl font-bold mt-1 text-yellow-400">{inTransitCount}</p>
            <span className="text-[11px] text-yellow-400/80">Live GPS tracking active</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Truck className="w-6 h-6 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800/90 border border-gray-700 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-gray-400 font-medium">Available at Depot</p>
            <p className="text-3xl font-bold mt-1 text-green-400">{availableCount}</p>
            <span className="text-[11px] text-green-400/80">Ready for dispatch</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800/90 border border-gray-700 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-gray-400 font-medium">Delivered Orders</p>
            <p className="text-3xl font-bold mt-1 text-indigo-400">{deliveredCount}</p>
            <span className="text-[11px] text-indigo-400/80">Successfully dropped off</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Grid: Active Orders & Live Telemetry Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders Column */}
        <div className="lg:col-span-2 bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-blue-400" /> Active Chandigarh Delivery Orders
            </h3>
            <span className="text-xs text-gray-400">{orders.length} Total Orders</span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 text-center">No orders currently active.</p>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-gray-900 border border-gray-700/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-gray-600 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-blue-300 font-mono">{order.id}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                        {order.customer}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        order.priority === 'High' 
                          ? 'bg-red-950 text-red-300 border-red-800' 
                          : 'bg-yellow-950 text-yellow-300 border-yellow-800'
                      }`}>
                        {order.priority || 'Normal'} Priority
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-300 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>{order.destination?.name || 'Chandigarh Hub'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>Assigned Pallets: <strong className="text-gray-200">{(order.assigned_pallets || []).join(', ') || 'None'}</strong></span>
                      <span>•</span>
                      <span>Driver: <strong className="text-gray-200">{order.assigned_agent || 'Unassigned'}</strong></span>
                    </div>
                  </div>

                  {/* Dynamic Status & Action */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      order.status === 'Completed' || order.status === 'Delivered'
                        ? 'bg-green-950/80 text-green-300 border-green-800'
                        : order.status === 'In Progress'
                        ? 'bg-yellow-950/80 text-yellow-300 border-yellow-800 animate-pulse'
                        : 'bg-gray-800 text-gray-300 border-gray-600'
                    }`}>
                      {order.status}
                    </span>

                    {(isAdmin || isManager) && (
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Pallet Telemetry Snapshot Column */}
        <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <Truck className="w-5 h-5 text-yellow-400" /> Live In-Transit Telemetry
            </h3>
            <span className="text-[11px] font-mono text-green-400 bg-green-950/60 px-2 py-0.5 rounded border border-green-800">
              Live
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Real-time GPS stream from pallets traversing Chandigarh delivery corridors:
          </p>

          <div className="space-y-3">
            {pallets.filter(p => p.status === 'In Transit').map((pallet, idx) => (
              <div key={pallet.id || `transit-p-${idx}`} className="bg-gray-900 border border-gray-700 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-blue-400">{pallet.id}</span>
                    <span className="text-[10px] text-gray-400">{pallet.type}</span>
                  </div>
                  <span className="text-xs font-mono text-yellow-400 font-bold">{pallet.speed_kmh} km/h</span>
                </div>

                <div className="text-[11px] text-gray-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span className="truncate">{pallet.location?.address || `${pallet.location?.lat.toFixed(4)}, ${pallet.location?.lng.toFixed(4)}`}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Battery className={`w-3.5 h-3.5 ${pallet.battery < 30 ? 'text-red-400' : 'text-green-400'}`} />
                    <span>Battery: <strong>{pallet.battery}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Temp: <strong>{pallet.temp_celsius}°C</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
