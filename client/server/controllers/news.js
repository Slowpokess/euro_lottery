const News = require('../models/News');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// @desc    Получение всех новостей
// @route   GET /api/news
// @access  Public
exports.getNews = async (req, res, next) => {
  try {
    const { 
      featured, 
      status, 
      category,
      search,
      tag,
      limit = 10, 
      skip = 0, 
      sort = '-publishDate' 
    } = req.query;
    
    console.log('Получение новостей с параметрами:', req.query);
    
    // Проверяем, подключена ли база данных
    if (!req.dbConnected) {
      console.log('База данных не подключена, используем мок данные для новостей');
      // Используем оригинальный middleware для обработки мок данных
      return next();
    }
    
    // Формируем запрос
    let query = {};
    
    // По умолчанию показываем только опубликованные новости для публичного API
    if (!req.user) {
      query.status = 'published';
    } else if (status) {
      // Если пользователь авторизован и указан статус, используем его
      query.status = status;
    }
    
    // Фильтрация по избранным
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Фильтрация по категории
    if (category) {
      query.categories = category;
    }
    
    // Фильтрация по тегу
    if (tag) {
      query.tags = tag;
    }
    
    // Поиск по тексту (в заголовке или содержании)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Запрос MongoDB:', query);
    
    // Получаем новости
    const news = await News.find(query)
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('author', 'username');
    
    // Получаем общее количество новостей
    const total = await News.countDocuments(query);
    
    console.log(`Найдено ${news.length} новостей из ${total}`);
    
    res.status(200).json({
      success: true,
      count: news.length,
      total,
      data: news
    });
  } catch (error) {
    console.error('Ошибка при получении новостей:', error);
    next(error);
  }
};

// @desc    Получение одной новости
// @route   GET /api/news/:id
// @access  Public
exports.getNewsById = async (req, res, next) => {
  try {
    const newsId = req.params.id;
    console.log(`Получение новости с ID: ${newsId}`);
    
    // Поиск по ID или slug
    const query = mongoose.Types.ObjectId.isValid(newsId) 
      ? { _id: newsId }
      : { slug: newsId };
      
    console.log('Запрос:', query);
    
    const news = await News.findOne(query).populate('author', 'username');
    
    if (!news) {
      console.log(`Новость не найдена: ${newsId}`);
      return res.status(404).json({
        success: false,
        error: 'Новость не найдена'
      });
    }
    
    // Проверяем статус для неавторизованных пользователей
    if (!req.user && news.status !== 'published') {
      console.log(`Попытка доступа к неопубликованной новости: ${newsId}, статус: ${news.status}`);
      return res.status(404).json({
        success: false,
        error: 'Новость не найдена'
      });
    }
    
    // Увеличиваем счетчик просмотров
    news.views += 1;
    await news.save();
    
    console.log(`Новость получена: ${news.title}, просмотры: ${news.views}`);
    
    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Ошибка при получении новости:', error);
    next(error);
  }
};

// @desc    Создание новости
// @route   POST /api/news
// @access  Private (admin, editor)
exports.createNews = async (req, res, next) => {
  try {
    console.log('Создание новости пользователем:', {
      userId: req.user._id,
      role: req.user.role,
      username: req.user.username
    });
    
    console.log('Полученные данные:', {
      title: req.body.title,
      status: req.body.status || 'published',
      featured: req.body.featured ? 'да' : 'нет',
      hasImage: req.file ? 'да' : 'нет'
    });
    
    // Добавляем изображение, если оно загружено
    if (req.file) {
      req.body.image = `/uploads/news/${req.file.filename}`;
      console.log('Добавлено изображение:', req.body.image);
    }
    
    // Добавляем автора
    req.body.author = req.user.id;
    
    // Обработка тегов и категорий
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
      console.log('Обработаны теги:', req.body.tags);
    }
    
    if (req.body.categories && typeof req.body.categories === 'string') {
      req.body.categories = req.body.categories.split(',').map(category => category.trim());
      console.log('Обработаны категории:', req.body.categories);
    }
    
    // Создаем новость
    const news = await News.create(req.body);
    console.log('Новость успешно создана с ID:', news._id);
    
    res.status(201).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Ошибка при создании новости:', error.message);
    next(error);
  }
};

