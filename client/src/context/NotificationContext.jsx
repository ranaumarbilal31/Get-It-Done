import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
const Context = createContext(null);
export function NotificationProvider({ children }) {
  const { user } = useAuth(),
    { socket } = useSocket();
  const [notifications, setNotifications] = useState([]),
    [toast, setToast] = useState(null);
  const timer = useRef(null);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const fetchNotifications = async () => {
    const id = user?.id;
    if (!id) return;
    try {
      const res = await api.get('/notifications');
      if (currentUser.current === id) setNotifications(res.data.notifications || []);
    } catch {
      /* Keep last successful result. */
    }
  };
  useEffect(() => {
    setNotifications([]);
    setToast(null);
    clearTimeout(timer.current);
    fetchNotifications();
    return () => clearTimeout(timer.current);
  }, [user?.id]);
  useEffect(() => {
    if (!socket) return;
    const receive = (n) => {
      setNotifications((prev) => (prev.some((item) => item.id === n.id) ? prev : [n, ...prev]));
      setToast(n);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 5000);
    };
    socket.on('notification_received', receive);
    return () => {
      socket.off('notification_received', receive);
      clearTimeout(timer.current);
    };
  }, [socket]);
  const markAsRead = async (id) => {
    try {
      await api.patch('/notifications/' + id + '/read');
      setNotifications((prev) =>
        prev.map((n) => (id === 'all' || n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {}
  };
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return (
    <Context.Provider
      value={{ notifications, unreadCount, markAsRead, refreshNotifications: fetchNotifications }}
    >
      {children}
      {toast && (
        <div role="status" className="notification-toast">
          <strong>{toast.title}</strong>
          <p>{toast.message}</p>
          <button aria-label="Dismiss notification" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useNotification = () => useContext(Context);
