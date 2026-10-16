import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  X, 
  AlertCircle,
  Cpu,
  Settings,
  Radio
} from 'lucide-react';
import IotConnectionModal, { getStoredIotConfig } from './IotConnectionModal';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('signin'); // Default to 'signin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('warehouse_manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [iotModalOpen, setIotModalOpen] = useState(false);
  const [iotConfig, setIotConfig] = useState(getStoredIotConfig);

  if (!isOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to sign in. Check email and password.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signup(email, password, name, selectedRole);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to create account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-800 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Smart Pallet Auth & RBAC</h2>
              <p className="text-xs text-gray-400">Role-Based Access Control • Chandigarh Operations</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IoT Connection Settings Access Banner */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-gray-900 to-gray-850 border-b border-gray-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="text-gray-400">Node:</span>
            <span className="font-mono text-cyan-300 font-bold">{iotConfig.deviceId}</span>
            <span className="text-[10px] text-gray-500">({iotConfig.connectionStatus})</span>
          </div>
          <button
            type="button"
            onClick={() => setIotModalOpen(true)}
            className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/60 border border-cyan-700/60 hover:border-cyan-500 transition cursor-pointer"
          >
            <Settings className="w-3 h-3 text-cyan-400" />
            <span>IoT Settings</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 border-b border-gray-800 text-xs font-semibold text-center">
          <button
            onClick={() => { setTab('signin'); setError(''); }}
            className={`py-3 flex items-center justify-center gap-1.5 transition ${
              tab === 'signin' 
                ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500 font-bold' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Email Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`py-3 flex items-center justify-center gap-1.5 transition ${
              tab === 'signup' 
                ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500 font-bold' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-950/70 border border-red-800 p-3 rounded-lg flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 2: Sign In */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@smartpallet.io"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition mt-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In with Firebase'}
              </button>
            </form>
          )}

          {/* TAB 3: Sign Up */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Gurpreet Singh"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gurpreet@smartpallet.io"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Assign Initial RBAC Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="admin">Admin (Full System Privilege)</option>
                  <option value="warehouse_manager">Warehouse Manager (Inventory & Dispatch)</option>
                  <option value="delivery_agent">Delivery Agent (Fleet & Deliveries)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition mt-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating account...' : 'Create Account & Save Role'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* IoT Connection Settings Sub-Modal */}
      <IotConnectionModal
        isOpen={iotModalOpen}
        onClose={() => setIotModalOpen(false)}
        onConfigSaved={(saved) => setIotConfig(saved)}
      />
    </div>
  );
}
