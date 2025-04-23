// Middleware для асинхронных обработчиков
// Обертывает асинхронные функции контроллеров для единообразной обработки ошибок
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;