import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In dev, Socket connects to backend port 5000 directly or via Vite proxy
    const socketServerUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
    const newSocket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.IO connected:', newSocket.id);
      setIsConnected(true);
      if (user?.id) {
        newSocket.emit('join_user', user.id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // When user changes / logs in, join their private channel
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join_user', user.id);
    }
  }, [socket, isConnected, user?.id]);

  const joinTask = (taskId) => {
    if (socket && taskId) {
      socket.emit('join_task', taskId);
    }
  };

  const leaveTask = (taskId) => {
    if (socket && taskId) {
      socket.emit('leave_task', taskId);
    }
  };

  const sendMessage = ({ taskId, senderId, receiverId, content }) => {
    if (socket) {
      socket.emit('send_message', { taskId, senderId, receiverId, content });
    }
  };

  const startTyping = (taskId, userName) => {
    if (socket) {
      socket.emit('typing_start', { taskId, userName });
    }
  };

  const stopTyping = (taskId) => {
    if (socket) {
      socket.emit('typing_stop', { taskId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinTask,
        leaveTask,
        sendMessage,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
