import api from './api';
import { DEFAULT_IMAGES } from '../utils/constants';

// Моковые данные для использования при отсутствии соединения
const MOCK_RESIDENTS = [
  {
    _id: 'r1',
    name: 'DJ Techno',
    bio: 'Опытный диджей с многолетним стажем в жанре техно',
    image: DEFAULT_IMAGES.RESIDENT,
    genres: ['Techno', 'Deep House', 'Minimal'],
    socialLinks: {
      instagram: 'https://instagram.com/djtechno',
      soundcloud: 'https://soundcloud.com/djtechno'
    },
    featured: true,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'r2',
    name: 'DJ House',
    bio: 'Специалист по house музыке во всех ее проявлениях',
    image: DEFAULT_IMAGES.RESIDENT,
    genres: ['House', 'Tech House', 'Progressive House'],
    socialLinks: {
      instagram: 'https://instagram.com/djhouse',
      soundcloud: 'https://soundcloud.com/djhouse'
    },
    featured: true,
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'r3',
    name: 'Ambient Producer',
    bio: 'Создает атмосферные эмбиент композиции',
    image: DEFAULT_IMAGES.RESIDENT,
    genres: ['Ambient', 'Chillout', 'Atmospheric'],
    socialLinks: {
      instagram: 'https://instagram.com/ambientproducer',
      soundcloud: 'https://soundcloud.com/ambientproducer'
    },
    featured: false,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Получение списка резидентов с возможностью фильтрации
export const getResidents = async (params = {}) => {
  try {
    const response = await api.get('/residents', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching residents:', error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn('Используются тестовые данные для резидентов из-за ошибки сети');
      
      // Фильтрация и подготовка моковых данных согласно параметрам
      let filteredResidents = [...MOCK_RESIDENTS];
      
      // Фильтрация по featured
      if (params.featured === true) {
        filteredResidents = filteredResidents.filter(resident => resident.featured);
      }
      
      // Фильтрация по поиску
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredResidents = filteredResidents.filter(resident => 
          resident.name.toLowerCase().includes(searchLower) || 
          resident.bio.toLowerCase().includes(searchLower) ||
          (resident.genres && resident.genres.some(genre => 
            genre.toLowerCase().includes(searchLower)
          ))
        );
      }
      
      // Сортировка
      if (params.sort) {
        const sortField = params.sort.startsWith('-') ? params.sort.substring(1) : params.sort;
        const sortOrder = params.sort.startsWith('-') ? -1 : 1;
        
        filteredResidents.sort((a, b) => {
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
      
      const paginatedResidents = filteredResidents.slice(startIndex, endIndex);
      
      // Формируем ответ в формате API
      return {
        success: true,
        count: paginatedResidents.length,
        total: filteredResidents.length,
        data: paginatedResidents,
        pagination: {
          page: page,
          limit: limit,
          total: filteredResidents.length,
          totalPages: Math.ceil(filteredResidents.length / limit)
        }
      };
    }
    
    throw error.response?.data || { error: 'Ошибка при получении резидентов' };
  }
};

// Получение резидента по ID
export const getResidentById = async (id) => {
  try {
    const response = await api.get(`/residents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching resident with ID ${id}:`, error);
    
    // Используем моковые данные при сетевой ошибке
    if (error.message === 'Network Error') {
      console.warn(`Используются тестовые данные для резидента ${id} из-за ошибки сети`);
      
      // Ищем резидента с таким ID в моковых данных
      const resident = MOCK_RESIDENTS.find(r => r._id === id);
      
      if (resident) {
        return {
          success: true,
          data: resident
        };
      } else {
        // Если не найден, возвращаем первого из моковых данных
        return {
          success: true,
          data: MOCK_RESIDENTS[0],
          _note: 'Моковые данные (ID не найден)'
        };
      }
    }
    
    throw error.response?.data || { error: 'Ошибка при получении резидента' };
  }
};

// Создание нового резидента
export const createResident = async (residentData) => {
  try {
    const response = await api.post('/residents', residentData);
    return response.data;
  } catch (error) {
    console.error('Error creating resident:', error);
    throw error.response?.data || { error: 'Ошибка при создании резидента' };
  }
};

// Обновление резидента
export const updateResident = async (id, residentData) => {
  try {
    const response = await api.put(`/residents/${id}`, residentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating resident with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при обновлении резидента' };
  }
};

// Удаление резидента
export const deleteResident = async (id) => {
  try {
    const response = await api.delete(`/residents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting resident with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при удалении резидента' };
  }
};

// Загрузка фото резидента
export const uploadResidentPhoto = async (id, formData) => {
  try {
    const response = await api.put(`/residents/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error uploading photo for resident with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при загрузке фотографии' };
  }
};