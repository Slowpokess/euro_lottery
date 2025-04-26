const mongoose = require('mongoose');

// Глобальная переменная для хранения соединения
let connection = null;

/**
 * Подключение к MongoDB с улучшенной обработкой ошибок и повторными попытками
 */
const connectDB = async () => {
  // Если соединение уже установлено и открыто, повторно использовать его
  if (connection && mongoose.connection.readyState === 1) {
    return connection;
  }
  
  try {
    // Получение строки подключения из переменных окружения
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('MONGO_URI не определен в переменных окружения');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI должен быть определен в production окружении');
      }
      console.log('В режиме разработки можно продолжить без БД');
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
      // Добавляем keepAlive для стабильности соединения
      keepAlive: true,
      keepAliveInitialDelay: 300000
    };
    
    // Установка соединения
    connection = await mongoose.connect(mongoURI, options);
    console.log(`MongoDB подключена: ${connection.connection.host}`);
    
    // Обработчики событий соединения
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB отключена - попытка переподключения');
      connection = null;
      
      // В production режиме критическая ошибка при потере соединения
      if (process.env.NODE_ENV === 'production') {
        console.error('КРИТИЧЕСКАЯ ОШИБКА: Потеря соединения с MongoDB в production режиме');
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
    });
    
    return connection;
  } catch (error) {
    console.error(`Ошибка подключения к MongoDB: ${error.message}`);
    
    // В production завершаем процесс при критической ошибке
    if (process.env.NODE_ENV === 'production') {
      console.error('КРИТИЧЕСКАЯ ОШИБКА: не удалось подключиться к базе данных в production режиме');
      // Мы не завершаем процесс немедленно, чтобы позволить API вернуть ошибку 503
      // вместо того, чтобы полностью крашить сервис
    } else {
      // В режиме разработки можно продолжить без БД
      console.log('Продолжение без подключения к БД (только для разработки)');
    }
    
    return null;
  }
};

module.exports = connectDB;