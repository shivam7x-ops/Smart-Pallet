import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  ShieldCheck, 
  Truck, 
  Warehouse, 
  ChevronDown, 
  LogOut, 
  User, 
  Sparkles,
  MapPin,
  RefreshCw,
  Cpu
} from 'lucide-react';
import IotConnectionModal from './IotConnectionModal';

export default function Navbar({ 
  onOpenPalletModal, 
  onOpenOrderModal, 
  onOpenAuthModal,
  onResetSeed,
  isResetting
}) {
  const { currentUser, role, isAdmin, isManager, isDriver, switchDemoRole, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [iotModalOpen, setIotModalOpen] = useState(false);

  const getRoleBadge = () => {
    if (isAdmin) {
      return {
        label: 'Admin',
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        style: 'bg-purple-950/80 text-purple-300 border-purple-800'
      };
    }
    if (isManager) {
      return {
        label: 'Warehouse Manager',
        icon: <Warehouse className="w-3.5 h-3.5" />,
        style: 'bg-blue-950/80 text-blue-300 border-blue-800'
      };
    }
    return {
      label: 'Delivery Agent',
      icon: <Truck className="w-3.5 h-3.5" />,
      style: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    };
  };

  const badge = getRoleBadge();

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
      {/* Brand & City Hub */}
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
          <p className="text-xs text-gray-400">IoT Telemetry & Dynamic VRP Logistics</p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center flex-wrap gap-3">
        {/* IoT Live Indicator & Settings Shortcut */}
        <button
          onClick={() => setIotModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 text-xs text-green-400 bg-green-950/60 hover:bg-green-950/90 border border-green-800 hover:border-green-600 px-3 py-1.5 rounded-full transition cursor-pointer"
          title="Click to view & test IoT Connection Settings"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
          <span>IoT Stream Active</span>
          <Cpu className="w-3 h-3 text-cyan-400 ml-0.5" />
        </button>

        {/* Quick Role Switcher Bar */}
        <div className="hidden md:flex items-center bg-gray-900 border border-gray-700 rounded-lg p-0.5 text-xs font-medium">
          <button
            onClick={() => switchDemoRole('admin')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              isAdmin 
                ? 'bg-purple-600 text-white shadow font-semibold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
          <button
            onClick={() => switchDemoRole('warehouse_manager')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              isManager 
                ? 'bg-blue-600 text-white shadow font-semibold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            Manager
          </button>
          <button
            onClick={() => switchDemoRole('delivery_agent')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              isDriver 
                ? 'bg-emerald-600 text-white shadow font-semibold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Driver
          </button>
        </div>

        {/* Action Buttons based on RBAC */}
        {(isAdmin || isManager) && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenOrderModal}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold px-3 py-2 rounded-lg transition border border-gray-600"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              New Order
            </button>
            <button
              onClick={onOpenPalletModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-md shadow-blue-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Pallet
            </button>
          </div>
        )}

        {/* User Profile & Auth Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 bg-gray-900 border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-xl transition"
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white max-w-[130px] truncate">
                  {currentUser?.name || 'Active User'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.style}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                {currentUser?.email}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
              <div className="p-2 border-b border-gray-800">
                <p className="text-gray-400 text-[10px]">CURRENT ROLE</p>
                <p className="font-bold text-white text-sm">{badge.label}</p>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  {currentUser?.hub || 'Chandigarh Central Hub'}
                </p>
              </div>

              <div className="py-2 border-b border-gray-800 space-y-1">
                <p className="text-gray-400 text-[10px] px-2">SWITCH ROLE (DEMO / RBAC)</p>
                <button
                  onClick={() => { switchDemoRole('admin'); setDropdownOpen(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${isAdmin ? 'bg-purple-950/60 text-purple-300 font-semibold' : 'text-gray-300 hover:bg-gray-800'}`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Admin
                  </span>
                  {isAdmin && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => { switchDemoRole('warehouse_manager'); setDropdownOpen(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${isManager ? 'bg-blue-950/60 text-blue-300 font-semibold' : 'text-gray-300 hover:bg-gray-800'}`}
                >
                  <span className="flex items-center gap-2">
                    <Warehouse className="w-3.5 h-3.5 text-blue-400" /> Warehouse Manager
                  </span>
                  {isManager && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => { switchDemoRole('delivery_agent'); setDropdownOpen(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${isDriver ? 'bg-emerald-950/60 text-emerald-300 font-semibold' : 'text-gray-300 hover:bg-gray-800'}`}
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" /> Delivery Agent
                  </span>
                  {isDriver && <span className="text-[10px]">Active</span>}
                </button>
              </div>

              {isAdmin && (
                <div className="py-1 border-b border-gray-800">
                  <button
                    onClick={() => { onResetSeed(); setDropdownOpen(false); }}
                    disabled={isResetting}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-yellow-400 hover:bg-yellow-950/30 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    Reset Chandigarh Seed Data
                  </button>
                </div>
              )}

              <div className="pt-1 space-y-1">
                <button
                  onClick={() => { setIotModalOpen(true); setDropdownOpen(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-cyan-400 hover:bg-gray-800 flex items-center gap-2 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  IoT Connection Settings
                </button>
                <button
                  onClick={() => { onOpenAuthModal(); setDropdownOpen(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-blue-400 hover:bg-gray-800 flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In / Create Account
                </button>
                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-red-400 hover:bg-gray-800 flex items-center gap-2 mt-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out (To Login Page)
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Dedicated Navbar Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition border border-red-800/70 hover:border-red-600 cursor-pointer shadow-sm"
          title="Sign out and return to Login Page"
          id="navbar-logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* IoT Connection Settings Modal */}
      <IotConnectionModal
        isOpen={iotModalOpen}
        onClose={() => setIotModalOpen(false)}
      />
    </header>
  );
}
