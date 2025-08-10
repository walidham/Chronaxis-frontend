import { useState } from 'react';

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const showSuccess = (message) => addNotification(message, 'success');
  const showError = (message) => addNotification(message, 'error');
  const showWarning = (message) => addNotification(message, 'warning');
  const showInfo = (message) => addNotification(message, 'info');

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};