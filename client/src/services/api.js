import axios from 'axios';
import { ErrorMessages, getErrorMessage } from '../utils/errorMessages';
import { 
  API, 
  STORAGE_KEYS, 
  DEFAULT_IMAGES, 
  EVENT_STATUSES,
  PAGE_SIZES
} from '../utils/constants';

// Environment configuration
const API_BASE_URL = API.BASE_URL;
const API_TIMEOUT = API.TIMEOUT;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Флаг для принудительного использования моковых данных (для разработки без сервера)
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Import tokenStorage from auth service to avoid circular dependency
// Simplified version that matches the implementation in auth.js
const getAuthToken = () => {
  try {
    const TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;
    const TOKEN_EXPIRY_KEY = STORAGE_KEYS.AUTH_TOKEN_EXPIRY;
    
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return null;
    }
    
    if (new Date(expiry) < new Date()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      return null;
    }
    
    return token;
  } catch (error) {
    return null;
  }
};

// Настройка глобального перехватчика для подавления сетевых ошибок в консоли
const originalConsoleError = console.error;
console.error = function(message, ...args) {
  // Подавляем логирование сетевых ошибок, если включены моковые данные
  if (USE_MOCK_DATA && (
      (typeof message === 'string' && message.includes('Network Error')) || 
      (args[0] && typeof args[0] === 'object' && args[0].message === 'Network Error')
    )) {
    console.warn('[Подавлено] Сетевая ошибка (скрыта в режиме моковых данных)');
    return;
  }
  originalConsoleError.apply(console, [message, ...args]);
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: parseInt(API_TIMEOUT, 10)
});

// Создаем простой кеш для запросов
const requestCache = new Map();

