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

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: parseInt(API_TIMEOUT, 10)
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
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
    return response;
  },
  async (error) => {
    // Create a safe error message
    let errorMessage;
    try {
      errorMessage = getErrorMessage(error);
    } catch (e) {
      errorMessage = 'Ошибка обработки API запроса';
    }
    
    // Format error for logging (without circular references)
    const formattedError = {
      url: error.config?.url || 'unknown',
      method: error.config?.method?.toUpperCase() || 'unknown',
      status: error.response?.status || 0,
      message: errorMessage
    };
    
    // Log error in non-production only
    if (!IS_PRODUCTION) {
      console.error('API Error:', formattedError);
    }
    
    // Handle network errors with fallback data in development
    if (error.message === 'Network Error' && !IS_PRODUCTION) {
      const url = error.config?.url;
      const method = error.config?.method;
      
      const mockData = getMockDataForEndpoint(url, method);
      if (mockData) {
        console.warn(`Using mock data for ${method} ${url} due to network error`);
        return Promise.resolve({ data: mockData });
      }
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
  
  // Для других endpoint'ов возвращаем null
  return null;
}

export default api;