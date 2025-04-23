import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Дополнительная проверка из localStorage для обратной совместимости
  useEffect(() => {
    // Проверяем наличие токена в localStorage
    const hasToken = localStorage.getItem('collider_auth_token') || false;
    const hasAdminData = localStorage.getItem('admin') || false;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('ProtectedRoute - Auth state:', { 
        isAuthenticated, 
        hasToken: Boolean(hasToken),
        hasAdminData: Boolean(hasAdminData) 
      });
    }
  }, [isAuthenticated]);

  if (loading) {
    // Пока идет проверка, показываем заглушку загрузки
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-content">
          <div className="admin-loading-logo">COLLIDER</div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Если не авторизован, перенаправляем на страницу логина
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Если пользователь авторизован, отображаем защищенный контент
  return children;
};

export default ProtectedRoute;