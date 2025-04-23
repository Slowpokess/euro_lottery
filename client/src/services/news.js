import api from './api';
import { PAGE_SIZES, NEWS_STATUSES, DEFAULT_IMAGES } from '../utils/constants';

// Моковые данные для использования при отсутствии соединения
const MOCK_NEWS = [
  {
    _id: '1',
    title: 'Открытие нового сезона',
    content: 'Приглашаем всех на открытие нового сезона в Collider. Вас ждут новые имена, улучшенный звук и незабываемая атмосфера.',
    summary: 'Новый сезон в Collider',
    image: DEFAULT_IMAGES.NEWS,
    publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: NEWS_STATUSES.PUBLISHED,
    featured: true,
    tags: ['открытие', 'сезон', 'техно'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '2',
    title: 'Новая система звука',
    content: 'Мы обновили звуковую систему в основном зале. Теперь звучание стало еще более мощным и чистым.',
    summary: 'Улучшения аудиосистемы',
    image: DEFAULT_IMAGES.NEWS,
    publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: NEWS_STATUSES.PUBLISHED,
    featured: false,
    tags: ['звук', 'система', 'улучшения'],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '3',
    title: 'Специальный гость из Берлина',
    content: 'В эти выходные нас посетит специальный гость из Берлина. Подробности скоро!',
    summary: 'Анонс специального гостя',
    image: DEFAULT_IMAGES.NEWS,
    publishDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: NEWS_STATUSES.PUBLISHED,
    featured: true,
    tags: ['гость', 'Берлин', 'анонс'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Получение всех новостей
export const getNews = async (params = {}) => {
  try {
    console.log('Запрос новостей с параметрами:', params);
    const response = await api.get('/news', { params });
    console.log(`Получено ${response.data.count} новостей`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении новостей:', error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn('Используются тестовые данные из-за ошибки сети');
      
      // Фильтрация и подготовка моковых данных согласно параметрам
      let filteredNews = [...MOCK_NEWS];
      
      // Фильтрация по featured
      if (params.featured === true) {
        filteredNews = filteredNews.filter(news => news.featured);
      }
      
      // Фильтрация по статусу
      if (params.status) {
        filteredNews = filteredNews.filter(news => news.status === params.status);
      }
      
      // Сортировка
      if (params.sort) {
        const sortField = params.sort.startsWith('-') ? params.sort.substring(1) : params.sort;
        const sortOrder = params.sort.startsWith('-') ? -1 : 1;
        
        filteredNews.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortOrder;
          if (a[sortField] > b[sortField]) return 1 * sortOrder;
          return 0;
        });
      }
      
      // Пагинация
      const page = params.page || 1;
      const limit = params.limit || PAGE_SIZES.DEFAULT;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedNews = filteredNews.slice(startIndex, endIndex);
      
      // Формируем ответ в формате API
      return {
        success: true,
        count: paginatedNews.length,
        total: filteredNews.length,
        data: paginatedNews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredNews.length,
          totalPages: Math.ceil(filteredNews.length / limit)
        }
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Получение статистики новостей
export const getNewsStats = async () => {
  try {
    console.log('Запрос статистики новостей');
    const response = await api.get('/news/stats/overview');
    console.log('Статистика новостей получена');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении статистики новостей:', error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn('Используются тестовые данные статистики из-за ошибки сети');
      
      // Рассчитываем статистику на основе моковых данных
      const totalNews = MOCK_NEWS.length;
      const published = MOCK_NEWS.filter(n => n.status === NEWS_STATUSES.PUBLISHED).length;
      const draft = MOCK_NEWS.filter(n => n.status === NEWS_STATUSES.DRAFT).length;
      const archived = MOCK_NEWS.filter(n => n.status === NEWS_STATUSES.ARCHIVED).length;
      const featured = MOCK_NEWS.filter(n => n.featured).length;
      
      return {
        success: true,
        data: {
          total: totalNews,
          published: published,
          draft: draft,
          archived: archived,
          featured: featured,
          recentActivity: {
            created: 2,
            updated: 1,
            deleted: 0
          }
        }
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Получение одной новости
export const getNewsById = async (id) => {
  try {
    console.log(`Запрос новости с ID: ${id}`);
    const response = await api.get(`/news/${id}`);
    console.log('Новость получена:', response.data.data.title);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении новости ${id}:`, error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn(`Используются тестовые данные для новости ${id} из-за ошибки сети`);
      
      // Ищем новость с таким ID в моковых данных
      const news = MOCK_NEWS.find(n => n._id === id);
      
      if (news) {
        return {
          success: true,
          data: news
        };
      } else {
        // Если не найдена, возвращаем первую из моковых данных
        return {
          success: true,
          data: MOCK_NEWS[0],
          _note: 'Моковые данные (ID не найден)'
        };
      }
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Создание новости
export const createNews = async (newsData) => {
  try {
    console.log('Отправка запроса на создание новости:', { 
      title: newsData.title,
      status: newsData.status || NEWS_STATUSES.PUBLISHED,
      featured: newsData.featured ? 'да' : 'нет'
    });
    
    // Для отправки файлов используем FormData
    const formData = new FormData();
    
    // Добавляем все поля в FormData
    Object.keys(newsData).forEach(key => {
      if (key === 'image' && newsData[key] instanceof File) {
        formData.append(key, newsData[key]);
        console.log('Добавлено изображение:', newsData[key].name, `(${Math.round(newsData[key].size / 1024)} KB)`);
      } else if (key === 'tags' || key === 'categories') {
        // Проверяем, что массивы передаются корректно
        if (Array.isArray(newsData[key])) {
          const stringValue = newsData[key].join(',');
          formData.append(key, stringValue);
          console.log(`Добавлены ${key}:`, stringValue);
        } else {
          formData.append(key, newsData[key]);
        }
      } else {
        formData.append(key, newsData[key]);
      }
    });
    
    const response = await api.post('/news', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Новость успешно создана:', response.data.data._id);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании новости:', error);
    throw error.response ? error.response.data : error;
  }
};

// Обновление новости
export const updateNews = async (id, newsData) => {
  try {
    console.log(`Отправка запроса на обновление новости ${id}:`, { 
      title: newsData.title,
      status: newsData.status,
      featured: newsData.featured ? 'да' : 'нет'
    });
    
    // Для отправки файлов используем FormData
    const formData = new FormData();
    
    // Добавляем все поля в FormData
    Object.keys(newsData).forEach(key => {
      if (key === 'image' && newsData[key] instanceof File) {
        formData.append(key, newsData[key]);
        console.log('Добавлено новое изображение:', newsData[key].name, `(${Math.round(newsData[key].size / 1024)} KB)`);
      } else if (key === 'tags' || key === 'categories') {
        // Проверяем, что массивы передаются корректно
        if (Array.isArray(newsData[key])) {
          const stringValue = newsData[key].join(',');
          formData.append(key, stringValue);
          console.log(`Обновлены ${key}:`, stringValue);
        } else {
          formData.append(key, newsData[key]);
        }
      } else {
        formData.append(key, newsData[key]);
      }
    });
    
    const response = await api.put(`/news/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Новость успешно обновлена:', response.data.data._id);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении новости ${id}:`, error);
    throw error.response ? error.response.data : error;
  }
};

// Удаление новости
export const deleteNews = async (id) => {
  try {
    console.log(`Отправка запроса на удаление новости ${id}`);
    const response = await api.delete(`/news/${id}`);
    console.log('Новость успешно удалена');
    return response.data;
  } catch (error) {
    console.error(`Ошибка при удалении новости ${id}:`, error);
    throw error.response ? error.response.data : error;
  }
};

// Получение недавних новостей (для главной страницы)
export const getRecentNews = async (limit = PAGE_SIZES.SMALL, featured = false) => {
  try {
    console.log(`Запрос ${featured ? 'избранных' : 'недавних'} новостей (лимит: ${limit})`);
    const params = { 
      limit,
      sort: '-publishDate',
      status: NEWS_STATUSES.PUBLISHED
    };
    
    if (featured) {
      params.featured = true;
    }
    
    const response = await api.get('/news', { params });
    console.log(`Получено ${response.data.count} новостей`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении недавних новостей:', error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn(`Используются тестовые данные для ${featured ? 'избранных' : 'недавних'} новостей из-за ошибки сети`);
      
      // Фильтрация по параметрам
      let filteredNews = [...MOCK_NEWS].filter(n => n.status === NEWS_STATUSES.PUBLISHED);
      
      if (featured) {
        filteredNews = filteredNews.filter(n => n.featured);
      }
      
      // Сортировка по дате публикации (по убыванию)
      filteredNews.sort((a, b) => {
        return new Date(b.publishDate) - new Date(a.publishDate);
      });
      
      // Ограничение количества
      filteredNews = filteredNews.slice(0, limit);
      
      return {
        success: true,
        count: filteredNews.length,
        total: filteredNews.length,
        data: filteredNews,
        pagination: {
          page: 1,
          limit: parseInt(limit),
          total: filteredNews.length,
          totalPages: 1
        }
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};