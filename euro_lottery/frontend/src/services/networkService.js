/**
 * Сервис для отслеживания сетевого соединения и синхронизации данных
 */
import cacheService from './cacheService';
import { showNetworkStatusNotification } from '../store/slices/networkSlice';
import store from '../store';

class NetworkService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.reconnectTimer = null;
    this.reconnectInterval = 5000; // 5 секунд
    this.syncInProgress = false;
    this.lastSyncAttempt = 0;
    this.initialized = false;
  }

  /**
   * Инициализация сервиса
   */
  init() {
    if (this.initialized) return;
    
    // Настраиваем прослушиватели событий сети
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Установка начального состояния
    this.broadcastStatus(navigator.onLine);
    
    this.initialized = true;
    
    // Запускаем синхронизацию, если мы онлайн
    if (navigator.onLine) {
      this.syncOfflineOperations();
    }
    
    // Периодически проверяем реальное соединение
    this.checkRealConnectivity();
    setInterval(() => this.checkRealConnectivity(), 30000); // Каждые 30 секунд
    
    return this;
  }

  /**
   * Добавление обработчика изменений статуса сети
   * @param {Function} callback - Функция обратного вызова
   * @returns {Function} - Функция для удаления обработчика
   */
  addListener(callback) {
    this.listeners.push(callback);
    // Немедленно вызываем с текущим статусом
    callback(this.isOnline);
    
    // Возвращаем функцию для удаления слушателя
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Обработчик события online
   */
  handleOnline() {
    console.log('Browser reports online status');
    
    // Проверяем реальное соединение перед уведомлением
    this.checkRealConnectivity().then(isReallyOnline => {
      if (isReallyOnline) {
        this.broadcastStatus(true);
        
        // Попытка синхронизации оффлайн-операций
        this.syncOfflineOperations();
      }
    });
  }

  /**
   * Обработчик события offline
   */
  handleOffline() {
    console.log('Browser reports offline status');
    this.broadcastStatus(false);
    
    // Очищаем таймер переподключения
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Оповещение всех слушателей об изменении статуса
   * @param {boolean} status - Статус соединения
   */
  broadcastStatus(status) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      
      // Вызываем все зарегистрированные обработчики
      this.listeners.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in network status listener:', error);
        }
      });
      
      // Отправляем уведомление в Redux
      store.dispatch(showNetworkStatusNotification(status));
    }
  }

  /**
   * Проверка реального сетевого соединения путем отправки тестового запроса
   * @returns {Promise<boolean>} - true если соединение работает
   */
  async checkRealConnectivity() {
    // Если браузер уже сообщает об отсутствии соединения, не проверяем дальше
    if (!navigator.onLine) {
      this.broadcastStatus(false);
      return false;
    }
    
    try {
      // Отправляем тестовый запрос с таймаутом
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const isOnline = response.ok;
      this.broadcastStatus(isOnline);
      return isOnline;
    } catch (error) {
      // Если запрос не удался, значит нет соединения
      if (error.name !== 'AbortError') {
        this.broadcastStatus(false);
      }
      return false;
    }
  }

  /**
   * Синхронизация оффлайн-операций при восстановлении соединения
   * @returns {Promise<void>}
   */
  async syncOfflineOperations() {
    // Предотвращаем повторные попытки синхронизации
    if (this.syncInProgress) {
      return;
    }
    
    this.syncInProgress = true;
    this.lastSyncAttempt = Date.now();
    
    try {
      const pendingOperations = await cacheService.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        this.syncInProgress = false;
        return;
      }
      
      console.log(`Syncing ${pendingOperations.length} offline operations`);
      
      // Получаем API сервис динамически, чтобы избежать циклических зависимостей
      const apiService = (await import('./api')).default;
      
      for (const operation of pendingOperations) {
        try {
          // Обновляем статус операции на "в обработке"
          await cacheService.updateOperationStatus(operation.id, 'processing');
          
          // Выполняем операцию
          const response = await this.performOperation(apiService, operation);
          
          // Обновляем статус операции на "завершено" с результатом
          await cacheService.updateOperationStatus(
            operation.id, 
            'completed', 
            response
          );
          
          // Если эндпоинт изменяет данные, инвалидируем связанный кэш
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(operation.method)) {
            // Определяем какие разделы кэша нужно очистить
            const cachePatternsToInvalidate = this.getCachePatternsForEndpoint(operation.endpoint);
            
            for (const pattern of cachePatternsToInvalidate) {
              await cacheService.clearCache(pattern);
            }
          }
        } catch (error) {
          console.error(`Error syncing operation ${operation.id}:`, error);
          
          // Помечаем операцию как проваленную, если она не временная проблема соединения
          if (!navigator.onLine || error.message.includes('network')) {
            // Оставляем в состоянии pending для будущих попыток
            break;
          } else {
            await cacheService.updateOperationStatus(
              operation.id, 
              'failed', 
              { error: error.message }
            );
          }
        }
      }
      
      // Очистка старых завершенных операций
      await cacheService.cleanupCompletedOperations();
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Выполнение оффлайн-операции
   * @param {Object} apiService - API сервис
   * @param {Object} operation - Операция для выполнения
   * @returns {Promise<Object>} - Результат операции
   */
  async performOperation(apiService, operation) {
    const { endpoint, method, data } = operation;
    
    // Определяем, какой метод API вызвать
    let apiMethod = null;
    const endpointParts = endpoint.split('/');
    
    // Пример определения правильного API метода на основе эндпоинта и HTTP метода
    // Необходимо расширить эту логику для всех поддерживаемых эндпоинтов
    switch (true) {
      case endpoint.includes('users/profile') && method === 'PATCH':
        apiMethod = () => apiService.user.updateProfile(data);
        break;
      case endpoint.includes('lottery/tickets/purchase') && method === 'POST':
        apiMethod = () => apiService.lottery.purchaseTicket(data);
        break;
      case endpoint.includes('payments/deposit') && method === 'POST':
        apiMethod = () => apiService.payment.deposit(data);
        break;
      case endpoint.includes('payments/withdraw') && method === 'POST':
        apiMethod = () => apiService.payment.withdraw(data);
        break;
      // Добавление других маппингов по необходимости
      default:
        throw new Error(`Unsupported offline operation: ${method} ${endpoint}`);
    }
    
    if (!apiMethod) {
      throw new Error(`No API method found for: ${method} ${endpoint}`);
    }
    
    return apiMethod();
  }

  /**
   * Определение связанных шаблонов кэша для инвалидации при изменении данных
   * @param {string} endpoint - API эндпоинт
   * @returns {Array<string>} - Шаблоны для инвалидации кэша
   */
  getCachePatternsForEndpoint(endpoint) {
    // Общая логика: если меняем что-то в определенном ресурсе,
    // нужно сбросить все кэши, связанные с этим ресурсом
    
    const patterns = [];
    
    // Базовое правило: добавляем сам эндпоинт
    patterns.push(endpoint);
    
    // Правила для очистки связанных разделов кэша
    if (endpoint.includes('users/profile')) {
      patterns.push('users/profile');
    } else if (endpoint.includes('lottery/tickets')) {
      patterns.push('lottery/tickets');
      patterns.push('lottery/tickets/user');
    } else if (endpoint.includes('payments')) {
      patterns.push('payments/transactions');
      patterns.push('payments/wallet');
    } else if (endpoint.includes('lottery/games')) {
      patterns.push('lottery/games');
    } else if (endpoint.includes('lottery/draws')) {
      patterns.push('lottery/draws');
    } else if (endpoint.includes('users/notifications')) {
      patterns.push('users/notifications');
    }
    
    return patterns;
  }
}

export default new NetworkService();