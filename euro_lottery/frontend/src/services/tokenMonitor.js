import store from '../store';
import { refreshToken, logoutUser } from '../store/slices/authSlice';
import { checkTokenExpiration } from './authInit';

/**
 * Класс для мониторинга JWT токенов
 * - Отслеживает срок действия токенов
 * - Запускает периодическую проверку
 * - Автоматически обновляет токены
 */
class TokenMonitor {
  constructor() {
    this.monitorInterval = null;
    this.checkFrequency = 60000; // Проверка каждую минуту
    this.tokenRefreshBuffer = 5 * 60 * 1000; // Обновлять за 5 минут до истечения срока
  }
  
  /**
   * Начать мониторинг токенов
   */
  startMonitoring() {
    if (this.monitorInterval) {
      this.stopMonitoring();
    }
    
    // Запускаем мониторинг с указанной частотой
    this.monitorInterval = setInterval(() => {
      this.checkTokens();
    }, this.checkFrequency);
    
    console.log('Token monitoring started');
    
    // Сразу выполняем первую проверку
    this.checkTokens();
    
    return this;
  }
  
  /**
   * Остановить мониторинг токенов
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('Token monitoring stopped');
    }
    
    return this;
  }
  
  /**
   * Проверка токенов и их обновление при необходимости
   */
  async checkTokens() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Если нет токенов, прекращаем мониторинг
      if (!accessToken || !refreshToken) {
        this.stopMonitoring();
        return false;
      }
      
      // Проверка срока действия refresh токена
      const isRefreshExpired = checkTokenExpiration(refreshToken);
      if (isRefreshExpired) {
        console.log('Refresh token expired, logging out...');
        // Если refresh токен истек, выполняем выход
        store.dispatch(logoutUser());
        this.stopMonitoring();
        return false;
      }
      
      // Для access токена проверяем, не истекает ли он скоро
      try {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const tokenExpiry = tokenPayload.exp * 1000; // Переводим в миллисекунды
        const currentTime = Date.now();
        const timeUntilExpiry = tokenExpiry - currentTime;
        
        // Если токен истекает в ближайшие 5 минут, обновляем его
        if (timeUntilExpiry <= this.tokenRefreshBuffer) {
          console.log(`Access token expires in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes, refreshing...`);
          store.dispatch(refreshToken());
        }
      } catch (error) {
        console.error('Error checking access token expiry:', error);
        // Если не удалось проверить токен, пробуем его обновить
        store.dispatch(refreshToken());
      }
      
      return true;
    } catch (error) {
      console.error('Token check error:', error);
      return false;
    }
  }
  
  /**
   * Проверка аутентификации пользователя
   * @returns {boolean} true если пользователь аутентифицирован
   */
  isAuthenticated() {
    const state = store.getState();
    return state.auth.isAuthenticated;
  }
}

// Создаем и экспортируем синглтон
const tokenMonitor = new TokenMonitor();
export default tokenMonitor;