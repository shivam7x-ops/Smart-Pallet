import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Package,
  Lock, 
  Mail, 
  User, 
  AlertCircle,
  Cpu,
  Settings,
  MapPin,
  XCircle,
  Radio,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  LogIn
} from 'lucide-react';
import IotConnectionModal, { getStoredIotConfig } from './IotConnectionModal';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('signin'); // Default to 'signin' so email & password fields are displayed on open
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('warehouse_manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // IoT Connection Modal state
  const [iotModalOpen, setIotModalOpen] = useState(false);
  const [iotConfig, setIotConfig] = useState(getStoredIotConfig);

  useEffect(() => {
    // Refresh config from storage
    setIotConfig(getStoredIotConfig());
  }, [iotModalOpen]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to sign in. Check email and password.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signup(email, password, name, selectedRole);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to create account.');
    }
  };

  const getIotStatusBadge = () => {
    switch (iotConfig.connectionStatus) {
      case 'Connected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected
          </span>
        );
      case 'Connecting':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[11px] font-bold text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Connecting...
          </span>
        );
      case 'Connection Failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-[11px] font-bold text-red-400">
            <XCircle className="w-3 h-3 text-red-400" />
            Connection Failed
          </span>
        );
      case 'Disconnected':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-[11px] font-medium text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            Disconnected
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Bar with Brand & IoT Connection Quick Button */}
      <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Smart Pallet Tracker
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-gray-900/90 text-blue-300 border border-gray-700 px-2.5 py-0.5 rounded-full">
                <MapPin className="w-3 h-3 text-red-400" />
                Chandigarh Hub
              </span>
            </div>
            <p className="text-xs text-gray-400">IoT Telemetry & Dynamic VRP Logistics Operations</p>
          </div>
        </div>

        {/* Prominent Header Action: IoT Connection Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIotModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-850 hover:from-gray-850 hover:to-gray-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-900/40 transition cursor-pointer group"
            id="login-iot-settings-btn"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <span>IoT Connection Settings</span>
            {getIotStatusBadge()}
          </button>
        </div>
      </header>

      {/* Main Login Screen Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-lg">
          
          {/* Card Wrapper with Existing Login Design */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Login Card Header */}
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
            </div>

            {/* IoT Connection Settings Access Banner (Before Login) */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-gray-900 to-gray-850 border-b border-gray-800 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Radio className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-gray-400">Hardware Node:</span>
                <span className="font-mono text-cyan-300 font-bold">{iotConfig.deviceId}</span>
                <span className="text-gray-500 text-[11px] hidden sm:inline">({iotConfig.ipAddress})</span>
              </div>
              <button
                type="button"
                onClick={() => setIotModalOpen(true)}
                className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/60 border border-cyan-700/60 hover:border-cyan-500 transition cursor-pointer shadow-sm"
                id="login-card-iot-btn"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>Configure IoT Settings</span>
              </button>
            </div>

            {/* Tab switcher */}
            <div className="grid grid-cols-2 border-b border-gray-800 text-xs font-semibold text-center">
              <button
                onClick={() => { setTab('signin'); setError(''); }}
                className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tab === 'signin' 
                    ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500 font-bold' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                id="tab-btn-signin"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => { setTab('signup'); setError(''); }}
                className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tab === 'signup' 
                    ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500 font-bold' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                id="tab-btn-signup"
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

              {/* TAB 1: Sign In */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-300 font-semibold block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                        Email Address
                      </span>
                      <span className="text-[10px] text-gray-500 font-normal">e.g. admin@smartpallet.io</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full bg-gray-800/90 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-300 font-semibold block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        Password
                      </span>
                      <span className="text-[10px] text-gray-500 font-normal">Demo: admin123</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full bg-gray-800/90 border border-gray-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit / Login Button */}
                  <button
                    id="login-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 mt-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authenticating Credentials...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Login to Dashboard</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>

                  {/* Security Notice */}
                  <div className="pt-2 text-center text-xs text-gray-500">
                    <span>Authorized personnel access only • Chandigarh Hub Operations</span>
                  </div>
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
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="admin">Admin (Full System Privilege)</option>
                      <option value="warehouse_manager">Warehouse Manager (Inventory & Dispatch)</option>
                      <option value="delivery_agent">Delivery Agent (Fleet & Deliveries)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition mt-2 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? 'Creating account...' : 'Create Account & Save Role'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick info note below card */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 text-center">
            <Cpu className="w-3.5 h-3.5 text-cyan-500" />
            <span>Hardware configuration and reachability tests can be conducted prior to signing in.</span>
          </div>
        </div>
      </main>

      {/* IoT Connection Settings Modal */}
      <IotConnectionModal
        isOpen={iotModalOpen}
        onClose={() => setIotModalOpen(false)}
        onConfigSaved={(saved) => setIotConfig(saved)}
      />
    </div>
  );
}
