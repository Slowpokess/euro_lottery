const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Генерация JWT токена
const generateToken = (id) => {
  console.log('Генерация токена для пользователя:', id);
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d' // По умолчанию 30 дней, если не указано
  });
  console.log('Токен успешно сгенерирован');
  return token;
};

// @desc    Регистрация пользователя
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Проверяем, существует ли пользователь
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким именем уже существует'
      });
    }

    // Создаем пользователя
    const user = await User.create({
      username,
      password
    });

    // Создаем токен
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Авторизация пользователя
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    console.log('Попытка входа:', { username: req.body.username });
    const { username, password } = req.body;

    // Проверяем, заполнены ли поля
    if (!username || !password) {
      console.log('Ошибка входа: не заполнены поля');
      return res.status(400).json({
        success: false,
        error: 'Пожалуйста, укажите имя пользователя и пароль'
      });
    }

    // Ищем пользователя в базе данных
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      console.log('Ошибка входа: пользователь не найден');
      return res.status(401).json({
        success: false,
        error: 'Неверные учетные данные'
      });
    }

    // Проверяем совпадение пароля
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Ошибка входа: неверный пароль');
      return res.status(401).json({
        success: false,
        error: 'Неверные учетные данные'
      });
    }

    // Создаем токен
    const token = generateToken(user._id);

    console.log('Успешный вход:', { 
      userId: user._id, 
      username: user.username,
      role: user.role 
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка при входе:', error.message);
    next(error);
  }
};

// @desc    Получение данных текущего пользователя
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user установлен middleware auth.protect
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};