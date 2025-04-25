const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Безопасный middleware для загрузки файлов с улучшенной валидацией
 * - Проверяет типы файлов по mimetype и расширению
 * - Использует crypto для генерации безопасных имен файлов
 * - Создает директории для загрузки, если они не существуют
 * - Включает ограничения размера и количества файлов
 */

// Разрешенные типы файлов с соответствующими расширениями и MIME-типами
const ALLOWED_FILE_TYPES = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimetypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  document: {
    extensions: ['.pdf'],
    mimetypes: ['application/pdf']
  }
};

// Создание безопасного пути загрузки в зависимости от типа ресурса
const getUploadPath = (resourceType) => {
  // Список валидных директорий ресурсов
  const validResources = ['events', 'equipment', 'news', 'promotions', 'residents', 'spaces'];
  
  // По умолчанию общая папка загрузок
  const resource = validResources.includes(resourceType) ? resourceType : 'general';
  
  // Конструируем полный путь
  // Используем переменную окружения FILE_UPLOAD_PATH, если она определена
  const baseUploadPath = process.env.FILE_UPLOAD_PATH || './uploads';
  const uploadPath = path.join(baseUploadPath, resource);
  
  // Проверяем существование директории
  try {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
  } catch (error) {
    console.error(`Ошибка создания директории ${uploadPath}: ${error.message}`);
    // В Vercel используем временную директорию в случае ошибки
    if (process.env.NODE_ENV === 'production') {
      return '/tmp';
    }
  }
  
  return uploadPath;
};

// Генерация безопасного имени файла
const generateSecureFilename = (file) => {
  // Получаем оригинальное расширение
  const originalExt = path.extname(file.originalname).toLowerCase();
  
  // Генерируем случайную строку похожую на UUID с помощью crypto
  const randomBytes = crypto.randomBytes(16).toString('hex');
  
  // Добавляем временную метку для дополнительной уникальности
  const timestamp = Date.now();
  
  // Комбинируем части для безопасного имени файла
  return `${timestamp}-${randomBytes}${originalExt}`;
};

// Извлечение типа ресурса из URL запроса
const getResourceType = (req) => {
  // Извлекаем тип ресурса из пути URL
  const urlParts = req.baseUrl.split('/');
  const resourceIndex = urlParts.indexOf('api') + 1;
  
  if (resourceIndex < urlParts.length) {
    return urlParts[resourceIndex];
  }
  
  return 'general';
};

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Определяем тип ресурса и получаем путь загрузки
      const resourceType = getResourceType(req);
      const uploadPath = getUploadPath(resourceType);
      
      cb(null, uploadPath);
    } catch (error) {
      cb(new ErrorResponse('Ошибка определения директории для загрузки файла', 500, 'Ошибка загрузки файла'));
    }
  },
  
  filename: (req, file, cb) => {
    try {
      const secureFilename = generateSecureFilename(file);
      cb(null, secureFilename);
    } catch (error) {
      cb(new ErrorResponse('Ошибка при создании имени файла', 500, 'Ошибка загрузки файла'));
    }
  }
});

// Улучшенный фильтр файлов с проверкой mimetype и расширения
const fileFilter = (req, file, cb) => {
  try {
    // Получаем расширение файла и проверяем, разрешено ли оно
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();
    
    // Проверяем, является ли это загрузкой изображения
    const isValidImage = 
      ALLOWED_FILE_TYPES.image.extensions.includes(ext) &&
      ALLOWED_FILE_TYPES.image.mimetypes.includes(mimetype);
    
    // Проверяем, является ли это загрузкой документа (PDF и т.д.)
    const isValidDocument = 
      ALLOWED_FILE_TYPES.document.extensions.includes(ext) &&
      ALLOWED_FILE_TYPES.document.mimetypes.includes(mimetype);
    
    if (isValidImage || isValidDocument) {
      cb(null, true);
    } else {
      cb(new ErrorResponse(
        'Недопустимый тип файла. Разрешены только JPG, PNG, GIF, WEBP и PDF файлы.',
        400,
        'Недопустимый тип файла. Разрешены только JPG, PNG, GIF, WEBP и PDF файлы.'
      ), false);
    }
  } catch (error) {
    cb(new ErrorResponse('Ошибка при проверке файла', 400, 'Ошибка при валидации файла'));
  }
};

// Инициализация multer с улучшенными настройками
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_UPLOAD ? parseInt(process.env.MAX_FILE_UPLOAD) : 5 * 1024 * 1024, // По умолчанию 5MB
    files: 5 // Максимум 5 файлов за один раз
  }
});

module.exports = upload;