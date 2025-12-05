import { createContext, useContext } from 'react';
import { NotificationType } from '../components/Layout/NotificationToast';

export interface NotificationContextType {
  show: (title: string, message: string, type?: NotificationType) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
}

// Export the Context so the Provider can use it
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Export the Hook for consumers (Sidebar, Editor, etc.)
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};