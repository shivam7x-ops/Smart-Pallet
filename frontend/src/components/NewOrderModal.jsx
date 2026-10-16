import React, { useState } from 'react';
import { Truck, X, MapPin, Package, User } from 'lucide-react';

const CHANDIGARH_DESTINATIONS = [
  { name: "Rajiv Gandhi IT Park, Chandigarh", lat: 30.7245, lng: 76.8375 },
  { name: "Sector 17 Commercial Center, Chandigarh", lat: 30.7415, lng: 76.7850 },
  { name: "Mohali Phase 7 Industrial Hub", lat: 30.7046, lng: 76.7179 },
  { name: "Panchkula Sector 5 Logistics Park", lat: 30.6942, lng: 76.8606 },
  { name: "Chandigarh Junction Freight Yard (Daria)", lat: 30.7022, lng: 76.8203 },
  { name: "Sector 35 Retail Distribution Center", lat: 30.7228, lng: 76.7681 }
];

export default function NewOrderModal({ 
  isOpen, 
  onClose, 
  availablePallets, 
  drivers, 
  onCreateOrder 
}) {
  const [customer, setCustomer] = useState('');
  const [destIndex, setDestIndex] = useState(0);
  const [priority, setPriority] = useState('Medium');
  const [selectedPallets, setSelectedPallets] = useState([]);
  const [assignedDriver, setAssignedDriver] = useState('driver@smartpallet.io');

  if (!isOpen) return null;

  const togglePallet = (id) => {
    if (selectedPallets.includes(id)) {
      setSelectedPallets(selectedPallets.filter(p => p !== id));
    } else {
      setSelectedPallets([...selectedPallets, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer) return;

    const chosenDest = CHANDIGARH_DESTINATIONS[destIndex];

    onCreateOrder({
      customer,
      destination: {
        name: chosenDest.name,
        lat: chosenDest.lat,
        lng: chosenDest.lng
      },
      required_pallets: selectedPallets.length || 1,
      assigned_pallets: selectedPallets,
      assigned_agent: assignedDriver,
      priority,
      status: 'Pending'
    });

    setCustomer('');
    setSelectedPallets([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Create Chandigarh Delivery Order</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Customer / Consignee</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Infosys Campus Logistics"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Delivery Destination in Chandigarh</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-red-400 absolute left-3 top-2.5" />
              <select
                value={destIndex}
                onChange={(e) => setDestIndex(parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {CHANDIGARH_DESTINATIONS.map((dest, i) => (
                  <option key={i} value={i}>
                    {dest.name} ({dest.lat.toFixed(4)}, {dest.lng.toFixed(4)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Delivery Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Assigned Delivery Agent</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                <select
                  value={assignedDriver}
                  onChange={(e) => setAssignedDriver(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="driver@smartpallet.io">Gurdeep Kumar (CH-01-TR-4521)</option>
                  {drivers?.map((d) => (
                    <option key={d.uid} value={d.email}>
                      {d.name} ({d.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pallet Allocation */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Select Pallets to Allocate ({selectedPallets.length} selected):
            </label>
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1.5">
              {availablePallets.length === 0 ? (
                <p className="text-xs text-gray-400 p-2 text-center">No available pallets in depot stock.</p>
              ) : (
                availablePallets.map(p => (
                  <label 
                    key={p.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-700/60 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPallets.includes(p.id)}
                      onChange={() => togglePallet(p.id)}
                      className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0"
                    />
                    <span className="font-bold text-blue-400 font-mono">{p.id}</span>
                    <span className="text-gray-300">{p.type}</span>
                    <span className="text-gray-500 text-[10px]">({p.capacity_kg} kg)</span>
                  </label>
                ))
              )}
            </div>
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow"
            >
              Dispatch Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
