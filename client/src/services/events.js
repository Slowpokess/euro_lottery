import api from './api';
import { DEFAULT_IMAGES, EVENT_STATUSES, PAGE_SIZES } from '../utils/constants';

// Моковые данные для использования при отсутствии соединения
const MOCK_EVENTS = [
  {
    _id: 'e1',
    title: 'Techno Night with Local DJs',
    description: 'Ночь техно-музыки с лучшими локальными диджеями',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    time: '22:00 - 06:00',
    location: 'Главный зал',
    image: DEFAULT_IMAGES.EVENT,
    status: EVENT_STATUSES.UPCOMING,
    featured: true,
    artists: ['DJ Alex', 'DJ Maria', 'DJ Techno'],
    ticketPrice: '300₴',
    ticketLink: 'https://tickets.club/event1',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'e2',
    title: 'Deep House Session',
    description: 'Погрузитесь в атмосферу глубокого хауса с нашими резидентами',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '23:00 - 05:00',
    location: 'Малый зал',
    image: DEFAULT_IMAGES.EVENT,
    status: EVENT_STATUSES.UPCOMING,
    featured: false,
    artists: ['Deep J', 'Soulful'],
    ticketPrice: '250₴',
    ticketLink: 'https://tickets.club/event2',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'e3',
    title: 'Berlin Guest DJ',
    description: 'Специальный гость из Берлина с эксклюзивным сетом',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    time: '22:00 - 06:00',
    location: 'Главный зал',
    image: DEFAULT_IMAGES.EVENT,
    status: EVENT_STATUSES.UPCOMING,
    featured: true,
    artists: ['Berlin DJ', 'Local Support'],
    ticketPrice: '450₴',
    ticketLink: 'https://tickets.club/event3',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'e4',
    title: 'Ambient & Experimental',
    description: 'Вечер экспериментальной и эмбиент музыки',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '20:00 - 02:00',
    location: 'Chill Room',
    image: DEFAULT_IMAGES.EVENT,
    status: EVENT_STATUSES.PAST,
    featured: false,
    artists: ['Ambient Master', 'Experimental Sound'],
    ticketPrice: '200₴',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Получение всех событий
export const getEvents = async (params = {}) => {
  try {
    // Проверяем, включены ли моковые данные в настройках
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log('Вызов API getEvents с параметрами (режим моковых данных):', params);
      
      // Фильтрация и подготовка моковых данных согласно параметрам
      let filteredEvents = [...MOCK_EVENTS];
      
      // Фильтрация по featured
      if (params.featured === 'true' || params.featured === true) {
        filteredEvents = filteredEvents.filter(event => event.featured);
      }
      
      // Фильтрация по статусу
      if (params.status) {
        filteredEvents = filteredEvents.filter(event => event.status === params.status);
      }
      
      // Сортировка
      if (params.sort) {
        const sortField = params.sort.startsWith('-') ? params.sort.substring(1) : params.sort;
        const sortOrder = params.sort.startsWith('-') ? -1 : 1;
        
        filteredEvents.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortOrder;
          if (a[sortField] > b[sortField]) return 1 * sortOrder;
          return 0;
        });
      } else {
        // По умолчанию сортируем по дате - более новые идут раньше
        filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      // Пагинация
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || PAGE_SIZES.DEFAULT;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
      
      // Имитируем задержку сети для более реалистичного поведения
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Формируем ответ в формате API
      return {
        success: true,
        count: paginatedEvents.length,
        total: filteredEvents.length,
        data: paginatedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredEvents.length,
          totalPages: Math.ceil(filteredEvents.length / limit)
        }
      };
    }
    
    // Если моковые данные не включены, делаем запрос к API
    console.log('Вызов API getEvents с параметрами:', params);
    const response = await api.get('/events', { params });
    console.log('Получен ответ от API getEvents:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка в getEvents:', error);
    
    // Используем моковые данные при сетевой ошибке или в режиме разработки
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn('Используются тестовые данные для событий из-за ошибки сети');
      
      // Фильтрация и подготовка моковых данных согласно параметрам
      let filteredEvents = [...MOCK_EVENTS];
      
      // Фильтрация по featured
      if (params.featured === 'true' || params.featured === true) {
        filteredEvents = filteredEvents.filter(event => event.featured);
      }
      
      // Фильтрация по статусу
      if (params.status) {
        filteredEvents = filteredEvents.filter(event => event.status === params.status);
      }
      
      // Сортировка
      if (params.sort) {
        const sortField = params.sort.startsWith('-') ? params.sort.substring(1) : params.sort;
        const sortOrder = params.sort.startsWith('-') ? -1 : 1;
        
        filteredEvents.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortOrder;
          if (a[sortField] > b[sortField]) return 1 * sortOrder;
          return 0;
        });
      } else {
        // По умолчанию сортируем по дате
        filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      // Пагинация
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || PAGE_SIZES.DEFAULT;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
      
      // Формируем ответ в формате API
      return {
        success: true,
        count: paginatedEvents.length,
        total: filteredEvents.length,
        data: paginatedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredEvents.length,
          totalPages: Math.ceil(filteredEvents.length / limit)
        }
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Получение одного события
export const getEvent = async (id) => {
  try {
    // Проверяем, включены ли моковые данные в настройках
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log(`Вызов API getEvent для id: ${id} (режим моковых данных)`);
      
      // Ищем событие с таким ID в моковых данных
      const event = MOCK_EVENTS.find(e => e._id === id);
      
      // Имитируем задержку сети для более реалистичного поведения
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (event) {
        return {
          success: true,
          data: event
        };
      } else {
        // Если событие с таким ID не найдено, создаем его на основе шаблона
        const mockEvent = {
          ...MOCK_EVENTS[0],
          _id: id,
          title: `Event ${id}`,
          description: `This is a mock event with ID ${id} generated because the original was not found.`,
          updatedAt: new Date().toISOString()
        };
        
        return {
          success: true,
          data: mockEvent,
          _generated: true
        };
      }
    }
    
    // Если моковые данные не включены, делаем запрос к API
    console.log(`Вызов API getEvent для id: ${id}`);
    const response = await api.get(`/events/${id}`);
    console.log('Получен ответ от API getEvent:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Ошибка в getEvent для id ${id}:`, error);
    
    // Используем моковые данные при сетевой ошибке или в режиме разработки
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn(`Используются тестовые данные для события ${id} из-за ошибки сети`);
      
      // Ищем событие с таким ID в моковых данных
      const event = MOCK_EVENTS.find(e => e._id === id);
      
      if (event) {
        return {
          success: true,
          data: event
        };
      } else {
        // Если событие с таким ID не найдено, создаем его на основе шаблона
        const mockEvent = {
          ...MOCK_EVENTS[0],
          _id: id,
          title: `Event ${id}`,
          description: `This is a mock event with ID ${id} generated because the original was not found.`,
          updatedAt: new Date().toISOString()
        };
        
        return {
          success: true,
          data: mockEvent,
          _fallback: true
        };
      }
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Создание события
export const createEvent = async (eventData) => {
  try {
    // Проверяем, включены ли моковые данные в настройках
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log('Создание события (режим моковых данных):', eventData);
      
      // Создаем новое моковое событие
      const newEvent = {
        _id: `e${Date.now()}`,
        ...eventData,
        image: eventData.image instanceof File 
          ? DEFAULT_IMAGES.EVENT 
          : eventData.image || DEFAULT_IMAGES.EVENT,
        status: eventData.status || EVENT_STATUSES.UPCOMING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: newEvent,
        message: 'Событие успешно создано'
      };
    }
    
    // Для отправки файлов используем FormData
    const formData = new FormData();
    
    // Добавляем все поля в FormData
    Object.keys(eventData).forEach(key => {
      if (key === 'image' && eventData[key] instanceof File) {
        formData.append(key, eventData[key]);
      } else {
        formData.append(key, eventData[key]);
      }
    });
    
    const response = await api.post('/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании события:', error.message);
    
    // Используем моковые данные при сетевой ошибке или в режиме разработки
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn('Используются тестовые данные для создания события из-за ошибки сети');
      
      // Создаем новое моковое событие
      const newEvent = {
        _id: `e${Date.now()}`,
        ...eventData,
        image: eventData.image instanceof File 
          ? DEFAULT_IMAGES.EVENT 
          : eventData.image || DEFAULT_IMAGES.EVENT,
        status: eventData.status || EVENT_STATUSES.UPCOMING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: newEvent,
        message: 'Событие успешно создано (mock)'
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Обновление события
export const updateEvent = async (id, eventData) => {
  try {
    // Проверяем, включены ли моковые данные в настройках
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log(`Обновление события ${id} (режим моковых данных)`);
      
      // Ищем событие в моковых данных
      const eventIndex = MOCK_EVENTS.findIndex(e => e._id === id);
      let updatedEvent;
      
      if (eventIndex !== -1) {
        // Обновляем существующее событие
        updatedEvent = {
          ...MOCK_EVENTS[eventIndex],
          ...eventData,
          _id: id,
          image: eventData.image instanceof File 
            ? DEFAULT_IMAGES.EVENT 
            : eventData.image || MOCK_EVENTS[eventIndex].image,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Если событие не найдено, создаем новое с указанным ID
        updatedEvent = {
          _id: id,
          ...eventData,
          image: eventData.image instanceof File 
            ? DEFAULT_IMAGES.EVENT 
            : eventData.image || DEFAULT_IMAGES.EVENT,
          status: eventData.status || EVENT_STATUSES.UPCOMING,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: updatedEvent,
        message: 'Событие успешно обновлено'
      };
    }
    
    // Для отправки файлов используем FormData
    const formData = new FormData();
    
    // Добавляем все поля в FormData
    Object.keys(eventData).forEach(key => {
      if (key === 'image' && eventData[key] instanceof File) {
        formData.append(key, eventData[key]);
      } else {
        formData.append(key, eventData[key]);
      }
    });
    
    const response = await api.put(`/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении события ${id}:`, error.message);
    
    // Используем моковые данные при сетевой ошибке или в режиме разработки
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn(`Используются тестовые данные для обновления события ${id} из-за ошибки сети`);
      
      // Ищем событие в моковых данных
      const eventIndex = MOCK_EVENTS.findIndex(e => e._id === id);
      let updatedEvent;
      
      if (eventIndex !== -1) {
        // Обновляем существующее событие
        updatedEvent = {
          ...MOCK_EVENTS[eventIndex],
          ...eventData,
          _id: id,
          image: eventData.image instanceof File 
            ? DEFAULT_IMAGES.EVENT 
            : eventData.image || MOCK_EVENTS[eventIndex].image,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Если событие не найдено, создаем новое с указанным ID
        updatedEvent = {
          _id: id,
          ...eventData,
          image: eventData.image instanceof File 
            ? DEFAULT_IMAGES.EVENT 
            : eventData.image || DEFAULT_IMAGES.EVENT,
          status: eventData.status || EVENT_STATUSES.UPCOMING,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        data: updatedEvent,
        message: 'Событие успешно обновлено (mock)'
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Удаление события
export const deleteEvent = async (id) => {
  try {
    // Проверяем, включены ли моковые данные в настройках
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log(`Удаление события ${id} (режим моковых данных)`);
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        message: 'Событие успешно удалено',
        data: { _id: id }
      };
    }
    
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при удалении события ${id}:`, error.message);
    
    // Используем моковые данные при сетевой ошибке или в режиме разработки
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn(`Используются тестовые данные для удаления события ${id} из-за ошибки сети`);
      
      return {
        success: true,
        message: 'Событие успешно удалено (mock)',
        data: { _id: id }
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};