const PromotionContact = require('../models/PromotionContact');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all promotion contacts
// @route   GET /api/promotion-contacts
// @access  Private
exports.getPromotionContacts = asyncHandler(async (req, res, next) => {
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
  query = PromotionContact.find(JSON.parse(queryStr));
  
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
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await PromotionContact.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Выполнение запроса
  const contacts = await query;
  
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
    count: contacts.length,
    total,
    pagination,
    data: contacts
  });
});

// @desc    Get single promotion contact
// @route   GET /api/promotion-contacts/:id
// @access  Private
exports.getPromotionContact = asyncHandler(async (req, res, next) => {
  const contact = await PromotionContact.findById(req.params.id);
  
  if (!contact) {
    return next(new ErrorResponse(`Заявка с ID ${req.params.id} не найдена`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: contact
  });
});

// @desc    Create new promotion contact
// @route   POST /api/promotion-contacts
// @access  Public
exports.createPromotionContact = asyncHandler(async (req, res, next) => {
  const contact = await PromotionContact.create(req.body);
  
  res.status(201).json({
    success: true,
    data: contact
  });
});

// @desc    Update promotion contact
// @route   PUT /api/promotion-contacts/:id
// @access  Private
exports.updatePromotionContact = asyncHandler(async (req, res, next) => {
  let contact = await PromotionContact.findById(req.params.id);
  
  if (!contact) {
    return next(new ErrorResponse(`Заявка с ID ${req.params.id} не найдена`, 404));
  }
  
  contact = await PromotionContact.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: contact
  });
});

// @desc    Delete promotion contact
// @route   DELETE /api/promotion-contacts/:id
// @access  Private
exports.deletePromotionContact = asyncHandler(async (req, res, next) => {
  const contact = await PromotionContact.findById(req.params.id);
  
  if (!contact) {
    return next(new ErrorResponse(`Заявка с ID ${req.params.id} не найдена`, 404));
  }
  
  await contact.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});