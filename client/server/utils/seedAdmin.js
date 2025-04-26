const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Не подключаемся к БД здесь, используем существующее подключение
    // Это предотвращает создание нового соединения
    
    // Проверяем, существует ли уже пользователь с ролью admin
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Администратор уже существует:', adminExists.username);
      return;
    }
    
    // Создаем администратора
    const admin = await User.create({
      username: 'admin',
      password: 'admin123', // В реальном проекте нужен сложный пароль
      role: 'admin'
    });
    
    console.log(`Администратор создан: ${admin.username}`);
    console.log('Пожалуйста, смените пароль после первого входа!');
    
  } catch (err) {
    console.error('Ошибка при создании администратора:', err);
    // Пробрасываем ошибку, но не закрываем соединение
    throw err;
  }
  // Удалили finally блок с закрытием соединения
};

// Проверяем, запущен ли скрипт напрямую (не импортирован)
if (require.main === module) {
  connectDB()
    .then(() => createAdminUser())
    .finally(() => mongoose.disconnect());
}

module.exports = createAdminUser;