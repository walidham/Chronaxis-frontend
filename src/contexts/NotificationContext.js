import React, { createContext, useContext } from 'react';
import { useNotification } from '../hooks/useNotification';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext doit être utilisé dans un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const notification = useNotification();
  
  return (
    <NotificationContext.Provider value={notification}>
      {children}
    </NotificationContext.Provider>
  );
};