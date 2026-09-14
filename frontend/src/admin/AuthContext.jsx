import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminApi, tokenStore } from './adminApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    adminApi
      .me()
      .then(setAdmin)
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onLogout = () => setAdmin(null);
    window.addEventListener('ft-admin-logout', onLogout);
    return () => window.removeEventListener('ft-admin-logout', onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, admin } = await adminApi.login(email, password);
    tokenStore.set(token);
    setAdmin(admin);
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setAdmin(null);
  }, []);

  return <AuthContext.Provider value={{ admin, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
