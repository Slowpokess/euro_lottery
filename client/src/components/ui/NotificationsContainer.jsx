import React from 'react';
import Notification from './Notification';
import { useUI } from '../../contexts';
import './NotificationsContainer.css';

const NotificationsContainer = () => {
  const { notifications, removeNotification } = useUI();

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationsContainer;