const express = require('express');
const { 
  getNews, 
  getNewsById, 
  createNews, 
  updateNews, 
  deleteNews,
  getNewsStats
} = require('../controllers/news');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/news
 * @desc    Получение всех новостей с возможностью фильтрации
 * @access  Public
 * @params  status, featured, category, tag, search, limit, skip, sort
 * @returns {Array} новости
 */
router.get('/', getNews);

/**
 * @route   GET /api/news/stats/overview
 * @desc    Получение статистики по новостям
 * @access  Private (admin, editor)
 * @returns {Object} статистика
 */
router.get('/stats/overview', protect, authorize(['admin', 'editor']), getNewsStats);

/**
 * @route   GET /api/news/category/:category
 * @desc    Получение новостей по категории
 * @access  Public
 * @returns {Array} новости
 */
router.get('/category/:category', (req, res, next) => {
  req.query.category = req.params.category;
  getNews(req, res, next);
});

/**
 * @route   GET /api/news/tag/:tag
 * @desc    Получение новостей по тегу
 * @access  Public
 * @returns {Array} новости
 */
router.get('/tag/:tag', (req, res, next) => {
  req.query.tag = req.params.tag;
  getNews(req, res, next);
});

/**
 * @route   GET /api/news/:id
 * @desc    Получение одной новости по ID или slug
 * @access  Public (published) / Private (draft, archived)
 * @returns {Object} новость
 */
router.get('/:id', getNewsById);

/**
 * @route   POST /api/news
 * @desc    Создание новой новости
 * @access  Private (admin, editor)
 * @body    title, content, excerpt, image, status, featured, categories, tags
 * @returns {Object} созданная новость
 */
router.post('/', protect, authorize(['admin', 'editor']), upload.single('image'), createNews);

/**
 * @route   PUT /api/news/:id
 * @desc    Обновление существующей новости
 * @access  Private (admin, editor)
 * @body    title, content, excerpt, image, status, featured, categories, tags
 * @returns {Object} обновленная новость
 */
router.put('/:id', protect, authorize(['admin', 'editor']), upload.single('image'), updateNews);

/**
 * @route   DELETE /api/news/:id
 * @desc    Удаление новости
 * @access  Private (только admin)
 * @returns {Object} пустой объект
 */
router.delete('/:id', protect, authorize(['admin']), deleteNews);

module.exports = router;