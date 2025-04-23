const Promotion = require('../models/Promotion');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const fs = require('fs');

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Public
exports.getPromotions = asyncHandler(async (req, res, next) => {
  let query;
  
  // Копируем req.query
  const reqQuery = { ...req.query };
  
  // Поля для исключения
  const removeFields = ['select', 'sort', 'page', 'limit'];
  
  // Удаляем поля из запроса
  removeFields.forEach(param => delete reqQuery[param]);
  
  // Создаем строку запроса
  let queryStr = JSON.stringify(reqQuery);
  
  // Создаем операторы ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Находим все записи
  query = Promotion.find(JSON.parse(queryStr));
  
  // Выбор полей
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Сортировка
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('order');
  }
  
  // Пагинация
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Promotion.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Выполнение запроса
  const promotions = await query;
  
  // Объект пагинации
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: promotions.length,
    total,
    pagination,
    data: promotions
  });
});

// @desc    Get single promotion
// @route   GET /api/promotions/:id
// @access  Public
exports.getPromotion = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.findById(req.params.id);
  
  if (!promotion) {
    return next(new ErrorResponse(`Услуга с ID ${req.params.id} не найдена`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: promotion
  });
});

// @desc    Create new promotion
// @route   POST /api/promotions
// @access  Private
exports.createPromotion = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.create(req.body);
  
  res.status(201).json({
    success: true,
    data: promotion
  });
});

// @desc    Update promotion
// @route   PUT /api/promotions/:id
// @access  Private
exports.updatePromotion = asyncHandler(async (req, res, next) => {
  let promotion = await Promotion.findById(req.params.id);
  
  if (!promotion) {
    return next(new ErrorResponse(`Услуга с ID ${req.params.id} не найдена`, 404));
  }
  
  promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: promotion
  });
});

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
// @access  Private
exports.deletePromotion = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.findById(req.params.id);
  
  if (!promotion) {
    return next(new ErrorResponse(`Услуга с ID ${req.params.id} не найдена`, 404));
  }
  
  await promotion.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload photo for promotion
// @route   PUT /api/promotions/:id/photo
// @access  Private
exports.promotionPhotoUpload = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.findById(req.params.id);
  
  if (!promotion) {
    return next(new ErrorResponse(`Услуга с ID ${req.params.id} не найдена`, 404));
  }
  
  if (!req.files) {
    return next(new ErrorResponse('Пожалуйста, загрузите файл', 400));
  }
  
  const file = req.files.file;
  
  // Проверка формата файла
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Пожалуйста, загрузите файл изображения', 400));
  }
  
  // Проверка размера
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(new ErrorResponse(`Пожалуйста, загрузите изображение размером менее ${process.env.MAX_FILE_UPLOAD}`, 400));
  }
  
  // Создаем имя файла
  file.name = `promotion_${promotion._id}${path.parse(file.name).ext}`;
  
  // Сохраняем файл
  file.mv(`${process.env.FILE_UPLOAD_PATH}/promotions/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Проблема с загрузкой файла', 500));
    }
    
    // Удаляем старое изображение, если оно существует и не является дефолтным
    if (promotion.image && promotion.image !== '/images/event-placeholder.jpg' && 
        fs.existsSync(`${process.env.FILE_UPLOAD_PATH}${promotion.image}`)) {
      fs.unlinkSync(`${process.env.FILE_UPLOAD_PATH}${promotion.image}`);
    }
    
    // Обновляем базу данных
    await Promotion.findByIdAndUpdate(req.params.id, { 
      image: `/uploads/promotions/${file.name}` 
    });
    
    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});