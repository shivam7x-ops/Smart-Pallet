import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ref, onValue } from 'firebase/database';
import { rtdb } from './firebase';

import Navbar from './components/Navbar';
import OverviewTab from './components/OverviewTab';
import InventoryTab from './components/InventoryTab';
import LiveMapTab from './components/LiveMapTab';
import RouteTab from './components/RouteTab';
import DriverViewTab from './components/DriverViewTab';
import UserManagementTab from './components/UserManagementTab';
import IotDeviceTab from './components/IotDeviceTab';

import NewPalletModal from './components/NewPalletModal';
import NewOrderModal from './components/NewOrderModal';
import AuthModal from './components/AuthModal';
import LoginPage from './components/LoginPage';

import { 
  Package, 
  Truck, 
  MapPin, 
  Navigation, 
  Users, 
  ShieldCheck, 
  Warehouse,
  Radio
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

function DashboardContent() {
  const { role, isAdmin, isManager, isDriver, updateUserRole } = useAuth();

  const [pallets, setPallets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Tab State
  const [activeTab, setActiveTab] = useState(isDriver ? 'driver-view' : 'overview');

  // Modals
  const [palletModalOpen, setPalletModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Automatically adjust active tab when switching roles if tab is restricted
  useEffect(() => {
    if (isDriver && (activeTab === 'inventory' || activeTab === 'users')) {
      setActiveTab('driver-view');
    } else if (isManager && activeTab === 'users') {
      setActiveTab('overview');
    }
  }, [role]);

  // Direct Firebase RTDB real-time listeners for low-latency live telemetry & sync
  useEffect(() => {
    try {
      const palletsRef = ref(rtdb, 'pallets');
      const unsubscribePallets = onValue(palletsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPallets(Object.values(data));
        }
      });

      const ordersRef = ref(rtdb, 'orders');
      const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setOrders(Object.values(data));
        }
      });

      const usersRef = ref(rtdb, 'users');
      const unsubscribeUsers = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUsers(Object.values(data));
        }
      });

      return () => {
        unsubscribePallets();
        unsubscribeOrders();
        unsubscribeUsers();
      };
    } catch (err) {
      console.warn("RTDB listener fallback to REST polling:", err);
    }
  }, []);

  // Fallback REST polling
  const fetchAllData = async () => {
    try {
      const [palletsRes, ordersRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/pallets`).catch(() => null),
        fetch(`${API_BASE}/orders`).catch(() => null),
        fetch(`${API_BASE}/users`).catch(() => null)
      ]);

      if (palletsRes?.ok) {
        const p = await palletsRes.json();
        setPallets(p);
      }
      if (ordersRes?.ok) {
        const o = await ordersRes.json();
        setOrders(o);
      }
      if (usersRes?.ok) {
        const u = await usersRes.json();
        setUsers(u);
      }
    } catch (e) {
      console.error("Failed fetching REST data:", e);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 4000);
    return () => clearInterval(interval);
  }, []);

  // CRUD Actions
  const handleCreatePallet = async (palletData) => {
    try {
      const res = await fetch(`${API_BASE}/pallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(palletData)
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Create pallet error:", err);
    }
  };

  const handleUpdatePalletStatus = async (palletId, status) => {
    try {
      // Optimistic update
      setPallets(pallets.map(p => p.id === palletId ? { ...p, status } : p));
      await fetch(`${API_BASE}/pallets/${palletId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchAllData();
    } catch (err) {
      console.error("Update pallet status error:", err);
    }
  };

  const handleDeletePallet = async (palletId) => {
    if (!window.confirm(`Are you sure you want to delete pallet ${palletId}?`)) return;
    try {
      setPallets(pallets.filter(p => p.id !== palletId));
      await fetch(`${API_BASE}/pallets/${palletId}`, {
        method: 'DELETE'
      });
      fetchAllData();
    } catch (err) {
      console.error("Delete pallet error:", err);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Create order error:", err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchAllData();
    } catch (err) {
      console.error("Update order status error:", err);
    }
  };

  const handleUpdateUserRoleAction = async (uid, newRole) => {
    const res = await updateUserRole(uid, newRole);
    if (res.success) {
      try {
        await fetch(`${API_BASE}/users/${uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        });
      } catch (e) {}
      fetchAllData();
    }
    return res;
  };

  const handleResetSeed = async () => {
    setIsResetting(true);
    try {
      await fetch(`${API_BASE}/reset-seed`, { method: 'POST' });
      await fetchAllData();
    } catch (err) {
      console.error("Reset seed error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const availablePallets = pallets.filter(p => p.status === 'Available');
  const driverUsers = users.filter(u => u.role === 'delivery_agent');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenPalletModal={() => setPalletModalOpen(true)}
        onOpenOrderModal={() => setOrderModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Navigation Tabs Bar with RBAC filters */}
      <div className="bg-gray-800/80 border-b border-gray-700 px-6 flex flex-wrap gap-1 sm:gap-6 text-xs sm:text-sm font-medium">
        {/* Overview Tab (Available to All) */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Overview & KPIs
        </button>

        {/* Inventory Tab (Admin & Warehouse Manager) */}
        {(isAdmin || isManager) && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            Pallet Inventory
          </button>
        )}

        {/* Live Map Tracking (Chandigarh) */}
        <button
          onClick={() => setActiveTab('live-map')}
          className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'live-map'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Live Map (Chandigarh)
        </button>

        {/* IoT Telemetry Hub & Hardware Diagnostics */}
        <button
          onClick={() => setActiveTab('iot')}
          className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'iot'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          IoT Telemetry Hub
        </button>

        {/* Route Optimization Tab (Admin & Warehouse Manager) */}
        {(isAdmin || isManager) && (
          <button
            onClick={() => setActiveTab('route')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'route'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Route Optimizer (VRP)
          </button>
        )}

        {/* Driver Cockpit Tab (Delivery Agent, or Admin Preview) */}
        {(isDriver || isAdmin) && (
          <button
            onClick={() => setActiveTab('driver-view')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'driver-view'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            {isDriver ? 'My Deliveries' : 'Driver Cockpit (Preview)'}
          </button>
        )}

        {/* User Management Tab (Admin Only) */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            User RBAC Console
          </button>
        )}
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        {activeTab === 'overview' && (
          <OverviewTab
            pallets={pallets}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'inventory' && (isAdmin || isManager) && (
          <InventoryTab
            pallets={pallets}
            onUpdatePalletStatus={handleUpdatePalletStatus}
            onDeletePallet={handleDeletePallet}
            onOpenRegisterModal={() => setPalletModalOpen(true)}
          />
        )}

        {activeTab === 'live-map' && (
          <LiveMapTab pallets={pallets} />
        )}

        {activeTab === 'iot' && (
          <IotDeviceTab />
        )}

        {activeTab === 'route' && (isAdmin || isManager) && (
          <RouteTab orders={orders} />
        )}

        {activeTab === 'driver-view' && (
          <DriverViewTab
            pallets={pallets}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'users' && isAdmin && (
          <UserManagementTab
            users={users.length ? users : Object.values({
              "usr_admin": { uid: "usr_admin", name: "System Administrator", email: "admin@smartpallet.io", role: "admin", hub: "Chandigarh Central HQ" },
              "usr_manager": { uid: "usr_manager", name: "Harpreet Singh", email: "manager@smartpallet.io", role: "warehouse_manager", hub: "Industrial Area Phase 1 Depot" },
              "usr_driver": { uid: "usr_driver", name: "Gurdeep Kumar", email: "driver@smartpallet.io", role: "delivery_agent", hub: "Chandigarh Fleet Unit 4" }
            })}
            onUpdateUserRole={handleUpdateUserRoleAction}
          />
        )}
      </main>

      {/* Modals */}
      <NewPalletModal
        isOpen={palletModalOpen}
        onClose={() => setPalletModalOpen(false)}
        onCreatePallet={handleCreatePallet}
      />

      <NewOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        availablePallets={availablePallets}
        drivers={driverUsers}
        onCreateOrder={handleCreateOrder}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

function RootApp() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-400 font-mono">Connecting to Chandigarh Logistics Hub...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <DashboardContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
