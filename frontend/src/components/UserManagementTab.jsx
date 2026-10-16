import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  ShieldCheck, 
  Warehouse, 
  Truck, 
  Check, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';

export default function UserManagementTab({ users, onUpdateUserRole }) {
  const { currentUser } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');

  const handleRoleChange = async (uid, newRole) => {
    const res = await onUpdateUserRole(uid, newRole);
    if (res.success) {
      setSuccessMessage(`Role successfully updated to ${newRole.replace('_', ' ')}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const getBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'warehouse_manager':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'delivery_agent':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">RBAC & User Access Management</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Admin console for managing user roles, credentials, and facility assignments across Chandigarh Hub
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-950/80 border border-green-800 px-3 py-1.5 rounded-lg text-xs text-green-300 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-green-400" />
            {successMessage}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" /> Registered System Users & RBAC Roles
        </h3>

        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-900 text-gray-400 uppercase text-[11px] tracking-wider font-semibold border-b border-gray-700">
              <tr>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Contact & Hub</th>
                <th className="p-3.5">Current Role</th>
                <th className="p-3.5 text-right">Assign New Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/80 bg-gray-900/30">
              {users.map(user => {
                const isSelf = user.uid === currentUser?.uid || user.email === currentUser?.email;

                return (
                  <tr key={user.uid} className="hover:bg-gray-800/60 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xs text-blue-400">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{user.name}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-blue-900/70 text-blue-300 px-1.5 py-0.2 rounded border border-blue-700">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-500" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs space-y-0.5">
                        <p className="text-gray-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                          <span className="truncate">{user.hub || 'Chandigarh Logistics Hub'}</span>
                        </p>
                        {user.phone && (
                          <p className="text-gray-500 text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {user.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getBadgeStyle(user.role)}`}>
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="warehouse_manager">Warehouse Manager</option>
                        <option value="delivery_agent">Delivery Agent</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Privileges Matrix Table */}
      <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" /> RBAC Permission Matrix
        </h3>
        
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
              <tr>
                <th className="p-3">Capability / Privilege</th>
                <th className="p-3 text-center text-purple-400">Admin</th>
                <th className="p-3 text-center text-blue-400">Warehouse Manager</th>
                <th className="p-3 text-center text-emerald-400">Delivery Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/80 bg-gray-900/40">
              <tr>
                <td className="p-3 font-medium text-white">View Live Telemetry Map & KPIs</td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">Register & Update Pallets</td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><X className="w-4 h-4 text-gray-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">Delete Pallets & Orders</td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><X className="w-4 h-4 text-gray-500 mx-auto" /></td>
                <td className="p-3 text-center"><X className="w-4 h-4 text-gray-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">Create Orders & Assign Drivers</td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><X className="w-4 h-4 text-gray-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">Change User RBAC Roles</td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><X className="w-4 h-4 text-gray-500 mx-auto" /></td>
                <td className="p-3 text-center"><X className="w-4 h-4 text-gray-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">Actionable Delivery Controls (Start / Drop-off)</td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="p-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
