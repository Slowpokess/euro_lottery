import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';
import { ErrorMessages, getErrorMessage } from '../../utils/errorMessages';
import './AdminErrorBoundary.css';

/**
 * Специализированный компонент ErrorBoundary для админ-панели
 * Включает дополнительные функции для сообщения об ошибках в админ-панели
 */
const AdminErrorBoundary = ({ children, onError, ...props }) => {
  // Обработчик ошибок для админ-панели
  const handleError = (error, errorInfo, errorId) => {
    // Логируем информацию об ошибке в админ-панели
    console.error(`[AdminErrorBoundary] Ошибка в админ-панели (ID: ${errorId}):`, error);
    
    // Дополнительное логирование для административных ошибок
    if (process.env.NODE_ENV === 'production') {
      // Здесь могла бы быть интеграция с более продвинутым логированием
      // для ошибок в админ-панели, например отправка в Sentry или другой сервис
    }
    
    // Вызываем пользовательский обработчик, если предоставлен
    if (onError) {
      onError(error, errorInfo, errorId);
    }
  };
  
  // Кастомный компонент для отображения ошибки в админ-панели
  const AdminErrorFallback = ({ error, errorInfo, errorId, resetError }) => (
    <div className="admin-error">
      <div className="admin-error-content">
        <h2>Ошибка в административной панели</h2>
        <p>
          {ErrorMessages.ADMIN_ERROR || 'Произошла ошибка при работе с административной панелью.'}
        </p>
        
        {errorId && (
          <p className="admin-error-id">
            Код ошибки: <strong>{errorId}</strong>
          </p>
        )}
        
        <div className="admin-error-actions">
          <button 
            className="btn btn-primary mr-2" 
            onClick={resetError}
          >
            Попробовать снова
          </button>
          
          <button 
            className="btn btn-outline-secondary" 
            onClick={() => window.location.href = '/admin/dashboard'}
          >
            Вернуться на панель управления
          </button>
        </div>
        
        {process.env.NODE_ENV !== 'production' && (
          <details className="admin-error-details">
            <summary>Технические детали</summary>
            <div className="admin-error-stack">
              <p><strong>Ошибка:</strong> {error ? getErrorMessage(error) : 'Неизвестная ошибка'}</p>
              {errorInfo && errorInfo.componentStack && (
                <pre>{errorInfo.componentStack}</pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
  
  return (
    <ErrorBoundary 
      onError={handleError} 
      FallbackComponent={AdminErrorFallback}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
};

AdminErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func
};

export default AdminErrorBoundary;