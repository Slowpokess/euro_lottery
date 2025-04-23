import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

// Constants for storage keys
const TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;
const USER_DATA_KEY = STORAGE_KEYS.USER;
const TOKEN_EXPIRY_KEY = STORAGE_KEYS.AUTH_TOKEN_EXPIRY;

// JWT token storage with better security (memory + httpOnly cookie ideal,
// but for now implementing improved localStorage handling)
const tokenStorage = {
  // Save token with expiry metadata
  setToken: (token, expiresIn = '30d') => {
    try {
      // Store token
      localStorage.setItem(TOKEN_KEY, token);
      
      // Calculate and store expiry
      const expiryMs = expiresIn.endsWith('d') 
        ? parseInt(expiresIn) * 24 * 60 * 60 * 1000 
        : parseInt(expiresIn) * 1000;
      
      const expiryDate = new Date(Date.now() + expiryMs).toISOString();
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate);
      
      return true;
    } catch (error) {
      console.error('Error storing authentication token:', error);
      return false;
    }
  },
  
  // Get token if valid
  getToken: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      
      if (!token || !expiry) {
        return null;
      }
      
      // Check if token is expired
      if (new Date(expiry) < new Date()) {
        // Token expired, clean up
        tokenStorage.removeToken();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error retrieving authentication token:', error);
      return null;
    }
  },
  
  // Remove token
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      return true;
    } catch (error) {
      console.error('Error removing authentication token:', error);
      return false;
    }
  }
};

// User data storage (no sensitive info)
const userStorage = {
  setUserData: (userData) => {
    try {
      const sanitizedData = {
        isAuthenticated: true,
        username: userData.username,
        role: userData.role,
        id: userData.id
      };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(sanitizedData));
      
      // Также сохраняем в ключ admin для обеспечения совместимости
      localStorage.setItem('admin', JSON.stringify(sanitizedData));
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  },
  
  getUserData: () => {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },
  
  removeUserData: () => {
    try {
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem('admin'); // Также удаляем данные из 'admin'
      return true;
    } catch (error) {
      console.error('Error removing user data:', error);
      return false;
    }
  }
};

// Authorize user
export const login = async (credentials) => {
  try {
    // Input validation
    if (!credentials?.username || !credentials?.password) {
      throw new Error('Username and password are required');
    }
    
    const response = await api.post('/auth/login', credentials);
    
    if (response.data?.token) {
      // Store token with expiry
      tokenStorage.setToken(response.data.token);
      
      // Store user data
      if (response.data?.user) {
        userStorage.setUserData(response.data.user);
      }
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error.response?.data || error.message);
    }
    throw error.response ? error.response.data : error;
  }
};

// Get current user data from API
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    
    // Update stored user data if response is successful
    if (response.data?.success && response.data?.user) {
      userStorage.setUserData(response.data.user);
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching user data:', error.response?.data || error.message);
    }
    throw error.response ? error.response.data : error;
  }
};

// Get user role from storage
export const getUserRole = () => {
  const userData = userStorage.getUserData();
  return userData?.role || null;
};

// Logout user
export const logout = () => {
  tokenStorage.removeToken();
  userStorage.removeUserData();
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = tokenStorage.getToken();
  const userData = userStorage.getUserData();
  
  return Boolean(token && userData?.isAuthenticated === true);
};