// @desc    Обновление новости
// @route   PUT /api/news/:id
// @access  Private (admin, editor)
exports.updateNews = async (req, res, next) => {
  try {
    console.log('Обновление новости пользователем:', {
      userId: req.user._id,
      role: req.user.role,
      username: req.user.username,
      newsId: req.params.id
    });
    
    let news = await News.findById(req.params.id);
    
    if (!news) {
      console.log(`Ошибка: новость с ID ${req.params.id} не найдена`);
      return res.status(404).json({
        success: false,
        error: 'Новость не найдена'
      });
    }
    
    console.log('Полученные данные для обновления:', {
      title: req.body.title,
      status: req.body.status,
      featured: req.body.featured ? 'да' : 'нет',
      hasImage: req.file ? 'да' : 'нет'
    });
    
    // Добавляем изображение, если оно загружено
    if (req.file) {
      console.log('Обновление изображения для новости');
      
      // Удаляем старое изображение, если оно есть и не является дефолтным
      if (news.image && !news.image.includes('placeholder') && fs.existsSync(path.join(__dirname, '..', news.image))) {
        fs.unlinkSync(path.join(__dirname, '..', news.image));
        console.log('Удалено старое изображение:', news.image);
      }
      
      req.body.image = `/uploads/news/${req.file.filename}`;
      console.log('Добавлено новое изображение:', req.body.image);
    }
    
    // Обработка тегов и категорий
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
      console.log('Обработаны теги:', req.body.tags);
    }
    
    if (req.body.categories && typeof req.body.categories === 'string') {
      req.body.categories = req.body.categories.split(',').map(category => category.trim());
      console.log('Обработаны категории:', req.body.categories);
    }
    
    // Обновляем новость
    news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    console.log('Новость успешно обновлена:', news._id);
    
    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Ошибка при обновлении новости:', error.message);
    next(error);
  }
};

// @desc    Удаление новости
// @route   DELETE /api/news/:id
// @access  Private (только admin)
exports.deleteNews = async (req, res, next) => {
  try {
    console.log('Удаление новости пользователем:', {
      userId: req.user._id,
      role: req.user.role,
      username: req.user.username,
      newsId: req.params.id
    });
    
    const news = await News.findById(req.params.id);
    
    if (!news) {
      console.log(`Ошибка: новость с ID ${req.params.id} не найдена`);
      return res.status(404).json({
        success: false,
        error: 'Новость не найдена'
      });
    }
    
    // Проверка роли пользователя (дополнительная проверка)
    if (req.user.role !== 'admin') {
      console.log(`Отказано в доступе: пользователь с ролью ${req.user.role} пытается удалить новость`);
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для удаления новостей'
      });
    }
    
    // Удаляем изображение, если оно есть и не является дефолтным
    if (news.image && !news.image.includes('placeholder') && fs.existsSync(path.join(__dirname, '..', news.image))) {
      fs.unlinkSync(path.join(__dirname, '..', news.image));
      console.log('Удалено изображение новости:', news.image);
    }
    
    await news.remove();
    console.log('Новость успешно удалена:', news._id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Ошибка при удалении новости:', error.message);
    next(error);
  }
};

// @desc    Получение статистики новостей
// @route   GET /api/news/stats
// @access  Private (admin, editor)
exports.getNewsStats = async (req, res, next) => {
  try {
    console.log('Запрос статистики новостей пользователем:', {
      userId: req.user._id,
      role: req.user.role
    });
    
    // Используем Promise.all для параллельного выполнения запросов
    const [
      total, 
      published, 
      draft, 
      archived, 
      featured, 
      mostViewed,
      categories
    ] = await Promise.all([
      News.countDocuments({}),
      News.countDocuments({ status: 'published' }),
      News.countDocuments({ status: 'draft' }),
      News.countDocuments({ status: 'archived' }),
      News.countDocuments({ featured: true }),
      News.find({})
        .sort('-views')
        .limit(5)
        .select('title slug views publishDate'),
      News.aggregate([
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    // Подсчет просмотров за последнюю неделю
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentNews = await News.find({
      updatedAt: { $gte: oneWeekAgo }
    }).select('views');
    
    const recentViews = recentNews.reduce((sum, news) => sum + news.views, 0);
    
    // Формируем объект статистики
    const stats = {
      total,
      published,
      draft,
      archived,
      featured,
      recentViews,
      mostViewed,
      categories,
      todayCount: await News.countDocuments({
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        }
      }),
      authorStats: null
    };
    
    // Статистика по авторам (только для админов)
    if (req.user.role === 'admin') {
      const authorStats = await News.aggregate([
        { $group: { 
          _id: '$author', 
          count: { $sum: 1 },
          views: { $sum: '$views' }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      // Заполняем информацией о пользователях
      stats.authorStats = await Promise.all(
        authorStats.map(async (stat) => {
          const user = await mongoose.model('User').findById(stat._id).select('username');
          return {
            ...stat,
            username: user ? user.username : 'Неизвестный'
          };
        })
      );
    }
    
    console.log('Статистика новостей успешно получена');
    
    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ошибка при получении статистики новостей:', error.message);
    next(error);
  }
};