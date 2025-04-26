const User = require('../models/User');
require('dotenv').config();

/**
 * Создает пользователя с правами администратора, если такой еще не существует
 * Использует существующее соединение с базой данных
 */
const createAdminUser = async () => {
  try {
    // Проверяем, существует ли уже пользователь с ролью admin
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Администратор уже существует:', adminExists.username);
      return adminExists;
    }
    
    // Проверяем тип среды и используем более безопасный пароль для production
    const password = process.env.NODE_ENV === 'production' 
      ? process.env.ADMIN_INITIAL_PASSWORD || 'Admin@' + Math.random().toString(36).substring(2, 10)
      : 'admin123';
    
    // Создаем администратора
    const admin = await User.create({
      username: 'admin',
      password: password, 
      role: 'admin'
    });
    
    console.log(`Администратор создан: ${admin.username}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('ВАЖНО: Установлен случайный пароль для администратора!');
      console.log('Смените пароль после первого входа.');
    } else {
      console.log('Пароль для разработки: admin123');
      console.log('В production будет использован другой пароль.');
    }
    
    return admin;
  } catch (err) {
    console.error('Ошибка при создании администратора:', err);
    
    // Игнорируем ошибку дубликата ключа (администратор уже существует)
    if (err.code === 11000) {
      console.log('Администратор уже существует (обнаружено по ошибке дубликата)');
      return null;
    }
    
    // Пробрасываем другие ошибки дальше
    throw err;
  }
};

module.exports = createAdminUser;