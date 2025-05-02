import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaWifi, FaSync, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { TbWifiOff } from 'react-icons/tb';
import { useTheme } from '../context/ThemeContext';
import { syncOfflineOperations, hideNetworkNotification } from '../store/slices/networkSlice';

/**
 * Компонент для отображения статуса сети и уведомлений о состоянии соединения
 */
const NetworkStatusBar = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const { 
    isOnline, 
    notification, 
    offlineOperationsCount
  } = useSelector(state => state.network);
  
  // Следим за изменениями в уведомлениях
  useEffect(() => {
    if (notification) {
      setVisible(true);
      
      // Если уведомление должно скрыться автоматически
      if (notification.autoHide && notification.timeout) {
        const timer = setTimeout(() => {
          setVisible(false);
          
          // Скрываем уведомление полностью после анимации
          setTimeout(() => {
            dispatch(hideNetworkNotification());
          }, 300);
        }, notification.timeout);
        
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [notification, dispatch]);
  
  // Если нет уведомления, ничего не отображаем
  if (!notification) {
    return null;
  }
  
  // Определяем иконку в зависимости от типа уведомления
  const getIcon = () => {
    switch (notification.type) {
      case 'online':
        return <FaWifi size={18} />;
      case 'offline':
        return <TbWifiOff size={18} />;
      case 'sync':
        return <FaSync size={18} className="rotating" />;
      case 'sync_complete':
        return <FaCheck size={18} />;
      default:
        return <FaExclamationTriangle size={18} />;
    }
  };
  
  // Определяем цвет фона в зависимости от типа уведомления
  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'online':
        return theme?.colors?.success || '#28a745';
      case 'offline':
        return theme?.colors?.warning || '#ffc107';
      case 'sync':
        return theme?.colors?.info || '#17a2b8';
      case 'sync_complete':
        return theme?.colors?.success || '#28a745';
      default:
        return theme?.colors?.primary || '#4a3aff';
    }
  };
  
  // Обработчик нажатия на кнопку синхронизации
  const handleSyncClick = () => {
    if (!isOnline) {
      return;
    }
    
    dispatch(syncOfflineOperations());
  };
  
  // Обработчик закрытия уведомления
  const handleClose = () => {
    setVisible(false);
    
    setTimeout(() => {
      dispatch(hideNetworkNotification());
    }, 300);
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: getBackgroundColor(),
        color: 'white',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1050,
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            marginRight: '0.75rem',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {getIcon()}
        </div>
        <div>{notification.message}</div>
      </div>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Отображаем кнопку синхронизации только если оффлайн и есть данные для синхронизации */}
        {notification.type === 'offline' && offlineOperationsCount > 0 && (
          <button
            onClick={handleSyncClick}
            disabled={!isOnline}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: 'white',
              borderRadius: '0.25rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              marginRight: '0.75rem',
              cursor: isOnline ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              opacity: isOnline ? 1 : 0.6
            }}
          >
            <FaSync size={12} style={{ marginRight: '0.35rem' }} />
            Синхронизировать ({offlineOperationsCount})
          </button>
        )}
        
        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '1.2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '0 0.25rem',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = 1}
          onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default NetworkStatusBar;