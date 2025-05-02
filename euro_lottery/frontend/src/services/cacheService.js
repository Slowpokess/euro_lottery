/**
 * Сервис для кэширования API данных с использованием localStorage/IndexedDB
 * Обеспечивает сохранение данных для оффлайн-режима и кэширования запросов
 */
import { openDB } from 'idb';

// Имя базы данных IndexedDB
const DB_NAME = 'euro_lottery_cache';
// Текущая версия базы данных
const DB_VERSION = 1;
// Имя хранилища объектов
const CACHE_STORE = 'api_cache';
// Имя хранилища для оффлайн-операций
const OFFLINE_STORE = 'offline_operations';

// Время жизни кэша по умолчанию (1 час)
const DEFAULT_CACHE_TTL = 60 * 60 * 1000;

// Кэш для хранения данных в памяти (для быстрого доступа)
const memoryCache = new Map();

// Иерархия TTL в зависимости от типа данных
const cacheTTLs = {
  'default': DEFAULT_CACHE_TTL,
  'lottery/games': 12 * 60 * 60 * 1000, // 12 часов для списка лотерей
  'lottery/draws/past': 24 * 60 * 60 * 1000, // 24 часа для прошедших розыгрышей
  'stats': 6 * 60 * 60 * 1000, // 6 часов для статистики
  'users/profile': 30 * 60 * 1000, // 30 минут для профиля пользователя
  'users/notifications': 5 * 60 * 1000, // 5 минут для уведомлений
  'lottery/draws/upcoming': 5 * 60 * 1000, // 5 минут для предстоящих розыгрышей
  'payments/transactions': 15 * 60 * 1000, // 15 минут для транзакций
};

// Инициализация IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Создаем хранилище для кэша API
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
      
      // Создаем хранилище для оффлайн-операций
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        const offlineStore = db.createObjectStore(OFFLINE_STORE, { 
          keyPath: 'id',
          autoIncrement: true
        });
        offlineStore.createIndex('timestamp', 'timestamp');
        offlineStore.createIndex('endpoint', 'endpoint');
        offlineStore.createIndex('status', 'status');
      }
    }
  });
};

// Получение TTL для конкретного эндпоинта
const getTTL = (endpoint) => {
  // Находим наилучшее совпадение для эндпоинта
  const matchingKey = Object.keys(cacheTTLs).find(key => 
    endpoint.includes(key)
  );
  
  return matchingKey ? cacheTTLs[matchingKey] : cacheTTLs.default;
};

// Генерация ключа кэша на основе эндпоинта и параметров
const generateCacheKey = (endpoint, params = null) => {
  if (!params) {
    return endpoint;
  }
  
  // Сортируем ключи параметров для стабильного ключа кэша
  const sortedParams = Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {});
  
  return `${endpoint}|${JSON.stringify(sortedParams)}`;
};

