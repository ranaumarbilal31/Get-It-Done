import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
const SocketContext = createContext(null);
export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    if (!token || !user) {
      setSocket(null);
      setIsConnected(false);
      return;
    }
    const origin =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? 'http://localhost:5000'
        : 'https://taskconnect-api.onrender.com');
    let active = true;
    let connection;
    import('socket.io-client')
      .then(({ io }) => {
        if (!active) return;
        connection = io(origin.replace(/\/+$/, ''), {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
        });
        connection.on('connect', () => setIsConnected(true));
        connection.on('disconnect', () => setIsConnected(false));
        connection.on('connect_error', () => setIsConnected(false));
        setSocket(connection);
      })
      .catch(() => {
        if (active) setIsConnected(false);
      });
    return () => {
      active = false;
      connection?.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user?.id]);
  const joinTask = useCallback((id) => socket?.emit('join_task', id), [socket]);
  const leaveTask = useCallback((id) => socket?.emit('leave_task', id), [socket]);
  const sendMessage = useCallback((data) => socket?.emit('send_message', data), [socket]);
  const startTyping = useCallback((taskId) => socket?.emit('typing_start', { taskId }), [socket]);
  const stopTyping = useCallback((taskId) => socket?.emit('typing_stop', { taskId }), [socket]);
  return (
    <SocketContext.Provider
      value={{ socket, isConnected, joinTask, leaveTask, sendMessage, startTyping, stopTyping }}
    >
      {children}
    </SocketContext.Provider>
  );
};
export const useSocket = () => useContext(SocketContext);
