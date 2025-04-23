import React, { useEffect, useState } from 'react';
import './Notification.css';

const Notification = ({ id, message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onClose(id);
        }, 300); // Задержка для завершения анимации исчезновения
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleCloseClick = () => {
    setVisible(false);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  return (
    <div className={`notification notification-${type} ${visible ? 'show' : 'hide'}`}>
      <div className="notification-content">
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={handleCloseClick}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default Notification;