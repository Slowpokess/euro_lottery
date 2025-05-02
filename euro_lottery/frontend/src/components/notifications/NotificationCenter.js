import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Offcanvas, Badge, Nav, Button, Spinner } from 'react-bootstrap';
import { 
  FaBell, FaCheckCircle, FaTimesCircle, FaTicketAlt, 
  FaTrophy, FaMoneyBillWave, FaInfoCircle, 
  FaTimes, FaCheck, FaExclamationTriangle
} from 'react-icons/fa';
import { HiSpeakerphone } from 'react-icons/hi';

import { useTheme } from '../../context/ThemeContext';
import useApi from '../../hooks/useApi';
import apiService from '../../services/api';
import { fetchUserNotifications, markNotificationAsRead } from '../../store/slices/notificationSlice';
import NotificationItem from './NotificationItem';
import PremiumButton from '../PremiumButton';

// Notification center component with sliding panel
const NotificationCenter = () => {
  const [show, setShow] = useState(false);
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, execute } = useApi();
  
  // Get notifications from Redux store
  const { 
    notifications, 
    unreadCount, 
    loading: notificationsLoading 
  } = useSelector(state => state.notifications);
  
  // Handle opening notification center
  const handleShow = () => {
    setShow(true);
    // Fetch latest notifications
    dispatch(fetchUserNotifications());
  };
  
  // Handle closing notification center
  const handleClose = () => setShow(false);
  
  // Mark notification as read
  const handleMarkAsRead = useCallback((notificationId) => {
    execute(
      () => apiService.user.markNotificationRead(notificationId),
      {
        onSuccess: () => {
          dispatch(markNotificationAsRead(notificationId));
        },
        showLoader: false
      }
    );
  }, [dispatch, execute]);
  
  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(() => {
    execute(
      () => apiService.user.markAllNotificationsRead(),
      {
        onSuccess: () => {
          // Refresh notifications
          dispatch(fetchUserNotifications());
        }
      }
    );
  }, [dispatch, execute]);
  
  // Navigation based on notification type
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read
    handleMarkAsRead(notification.id);
    
    // Navigate based on type and related object
    switch (notification.notification_type) {
      case 'draw_upcoming':
      case 'draw_results':
        if (notification.related_object_type === 'draw' && notification.related_object_id) {
          navigate(`/draws/${notification.related_object_id}`);
        } else {
          navigate('/draws');
        }
        break;
        
      case 'winning':
        if (notification.related_object_type === 'winning_ticket' && notification.related_object_id) {
          navigate(`/my-tickets/${notification.data?.ticket_id || ''}`);
        } else {
          navigate('/my-tickets');
        }
        break;
        
      case 'deposit_success':
      case 'deposit_failed':
      case 'withdrawal_approved':
      case 'withdrawal_processed':
      case 'withdrawal_failed':
        navigate('/wallet');
        break;
        
      case 'ticket_purchased':
        if (notification.data?.ticket_id) {
          navigate(`/my-tickets/${notification.data.ticket_id}`);
        } else {
          navigate('/my-tickets');
        }
        break;
        
      case 'promo':
        if (notification.data?.cta_url) {
          window.open(notification.data.cta_url, '_blank');
        }
        break;
        
      default:
        // For system or other notifications
        break;
    }
    
    // Close the panel
    handleClose();
  }, [handleMarkAsRead, navigate, handleClose]);
  
  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'draw_upcoming':
      case 'draw_results':
        return <FaTicketAlt />;
      case 'winning':
        return <FaTrophy style={{ color: theme?.colors?.success }} />;
      case 'deposit_success':
        return <FaCheckCircle style={{ color: theme?.colors?.success }} />;
      case 'deposit_failed':
      case 'withdrawal_failed':
        return <FaTimesCircle style={{ color: theme?.colors?.error }} />;
      case 'withdrawal_approved':
      case 'withdrawal_processed':
        return <FaMoneyBillWave style={{ color: theme?.colors?.tertiary }} />;
      case 'ticket_purchased':
        return <FaTicketAlt style={{ color: theme?.colors?.primary }} />;
      case 'promo':
        return <HiSpeakerphone style={{ color: theme?.colors?.secondary }} />;
      case 'system':
        return <FaExclamationTriangle style={{ color: theme?.colors?.warning }} />;
      default:
        return <FaInfoCircle />;
    }
  };
  
  return (
    <>
      {/* Notification Bell Button */}
      <Nav.Item>
        <Button
          variant={theme?.name === 'dark' ? 'outline-light' : 'outline-dark'}
          size="sm"
          className="position-relative rounded-circle p-2"
          onClick={handleShow}
          aria-label="Notifications"
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: theme?.name === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            color: theme?.colors?.text
          }}
        >
          <FaBell size={18} />
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              pill 
              className="position-absolute"
              style={{
                top: 0,
                right: 0,
                transform: 'translate(25%, -25%)',
                minWidth: '1.2rem',
                height: '1.2rem',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 0.3rem'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </Nav.Item>
      
      {/* Notifications Panel */}
      <Offcanvas 
        show={show} 
        onHide={handleClose} 
        placement="end"
        style={{
          width: '350px',
          maxWidth: '100vw',
          backgroundColor: theme?.colors?.background,
          color: theme?.colors?.text,
          borderLeft: `1px solid ${theme?.colors?.border}`,
          zIndex: theme?.zIndex?.dropdown
        }}
      >
        <Offcanvas.Header 
          style={{
            borderBottom: `1px solid ${theme?.colors?.border}`,
            padding: '1rem 1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <Offcanvas.Title
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaBell style={{ color: theme?.colors?.primary }} />
              Notifications
              {unreadCount > 0 && (
                <Badge 
                  bg="danger" 
                  pill
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  {unreadCount} new
                </Badge>
              )}
            </Offcanvas.Title>
            
            <Button
              variant="link"
              size="sm"
              onClick={handleClose}
              aria-label="Close"
              style={{ 
                color: theme?.colors?.textMedium,
                textDecoration: 'none',
                padding: '5px'
              }}
            >
              <FaTimes size={16} />
            </Button>
          </div>
        </Offcanvas.Header>
        
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1.25rem',
            borderBottom: `1px solid ${theme?.colors?.border}`,
            backgroundColor: theme?.name === 'dark' 
              ? 'rgba(255, 255, 255, 0.03)' 
              : 'rgba(0, 0, 0, 0.02)'
          }}
        >
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: theme?.colors?.textMedium
            }}
          >
            {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
          </div>
          
          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={loading}
              style={{
                fontSize: '0.75rem',
                padding: '0',
                color: theme?.colors?.primary,
                textDecoration: 'none'
              }}
            >
              <FaCheck size={10} className="me-1" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <Offcanvas.Body 
          style={{ 
            padding: 0,
            overflowX: 'hidden'
          }}
        >
          {/* Loading state */}
          {notificationsLoading && (
            <div 
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                color: theme?.colors?.textMedium
              }}
            >
              <Spinner 
                animation="border" 
                size="sm" 
                style={{ color: theme?.colors?.primary }}
              />
              <span style={{ marginLeft: '0.75rem' }}>Loading notifications...</span>
            </div>
          )}
          
          {/* Empty state */}
          {!notificationsLoading && notifications.length === 0 && (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: theme?.colors?.textMedium
              }}
            >
              <div 
                style={{ 
                  marginBottom: '1rem',
                  fontSize: '2rem',
                  color: theme?.colors?.textLight
                }}
              >
                <FaBell />
              </div>
              <p>You don't have any notifications yet.</p>
            </div>
          )}
          
          {/* Notification list */}
          {!notificationsLoading && notifications.length > 0 && (
            <div>
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  icon={getNotificationIcon(notification.notification_type)}
                />
              ))}
            </div>
          )}
          
          {/* Settings button at the bottom */}
          <div
            style={{
              padding: '1rem',
              textAlign: 'center',
              borderTop: `1px solid ${theme?.colors?.border}`,
              position: 'sticky',
              bottom: 0,
              backgroundColor: theme?.colors?.background,
              zIndex: 1
            }}
          >
            <PremiumButton
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                navigate('/profile/notification-settings');
                handleClose();
              }}
            >
              Notification Settings
            </PremiumButton>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default NotificationCenter;