// Функция для создания ключа кеша
const createCacheKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    // Проверка, есть ли кешированный ответ для GET-запросов
    if (config.method === 'get') {
      const cacheKey = createCacheKey(config);
      
      // Проверяем кеш
      if (requestCache.has(cacheKey)) {
        console.log(`Using cached response for ${config.url}`);
        
        // Используем кешированные данные
        config.adapter = () => {
          return Promise.resolve(requestCache.get(cacheKey));
        };
        
        return config;
      }
    }
    
    // Проверка, нужно ли использовать моковые данные для GET-запросов
    if (USE_MOCK_DATA && config.method === 'get') {
      const mockData = getMockDataForEndpoint(config.url, config.method);
      if (mockData) {
        console.warn(`Intercepting GET ${config.url} with mock data (forced by .env)`);
        
        // Создаем ответ с моковыми данными
        const response = {
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        };
        
        // Кешируем ответ
        const cacheKey = createCacheKey(config);
        requestCache.set(cacheKey, response);
        
        // Заменяем реальный запрос на обещание, которое сразу возвращает моковые данные
        config.adapter = () => Promise.resolve(response);
        
        return config;
      }
    }
    
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      if (!IS_PRODUCTION) {
        console.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
    }
    
    // Validate data for POST/PUT requests
    if ((config.method === 'post' || config.method === 'put') && config.data) {
      // Sanitize input data to prevent XSS (simplified example)
      if (typeof config.data === 'object') {
        Object.keys(config.data).forEach(key => {
          if (typeof config.data[key] === 'string') {
            // Basic sanitization - more comprehensive approaches would be implemented here
            config.data[key] = config.data[key].trim();
          }
        });
      }
    }
    
    return config;
  },
  (error) => {
    if (!IS_PRODUCTION) {
      console.error('API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Кешируем успешные ответы GET
    if (response.config.method === 'get') {
      const cacheKey = createCacheKey(response.config);
      requestCache.set(cacheKey, response);
      // console.log(`Cached response for ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    // Проверка, нужно ли использовать моковые данные
    const url = error.config?.url;
    const method = error.config?.method;
    
    // Если это сетевая ошибка, нужно проверить кеш перед использованием моковых данных
    if (error.message === 'Network Error' && method === 'get') {
      const cacheKey = createCacheKey(error.config);
      
      // Проверяем, есть ли кешированный ответ
      if (requestCache.has(cacheKey)) {
        console.log(`Using cached response for ${url} after network error`);
        return Promise.resolve(requestCache.get(cacheKey));
      }
    }
    
    // Если включено использование моковых данных в .env или это сетевая ошибка в режиме разработки
    if ((USE_MOCK_DATA || (error.message === 'Network Error' && !IS_PRODUCTION)) && url && method) {
      const mockData = getMockDataForEndpoint(url, method);
      if (mockData) {
        console.warn(`Using mock data for ${method} ${url} - ${USE_MOCK_DATA ? 'Forced by .env' : 'Due to network error'}`);
        
        // Создаем ответ с моковыми данными
        const response = {
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
          request: {}
        };
        
        // Кешируем ответ
        const cacheKey = createCacheKey(error.config);
        requestCache.set(cacheKey, response);
        
        return Promise.resolve(response);
      }
    }
    
    // Create a safe error message
    let errorMessage;
    try {
      errorMessage = getErrorMessage(error);
    } catch (e) {
      errorMessage = 'Ошибка обработки API запроса';
    }
    
    // Format error for logging (without circular references)
    const formattedError = {
      url: url || 'unknown',
      method: method?.toUpperCase() || 'unknown',
      status: error.response?.status || 0,
      message: errorMessage
    };
    
    // Log error in non-production only
    if (!IS_PRODUCTION) {
      console.error('API Error:', formattedError);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN_EXPIRY);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      // Dispatch auth error event
      window.dispatchEvent(new CustomEvent('auth:error', { 
        detail: { 
          message: ErrorMessages.AUTH_EXPIRED,
          status: 401
        }
      }));
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    
    // Add formatted message to error object safely
    try {
      error.formattedMessage = errorMessage;
    } catch (e) {
      // If we can't modify the error, create a new one
      const newError = new Error(errorMessage);
      newError.originalError = error;
      return Promise.reject(newError);
    }
    
    return Promise.reject(error);
  }
);

// Mock data helper for development fallbacks
function getMockDataForEndpoint(url = '', method = '') {
  if (!url || !method) return null;
  
  // Check if this is a specific resource request
  const idMatch = url.match(/\/([^/]+)\/([a-zA-Z0-9]+)$/);
  const resourceId = idMatch ? idMatch[2] : null;
  
  // Equipment endpoints
  if (url.includes('/equipment') && method === 'get') {
    // Specific equipment by ID
    if (resourceId) {
      return {
        success: true,
        data: {
          _id: resourceId,
          name: 'Pioneer CDJ-3000',
          category: 'sound',
          description: 'Профессиональный DJ-плеер с большим дисплеем и продвинутыми функциями',
          price: 2500,
          priceUnit: 'day',
          images: [DEFAULT_IMAGES.EQUIPMENT],
          status: 'available',
          specifications: {
            brand: 'Pioneer DJ',
            model: 'CDJ-3000',
            connectivity: ['USB', 'Link', 'SD Card'],
            dimensions: '443 x 114 x 404 mm',
            weight: '5.5 kg'
          },
          createdAt: new Date('2023-01-15').toISOString(),
          updatedAt: new Date('2023-02-20').toISOString()
        }
      };
    }
    
    // List of equipment
    return {
      success: true,
      data: [
        {
          _id: 'e1',
          name: 'Pioneer CDJ-3000',
          category: 'sound',
          description: 'Профессиональный DJ-плеер с большим дисплеем',
          price: 2500,
          priceUnit: 'day',
          images: [DEFAULT_IMAGES.EQUIPMENT],
          status: 'available'
        },
        {
          _id: 'e2',
          name: 'Allen & Heath Xone:96',
          category: 'sound',
          description: 'Профессиональный DJ-микшер с аналоговым фильтром',
          price: 1800,
          priceUnit: 'day',
          images: [DEFAULT_IMAGES.EQUIPMENT],
          status: 'available'
        },
        {
          _id: 'e3',
          name: 'KV2 Audio ES System',
          category: 'sound',
          description: 'Активная акустическая система высокой мощности',
          price: 5000,
          priceUnit: 'day',
          images: [DEFAULT_IMAGES.EQUIPMENT],
          status: 'available'
        },
        {
          _id: 'e4',
          name: 'Martin MAC Aura XB',
          category: 'light',
          description: 'Компактный светодиодный прибор с эффектом заливки',
          price: 1200,
          priceUnit: 'day',
          images: [DEFAULT_IMAGES.EQUIPMENT],
          status: 'available'
        },
        {
          _id: 'e5',
          name: 'Stage Deck 2x1m',
          category: 'stage',
          description: 'Прочная сценическая площадка с регулируемой высотой',
          price: 500,
          priceUnit: 'event',
          images: [DEFAULT_IMAGES.EQUIPMENT],
          status: 'available'
        },
        {
          _id: 'e6',
          name: 'Fog Machine Antari Z-3000',
          category: 'other',
          description: 'Мощная дым-машина для создания эффектов',
          price: 300,
          priceUnit: 'day',
          images: [DEFAULT_IMAGES.EQUIPMENT],
          status: 'available'
        }
      ],
      count: 6,
      total: 6,
      pagination: {
        page: 1,
        limit: PAGE_SIZES.DEFAULT,
        total: 6,
        totalPages: 1
      }
    };
  }
  
  // Events endpoint
  if (url.includes('/events') && method === 'get') {
    // Specific event by ID
    if (resourceId) {
      return {
        success: true,
        data: {
          _id: resourceId,
          title: 'Sample Event',
          description: 'This is a sample event description from mock data',
          date: new Date().toISOString(),
          time: '22:00 - 06:00',
          location: 'Main Hall',
          image: DEFAULT_IMAGES.EVENT,
          status: EVENT_STATUSES.UPCOMING,
          featured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
    
    // List of events
    return {
      success: true,
      data: [
        {
          _id: '1',
          title: 'Night Grooves',
          description: 'A night of deep house and techno',
          date: new Date('2023-05-15').toISOString(),
          time: '22:00 - 06:00',
          location: 'Main Hall',
          image: DEFAULT_IMAGES.EVENT,
          status: EVENT_STATUSES.UPCOMING,
          featured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Ambient Session',
          description: 'Relaxing ambient music evening',
          date: new Date('2023-05-20').toISOString(),
          time: '20:00 - 02:00',
          location: 'Chill Room',
          image: DEFAULT_IMAGES.EVENT,
          status: EVENT_STATUSES.UPCOMING,
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      count: 2,
      total: 2,
      pagination: {
        page: 1,
        limit: PAGE_SIZES.DEFAULT,
        total: 2
      }
    };
  }
  
  // News endpoint
  if (url.includes('/news') && method === 'get') {
    // Specific news by ID
    if (resourceId) {
      return {
        success: true,
        data: {
          _id: resourceId,
          title: 'Sample News',
          content: 'This is a sample news article from mock data',
          summary: 'Mock news sample',
          image: DEFAULT_IMAGES.NEWS,
          publishDate: new Date().toISOString(),
          status: 'published',
          featured: true,
          tags: ['mock', 'sample', 'news'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
    
    // List of news
    return {
      success: true,
      data: [
        {
          _id: '1',
          title: 'New Season Opening',
          content: 'We are excited to announce the opening of our new season!',
          summary: 'New season announcement',
          image: DEFAULT_IMAGES.NEWS,
          publishDate: new Date().toISOString(),
          status: 'published',
          featured: true,
          tags: ['season', 'opening', 'announcement'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Sound System Upgrade',
          content: 'We have upgraded our sound system for an even better experience!',
          summary: 'Sound system improvements',
          image: DEFAULT_IMAGES.NEWS,
          publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'published',
          featured: false,
          tags: ['sound', 'upgrade', 'improvements'],
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      count: 2,
      total: 2,
      pagination: {
        page: 1,
        limit: PAGE_SIZES.DEFAULT,
        total: 2
      }
    };
  }
  
  // Auth endpoints - login mock
  if (url.includes('/auth/login') && method === 'post') {
    return {
      success: true,
      token: 'mock-jwt-token-for-testing-purposes-only',
      user: {
        id: 'admin-id',
        username: 'admin',
        role: 'admin'
      }
    };
  }
  
  // Auth endpoints - current user mock
  if (url.includes('/auth/me') && method === 'get') {
    return {
      success: true,
      user: {
        id: 'admin-id',
        username: 'admin',
        role: 'admin'
      }
    };
  }
  
  // Spaces endpoints
  if (url.includes('/spaces') && method === 'get') {
    // Specific space by ID (includes both /spaces/:id and /spaces/custom/:id)
    if (url.match(/\/spaces\/(custom\/)?[a-zA-Z0-9-_]+$/)) {
      const customIdMatch = url.match(/\/spaces\/custom\/([a-zA-Z0-9-_]+)$/);
      const idMatch = url.match(/\/spaces\/([a-zA-Z0-9-_]+)$/);
      
      const id = customIdMatch ? null : (idMatch ? idMatch[1] : null);
      const customId = customIdMatch ? customIdMatch[1] : null;
      
      return {
        success: true,
        data: {
          _id: id || 's1',
          name: 'Главный зал',
          description: 'Просторный зал с качественной звуковой системой и танцполом',
          capacity: 500,
          area: 300,
          image: DEFAULT_IMAGES.SPACE,
          equipment: ['DJ-пульт', 'Акустическая система', 'Световое оборудование'],
          status: 'available',
          customId: customId || 'main-hall',
          features: ['Бар', 'Гардероб', 'Кондиционер'],
          pricePerHour: 1000,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
    
    // List of spaces
    return {
      success: true,
      count: 3,
      total: 3,
      data: [
        {
          _id: 's1',
          name: 'Главный зал',
          description: 'Просторный зал с качественной звуковой системой и танцполом',
          capacity: 500,
          area: 300,
          image: DEFAULT_IMAGES.SPACE,
          status: 'available',
          customId: 'main-hall',
          pricePerHour: 1000
        },
        {
          _id: 's2',
          name: 'Малый зал',
          description: 'Уютное пространство для небольших мероприятий и камерных выступлений',
          capacity: 100,
          area: 80,
          image: DEFAULT_IMAGES.SPACE,
          status: 'available',
          customId: 'small-hall',
          pricePerHour: 500
        },
        {
          _id: 's3',
          name: 'Лаунж-зона',
          description: 'Комфортное пространство для отдыха с мягкой мебелью',
          capacity: 50,
          area: 60,
          image: DEFAULT_IMAGES.SPACE,
          status: 'available',
          customId: 'lounge',
          pricePerHour: 300
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1
      }
    };
  }
  
  // Residents endpoints
  if (url.includes('/residents') && method === 'get') {
    // Specific resident by ID
    if (url.match(/\/residents\/[a-zA-Z0-9-_]+$/)) {
      const idMatch = url.match(/\/residents\/([a-zA-Z0-9-_]+)$/);
      const id = idMatch ? idMatch[1] : 'r1';
      
      return {
        success: true,
        data: {
          _id: id,
          name: 'DJ Techno',
          bio: 'Опытный диджей с многолетним стажем в жанре техно',
          image: DEFAULT_IMAGES.RESIDENT,
          genres: ['Techno', 'Deep House', 'Minimal'],
          socialLinks: {
            instagram: 'https://instagram.com/djtechno',
            soundcloud: 'https://soundcloud.com/djtechno'
          },
          featured: true,
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
    
    // List of residents
    return {
      success: true,
      count: 3,
      total: 3,
      data: [
        {
          _id: 'r1',
          name: 'DJ Techno',
          bio: 'Опытный диджей с многолетним стажем в жанре техно',
          image: DEFAULT_IMAGES.RESIDENT,
          genres: ['Techno', 'Deep House', 'Minimal'],
          featured: true
        },
        {
          _id: 'r2',
          name: 'DJ House',
          bio: 'Специалист по house музыке во всех ее проявлениях',
          image: DEFAULT_IMAGES.RESIDENT,
          genres: ['House', 'Tech House', 'Progressive House'],
          featured: true
        },
        {
          _id: 'r3',
          name: 'Ambient Producer',
          bio: 'Создает атмосферные эмбиент композиции',
          image: DEFAULT_IMAGES.RESIDENT,
          genres: ['Ambient', 'Chillout', 'Atmospheric'],
          featured: false
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1
      }
    };
  }
  
  // Для других endpoint'ов возвращаем null
  return null;
}

export default api;