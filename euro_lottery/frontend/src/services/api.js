import axios from 'axios';
import store from '../store';
import { refreshToken } from '../store/slices/authSlice';
import cacheService from './cacheService';
import networkService from './networkService';
import { setNetworkStatus, updateOfflineOperationsCount } from '../store/slices/networkSlice';

// Инициализация сетевого сервиса
networkService.init();

// Базовые настройки API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const DEFAULT_TIMEOUT = 15000; // 15 секунд таймаут по умолчанию

// Основной API инстанс
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: DEFAULT_TIMEOUT,
});

// Перехватчик запросов для добавления аутентификации
api.interceptors.request.use(
  async (config) => {
    // Добавляем токен к запросу
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Добавляем метку времени для предотвращения кэширования браузером
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    // Проверяем возможность использования кэша для GET запросов
    if (config.method === 'get' && config.cache !== false) {
      // Добавляем флаг указывающий, что кэш был проверен
      config._cacheChecked = true;
      
      // Проверяем наличие в кэше
      const endpoint = config.url.replace(API_URL, '');
      const cachedData = await cacheService.getCache(endpoint, config.params);
      
      if (cachedData) {
        // Данные есть в кэше, прерываем HTTP запрос и возвращаем кэшированные данные
        const response = {
          data: cachedData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          _fromCache: true
        };
        
        // Эмулируем ответ, как будто он пришел от сервера
        return Promise.reject({ 
          config, 
          response, 
          isAxiosError: true,
          _fromCache: true 
        });
      }
    }
    
    // Проверяем онлайн-статус
    if (!navigator.onLine && config.method !== 'get') {
      // Добавляем в очередь оффлайн-операций, если это mutating запрос
      if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
        try {
          const endpoint = config.url.replace(API_URL, '');
          await cacheService.addOfflineOperation(
            endpoint,
            config.method.toUpperCase(),
            config.data
          );
          
          // Обновляем счетчик оффлайн-операций
          const pendingOps = await cacheService.getPendingOperations();
          store.dispatch(updateOfflineOperationsCount(pendingOps.length));
          
          // Возвращаем ошибку со специальным флагом для обработки оффлайн-режима
          const error = new Error('Request queued for offline processing');
          error._offlineQueued = true;
          return Promise.reject(error);
        } catch (error) {
          console.error('Failed to queue offline operation:', error);
        }
      }
      
      // Возвращаем ошибку сетевого соединения
      const networkError = new Error('No internet connection');
      networkError.isOffline = true;
      return Promise.reject(networkError);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик ответов для обработки ошибок и кэширования
api.interceptors.response.use(
  async (response) => {
    // Обновляем статус сети, если получен ответ
    store.dispatch(setNetworkStatus(true));
    
    // Кэшируем ответы GET запросов
    if (response.config.method === 'get' && response.status === 200 && response.config.cache !== false) {
      try {
        const endpoint = response.config.url.replace(API_URL, '');
        await cacheService.setCache(endpoint, response.data, response.config.params);
      } catch (error) {
        console.error('Error caching response:', error);
      }
    }
    
    return response;
  },
  async (error) => {
    // Если это кэшированный ответ, возвращаем его как успешный
    if (error._fromCache && error.response) {
      return error.response;
    }
    
    // Если запрос был добавлен в очередь оффлайн-операций, возвращаем специальный ответ
    if (error._offlineQueued) {
      return {
        data: { 
          status: 'queued', 
          message: 'Request queued for processing when online' 
        },
        status: 202, // Accepted
        headers: {},
        config: error.config,
        _offlineQueued: true
      };
    }
    
    // Если нет соединения, проверяем кэш или возвращаем оффлайн ошибку
    if (!navigator.onLine || (error.message && error.message.includes('network'))) {
      store.dispatch(setNetworkStatus(false));
      
      const config = error.config;
      
      // Для GET запросов попытаемся вернуть кэшированные данные, даже если они устарели
      if (config && config.method === 'get' && !config._cacheChecked) {
        try {
          const endpoint = config.url.replace(API_URL, '');
          const cachedData = await cacheService.getCache(endpoint, config.params);
          
          if (cachedData) {
            return {
              data: cachedData,
              status: 200,
              statusText: 'OK (From Cache)',
              headers: {},
              config,
              _fromCache: true
            };
          }
        } catch (cacheError) {
          console.error('Error retrieving from cache:', cacheError);
        }
      }
      
      // Если это не GET запрос, возвращаем ошибку сети
      error.isOffline = true;
      return Promise.reject(error);
    }
    
    // Попытка обновить токен при 401 ошибке (unauthorized) или 403 ошибке (forbidden)
    const originalRequest = error.config;
    
    // Предотвращаем бесконечный цикл обновления токена
    if (originalRequest && !originalRequest._retry &&
        error.response && (error.response.status === 401 || error.response.status === 403) &&
        localStorage.getItem('refreshToken')) {
      
      originalRequest._retry = true;
      
      try {
        // Проверяем, не происходит ли в данный момент обновление токена
        const state = store.getState();
        const isRefreshing = state.auth.tokenRefreshStatus === 'loading';
        
        if (!isRefreshing) {
          // Обновляем токен
          const result = await store.dispatch(refreshToken());
          
          // Проверяем успешность операции обновления токена
          if (refreshToken.fulfilled.match(result)) {
            // Обновляем заголовок авторизации
            const newToken = localStorage.getItem('accessToken');
            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Повторяем оригинальный запрос
            return api(originalRequest);
          } else {
            // Если обновление токена не удалось, выходим из системы
            return Promise.reject(new Error('Session expired'));
          }
        } else {
          // Если токен уже обновляется, ждем 500ms и пробуем снова
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Проверяем, появился ли новый токен
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            return Promise.reject(new Error('Token refresh failed'));
          }
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Если не удалось обновить токен, отклоняем запрос и очищаем локальные данные
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common.Authorization;
        
        // Если пользователь был авторизован, перенаправляем на страницу входа
        const state = store.getState();
        if (state.auth.isAuthenticated) {
          window.location.href = '/login?session_expired=true';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Вспомогательная функция для создания кэширующих опций
const createCacheOptions = (ttl = null, forceRefresh = false) => ({
  cache: !forceRefresh, // Если forceRefresh=true, отключаем кэш
  ttl // Время жизни кэша в миллисекундах
});

// API сервис с группировкой по доменам
const apiService = {
  // Утилиты для кэширования и оффлайн-режима
  cache: {
    // Принудительное обновление из сети
    forceRefresh: (endpoint, params = null) => {
      const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return api.get(url, { params, cache: false });
    },
    
    // Очистка кэша по шаблону
    clear: async (pattern = null) => {
      return cacheService.clearCache(pattern);
    },
    
    // Получение метрик кэша
    getMetrics: async () => {
      return cacheService.getCacheMetrics();
    }
  },
  
  // Аутентификация и пользователи
  auth: {
    login: (credentials) => api.post('/users/login/', credentials),
    register: (userData) => api.post('/users/register/', userData),
    verifyEmail: (token) => api.get(`/users/verify-email/${token}/`),
    forgotPassword: (email) => api.post('/users/forgot-password/', { email }),
    resetPassword: (token, password) => api.post(`/users/reset-password/${token}/`, { password }),
    logout: (refreshToken) => api.post('/users/logout/', { refresh: refreshToken }),
    
    // Обновление токена доступа
    refreshToken: (refreshToken) => api.post('/users/token/refresh/', { refresh: refreshToken })
  },
  
  // Управление пользователями
  user: {
    // Основные данные профиля с умеренным кэшированием
    getProfile: (options = {}) => api.get('/users/profile/', {
      ...createCacheOptions(10 * 60 * 1000, options.forceRefresh) // 10 минут кэш
    }),
    
    updateProfile: (userData) => api.patch('/users/profile/', userData),
    
    // Уведомления с коротким кэшированием
    getNotifications: (params, options = {}) => api.get('/users/notifications/', {
      params,
      ...createCacheOptions(1 * 60 * 1000, options.forceRefresh) // 1 минута кэш
    }),
    
    markNotificationRead: (id) => api.patch(`/users/notifications/${id}/read/`),
    markAllNotificationsRead: () => api.post('/users/notifications/mark-all-read/'),
    
    getNotificationSettings: (options = {}) => api.get('/users/notification-settings/', {
      ...createCacheOptions(5 * 60 * 1000, options.forceRefresh) // 5 минут кэш
    }),
    
    updateNotificationSettings: (settings) => api.patch('/users/notification-settings/', settings),
    updatePassword: (passwordData) => api.post('/users/change-password/', passwordData),
    
    // Двухфакторная аутентификация и верификация
    getPhoneVerificationStatus: () => api.get('/users/phone-verification-status/'),
    requestPhoneVerification: (phone) => api.post('/users/request-phone-verification/', { phone }),
    verifyPhone: (code) => api.post('/users/verify-phone/', { code }),
    
    // Файлы и документы
    uploadDocument: (documentData) => api.post('/users/documents/', documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    
    getDocuments: (options = {}) => api.get('/users/documents/', {
      ...createCacheOptions(30 * 60 * 1000, options.forceRefresh) // 30 минут кэш
    }),
    
    deleteDocument: (id) => api.delete(`/users/documents/${id}/`),
    
    // Адреса
    getAddresses: (options = {}) => api.get('/users/addresses/', {
      ...createCacheOptions(60 * 60 * 1000, options.forceRefresh) // 1 час кэш
    }),
    
    addAddress: (addressData) => api.post('/users/addresses/', addressData),
    updateAddress: (id, addressData) => api.patch(`/users/addresses/${id}/`, addressData),
    deleteAddress: (id) => api.delete(`/users/addresses/${id}/`),
    setDefaultAddress: (id) => api.post(`/users/addresses/${id}/set-default/`)
  },
  
  // Лотереи и игры
  lottery: {
    // Список лотерей с долгим кэшированием
    getLotteries: (params, options = {}) => api.get('/lottery/games/', {
      params,
      ...createCacheOptions(6 * 60 * 60 * 1000, options.forceRefresh) // 6 часов кэш
    }),
    
    // Детали лотереи с умеренным кэшированием
    getLotteryDetails: (id, options = {}) => api.get(`/lottery/games/${id}/`, {
      ...createCacheOptions(30 * 60 * 1000, options.forceRefresh) // 30 минут кэш
    }),
    
    // Предстоящие тиражи с коротким кэшированием (часто обновляются)
    getUpcomingDraws: (params, options = {}) => api.get('/lottery/draws/upcoming/', {
      params,
      ...createCacheOptions(5 * 60 * 1000, options.forceRefresh) // 5 минут кэш
    }),
    
    // Прошедшие тиражи с долгим кэшированием
    getPastDraws: (params, options = {}) => api.get('/lottery/draws/past/', {
      params,
      ...createCacheOptions(12 * 60 * 60 * 1000, options.forceRefresh) // 12 часов кэш
    }),
    
    // Детали тиража
    getDrawDetails: (id, options = {}) => api.get(`/lottery/draws/${id}/`, {
      ...createCacheOptions(10 * 60 * 1000, options.forceRefresh) // 10 минут кэш
    }),
    
    // Результаты тиража с долгим кэшированием
    getDrawResults: (id, options = {}) => api.get(`/lottery/draws/${id}/results/`, {
      ...createCacheOptions(24 * 60 * 60 * 1000, options.forceRefresh) // 24 часа кэш
    }),
    
    // Билеты с умеренным кэшированием, т.к. могут быть обновления по выигрышам
    getUserTickets: (params, options = {}) => api.get('/lottery/tickets/user/', {
      params,
      ...createCacheOptions(5 * 60 * 1000, options.forceRefresh) // 5 минут кэш
    }),
    
    // Подробности о билете
    getTicketDetails: (id, options = {}) => api.get(`/lottery/tickets/${id}/`, {
      ...createCacheOptions(5 * 60 * 1000, options.forceRefresh) // 5 минут кэш
    }),
    
    // Покупка и проверка билетов - без кэширования
    purchaseTicket: (ticketData) => api.post('/lottery/tickets/purchase/', ticketData),
    validateTicketNumbers: (numbers) => api.post('/lottery/tickets/validate-numbers/', numbers),
    
    // Быстрая покупка случайного билета
    purchaseQuickTicket: (lotteryId, count = 1) => api.post('/lottery/tickets/quick-purchase/', {
      lottery_id: lotteryId,
      count
    }),
    
    // История выигрышей
    getWinningTickets: (params, options = {}) => api.get('/lottery/tickets/winning/', {
      params,
      ...createCacheOptions(15 * 60 * 1000, options.forceRefresh) // 15 минут кэш
    }),
    
    // Правила игры с долгим кэшированием
    getLotteryRules: (lotteryId, options = {}) => api.get(`/lottery/games/${lotteryId}/rules/`, {
      ...createCacheOptions(24 * 60 * 60 * 1000, options.forceRefresh) // 24 часа кэш
    }),
    
    // Джекпот и призовые фонды
    getJackpotInfo: (lotteryId, options = {}) => api.get(`/lottery/games/${lotteryId}/jackpot/`, {
      ...createCacheOptions(30 * 60 * 1000, options.forceRefresh) // 30 минут кэш
    })
  },
  
  // Платежи и финансы
  payment: {
    // Информация о кошельке с коротким кэшированием
    getWallet: (options = {}) => api.get('/payments/wallet/', {
      ...createCacheOptions(2 * 60 * 1000, options.forceRefresh) // 2 минуты кэш
    }),
    
    // История транзакций
    getTransactions: (params, options = {}) => api.get('/payments/transactions/', {
      params,
      ...createCacheOptions(5 * 60 * 1000, options.forceRefresh) // 5 минут кэш
    }),
    
    // Детали транзакции
    getTransactionDetails: (id, options = {}) => api.get(`/payments/transactions/${id}/`, {
      ...createCacheOptions(10 * 60 * 1000, options.forceRefresh) // 10 минут кэш
    }),
    
    // Операции пополнения и вывода
    deposit: (depositData) => api.post('/payments/deposit/', depositData),
    initiateDeposit: (depositData) => api.post('/payments/deposit/initiate/', depositData),
    confirmDeposit: (confirmData) => api.post('/payments/deposit/confirm/', confirmData),
    cancelDeposit: (cancelData) => api.post('/payments/deposit/cancel/', cancelData),
    
    withdraw: (withdrawData) => api.post('/payments/withdraw/', withdrawData),
    getWithdrawalRequests: (params, options = {}) => api.get('/payments/withdrawals/', {
      params,
      ...createCacheOptions(5 * 60 * 1000, options.forceRefresh) // 5 минут кэш
    }),
    
    cancelWithdrawal: (id) => api.post(`/payments/withdrawals/${id}/cancel/`),
    
    // Методы оплаты
    getPaymentMethods: (options = {}) => api.get('/payments/methods/', {
      ...createCacheOptions(20 * 60 * 1000, options.forceRefresh) // 20 минут кэш
    }),
    
    addPaymentMethod: (methodData) => api.post('/payments/methods/', methodData),
    updatePaymentMethod: (id, methodData) => api.patch(`/payments/methods/${id}/`, methodData),
    deletePaymentMethod: (id) => api.delete(`/payments/methods/${id}/`),
    setDefaultPaymentMethod: (id) => api.post(`/payments/methods/${id}/set-default/`),
    
    // Проверка статуса платежа
    checkPaymentStatus: (paymentId) => api.get(`/payments/status/${paymentId}/`, {
      cache: false // Всегда свежие данные для статуса платежа
    }),
    
    // Лимиты и комиссии
    getPaymentLimits: (options = {}) => api.get('/payments/limits/', {
      ...createCacheOptions(60 * 60 * 1000, options.forceRefresh) // 1 час кэш
    }),
    
    getPaymentFees: (options = {}) => api.get('/payments/fees/', {
      ...createCacheOptions(60 * 60 * 1000, options.forceRefresh) // 1 час кэш
    })
  },
  
  // Уведомления
  notification: {
    getUnreadCount: (options = {}) => api.get('/users/notifications/unread-count/', {
      ...createCacheOptions(1 * 60 * 1000, options.forceRefresh) // 1 минута кэш
    }),
    
    subscribeToNotifications: (subscription) => api.post('/notifications/subscribe/', subscription),
    unsubscribeFromNotifications: () => api.post('/notifications/unsubscribe/'),
    testNotification: () => api.post('/notifications/test/'),
    
    // Получить все каналы уведомлений
    getNotificationChannels: (options = {}) => api.get('/notifications/channels/', {
      ...createCacheOptions(60 * 60 * 1000, options.forceRefresh) // 1 час кэш
    }),
    
    // Обновить настройки каналов
    updateNotificationChannels: (channelSettings) => api.patch('/notifications/channels/', channelSettings)
  },
  
  // Аналитика и статистика
  stats: {
    // Статистика пользователя
    getUserStats: (options = {}) => api.get('/stats/user/', {
      ...createCacheOptions(30 * 60 * 1000, options.forceRefresh) // 30 минут кэш
    }),
    
    // Статистика лотереи
    getLotteryStats: (lotteryId, options = {}) => api.get(`/stats/lottery/${lotteryId}/`, {
      ...createCacheOptions(6 * 60 * 60 * 1000, options.forceRefresh) // 6 часов кэш
    }),
    
    // Популярные номера
    getPopularNumbers: (params, options = {}) => api.get('/stats/popular-numbers/', {
      params,
      ...createCacheOptions(12 * 60 * 60 * 1000, options.forceRefresh) // 12 часов кэш
    }),
    
    // История выигрышей
    getWinningHistory: (params, options = {}) => api.get('/stats/winning-history/', {
      params,
      ...createCacheOptions(12 * 60 * 60 * 1000, options.forceRefresh) // 12 часов кэш
    }),
    
    // Статистика джекпотов
    getJackpotHistory: (lotteryId, options = {}) => api.get(`/stats/jackpot-history/${lotteryId}/`, {
      ...createCacheOptions(24 * 60 * 60 * 1000, options.forceRefresh) // 24 часа кэш
    }),
    
    // Распределение выигрышей по категориям
    getWinDistribution: (lotteryId, options = {}) => api.get(`/stats/win-distribution/${lotteryId}/`, {
      ...createCacheOptions(24 * 60 * 60 * 1000, options.forceRefresh) // 24 часа кэш
    })
  },
  
  // Симуляция розыгрыша
  simulation: {
    simulateDraw: (drawId) => api.get(`/lottery/draws/${drawId}/simulate/`),
    generateRandomNumbers: (lotteryId) => api.get(`/lottery/games/${lotteryId}/random-numbers/`),
    
    // Симуляция игры для обучения
    simulateGameplay: (params) => api.post('/simulation/gameplay/', params)
  },
  
  // Справочная информация и помощь
  reference: {
    // FAQ с долгим кэшированием
    getFaq: (options = {}) => api.get('/reference/faq/', {
      ...createCacheOptions(24 * 60 * 60 * 1000, options.forceRefresh) // 24 часа кэш
    }),
    
    // Условия использования
    getTerms: (options = {}) => api.get('/reference/terms/', {
      ...createCacheOptions(24 * 60 * 60 * 1000, options.forceRefresh) // 24 часа кэш
    }),
    
    // Политика приватности
    getPrivacyPolicy: (options = {}) => api.get('/reference/privacy-policy/', {
      ...createCacheOptions(24 * 60 * 60 * 1000, options.forceRefresh) // 24 часа кэш
    }),
    
    // Создание обращения в поддержку
    createSupportTicket: (ticketData) => api.post('/reference/support-tickets/', ticketData),
    
    // Получение списка обращений
    getSupportTickets: (params, options = {}) => api.get('/reference/support-tickets/', {
      params,
      ...createCacheOptions(15 * 60 * 1000, options.forceRefresh) // 15 минут кэш
    }),
    
    // Детали обращения
    getSupportTicketDetails: (id, options = {}) => api.get(`/reference/support-tickets/${id}/`, {
      ...createCacheOptions(5 * 60 * 1000, options.forceRefresh) // 5 минут кэш
    }),
    
    // Добавление сообщения к обращению
    addSupportMessage: (ticketId, message) => api.post(`/reference/support-tickets/${ticketId}/messages/`, {
      message
    }),
    
    // Обратная связь
    sendFeedback: (feedbackData) => api.post('/reference/feedback/', feedbackData)
  },
  
  // Акции и бонусы
  promotion: {
    // Активные акции
    getActivePromotions: (options = {}) => api.get('/promotions/active/', {
      ...createCacheOptions(15 * 60 * 1000, options.forceRefresh) // 15 минут кэш
    }),
    
    // Детали акции
    getPromotionDetails: (id, options = {}) => api.get(`/promotions/${id}/`, {
      ...createCacheOptions(30 * 60 * 1000, options.forceRefresh) // 30 минут кэш
    }),
    
    // Использование промокода
    applyPromoCode: (code) => api.post('/promotions/apply-code/', { code }),
    
    // Бонусы пользователя
    getUserBonuses: (options = {}) => api.get('/promotions/user-bonuses/', {
      ...createCacheOptions(15 * 60 * 1000, options.forceRefresh) // 15 минут кэш
    }),
    
    // Получение реферальной ссылки
    getReferralLink: (options = {}) => api.get('/promotions/referral-link/', {
      ...createCacheOptions(60 * 60 * 1000, options.forceRefresh) // 1 час кэш
    }),
    
    // Статистика рефералов
    getReferralStats: (options = {}) => api.get('/promotions/referral-stats/', {
      ...createCacheOptions(30 * 60 * 1000, options.forceRefresh) // 30 минут кэш
    })
  }
};

export default apiService;