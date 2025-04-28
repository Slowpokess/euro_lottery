const mongoose = require('mongoose');

// Глобальная переменная для хранения соединения
let connection = null;
let isConnecting = false;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 5000; // 5 секунд начальная задержка

/**
 * Подключение к MongoDB с улучшенной обработкой ошибок и повторными попытками
 */
const connectDB = async () => {
  // Если соединение уже установлено и открыто, повторно использовать его
  if (connection && mongoose.connection.readyState === 1) {
    return connection;
  }
  
  // Если уже идет процесс подключения, ждем его завершения
  if (isConnecting) {
    console.log('Подключение к MongoDB уже выполняется, ожидание...');
    // Ждем небольшой промежуток и проверяем снова
    await new Promise(resolve => setTimeout(resolve, 1000));
    return connectDB();
  }
  
  isConnecting = true;
  
  try {
    // Получение строки подключения из переменных окружения
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('MONGO_URI не определен в переменных окружения');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI должен быть определен в production окружении');
      }
      console.log('В режиме разработки можно продолжить без БД');
      isConnecting = false;
      return null;
    }
    
    // Настройки подключения с оптимизированными параметрами для Railway
    const options = {
      serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 30000 : 5000,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 10000 // Проверка состояния соединения каждые 10 секунд
    };
    
    // Установка соединения
    connection = await mongoose.connect(mongoURI, options);
    console.log(`MongoDB подключена: ${connection.connection.host}`);
    retryCount = 0; // Сбрасываем счетчик после успешного подключения
    
    // Обработчики событий соединения
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB отключена - автоматическая попытка переподключения');
      connection = null;
      
      // Пытаемся переподключиться с экспоненциальной задержкой
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        retryCount++;
        console.log(`Переподключение через ${delay / 1000} секунд (попытка ${retryCount}/${MAX_RETRIES})`);
        
        setTimeout(async () => {
          isConnecting = false;
          try {
            await connectDB();
          } catch (err) {
            console.error('Ошибка при попытке переподключения:', err);
          }
        }, delay);
      } else {
        console.error(`Превышено максимальное количество попыток (${MAX_RETRIES})`);
        
        // В production режиме критическая ошибка при потере соединения
        if (process.env.NODE_ENV === 'production') {
          console.error('КРИТИЧЕСКАЯ ОШИБКА: Потеря соединения с MongoDB в production режиме');
        }
      }
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Ошибка соединения с MongoDB:', err);
      if (process.env.NODE_ENV === 'production') {
        console.error('Критическая ошибка соединения в production режиме');
      }
    });
    
    // Настройка автоматического переподключения
    mongoose.connection.on('reconnected', () => {
      console.log('Переподключение к MongoDB выполнено успешно');
      retryCount = 0; // Сбрасываем счетчик после успешного переподключения
    });
    
    isConnecting = false;
    return connection;
  } catch (error) {
    console.error(`Ошибка подключения к MongoDB: ${error.message}`);
    
    // Автоматические повторные попытки при сбое первоначального подключения
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      retryCount++;
      console.log(`Повторная попытка подключения через ${delay / 1000} секунд (попытка ${retryCount}/${MAX_RETRIES})`);
      
      // Устанавливаем таймер для следующей попытки
      return new Promise(resolve => {
        setTimeout(async () => {
          isConnecting = false;
          try {
            const conn = await connectDB();
            resolve(conn);
          } catch (err) {
            console.error('Ошибка при повторной попытке подключения:', err);
            resolve(null);
          }
        }, delay);
      });
    }
    
    // В production режиме показываем критическую ошибку
    if (process.env.NODE_ENV === 'production') {
      console.error('КРИТИЧЕСКАЯ ОШИБКА: не удалось подключиться к базе данных в production режиме');
      // Мы не завершаем процесс немедленно, чтобы позволить API вернуть ошибку 503
    } else {
      // В режиме разработки можно продолжить без БД
      console.log('Продолжение без подключения к БД (только для разработки)');
    }
    
    isConnecting = false;
    return null;
  }
};

module.exports = connectDB;