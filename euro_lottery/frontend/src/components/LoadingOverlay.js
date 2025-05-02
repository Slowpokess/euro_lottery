import React, { useContext, createContext, useReducer, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext';

// Context для глобального состояния загрузки
const LoadingContext = createContext();

// Начальное состояние
const initialState = {
  globalCount: 0,
  pendingRequests: {},
  showGlobalSpinner: false,
  showMinimalIndicator: false,
  latestRequestId: null
};

// Reducer для обработки действий
function loadingReducer(state, action) {
  switch (action.type) {
    case 'START_LOADING': {
      const { id, global = true, minimal = false, text } = action.payload;
      
      // Добавляем запрос в список ожидающих
      const pendingRequests = {
        ...state.pendingRequests,
        [id]: { text, timestamp: Date.now(), global, minimal }
      };
      
      // Увеличиваем глобальный счетчик только если запрос помечен как глобальный
      const globalCount = global ? state.globalCount + 1 : state.globalCount;
      
      return {
        ...state,
        globalCount,
        pendingRequests,
        showGlobalSpinner: globalCount > 0,
        showMinimalIndicator: globalCount > 0 || Object.keys(pendingRequests).some(key => pendingRequests[key].minimal),
        latestRequestId: id
      };
    }
    
    case 'STOP_LOADING': {
      const { id } = action.payload;
      
      // Если запроса не существует, ничего не делаем
      if (!state.pendingRequests[id]) {
        return state;
      }
      
      // Получаем информацию о запросе
      const request = state.pendingRequests[id];
      
      // Удаляем запрос из списка ожидающих
      const pendingRequests = { ...state.pendingRequests };
      delete pendingRequests[id];
      
      // Уменьшаем глобальный счетчик только если запрос был глобальным
      const globalCount = request.global ? Math.max(0, state.globalCount - 1) : state.globalCount;
      
      // Находим новый последний запрос
      const pendingIds = Object.keys(pendingRequests);
      const latestId = pendingIds.length > 0 
        ? pendingIds.sort((a, b) => 
            pendingRequests[b].timestamp - pendingRequests[a].timestamp
          )[0] 
        : null;
        
      return {
        ...state,
        globalCount,
        pendingRequests,
        showGlobalSpinner: globalCount > 0,
        showMinimalIndicator: globalCount > 0 || Object.keys(pendingRequests).some(key => pendingRequests[key].minimal),
        latestRequestId: latestId
      };
    }
    
    case 'RESET': {
      return initialState;
    }
    
    default:
      return state;
  }
}

/**
 * Provider компонент для управления индикаторами загрузки
 */
export const LoadingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(loadingReducer, initialState);
  
  const startLoading = (id, options = {}) => {
    dispatch({
      type: 'START_LOADING',
      payload: {
        id: id || `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...options
      }
    });
  };
  
  const stopLoading = (id) => {
    dispatch({
      type: 'STOP_LOADING',
      payload: { id }
    });
  };
  
  const resetLoading = () => {
    dispatch({ type: 'RESET' });
  };
  
  return (
    <LoadingContext.Provider
      value={{
        ...state,
        startLoading,
        stopLoading,
        resetLoading
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

/**
 * Хук для доступа к контексту загрузки
 */
export const useLoading = () => {
  const context = useContext(LoadingContext);
  
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  
  return context;
};

/**
 * Глобальный индикатор загрузки во весь экран
 */
export const GlobalLoadingOverlay = () => {
  const { showGlobalSpinner, pendingRequests, latestRequestId } = useLoading();
  const theme = useTheme();
  
  // Если нет активных запросов, не показываем оверлей
  if (!showGlobalSpinner) {
    return null;
  }
  
  // Получаем текст для текущего запроса
  const loadingText = latestRequestId && pendingRequests[latestRequestId]?.text 
    ? pendingRequests[latestRequestId].text 
    : 'Загрузка...';
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1060,
        backdropFilter: 'blur(3px)'
      }}
    >
      <Spinner
        animation="border"
        role="status"
        style={{
          width: '5rem',
          height: '5rem',
          borderWidth: '0.4rem',
          color: theme?.colors?.primary || '#4a3aff'
        }}
      />
      
      <div
        style={{
          marginTop: '1rem',
          color: 'white',
          fontSize: '1.25rem',
          fontWeight: 500,
          textAlign: 'center',
          maxWidth: '80%'
        }}
      >
        {loadingText}
      </div>
    </div>
  );
};

/**
 * Минимальный индикатор загрузки (например, в шапке)
 */
export const MinimalLoadingIndicator = ({ position = 'top-right' }) => {
  const { showMinimalIndicator } = useLoading();
  const theme = useTheme();
  
  if (!showMinimalIndicator) {
    return null;
  }
  
  // Определяем позицию индикатора
  let positionStyle = {};
  
  switch (position) {
    case 'top-left':
      positionStyle = { top: '1rem', left: '1rem' };
      break;
    case 'top-right':
      positionStyle = { top: '1rem', right: '1rem' };
      break;
    case 'bottom-left':
      positionStyle = { bottom: '1rem', left: '1rem' };
      break;
    case 'bottom-right':
      positionStyle = { bottom: '1rem', right: '1rem' };
      break;
    default:
      positionStyle = { top: '1rem', right: '1rem' };
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyle,
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        background: theme?.colors?.cardBg || 'white',
        color: theme?.colors?.text || '#333',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.25rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
        fontSize: '0.85rem',
        opacity: 0.9,
        backdropFilter: 'blur(3px)'
      }}
    >
      <Spinner
        animation="border"
        role="status"
        size="sm"
        style={{
          marginRight: '0.5rem',
          color: theme?.colors?.primary || '#4a3aff'
        }}
      />
      <span>Загрузка...</span>
    </div>
  );
};

/**
 * Компонент для автоматического управления индикаторами
 * на основе счетчика активных запросов из useApi
 */
export const ApiLoadingMonitor = ({ apiCounter }) => {
  const { startLoading, stopLoading, resetLoading } = useLoading();
  
  // ID для глобального запроса API
  const loadingId = 'global-api-loading';
  
  // Следим за изменением счетчика запросов
  useEffect(() => {
    if (apiCounter > 0) {
      startLoading(loadingId, {
        global: false,
        minimal: true,
        text: 'Загрузка данных...'
      });
    } else {
      stopLoading(loadingId);
    }
    
    // Очистка при размонтировании
    return () => {
      stopLoading(loadingId);
    };
  }, [apiCounter, startLoading, stopLoading]);
  
  // Компонент ничего не рендерит
  return null;
};

/**
 * Компонент для отображения состояния загрузки в конкретном месте UI
 */
export const LoadingPlaceholder = ({ height, width, text, isLoading }) => {
  const theme = useTheme();
  
  if (!isLoading) {
    return null;
  }
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height || '200px',
        width: width || '100%',
        backgroundColor: theme?.colors?.cardBg || '#f8f9fa',
        borderRadius: '0.5rem',
        opacity: 0.8
      }}
    >
      <Spinner
        animation="border"
        role="status"
        style={{
          color: theme?.colors?.primary || '#4a3aff'
        }}
      />
      {text && (
        <div
          style={{
            marginTop: '1rem',
            color: theme?.colors?.textMedium || '#6c757d',
            fontSize: '0.875rem'
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;