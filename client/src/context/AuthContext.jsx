import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/client';
const Context = createContext(null);
const readToken = () => {
  try {
    return (
      localStorage.getItem('getitdone_token') || localStorage.getItem('taskconnect_token') || null
    );
  } catch {
    return null;
  }
};
const saveToken = (token) => {
  try {
    for (const key of ['getitdone_token', 'taskconnect_token'])
      token ? localStorage.setItem(key, token) : localStorage.removeItem(key);
  } catch {}
};
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [token, setToken] = useState(null),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const expire = () => {
    generation.current++;
    saveToken(null);
    setToken(null);
    setUser(null);
    setLoading(false);
  };
  useEffect(() => {
    setToken(readToken());
    setReady(true);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const current = ++generation.current;
    const controller = new AbortController();
    setLoading(true);
    api
      .get('/auth/me', { signal: controller.signal })
      .then((res) => {
        if (current === generation.current) setUser(res.data.user);
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.response?.status === 401) expire();
      })
      .finally(() => {
        if (current === generation.current) setLoading(false);
      });
    return () => controller.abort();
  }, [token, ready]);
  const authenticate = async (endpoint, body) => {
    const res = await api.post(endpoint, body);
    generation.current++;
    saveToken(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setLoading(false);
    return res.data.user;
  };
  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (name, email, password) =>
    authenticate('/auth/register', { name, email, password });
  const logout = async () => {
    expire();
    try {
      await api.post('/auth/logout');
    } catch {}
  };
  const updateProfile = async (form) => {
    const res = await api.put('/auth/profile', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setUser(res.data.user);
    return res.data.user;
  };
  const submitVerification = async (form) => {
    const res = await api.post('/auth/verify-id', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setUser((prev) => ({ ...prev, verificationStatus: 'PENDING' }));
    return res.data;
  };
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {}
  };
  return (
    <Context.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
        updateProfile,
        submitVerification,
        refreshUser,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
