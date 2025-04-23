import React from 'react';
import PropTypes from 'prop-types';
import { ErrorMessages, getErrorMessage } from '../utils/errorMessages';
import './ErrorBoundary.css';

/**
 * Компонент для перехвата необработанных ошибок в приложении
 * Предотвращает полный крах React-приложения при ошибках
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null,
      errorTimestamp: null
    };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние, чтобы при следующем рендере показать запасной UI
    return { 
      hasError: true, 
      error,
      errorTimestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Генерируем уникальный идентификатор ошибки
    const errorId = `ERR-${Math.random().toString(36).substring(2, 9)}`;
    
    // Логируем детали ошибки с более подробной информацией
    console.error(`[ErrorBoundary] Error ID: ${errorId}`);
    console.error(`[ErrorBoundary] Error:`, error);
    console.error(`[ErrorBoundary] Error Message:`, error?.message || 'No error message');
    console.error(`[ErrorBoundary] Error Stack:`, error?.stack || 'No stack trace');
    console.error(`[ErrorBoundary] Component Stack:`, errorInfo?.componentStack || 'No component stack');
    
    // Безопасно логируем информацию об ошибке
    if (typeof errorInfo === 'object' && errorInfo !== null) {
      try {
        Object.keys(errorInfo).forEach(key => {
          console.error(`[ErrorBoundary] ErrorInfo ${key}:`, errorInfo[key]);
        });
      } catch (logError) {
        console.error('[ErrorBoundary] Error accessing errorInfo properties', logError);
      }
    }
    
    // Обновляем состояние с дополнительной информацией об ошибке
    this.setState({ 
      errorInfo,
      errorId
    });
    
    // Вызываем пользовательский обработчик ошибок, если он предоставлен
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo, errorId);
      } catch (callbackError) {
        console.error('[ErrorBoundary] Error in onError callback:', callbackError);
      }
    }
  }
  
  /**
   * Метод для отправки ошибки в сервис мониторинга
   */
  reportErrorToMonitoringService(error, errorInfo, errorId) {
    // Здесь может быть интеграция с сервисом мониторинга ошибок, например Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     extra: {
    //       componentStack: errorInfo.componentStack,
    //       errorId,
    //       componentName: this.props.name || 'Unknown'
    //     }
    //   });
    // }
  }

  /**
   * Сбрасывает состояние ошибки и пытается восстановить компонент
   */
  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Вызываем пользовательский обработчик сброса, если он предоставлен
    if (this.props.onReset) {
      this.props.onReset();
    }
    
    // Опционально можно перезагрузить страницу, если требуется более глубокое восстановление
    if (this.props.reloadOnReset) {
      window.location.reload();
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId, errorTimestamp } = this.state;
    const { 
      children, 
      fallback, 
      showDetails, 
      fallbackRender,
      FallbackComponent 
    } = this.props;

    // Если ошибки нет, просто рендерим дочерние компоненты
    if (!hasError) {
      return children;
    }
    
    // Если предоставлен FallbackComponent, используем его
    if (FallbackComponent) {
      return (
        <FallbackComponent 
          error={error} 
          errorInfo={errorInfo}
          errorId={errorId}
          errorTimestamp={errorTimestamp} 
          resetError={this.resetError} 
        />
      );
    }
    
    // Если предоставлена функция рендера fallbackRender, используем ее
    if (fallbackRender) {
      return fallbackRender(error, errorInfo, this.resetError, errorId);
    }
    
    // Если предоставлен элемент fallback, используем его
    if (fallback) {
      return React.isValidElement(fallback) 
        ? fallback 
        : null;
    }
    
    // Иначе используем стандартный UI для ошибки
    return (
      <div className="error-boundary">
        <div className="error-boundary-content">
          <h2>Что-то пошло не так</h2>
          <p>{ErrorMessages.COMPONENT_ERROR || 'Произошла ошибка при отображении этой части приложения.'}</p>
          
          {errorId && (
            <p className="error-boundary-id">
              Код ошибки: <span>{errorId}</span>
            </p>
          )}
          
          {showDetails && (
            <details>
              <summary>Подробности ошибки</summary>
              <p>
                {error && (typeof error === 'string' 
                  ? error 
                  : getErrorMessage(error))}
              </p>
              <div>
                {errorInfo && errorInfo.componentStack && (
                  <pre>{errorInfo.componentStack}</pre>
                )}
              </div>
            </details>
          )}
          
          <button
            className="error-boundary-button"
            onClick={this.resetError}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  /** Дочерние компоненты */
  children: PropTypes.node.isRequired,
  
  /** Показывать ли детальную информацию об ошибке */
  showDetails: PropTypes.bool,
  
  /** Компонент, который будет отображен вместо стандартного UI ошибки */
  FallbackComponent: PropTypes.elementType,
  
  /** Функция рендера для отображения UI ошибки */
  fallbackRender: PropTypes.func,
  
  /** React элемент для отображения при ошибке */
  fallback: PropTypes.element,
  
  /** Обработчик, вызываемый при возникновении ошибки */
  onError: PropTypes.func,
  
  /** Обработчик, вызываемый при сбросе ошибки */
  onReset: PropTypes.func,
  
  /** Перезагружать ли страницу при сбросе ошибки */
  reloadOnReset: PropTypes.bool,
  
  /** Имя компонента для более информативных сообщений об ошибках */
  name: PropTypes.string
};

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development',
  reloadOnReset: false
};

export default ErrorBoundary;