import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Search, 
  Filter, 
  Battery, 
  Thermometer, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Truck, 
  Wrench,
  Clock,
  MapPin
} from 'lucide-react';

export default function InventoryTab({ 
  pallets, 
  onUpdatePalletStatus, 
  onDeletePallet, 
  onOpenRegisterModal 
}) {
  const { isAdmin, isManager } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredPallets = pallets.filter(pallet => {
    const matchesSearch = 
      pallet.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pallet.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pallet.location?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || pallet.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || pallet.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Transit':
        return 'bg-yellow-950 text-yellow-300 border-yellow-800';
      case 'Available':
        return 'bg-green-950 text-green-300 border-green-800';
      case 'Delivered':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'Maintenance':
        return 'bg-red-950 text-red-300 border-red-800';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-6 shadow-xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Pallet Inventory Management
          </h2>
          <p className="text-xs text-gray-400">
            Stock control, real-time sensor metrics, and status allocation for Chandigarh Depot
          </p>
        </div>

        {(isAdmin || isManager) && (
          <button
            onClick={onOpenRegisterModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" /> Register New Pallet
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-700">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pallet ID, type, location..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses ({pallets.length})</option>
            <option value="Available">Available at Depot</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Pallet Types</option>
            <option value="Euro Pallet (Standard)">Euro Pallet (Standard)</option>
            <option value="Industrial Heavy Duty">Industrial Heavy Duty</option>
            <option value="Refrigerated Container Pallet">Refrigerated Container</option>
            <option value="Heavy Duty Plastic Pallet">Heavy Duty Plastic</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-900 text-gray-400 uppercase text-[11px] tracking-wider font-semibold border-b border-gray-700">
            <tr>
              <th className="p-3.5">Pallet ID</th>
              <th className="p-3.5">Type & Specs</th>
              <th className="p-3.5">Capacity</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Battery</th>
              <th className="p-3.5">Telemetry (°C / km/h)</th>
              <th className="p-3.5">Current Location (Chandigarh)</th>
              {(isAdmin || isManager) && <th className="p-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/80 bg-gray-900/30">
            {filteredPallets.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-6 text-center text-xs text-gray-400">
                  No pallets matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredPallets.map(pallet => (
                <tr key={pallet.id} className="hover:bg-gray-800/60 transition">
                  {/* ID */}
                  <td className="p-3.5 font-bold text-blue-400 font-mono text-sm">
                    {pallet.id}
                  </td>

                  {/* Type */}
                  <td className="p-3.5">
                    <p className="font-medium text-white text-xs">{pallet.type}</p>
                    <p className="text-[10px] text-gray-400">IoT ESP32 Unit Attached</p>
                  </td>

                  {/* Capacity */}
                  <td className="p-3.5 text-xs font-semibold text-gray-200">
                    {pallet.capacity_kg} kg
                  </td>

                  {/* Status & Dynamic Status Change */}
                  <td className="p-3.5">
                    {(isAdmin || isManager) ? (
                      <select
                        value={pallet.status}
                        onChange={(e) => onUpdatePalletStatus(pallet.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${getStatusBadge(pallet.status)}`}
                      >
                        <option value="Available">Available</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(pallet.status)}`}>
                        {pallet.status}
                      </span>
                    )}
                  </td>

                  {/* Battery */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <Battery className={`w-4 h-4 ${pallet.battery < 25 ? 'text-red-400 animate-pulse' : 'text-green-400'}`} />
                      <span className="font-mono text-xs font-semibold">{pallet.battery}%</span>
                    </div>
                  </td>

                  {/* Temp & Speed */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-cyan-300 font-mono">
                        <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                        {pallet.temp_celsius}°C
                      </span>
                      <span className="text-gray-400 font-mono">
                        {pallet.speed_kmh} km/h
                      </span>
                    </div>
                  </td>

                  {/* Location in Chandigarh */}
                  <td className="p-3.5 max-w-[220px]">
                    <div className="flex items-start gap-1.5 text-xs text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-xs font-medium truncate">
                          {pallet.location?.address || 'Chandigarh Logistics Hub'}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {pallet.location?.lat?.toFixed(4)}, {pallet.location?.lng?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  {(isAdmin || isManager) && (
                    <td className="p-3.5 text-right">
                      {isAdmin && (
                        <button
                          onClick={() => onDeletePallet(pallet.id)}
                          title="Delete Pallet (Admin Only)"
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
