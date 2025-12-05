import React, { useState, ReactNode } from 'react';
import { Box, Portal } from '@mantine/core';
import NotificationToast, { NotificationType } from './NotificationToast';
import { NotificationContext } from '../../context/NotificationContext';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const show = (title: string, message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, title, message, type }]);
  };

  const success = (title: string, message: string) => show(title, message, 'success');
  const error = (title: string, message: string) => show(title, message, 'error');

  return (
    <NotificationContext.Provider value={{ show, success, error }}>
      {children}
      <Portal>
        <Box 
            style={{ 
                position: 'fixed', 
                top: 20, 
                right: 20, 
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none' // Allow clicks to pass through empty space
            }}
        >
          {notifications.map((n) => (
            <NotificationToast 
                key={n.id}
                {...n}
                onClose={removeNotification}
            />
          ))}
        </Box>
      </Portal>
    </NotificationContext.Provider>
  );
};