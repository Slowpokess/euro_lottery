const Resident = require('../models/Resident');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const fs = require('fs');

// @desc    Get all residents
// @route   GET /api/residents
// @access  Public
exports.getResidents = asyncHandler(async (req, res, next) => {
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
  query = Resident.find(JSON.parse(queryStr));
  
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
    query = query.sort('-createdAt');
  }
  
  // Пагинация
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Resident.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Выполнение запроса
  const residents = await query;
  
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
    count: residents.length,
    total,
    pagination,
    data: residents
  });
});

// @desc    Get single resident
// @route   GET /api/residents/:id
// @access  Public
exports.getResident = asyncHandler(async (req, res, next) => {
  const resident = await Resident.findById(req.params.id);
  
  if (!resident) {
    return next(new ErrorResponse(`Резидент с ID ${req.params.id} не найден`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: resident
  });
});

// @desc    Create new resident
// @route   POST /api/residents
// @access  Private
exports.createResident = asyncHandler(async (req, res, next) => {
  const resident = await Resident.create(req.body);
  
  res.status(201).json({
    success: true,
    data: resident
  });
});

// @desc    Update resident
// @route   PUT /api/residents/:id
// @access  Private
exports.updateResident = asyncHandler(async (req, res, next) => {
  let resident = await Resident.findById(req.params.id);
  
  if (!resident) {
    return next(new ErrorResponse(`Резидент с ID ${req.params.id} не найден`, 404));
  }
  
  resident = await Resident.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: resident
  });
});

// @desc    Delete resident
// @route   DELETE /api/residents/:id
// @access  Private
exports.deleteResident = asyncHandler(async (req, res, next) => {
  const resident = await Resident.findById(req.params.id);
  
  if (!resident) {
    return next(new ErrorResponse(`Резидент с ID ${req.params.id} не найден`, 404));
  }
  
  await resident.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload photo for resident
// @route   PUT /api/residents/:id/photo
// @access  Private
exports.residentPhotoUpload = asyncHandler(async (req, res, next) => {
  const resident = await Resident.findById(req.params.id);
  
  if (!resident) {
    return next(new ErrorResponse(`Резидент с ID ${req.params.id} не найден`, 404));
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
  file.name = `resident_${resident._id}${path.parse(file.name).ext}`;
  
  // Сохраняем файл
  file.mv(`${process.env.FILE_UPLOAD_PATH}/residents/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Проблема с загрузкой файла', 500));
    }
    
    // Удаляем старое изображение, если оно существует и не является дефолтным
    if (resident.image && resident.image !== '/images/residents-placeholder.jpg' && 
        fs.existsSync(`${process.env.FILE_UPLOAD_PATH}${resident.image}`)) {
      fs.unlinkSync(`${process.env.FILE_UPLOAD_PATH}${resident.image}`);
    }
    
    // Обновляем базу данных
    await Resident.findByIdAndUpdate(req.params.id, { 
      image: `/uploads/residents/${file.name}` 
    });
    
    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});