import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, rtdb } from '../firebase';

export const DEMO_PROFILES = {
  admin: {
    uid: 'demo_admin',
    name: 'Aman Sharma (HQ Admin)',
    email: 'admin@smartpallet.io',
    role: 'admin',
    hub: 'Chandigarh Central HQ',
    badge: 'Admin',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    description: 'Full system master privileges, RBAC control, all pallet/order management & VRP optimization.'
  },
  warehouse_manager: {
    uid: 'demo_manager',
    name: 'Harpreet Singh (Depot Head)',
    email: 'manager@smartpallet.io',
    role: 'warehouse_manager',
    hub: 'Industrial Area Phase 1 Depot, Chandigarh',
    badge: 'Warehouse Manager',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    description: 'Stock management, pallet registration, dispatching pallets to orders, inventory health.'
  },
  delivery_agent: {
    uid: 'demo_driver',
    name: 'Gurdeep Kumar (Senior Driver)',
    email: 'driver@smartpallet.io',
    role: 'delivery_agent',
    hub: 'Chandigarh Fleet Unit 4',
    vehicle_id: 'CH-01-TR-4521',
    badge: 'Delivery Agent',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    description: 'Assigned Chandigarh deliveries, active navigation route, one-click order status, live cargo telemetry.'
  }
};

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Always display Login Page first whenever the website is opened
  const [currentUser, setCurrentUser] = useState(() => {
    const session = sessionStorage.getItem('sm_pallet_session_user');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.uid) return parsed;
      } catch (e) {}
    }
    return null; // Ensure Login Page is always shown first
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch role from RTDB
        try {
          const userRef = ref(rtdb, `users/${fbUser.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            const fullProfile = {
              uid: fbUser.uid,
              email: fbUser.email,
              name: data.name || fbUser.email.split('@')[0],
              role: data.role || 'warehouse_manager',
              hub: data.hub || 'Chandigarh Depot',
              isFirebase: true
            };
            setCurrentUser(fullProfile);
            sessionStorage.setItem('sm_pallet_session_user', JSON.stringify(fullProfile));
          } else {
            // New user without RTDB entry yet
            const defaultProfile = {
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              role: 'warehouse_manager',
              hub: 'Industrial Area Phase 1, Chandigarh',
              isFirebase: true
            };
            await set(userRef, defaultProfile);
            setCurrentUser(defaultProfile);
            sessionStorage.setItem('sm_pallet_session_user', JSON.stringify(defaultProfile));
          }
        } catch (err) {
          console.warn('Firebase RTDB user fetch error, using local fallback:', err);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Quick switch between preset demo roles
  const switchDemoRole = (roleKey) => {
    const profile = DEMO_PROFILES[roleKey] || DEMO_PROFILES.admin;
    setCurrentUser(profile);
    sessionStorage.setItem('sm_pallet_session_user', JSON.stringify(profile));
  };

  // Sign In with credential validation
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    // 1. Built-in Logistics Demo Accounts validation
    if (cleanEmail === 'admin@smartpallet.io') {
      if (cleanPass === 'admin123' || cleanPass === 'password123' || cleanPass === 'admin' || cleanPass === 'password') {
        const profile = DEMO_PROFILES.admin;
        setCurrentUser(profile);
        sessionStorage.setItem('sm_pallet_session_user', JSON.stringify(profile));
        return { success: true, user: profile };
      } else {
        return { success: false, error: 'Incorrect password for admin@smartpallet.io. Try "admin123".' };
      }
    }

    if (cleanEmail === 'manager@smartpallet.io') {
      if (cleanPass === 'manager123' || cleanPass === 'password123' || cleanPass === 'manager' || cleanPass === 'password') {
        const profile = DEMO_PROFILES.warehouse_manager;
        setCurrentUser(profile);
        sessionStorage.setItem('sm_pallet_session_user', JSON.stringify(profile));
        return { success: true, user: profile };
      } else {
        return { success: false, error: 'Incorrect password for manager@smartpallet.io. Try "manager123".' };
      }
    }

    if (cleanEmail === 'driver@smartpallet.io') {
      if (cleanPass === 'driver123' || cleanPass === 'password123' || cleanPass === 'driver' || cleanPass === 'password') {
        const profile = DEMO_PROFILES.delivery_agent;
        setCurrentUser(profile);
        sessionStorage.setItem('sm_pallet_session_user', JSON.stringify(profile));
        return { success: true, user: profile };
      } else {
        return { success: false, error: 'Incorrect password for driver@smartpallet.io. Try "driver123".' };
      }
    }

    // 2. Firebase Authentication for live accounts
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      return { success: true, user: cred.user };
    } catch (error) {
      let msg = 'Invalid credentials. Please verify your email and password.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        msg = 'Invalid email or password. Please check your credentials or use the demo accounts below.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Invalid email format. Please enter a valid email address.';
      }
      return { success: false, error: msg };
    }
  };

  // Real Firebase Sign Up with chosen role
  const signup = async (email, password, name, role = 'warehouse_manager') => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: name || email.split('@')[0],
        role: role,
        hub: 'Chandigarh Central Depot',
        created_at: new Date().toISOString()
      };
      // Store in RTDB
      try {
        await set(ref(rtdb, `users/${cred.user.uid}`), userProfile);
      } catch (dbErr) {
        console.warn('Could not write to RTDB directly:', dbErr);
      }
      setCurrentUser({ ...userProfile, isFirebase: true });
      localStorage.setItem('sm_pallet_demo_user', JSON.stringify(userProfile));
      return { success: true, user: cred.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Sign out - returns to Login Page & IoT Connection screen
  const logout = async () => {
    try {
      if (currentUser?.isFirebase) {
        await fbSignOut(auth);
      }
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setCurrentUser(null);
    sessionStorage.removeItem('sm_pallet_session_user');
    localStorage.removeItem('sm_pallet_demo_user');
  };

  // Update dynamic user role in RTDB and state
  const updateUserRole = async (uid, newRole) => {
    try {
      await update(ref(rtdb, `users/${uid}`), { role: newRole });
      if (currentUser.uid === uid) {
        const updated = { ...currentUser, role: newRole };
        setCurrentUser(updated);
        localStorage.setItem('sm_pallet_demo_user', JSON.stringify(updated));
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to update user role:', error);
      return { success: false, error: error.message };
    }
  };

  const role = currentUser?.role || 'admin';
  const isAdmin = role === 'admin';
  const isManager = role === 'warehouse_manager';
  const isDriver = role === 'delivery_agent';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAdmin,
        isManager,
        isDriver,
        authLoading,
        login,
        signup,
        logout,
        switchDemoRole,
        updateUserRole,
        DEMO_PROFILES
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
