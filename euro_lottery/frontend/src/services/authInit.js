import store from '../store';
import { refreshToken, setLoggedIn, logoutUser } from '../store/slices/authSlice';
import axios from 'axios';

/**
 * Инициализация состояния аутентификации при запуске приложения
 * - Проверяет валидность токенов
 * - Устанавливает начальное состояние аутентификации
 * - Настраивает автоматическое обновление токенов
 */
export const initAuth = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Если токены отсутствуют, пользователь не авторизован
    if (!accessToken || !refreshToken) {
      return false;
    }
    
    // Проверка срока действия access токена
    const isAccessTokenExpired = checkTokenExpiration(accessToken);
    
    // Проверка срока действия refresh токена
    const isRefreshTokenExpired = checkTokenExpiration(refreshToken);
    
    // Если refresh токен истек, выход из системы
    if (isRefreshTokenExpired) {
      await store.dispatch(logoutUser());
      return false;
    }
    
    // Если access токен истек, но refresh токен действителен, обновляем токены
    if (isAccessTokenExpired && !isRefreshTokenExpired) {
      try {
        const result = await store.dispatch(refreshToken());
        
        // Если обновление токена прошло успешно, получаем данные пользователя
        if (!result.error) {
          // Устанавливаем токен в заголовки запросов
          const newToken = localStorage.getItem('accessToken');
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Получаем данные пользователя из API
          const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/users/profile/`);
          
          // Устанавливаем состояние авторизации
          store.dispatch(setLoggedIn({
            user: response.data,
            access: newToken,
            refresh: localStorage.getItem('refreshToken')
          }));
          
          return true;
        }
      } catch (error) {
        console.error('Failed to refresh token during initialization:', error);
        await store.dispatch(logoutUser());
        return false;
      }
    } else if (!isAccessTokenExpired) {
      // Если access токен действителен, устанавливаем токен в заголовки запросов
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      try {
        // Получаем данные пользователя из API
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/users/profile/`);
        
        // Устанавливаем состояние авторизации
        store.dispatch(setLoggedIn({
          user: response.data,
          access: accessToken,
          refresh: refreshToken
        }));
        
        // Планируем обновление токена до истечения срока действия
        scheduleTokenRefresh(accessToken);
        
        return true;
      } catch (error) {
        console.error('Failed to fetch user profile during initialization:', error);
        
        // Если получение данных пользователя не удалось, пробуем обновить токен
        try {
          await store.dispatch(refreshToken());
          return true;
        } catch (refreshError) {
          console.error('Failed to refresh token after profile fetch failure:', refreshError);
          await store.dispatch(logoutUser());
          return false;
        }
      }
    }
  } catch (error) {
    console.error('Auth initialization error:', error);
    await store.dispatch(logoutUser());
    return false;
  }
  
  return false;
};

/**
 * Проверка срока действия JWT токена
 * @param {string} token - JWT токен для проверки
 * @returns {boolean} true если токен истек, false если действителен
 */
export const checkTokenExpiration = (token) => {
  try {
    // Извлекаем payload из JWT токена
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Текущее время в секундах (JWT использует секунды, а не миллисекунды)
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Проверяем срок действия токена
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    // В случае ошибки считаем токен недействительным
    return true;
  }
};

/**
 * Планирование автоматического обновления токена до истечения срока действия
 * @param {string} accessToken - Текущий JWT access токен
 */
export const scheduleTokenRefresh = (accessToken) => {
  try {
    // Извлекаем payload из JWT токена
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    
    // Вычисляем время до истечения срока действия токена (в миллисекундах)
    const expirationTime = payload.exp * 1000; // Конвертируем в миллисекунды
    const currentTime = Date.now();
    
    // Обновляем токен за 1 минуту до истечения срока действия
    const timeUntilRefresh = expirationTime - currentTime - (60 * 1000);
    
    // Если до истечения срока действия токена осталось положительное количество времени,
    // планируем обновление токена
    if (timeUntilRefresh > 0) {
      setTimeout(() => {
        store.dispatch(refreshToken());
      }, timeUntilRefresh);
      
      console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
    } else {
      // Если токен уже истек или истекает менее чем через минуту, обновляем его немедленно
      store.dispatch(refreshToken());
    }
  } catch (error) {
    console.error('Error scheduling token refresh:', error);
  }
};

export default {
  initAuth,
  checkTokenExpiration,
  scheduleTokenRefresh
};