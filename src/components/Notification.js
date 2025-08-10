import React, { useState, useEffect } from 'react';
import './Notification.css';

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`notification ${type} ${isVisible ? 'show' : 'hide'}`}>
      <span className="notification-icon">{getIcon()}</span>
      <span className="notification-message">{message}</span>
      <button className="notification-close" onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }}>
        ×
      </button>
    </div>
  );
};

export default Notification;