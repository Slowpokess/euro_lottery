import api from './api';

// Получение списка услуг промоушена с возможностью фильтрации
export const getPromotions = async (params = {}) => {
  try {
    const response = await api.get('/promotions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching promotions:', error);
    throw error.response?.data || { error: 'Ошибка при получении услуг промоушена' };
  }
};

// Получение услуги промоушена по ID
export const getPromotionById = async (id) => {
  try {
    const response = await api.get(`/promotions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching promotion with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при получении услуги промоушена' };
  }
};

// Создание новой услуги промоушена
export const createPromotion = async (promotionData) => {
  try {
    const response = await api.post('/promotions', promotionData);
    return response.data;
  } catch (error) {
    console.error('Error creating promotion:', error);
    throw error.response?.data || { error: 'Ошибка при создании услуги промоушена' };
  }
};

// Обновление услуги промоушена
export const updatePromotion = async (id, promotionData) => {
  try {
    const response = await api.put(`/promotions/${id}`, promotionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating promotion with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при обновлении услуги промоушена' };
  }
};

// Удаление услуги промоушена
export const deletePromotion = async (id) => {
  try {
    const response = await api.delete(`/promotions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting promotion with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при удалении услуги промоушена' };
  }
};

// Загрузка фото для услуги промоушена
export const uploadPromotionPhoto = async (id, formData) => {
  try {
    const response = await api.put(`/promotions/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error uploading photo for promotion with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при загрузке фотографии' };
  }
};