import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../context/ThemeContext';
import { FaCheck } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ 
  notification, 
  onClick, 
  onMarkAsRead, 
  icon 
}) => {
  const theme = useTheme();
  
  // Format the time since notification was created
  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'recently';
    }
  };
  
  // Get background color based on notification type and read status
  const getBackgroundColor = () => {
    const isRead = notification.is_read;
    
    if (isRead) {
      return 'transparent';
    }
    
    return theme?.name === 'dark' 
      ? 'rgba(109, 97, 255, 0.1)' 
      : 'rgba(74, 58, 255, 0.05)';
  };
  
  // Get left border color based on notification priority
  const getBorderColor = () => {
    if (notification.priority === 'high') {
      return theme?.colors?.error || '#FF4D6A';
    }
    
    if (notification.priority === 'medium') {
      return theme?.colors?.warning || '#FFC240';
    }
    
    if (!notification.is_read) {
      return theme?.colors?.primary || '#4A3AFF';
    }
    
    return 'transparent';
  };
  
  // Handle mark as read click without propagation
  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    if (onMarkAsRead && !notification.is_read) {
      onMarkAsRead();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        padding: '1rem 1.25rem',
        borderBottom: `1px solid ${theme?.colors?.border}`,
        backgroundColor: getBackgroundColor(),
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'flex-start',
        borderLeft: `3px solid ${getBorderColor()}`,
      }}
    >
      {/* Left side: Icon */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: theme?.name === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '0.875rem',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      
      {/* Middle: Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: notification.is_read ? 400 : 600,
            fontSize: '0.9375rem',
            marginBottom: '0.25rem',
            color: notification.is_read ? theme?.colors?.textMedium : theme?.colors?.text
          }}
        >
          {notification.title}
        </div>
        
        <div
          style={{
            fontSize: '0.8125rem',
            color: theme?.colors?.textMedium,
            marginBottom: '0.5rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {notification.message}
        </div>
        
        <div
          style={{
            fontSize: '0.75rem',
            color: theme?.colors?.textLight,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {formatTimeAgo(notification.created_at)}
          
          {!notification.is_read && (
            <button
              onClick={handleMarkAsRead}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: theme?.colors?.primary,
                marginLeft: 'auto',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <FaCheck size={10} style={{ marginRight: '0.25rem' }} />
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    notification_type: PropTypes.string.isRequired,
    is_read: PropTypes.bool.isRequired,
    created_at: PropTypes.string.isRequired,
    priority: PropTypes.string,
    data: PropTypes.object,
    related_object_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    related_object_type: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  icon: PropTypes.node
};

export default NotificationItem;