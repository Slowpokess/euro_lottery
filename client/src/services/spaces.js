import api from './api';
import { DEFAULT_IMAGES } from '../utils/constants';

// Моковые данные для использования при отсутствии соединения
const MOCK_SPACES = [
  {
    _id: 's1',
    name: 'Главный зал',
    description: 'Просторный зал с качественной звуковой системой и танцполом',
    capacity: 500,
    area: 300,
    image: DEFAULT_IMAGES.SPACE,
    equipment: ['DJ-пульт', 'Акустическая система', 'Световое оборудование'],
    status: 'available',
    customId: 'main-hall',
    features: ['Бар', 'Гардероб', 'Кондиционер'],
    pricePerHour: 1000,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 's2',
    name: 'Малый зал',
    description: 'Уютное пространство для небольших мероприятий и камерных выступлений',
    capacity: 100,
    area: 80,
    image: DEFAULT_IMAGES.SPACE,
    equipment: ['DJ-пульт', 'Акустическая система'],
    status: 'available',
    customId: 'small-hall',
    features: ['Бар', 'Кондиционер'],
    pricePerHour: 500,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 's3',
    name: 'Лаунж-зона',
    description: 'Комфортное пространство для отдыха с мягкой мебелью и приглушённым светом',
    capacity: 50,
    area: 60,
    image: DEFAULT_IMAGES.SPACE,
    equipment: ['Аудиосистема', 'Проектор'],
    status: 'available',
    customId: 'lounge',
    features: ['Мягкая мебель', 'Кондиционер', 'Бар'],
    pricePerHour: 300,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Получение списка пространств с возможностью фильтрации
export const getSpaces = async (params = {}) => {
  try {
    const response = await api.get('/spaces', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching spaces:', error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn('Используются тестовые данные для пространств из-за ошибки сети');
      
      // Фильтрация и подготовка моковых данных согласно параметрам
      let filteredSpaces = [...MOCK_SPACES];
      
      // Фильтрация по статусу
      if (params.status) {
        filteredSpaces = filteredSpaces.filter(space => space.status === params.status);
      }
      
      // Фильтрация по поиску
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredSpaces = filteredSpaces.filter(space => 
          space.name.toLowerCase().includes(searchLower) || 
          space.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Сортировка
      if (params.sort) {
        const sortField = params.sort.startsWith('-') ? params.sort.substring(1) : params.sort;
        const sortOrder = params.sort.startsWith('-') ? -1 : 1;
        
        filteredSpaces.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortOrder;
          if (a[sortField] > b[sortField]) return 1 * sortOrder;
          return 0;
        });
      }
      
      // Пагинация
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedSpaces = filteredSpaces.slice(startIndex, endIndex);
      
      // Формируем ответ в формате API
      return {
        success: true,
        count: paginatedSpaces.length,
        total: filteredSpaces.length,
        data: paginatedSpaces,
        pagination: {
          page: page,
          limit: limit,
          total: filteredSpaces.length,
          totalPages: Math.ceil(filteredSpaces.length / limit)
        }
      };
    }
    
    throw error.response?.data || { error: 'Ошибка при получении пространств' };
  }
};

// Получение пространства по ID
export const getSpaceById = async (id) => {
  try {
    const response = await api.get(`/spaces/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching space with ID ${id}:`, error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn(`Используются тестовые данные для пространства ${id} из-за ошибки сети`);
      
      // Ищем пространство с таким ID в моковых данных
      const space = MOCK_SPACES.find(s => s._id === id);
      
      if (space) {
        return {
          success: true,
          data: space
        };
      } else {
        // Если не найдено, возвращаем первое из моковых данных
        return {
          success: true,
          data: MOCK_SPACES[0],
          _note: 'Моковые данные (ID не найден)'
        };
      }
    }
    
    throw error.response?.data || { error: 'Ошибка при получении пространства' };
  }
};

// Получение пространства по пользовательскому ID
export const getSpaceByCustomId = async (customId) => {
  try {
    const response = await api.get(`/spaces/custom/${customId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching space with custom ID ${customId}:`, error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn(`Используются тестовые данные для пространства с customId ${customId} из-за ошибки сети`);
      
      // Ищем пространство с таким customId в моковых данных
      const space = MOCK_SPACES.find(s => s.customId === customId);
      
      if (space) {
        return {
          success: true,
          data: space
        };
      } else {
        // Если не найдено, возвращаем первое из моковых данных
        return {
          success: true,
          data: MOCK_SPACES[0],
          _note: 'Моковые данные (customId не найден)'
        };
      }
    }
    
    throw error.response?.data || { error: 'Ошибка при получении пространства' };
  }
};

// Создание нового пространства
export const createSpace = async (spaceData) => {
  try {
    const response = await api.post('/spaces', spaceData);
    return response.data;
  } catch (error) {
    console.error('Error creating space:', error);
    throw error.response?.data || { error: 'Ошибка при создании пространства' };
  }
};

// Обновление пространства
export const updateSpace = async (id, spaceData) => {
  try {
    const response = await api.put(`/spaces/${id}`, spaceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating space with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при обновлении пространства' };
  }
};

// Удаление пространства
export const deleteSpace = async (id) => {
  try {
    const response = await api.delete(`/spaces/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting space with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при удалении пространства' };
  }
};

// Загрузка изображения пространства
export const uploadSpaceImage = async (id, formData) => {
  try {
    const response = await api.put(`/spaces/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error uploading image for space with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при загрузке изображения' };
  }
};