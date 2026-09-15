import React, { createContext, useContext, useState, useMemo } from 'react';
import { api } from '../api/client';
import networkService from '../net/networkService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Note: there is no persisted session across app restarts by design —
  // the peer-to-peer connection itself (this device's TCP socket to the
  // Host, or the Host's own in-memory session) is what "being logged in"
  // rides on, and that connection is freshly re-established on launch.
  // Logging back in takes one tap, so this keeps the auth model simple
  // and avoids stale sessions after a Host restart.

  async function login(username, password) {
    const { user: loggedInUser } = await api.post('/api/auth/login', { username, password });
    networkService.setLocalUser(loggedInUser);
    setUser(loggedInUser);
  }

  function logout() {
    networkService.setLocalUser(null);
    setUser(null);
  }

  // Section 16 access rules, enforced client-side for UX; every handler
  // also enforces these server-side regardless of which device calls it.
  const permissions = useMemo(() => {
    if (!user) return {};
    const isOwner = user.role === 'owner';
    const isManager = user.role === 'manager';
    return {
      canAccessSettlement: isOwner,
      canAccessCollection: isOwner,
      canManageEmployees: isOwner,
      canBackup: isOwner || isManager
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, permissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
