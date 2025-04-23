import api from './api';

// Отправка заявки на услуги промоушена
export const submitPromotionContact = async (contactData) => {
  try {
    const response = await api.post('/promotion-contacts', contactData);
    return response.data;
  } catch (error) {
    console.error('Error submitting promotion contact:', error);
    throw error.response?.data || { error: 'Ошибка при отправке заявки' };
  }
};

// Получение списка заявок (только для админов)
export const getPromotionContacts = async (params = {}) => {
  try {
    const response = await api.get('/promotion-contacts', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching promotion contacts:', error);
    throw error.response?.data || { error: 'Ошибка при получении заявок' };
  }
};

// Получение заявки по ID (только для админов)
export const getPromotionContactById = async (id) => {
  try {
    const response = await api.get(`/promotion-contacts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching promotion contact with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при получении заявки' };
  }
};

// Обновление статуса заявки (только для админов)
export const updatePromotionContact = async (id, contactData) => {
  try {
    const response = await api.put(`/promotion-contacts/${id}`, contactData);
    return response.data;
  } catch (error) {
    console.error(`Error updating promotion contact with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при обновлении заявки' };
  }
};

// Удаление заявки (только для админов)
export const deletePromotionContact = async (id) => {
  try {
    const response = await api.delete(`/promotion-contacts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting promotion contact with ID ${id}:`, error);
    throw error.response?.data || { error: 'Ошибка при удалении заявки' };
  }
};