// Объект сервиса кэширования
const cacheService = {
  /**
   * Сохранение данных в кэш
   * @param {string} endpoint - API эндпоинт
   * @param {Object} data - Данные для кэширования
   * @param {Object} params - Параметры запроса (опционально)
   * @param {number} ttl - Время жизни кэша в мс (опционально)
   * @returns {Promise}
   */
  async setCache(endpoint, data, params = null, ttl = null) {
    const key = generateCacheKey(endpoint, params);
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || getTTL(endpoint));
    
    // Сохраняем данные в память для быстрого доступа
    memoryCache.set(key, {
      data,
      expiresAt
    });
    
    // Сохраняем данные в IndexedDB
    try {
      const db = await initDB();
      await db.put(CACHE_STORE, {
        key,
        data,
        timestamp,
        expiresAt,
        endpoint
      });
      return true;
    } catch (error) {
      console.error('Error saving to cache:', error);
      return false;
    }
  },
  
  /**
   * Получение данных из кэша
   * @param {string} endpoint - API эндпоинт
   * @param {Object} params - Параметры запроса (опционально)
   * @returns {Promise<Object|null>} - Кэшированные данные или null
   */
  async getCache(endpoint, params = null) {
    const key = generateCacheKey(endpoint, params);
    const now = Date.now();
    
    // Сначала проверяем память
    if (memoryCache.has(key)) {
      const cached = memoryCache.get(key);
      
      // Проверяем срок действия
      if (cached.expiresAt > now) {
        return cached.data;
      }
      
      // Если срок истек, удаляем из памяти
      memoryCache.delete(key);
    }
    
    // Проверяем IndexedDB
    try {
      const db = await initDB();
      const cached = await db.get(CACHE_STORE, key);
      
      if (cached && cached.expiresAt > now) {
        // Обновляем в памяти для будущих запросов
        memoryCache.set(key, {
          data: cached.data,
          expiresAt: cached.expiresAt
        });
        
        return cached.data;
      }
      
      // Очищаем просроченный кэш
      if (cached) {
        await db.delete(CACHE_STORE, key);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  },
  
  /**
   * Очистка кэша по ключу/шаблону
   * @param {string} pattern - Шаблон эндпоинта для очистки
   * @returns {Promise<number>} - Количество удаленных записей
   */
  async clearCache(pattern = null) {
    try {
      // Очищаем память
      if (!pattern) {
        memoryCache.clear();
      } else {
        for (const key of memoryCache.keys()) {
          if (key.includes(pattern)) {
            memoryCache.delete(key);
          }
        }
      }
      
      // Очищаем IndexedDB
      const db = await initDB();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      const store = tx.objectStore(CACHE_STORE);
      
      if (!pattern) {
        // Очищаем все
        await store.clear();
        return -1; // Индикатор полной очистки
      } else {
        // Очищаем по шаблону
        const allKeys = await store.getAllKeys();
        let count = 0;
        
        for (const key of allKeys) {
          const item = await store.get(key);
          if (item.endpoint.includes(pattern) || item.key.includes(pattern)) {
            await store.delete(key);
            count++;
          }
        }
        
        return count;
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      return 0;
    }
  },
  
  /**
   * Добавление операции в очередь оффлайн-операций
   * @param {string} endpoint - API эндпоинт
   * @param {string} method - HTTP метод (POST, PUT, DELETE)
   * @param {Object} data - Данные для отправки
   * @returns {Promise<boolean>} - Успешно ли добавлена операция
   */
  async addOfflineOperation(endpoint, method, data) {
    try {
      const db = await initDB();
      await db.add(OFFLINE_STORE, {
        endpoint,
        method,
        data,
        timestamp: Date.now(),
        status: 'pending' // pending, processing, completed, failed
      });
      return true;
    } catch (error) {
      console.error('Error adding offline operation:', error);
      return false;
    }
  },
  
  /**
   * Получение всех ожидающих оффлайн-операций
   * @returns {Promise<Array>} - Список операций
   */
  async getPendingOperations() {
    try {
      const db = await initDB();
      return await db.getAllFromIndex(OFFLINE_STORE, 'status', 'pending');
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  },
  
  /**
   * Обновление статуса оффлайн-операции
   * @param {number} id - ID операции
   * @param {string} status - Новый статус
   * @param {Object} result - Результат выполнения (опционально)
   * @returns {Promise<boolean>} - Успешно ли обновлен статус
   */
  async updateOperationStatus(id, status, result = null) {
    try {
      const db = await initDB();
      const tx = db.transaction(OFFLINE_STORE, 'readwrite');
      const store = tx.objectStore(OFFLINE_STORE);
      
      const operation = await store.get(id);
      if (!operation) {
        return false;
      }
      
      operation.status = status;
      if (result) {
        operation.result = result;
      }
      operation.updatedAt = Date.now();
      
      await store.put(operation);
      return true;
    } catch (error) {
      console.error('Error updating operation status:', error);
      return false;
    }
  },
  
  /**
   * Удаление завершенных операций
   * @returns {Promise<number>} - Количество удаленных операций
   */
  async cleanupCompletedOperations() {
    try {
      const db = await initDB();
      const tx = db.transaction(OFFLINE_STORE, 'readwrite');
      const store = tx.objectStore(OFFLINE_STORE);
      
      const completedOps = await db.getAllFromIndex(
        OFFLINE_STORE, 
        'status', 
        'completed'
      );
      
      let count = 0;
      for (const op of completedOps) {
        // Удаляем операции, которые были завершены более 24 часов назад
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        if (op.updatedAt && op.updatedAt < oneDayAgo) {
          await store.delete(op.id);
          count++;
        }
      }
      
      return count;
    } catch (error) {
      console.error('Error cleaning up operations:', error);
      return 0;
    }
  },
  
  /**
   * Проверка онлайн/оффлайн статуса
   * @returns {boolean} - true если онлайн
   */
  isOnline() {
    return navigator.onLine;
  },
  
  /**
   * Получение метрик кэша
   * @returns {Promise<Object>} - Метрики кэша
   */
  async getCacheMetrics() {
    try {
      const db = await initDB();
      const allCache = await db.getAll(CACHE_STORE);
      const now = Date.now();
      
      const metrics = {
        totalEntries: allCache.length,
        validEntries: 0,
        expiredEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        averageAge: 0,
        sizeEstimate: 0,
        endpointBreakdown: {}
      };
      
      if (allCache.length === 0) {
        return metrics;
      }
      
      let totalAge = 0;
      let oldestTimestamp = now;
      let newestTimestamp = 0;
      
      for (const entry of allCache) {
        const age = now - entry.timestamp;
        totalAge += age;
        
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
        }
        
        if (entry.timestamp > newestTimestamp) {
          newestTimestamp = entry.timestamp;
        }
        
        if (entry.expiresAt > now) {
          metrics.validEntries++;
        } else {
          metrics.expiredEntries++;
        }
        
        // Оценка размера в JSON
        const entrySize = JSON.stringify(entry).length;
        metrics.sizeEstimate += entrySize;
        
        // Разбивка по эндпоинтам
        const endpoint = entry.endpoint.split('/')[0];
        metrics.endpointBreakdown[endpoint] = (metrics.endpointBreakdown[endpoint] || 0) + 1;
      }
      
      metrics.averageAge = totalAge / allCache.length;
      metrics.oldestEntry = new Date(oldestTimestamp).toISOString();
      metrics.newestEntry = new Date(newestTimestamp).toISOString();
      metrics.sizeEstimate = (metrics.sizeEstimate / (1024 * 1024)).toFixed(2) + ' MB';
      
      return metrics;
    } catch (error) {
      console.error('Error getting cache metrics:', error);
      return null;
    }
  }
};

export default cacheService;