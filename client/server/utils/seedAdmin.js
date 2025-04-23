const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await connectDB();
    
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
  } finally {
    await mongoose.disconnect();
    console.log('Соединение с базой данных закрыто');
  }
};

// Проверяем, запущен ли скрипт напрямую (не импортирован)
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;