const Space = require('../models/Space');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');

// @desc    Get all spaces
// @route   GET /api/spaces
// @access  Public
exports.getSpaces = asyncHandler(async (req, res, next) => {
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
  query = Space.find(JSON.parse(queryStr));
  
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
    query = query.sort('name');
  }
  
  // Пагинация
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Space.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Выполнение запроса
  const spaces = await query;
  
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
    count: spaces.length,
    total,
    pagination,
    data: spaces
  });
});

// @desc    Get single space
// @route   GET /api/spaces/:id
// @access  Public
exports.getSpace = asyncHandler(async (req, res, next) => {
  const space = await Space.findById(req.params.id);
  
  if (!space) {
    return next(new ErrorResponse(`Пространство с ID ${req.params.id} не найдено`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: space
  });
});

// @desc    Get space by custom id
// @route   GET /api/spaces/custom/:customId
// @access  Public
exports.getSpaceByCustomId = asyncHandler(async (req, res, next) => {
  const space = await Space.findOne({ id: req.params.customId });
  
  if (!space) {
    return next(new ErrorResponse(`Пространство с ID ${req.params.customId} не найдено`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: space
  });
});

// @desc    Create new space
// @route   POST /api/spaces
// @access  Private
exports.createSpace = asyncHandler(async (req, res, next) => {
  const space = await Space.create(req.body);
  
  res.status(201).json({
    success: true,
    data: space
  });
});

// @desc    Update space
// @route   PUT /api/spaces/:id
// @access  Private
exports.updateSpace = asyncHandler(async (req, res, next) => {
  let space = await Space.findById(req.params.id);
  
  if (!space) {
    return next(new ErrorResponse(`Пространство с ID ${req.params.id} не найдено`, 404));
  }
  
  space = await Space.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: space
  });
});

// @desc    Delete space
// @route   DELETE /api/spaces/:id
// @access  Private
exports.deleteSpace = asyncHandler(async (req, res, next) => {
  const space = await Space.findById(req.params.id);
  
  if (!space) {
    return next(new ErrorResponse(`Пространство с ID ${req.params.id} не найдено`, 404));
  }
  
  await space.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload image for space
// @route   PUT /api/spaces/:id/image
// @access  Private
exports.spaceImageUpload = asyncHandler(async (req, res, next) => {
  const space = await Space.findById(req.params.id);
  
  if (!space) {
    return next(new ErrorResponse(`Пространство с ID ${req.params.id} не найдено`, 404));
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
  file.name = `space_${space._id}_${Date.now()}${path.parse(file.name).ext}`;
  
  // Сохраняем файл
  file.mv(`${process.env.FILE_UPLOAD_PATH}/spaces/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Проблема с загрузкой файла', 500));
    }
    
    // Добавляем новое изображение в массив
    const updatedImages = [...space.images, `/uploads/spaces/${file.name}`];
    
    // Обновляем базу данных
    await Space.findByIdAndUpdate(req.params.id, { 
      images: updatedImages 
    });
    
    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});