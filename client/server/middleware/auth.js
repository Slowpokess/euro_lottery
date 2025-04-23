const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware для проверки JWT токена
exports.protect = async (req, res, next) => {
  let token;

  console.log('Защита маршрута. Заголовки запроса:', {
    authorization: req.headers.authorization
  });

  // Проверяем, есть ли токен в заголовке
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Получаем токен из заголовка
    token = req.headers.authorization.split(' ')[1];
    console.log('Токен получен из заголовка');
  }

  // Проверяем, есть ли токен
  if (!token) {
    console.log('Ошибка: токен не предоставлен');
    return res.status(401).json({
      success: false,
      error: 'Нет доступа, токен не предоставлен'
    });
  }

  try {
    // Верификация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Токен успешно верифицирован', { userId: decoded.id });

    // Получаем пользователя из базы данных
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      console.log('Ошибка: пользователь с токеном не найден', { userId: decoded.id });
      return res.status(401).json({
        success: false,
        error: 'Пользователь с этим токеном не найден'
      });
    }

    console.log('Пользователь аутентифицирован', { 
      userId: req.user._id, 
      role: req.user.role 
    });
    next();
  } catch (error) {
    console.log('Ошибка верификации токена:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Нет доступа, токен недействителен'
    });
  }
};

// Middleware для проверки роли пользователя
exports.authorize = (roles) => {
  return (req, res, next) => {
    // Проверяем, является ли roles массивом, если нет - преобразуем в массив
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    console.log('Проверка прав доступа', { 
      userRole: req.user.role, 
      allowedRoles: allowedRoles 
    });
    
    if (!allowedRoles.includes(req.user.role)) {
      console.log('Ошибка: недостаточно прав', { 
        userRole: req.user.role, 
        requiredRoles: allowedRoles 
      });
      return res.status(403).json({
        success: false,
        error: `У вас нет прав для выполнения этого действия. Требуется роль: ${allowedRoles.join(' или ')}`
      });
    }
    
    console.log('Доступ разрешен', { role: req.user.role });
    next();
  };
};