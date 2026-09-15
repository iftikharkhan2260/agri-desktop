import React, { createContext, useContext, useState, useMemo } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // No persisted session across app restarts by design — the main process
  // already tracks "who's logged in" for local/host dispatch after a
  // successful login (see electron/main.js's api-request handler); logging
  // back in on relaunch takes one tap and keeps this simple.

  async function login(username, password) {
    const { user: loggedInUser } = await api.post('/api/auth/login', { username, password });
    setUser(loggedInUser);
  }

  function logout() {
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
