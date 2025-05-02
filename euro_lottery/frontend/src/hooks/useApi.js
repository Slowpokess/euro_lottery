import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../store/slices/authSlice';
import { showNetworkStatusNotification } from '../store/slices/networkSlice';
import cacheService from '../services/cacheService';

/**
 * Хук для работы с API запросами
 * Обеспечивает управление состояниями загрузки, обработку ошибок и отображение индикаторов
 * @returns {Object} Объект с методами и состояниями для работы с API
 */
const useApi = () => {
  // Состояния загрузки и ошибок
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const loadingRef = useRef({}); // Отслеживание загрузки по ID запроса
  
  // Доступ к диспетчеру Redux и навигации
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Получение статуса сети из Redux
  const { isOnline } = useSelector(state => state.network);
  
  // Глобальный счетчик выполняемых запросов для отображения общего индикатора
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  
  /**
   * Обновляет счетчик активных запросов
   * @param {number} delta - Изменение счетчика (+1 или -1)
   */
  const updateRequestsCount = useCallback((delta) => {
    setActiveRequestsCount(prev => Math.max(0, prev + delta));
  }, []);
  
  /**
   * Создает уникальный ID для запроса
   * @returns {string} - Уникальный ID
   */
  const generateRequestId = useCallback(() => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  /**
   * Выполняет API запрос с обработкой состояний и ошибок
   * @param {Function} apiCall - Функция API запроса
   * @param {Object} options - Опции запроса
   * @returns {Promise} - Результат запроса
   */
  const execute = useCallback(
    async (apiCall, {
      onSuccess,
      onError,
      showLoader = true,
      resetStates = true,
      showGlobalLoader = true,
      logoutOnError = false,
      useOfflineFallback = true,
      retryCount = 0,
      requestId = null
    } = {}) => {
      // Создаем ID запроса если не предоставлен
      const reqId = requestId || generateRequestId();
      
      try {
        // Сбрасываем предыдущие состояния
        if (resetStates) {
          setSuccess(false);
          setError(null);
        }
        
        // Устанавливаем состояние загрузки
        if (showLoader) {
          setLoading(true);
          loadingRef.current[reqId] = true;
        }
        
        // Увеличиваем счетчик активных запросов для глобального индикатора
        if (showGlobalLoader) {
          updateRequestsCount(1);
        }
        
        // Выполняем запрос
        const response = await apiCall();
        
        // Обработка результата
        const result = response.data;
        
        // Проверяем, был ли ответ получен из кэша
        const isFromCache = response._fromCache || false;
        
        // Обновляем индикатор загрузки
        if (showLoader) {
          setLoading(false);
          delete loadingRef.current[reqId];
        }
        
        // Уменьшаем счетчик активных запросов
        if (showGlobalLoader) {
          updateRequestsCount(-1);
        }
        
        // Устанавливаем успех
        setSuccess(true);
        
        // Вызываем callback с результатом
        if (onSuccess) {
          onSuccess(result, { fromCache: isFromCache });
        }
        
        return result;
      } catch (err) {
        // Если запрос поставлен в очередь для оффлайн-обработки
        if (err._offlineQueued) {
          if (showLoader) {
            setLoading(false);
            delete loadingRef.current[reqId];
          }
          
          if (showGlobalLoader) {
            updateRequestsCount(-1);
          }
          
          // Уведомляем о добавлении в очередь
          dispatch(showNetworkStatusNotification(false));
          
          // Возвращаем успешный результат с информацией о постановке в очередь
          const queuedResult = {
            status: 'queued',
            message: 'Запрос будет выполнен, когда устройство подключится к интернету'
          };
          
          if (onSuccess) {
            onSuccess(queuedResult, { queued: true });
          }
          
          return queuedResult;
        }
        
        // Обработка ошибок оффлайн-режима
        if (!isOnline || err.isOffline || (err.message && (
            err.message.includes('network') || 
            err.message.includes('timeout') || 
            err.message.includes('connection')
          ))) {
          if (showLoader) {
            setLoading(false);
            delete loadingRef.current[reqId];
          }
          
          if (showGlobalLoader) {
            updateRequestsCount(-1);
          }
          
          // Проверяем есть ли кэшированные данные для запроса GET
          if (useOfflineFallback && err.config && err.config.method === 'get') {
            try {
              const endpoint = err.config.url.replace(err.config.baseURL, '');
              const cachedData = await cacheService.getCache(endpoint, err.config.params);
              
              if (cachedData) {
                // Показываем уведомление о работе в оффлайн-режиме
                dispatch(showNetworkStatusNotification(false));
                
                // Устанавливаем успех, т.к. у нас есть данные из кэша
                setSuccess(true);
                
                if (onSuccess) {
                  onSuccess(cachedData, { 
                    fromCache: true, 
                    offline: true 
                  });
                }
                
                return cachedData;
              }
            } catch (cacheError) {
              console.error('Error retrieving from cache:', cacheError);
            }
          }
          
          // Если нет кэшированных данных, устанавливаем ошибку оффлайн-режима
          const offlineError = {
            message: 'Нет подключения к интернету. Проверьте подключение и повторите попытку.'
          };
          
          setError(offlineError);
          
          if (onError) {
            onError(offlineError, err);
          }
          
          throw Object.assign(new Error(offlineError.message), { 
            isOffline: true,
            originalError: err
          });
        }
        
        // Общая обработка ошибок
        if (showLoader) {
          setLoading(false);
          delete loadingRef.current[reqId];
        }
        
        if (showGlobalLoader) {
          updateRequestsCount(-1);
        }
        
        // Если ошибка авторизации и указана опция logoutOnError
        if (logoutOnError && err.response && err.response.status === 401) {
          dispatch(logoutUser());
          navigate('/login');
        }
        
        // Получаем сообщение об ошибке
        const errorMessage = getErrorMessage(err);
        
        // Если указано количество повторов и ошибка не связана с авторизацией
        if (retryCount > 0 && (!err.response || err.response.status !== 401)) {
          console.log(`Retrying API call (${retryCount} attempts left)...`);
          
          return execute(apiCall, {
            onSuccess,
            onError,
            showLoader,
            resetStates: false, // Не сбрасываем состояния при повторе
            showGlobalLoader,
            logoutOnError,
            useOfflineFallback,
            retryCount: retryCount - 1,
            requestId: reqId
          });
        }
        
        // Устанавливаем сообщение об ошибке
        setError(errorMessage);
        
        // Вызываем callback с ошибкой
        if (onError) {
          onError(errorMessage, err);
        }
        
        throw err;
      }
    },
    [dispatch, generateRequestId, isOnline, navigate, updateRequestsCount]
  );
  
  /**
   * Сбрасывает все состояния
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    loadingRef.current = {};
    setActiveRequestsCount(0);
  }, []);
  
  /**
   * Извлекает сообщение об ошибке из объекта ошибки
   * @param {Error} error - Объект ошибки
   * @returns {Object} - Структурированная ошибка
   */
  const getErrorMessage = (error) => {
    // Оффлайн ошибка
    if (error.isOffline || (error.message && (
        error.message.includes('network') || 
        error.message.includes('connection')
    ))) {
      return {
        message: 'Нет подключения к интернету. Проверьте подключение и повторите попытку.',
        isOffline: true
      };
    }
    
    // Таймаут
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      return { 
        message: 'Время ожидания истекло. Пожалуйста, повторите попытку позже.',
        isTimeout: true
      };
    }
    
    // Ошибка сервера
    if (error.response) {
      const { data, status } = error.response;
      
      // Проверяем различные форматы ошибок API
      if (data) {
        // Строка с сообщением об ошибке
        if (typeof data === 'string') {
          return { message: data, status };
        }
        
        // Поле detail с сообщением
        if (data.detail) {
          return { message: data.detail, status, code: data.code };
        } 
        
        // Поле message с сообщением
        if (data.message) {
          return { message: data.message, status, code: data.code };
        }
        
        // Массив не-полевых ошибок
        if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          return { message: data.non_field_errors[0], status };
        }
        
        // Проверка вложенных полей с ошибками для форм
        if (typeof data === 'object' && data !== null) {
          // Перебираем ключи объекта
          for (const key of Object.keys(data)) {
            const value = data[key];
            
            // Если значение - массив, берем первый элемент
            if (Array.isArray(value) && value.length > 0) {
              return { 
                message: `${key}: ${value[0]}`,
                field: key,
                fieldError: value[0],
                status
              };
            }
            
            // Если значение - объект, ищем ошибки внутри
            if (value && typeof value === 'object') {
              for (const nestedKey of Object.keys(value)) {
                if (Array.isArray(value[nestedKey]) && value[nestedKey].length > 0) {
                  return { 
                    message: `${key}.${nestedKey}: ${value[nestedKey][0]}`,
                    field: `${key}.${nestedKey}`,
                    fieldError: value[nestedKey][0],
                    status
                  };
                }
              }
            }
          }
        }
      }
      
      // Стандартные сообщения по HTTP статусам
      switch (status) {
        case 400:
          return { message: 'Неверный запрос. Пожалуйста, проверьте данные.', status };
        case 401:
          return { message: 'Требуется авторизация. Пожалуйста, войдите в систему.', status };
        case 403:
          return { message: 'Доступ запрещен. У вас нет прав для выполнения этой операции.', status };
        case 404:
          return { message: 'Запрашиваемый ресурс не найден.', status };
        case 409:
          return { message: 'Конфликт при обработке запроса. Пожалуйста, проверьте данные.', status };
        case 422:
          return { message: 'Ошибка проверки данных. Пожалуйста, исправьте ошибки в форме.', status };
        case 429:
          return { message: 'Слишком много запросов. Пожалуйста, повторите попытку позже.', status };
        case 500:
          return { message: 'Внутренняя ошибка сервера. Пожалуйста, повторите попытку позже.', status };
        case 502:
        case 503:
        case 504:
          return { message: 'Сервис временно недоступен. Пожалуйста, повторите попытку позже.', status };
        default:
          return { message: `Ошибка сервера (код ${status}).`, status };
      }
    } 
    
    // Ошибка запроса (не получен ответ)
    if (error.request) {
      return { 
        message: 'Не удалось получить ответ от сервера. Пожалуйста, проверьте подключение.',
        isConnectionError: true
      };
    }
    
    // Другие ошибки
    return { 
      message: error.message || 'Произошла непредвиденная ошибка. Пожалуйста, повторите попытку.',
      isUnknown: true
    };
  };
  
  // Очистка индикаторов загрузки при размонтировании компонента
  useEffect(() => {
    return () => {
      loadingRef.current = {};
      setActiveRequestsCount(0);
    };
  }, []);
  
  return {
    loading,
    error,
    success,
    activeRequestsCount,
    execute,
    reset,
    setError,
    isLoading: (reqId) => !!loadingRef.current[reqId],
    setLocalLoading: (reqId, isLoading) => {
      if (isLoading) {
        loadingRef.current[reqId] = true;
      } else {
        delete loadingRef.current[reqId];
      }
    }
  };
};

export default useApi;