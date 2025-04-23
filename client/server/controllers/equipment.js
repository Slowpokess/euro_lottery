const Equipment = require('../models/Equipment');
const fs = require('fs');
const path = require('path');

// @desc    Получение всего оборудования
// @route   GET /api/equipment
// @access  Public
exports.getEquipment = async (req, res, next) => {
  try {
    const { category, status, limit = 10, skip = 0, sort = 'name' } = req.query;
    
    // Формируем запрос
    let query = {};
    
    // Фильтрация по категории
    if (category) {
      query.category = category;
    }
    
    // Фильтрация по статусу
    if (status) {
      query.status = status;
    }
    
    // Получаем оборудование
    const equipment = await Equipment.find(query)
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    // Получаем общее количество оборудования
    const total = await Equipment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: equipment.length,
      total,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получение конкретного оборудования
// @route   GET /api/equipment/:id
// @access  Public
exports.getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Оборудование не найдено'
      });
    }
    
    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Создание оборудования
// @route   POST /api/equipment
// @access  Private (admin, editor)
exports.createEquipment = async (req, res, next) => {
  try {
    console.log('Создание оборудования пользователем:', {
      userId: req.user._id,
      role: req.user.role,
      username: req.user.username
    });
    
    console.log('Полученные данные:', {
      name: req.body.name,
      category: req.body.category,
      filesReceived: req.files ? req.files.length : 0
    });
    
    // Добавляем изображения, если они загружены
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => `/uploads/equipment/${file.filename}`);
      console.log('Добавлены изображения:', req.body.images);
    }
    
    // Создаем оборудование
    const equipment = await Equipment.create(req.body);
    console.log('Оборудование успешно создано с ID:', equipment._id);
    
    res.status(201).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Ошибка при создании оборудования:', error.message);
    next(error);
  }
};

// @desc    Обновление оборудования
// @route   PUT /api/equipment/:id
// @access  Private (admin, editor)
exports.updateEquipment = async (req, res, next) => {
  try {
    console.log('Обновление оборудования пользователем:', {
      userId: req.user._id,
      role: req.user.role,
      username: req.user.username,
      equipmentId: req.params.id
    });
    
    let equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      console.log('Ошибка: оборудование не найдено');
      return res.status(404).json({
        success: false,
        error: 'Оборудование не найдено'
      });
    }
    
    console.log('Полученные данные для обновления:', {
      name: req.body.name,
      category: req.body.category,
      filesReceived: req.files ? req.files.length : 0
    });
    
    // Добавляем изображения, если они загружены
    if (req.files && req.files.length > 0) {
      console.log('Удаление старых изображений перед добавлением новых');
      
      // Удаляем старые изображения, если они есть и не являются дефолтными
      equipment.images.forEach(image => {
        if (!image.includes('placeholder') && fs.existsSync(path.join(__dirname, '..', image))) {
          fs.unlinkSync(path.join(__dirname, '..', image));
          console.log('Удалено изображение:', image);
        }
      });
      
      req.body.images = req.files.map(file => `/uploads/equipment/${file.filename}`);
      console.log('Добавлены новые изображения:', req.body.images);
    }
    
    // Обновляем оборудование
    equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    console.log('Оборудование успешно обновлено:', equipment._id);
    
    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Ошибка при обновлении оборудования:', error.message);
    next(error);
  }
};

// @desc    Удаление оборудования
// @route   DELETE /api/equipment/:id
// @access  Private (admin, editor)
exports.deleteEquipment = async (req, res, next) => {
  try {
    console.log('Удаление оборудования пользователем:', {
      userId: req.user._id,
      role: req.user.role,
      username: req.user.username,
      equipmentId: req.params.id
    });
    
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      console.log('Ошибка: оборудование не найдено');
      return res.status(404).json({
        success: false,
        error: 'Оборудование не найдено'
      });
    }
    
    // Удаляем изображения, если они есть и не являются дефолтными
    console.log('Удаление изображений оборудования');
    equipment.images.forEach(image => {
      if (!image.includes('placeholder') && fs.existsSync(path.join(__dirname, '..', image))) {
        fs.unlinkSync(path.join(__dirname, '..', image));
        console.log('Удалено изображение:', image);
      }
    });
    
    await equipment.remove();
    console.log('Оборудование успешно удалено:', equipment._id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Ошибка при удалении оборудования:', error.message);
    next(error);
  }
};