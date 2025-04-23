import api from './api';

// Получение всех заявок на аренду
export const getRentRequests = async (params = {}) => {
  try {
    console.log('Запрос заявок на аренду с параметрами:', params);
    const response = await api.get('/rent-requests', { params });
    console.log(`Получено ${response.data.count} заявок на аренду`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении заявок на аренду:', error);
    throw error.response ? error.response.data : error;
  }
};

// Получение статистики по заявкам
export const getRentRequestsStats = async () => {
  try {
    console.log('Запрос статистики по заявкам на аренду');
    const response = await api.get('/rent-requests/stats');
    console.log('Статистика по заявкам на аренду получена');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении статистики по заявкам:', error);
    throw error.response ? error.response.data : error;
  }
};

// Получение одной заявки
export const getRentRequest = async (id) => {
  try {
    console.log(`Запрос заявки на аренду с ID: ${id}`);
    const response = await api.get(`/rent-requests/${id}`);
    console.log('Заявка на аренду получена');
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении заявки ${id}:`, error);
    throw error.response ? error.response.data : error;
  }
};

// Создание заявки на аренду
export const createRentRequest = async (requestData) => {
  try {
    console.log('Отправка заявки на аренду:', {
      name: requestData.name,
      email: requestData.email,
      startDate: requestData.startDate,
      equipmentItems: requestData.equipmentItems?.length || 0
    });
    
    const response = await api.post('/rent-requests', requestData);
    console.log('Заявка на аренду успешно создана:', response.data.data._id);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании заявки на аренду:', error);
    throw error.response ? error.response.data : error;
  }
};

// Обновление статуса заявки
export const updateRentRequestStatus = async (id, { status, adminComment }) => {
  try {
    console.log(`Обновление статуса заявки ${id} на "${status}"`);
    const response = await api.put(`/rent-requests/${id}/status`, { 
      status, 
      adminComment 
    });
    console.log('Статус заявки успешно обновлен');
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении статуса заявки ${id}:`, error);
    throw error.response ? error.response.data : error;
  }
};

// Удаление заявки
export const deleteRentRequest = async (id) => {
  try {
    console.log(`Удаление заявки на аренду ${id}`);
    const response = await api.delete(`/rent-requests/${id}`);
    console.log('Заявка на аренду успешно удалена');
    return response.data;
  } catch (error) {
    console.error(`Ошибка при удалении заявки ${id}:`, error);
    throw error.response ? error.response.data : error;
  }
};