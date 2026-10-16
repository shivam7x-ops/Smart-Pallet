import React, { useState } from 'react';
import { Package, X, MapPin } from 'lucide-react';

const CHANDIGARH_DEPOT = {
  lat: 30.7046,
  lng: 76.8016,
  address: 'Central Logistics Depot, Industrial Area Phase 1, Chandigarh'
};

export default function NewPalletModal({ isOpen, onClose, onCreatePallet }) {
  const [palletId, setPalletId] = useState('');
  const [palletType, setPalletType] = useState('Euro Pallet (Standard)');
  const [capacity, setCapacity] = useState(1500);
  const [locationName, setLocationName] = useState(CHANDIGARH_DEPOT.address);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!palletId) return;

    onCreatePallet({
      id: palletId.trim().toUpperCase(),
      type: palletType,
      capacity_kg: parseFloat(capacity),
      status: 'Available',
      location: {
        lat: CHANDIGARH_DEPOT.lat,
        lng: CHANDIGARH_DEPOT.lng,
        address: locationName
      }
    });

    setPalletId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Register New Pallet</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Pallet Tag / ID (e.g. P006)</label>
            <input
              type="text"
              value={palletId}
              onChange={(e) => setPalletId(e.target.value)}
              placeholder="P006"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Pallet Type & Category</label>
            <select
              value={palletType}
              onChange={(e) => setPalletType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option>Euro Pallet (Standard)</option>
              <option>Industrial Heavy Duty</option>
              <option>Refrigerated Container Pallet</option>
              <option>Heavy Duty Plastic Pallet</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Weight Capacity (kg)</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              min="100"
              max="5000"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
              <MapPin className="w-3.5 h-3.5" /> Initial Station Assignment
            </div>
            <p className="text-xs text-white">{locationName}</p>
            <p className="text-[10px] text-gray-400">Lat: 30.7046, Lng: 76.8016 (Chandigarh Depot)</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow"
            >
              Register to Chandigarh Depot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
