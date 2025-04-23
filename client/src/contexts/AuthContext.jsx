import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  login as authLogin, 
  getCurrentUser, 
  logout as authLogout, 
  isAuthenticated as checkAuth,
  getUserRole
} from '../services/auth';
import { STORAGE_KEYS } from '../utils/constants';

// Создание контекста авторизации с начальными значениями для совместимости с React 19
export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: () => {},
  hasRole: () => false,
  getUserRole: () => null
});

// Хук для использования контекста авторизации с проверкой
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Провайдер контекста авторизации
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Проверка статуса авторизации при загрузке
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setLoading(true);
        
        // Проверяем авторизацию по локальным данным
        const isAuth = checkAuth();
        
        // Также проверяем данные из 'admin' для обратной совместимости
        const adminData = localStorage.getItem('admin');
        const hasAdminData = adminData ? JSON.parse(adminData)?.isAuthenticated : false;
        
        if (isAuth || hasAdminData) {
          // Если есть локальная авторизация, проверяем токен через API
          try {
            // Получаем данные пользователя из localStorage
            let userData;
            
            if (hasAdminData) {
              userData = JSON.parse(adminData);
              // Синхронизируем с основным хранилищем
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
            } else {
              const storedUserData = localStorage.getItem(STORAGE_KEYS.USER);
              userData = storedUserData ? JSON.parse(storedUserData) : null;
            }
            
            if (userData) {
              setUser({
                username: userData.username,
                role: userData.role,
                id: userData.id
              });
              setIsAuthenticated(true);
            }
            
            // Дополнительно обновляем данные с сервера
            try {
              const apiUserData = await getCurrentUser();
              if (apiUserData?.user) {
                setUser({
                  username: apiUserData.user.username,
                  role: apiUserData.user.role,
                  id: apiUserData.user.id
                });
                setIsAuthenticated(true);
              }
            } catch (apiError) {
              console.error('Ошибка при обновлении данных пользователя:', apiError);
              // Не сбрасываем авторизацию, если уже есть локальные данные
              if (!userData) {
                authLogout();
                setIsAuthenticated(false);
                setUser(null);
              }
            }
          } catch (error) {
            // Если токен недействителен, очищаем данные
            authLogout();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        setError(error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // Функция авторизации
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await authLogin(credentials);
      
      setUser({
        username: data.user.username,
        role: data.user.role,
        id: data.user.id
      });
      setIsAuthenticated(true);
      
      return data;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Функция выхода
  const logout = () => {
    authLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Функция проверки роли
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  // Значение контекста
  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    getUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};