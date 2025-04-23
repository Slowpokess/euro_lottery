const Event = require('../models/Event');
const fs = require('fs');
const path = require('path');

// @desc    Получение всех событий
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const { status, limit = 10, skip = 0, sort = '-date' } = req.query;
    
    console.log('GET /api/events запрос получен');
    console.log('Параметры запроса:', { status, limit, skip, sort });
    
    // Проверяем, подключена ли база данных
    if (!req.dbConnected) {
      console.log('База данных не подключена, используем мок данные');
      // Используем оригинальный middleware для обработки мок данных
      return next();
    }
    
    // Формируем запрос
    let query = {};
    
    // Фильтрация по статусу
    if (status) {
      query.status = status;
    }
    
    console.log('Условия запроса:', query);
    
    // Получаем события
    const events = await Event.find(query)
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    // Получаем общее количество событий
    const total = await Event.countDocuments(query);
    
    console.log(`Найдено ${events.length} событий из ${total}`);
    
    res.status(200).json({
      success: true,
      count: events.length,
      total,
      data: events
    });
  } catch (error) {
    console.error('Ошибка при получении событий:', error);
    next(error);
  }
};

// @desc    Получение одного события
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Событие не найдено'
      });
    }
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Создание события
// @route   POST /api/events
// @access  Private
exports.createEvent = async (req, res, next) => {
  try {
    // Добавляем изображение, если оно загружено
    if (req.file) {
        req.body.image = `/uploads/events/${req.file.filename}`;
      }
      
      // Создаем событие
      const event = await Event.create(req.body);
      console.log('Event created successfully:', event);

      res.status(201).json({
        success: true,
        data: event
      });
        } catch (error) {
          console.error('Error creating event:', error);
          next(error);
        }
      };
      
      // @desc    Обновление события
      // @route   PUT /api/events/:id
      // @access  Private
      exports.updateEvent = async (req, res, next) => {
        try {
          let event = await Event.findById(req.params.id);
          
          if (!event) {
            return res.status(404).json({
              success: false,
              error: 'Событие не найдено'
            });
          }
          
          // Добавляем изображение, если оно загружено
          if (req.file) {
            // Удаляем старое изображение, если оно есть и не является дефолтным
            if (event.image && !event.image.includes('placeholder') && fs.existsSync(path.join(__dirname, '..', event.image))) {
              fs.unlinkSync(path.join(__dirname, '..', event.image));
            }
            
            req.body.image = `/uploads/events/${req.file.filename}`;
          }
          
          // Обновляем событие
          event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
          });
          
          res.status(200).json({
            success: true,
            data: event
          });
        } catch (error) {
          next(error);
        }
      };
      
      // @desc    Удаление события
      // @route   DELETE /api/events/:id
      // @access  Private
      exports.deleteEvent = async (req, res, next) => {
        try {
          const event = await Event.findById(req.params.id);
          
          if (!event) {
            return res.status(404).json({
              success: false,
              error: 'Событие не найдено'
            });
          }
          
          // Удаляем изображение, если оно есть и не является дефолтным
          if (event.image && !event.image.includes('placeholder') && fs.existsSync(path.join(__dirname, '..', event.image))) {
            fs.unlinkSync(path.join(__dirname, '..', event.image));
          }
          
          await event.remove();
          
          res.status(200).json({
            success: true,
            data: {}
          });
        } catch (error) {
          next(error);
        }
      };