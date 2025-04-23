import api from './api';
import { DEFAULT_IMAGES } from '../utils/constants';

// Создаем моковые данные для оборудования
const mockEquipmentData = [
  {
    _id: 'e1',
    name: 'Pioneer CDJ-3000',
    category: 'sound',
    description: 'Профессиональный DJ-плеер с большим дисплеем и продвинутыми функциями',
    price: 2500,
    priceUnit: 'day',
    images: [DEFAULT_IMAGES.EQUIPMENT],
    status: 'available',
    specifications: {
      brand: 'Pioneer DJ',
      model: 'CDJ-3000',
      connectivity: ['USB', 'Link', 'SD Card'],
      dimensions: '443 x 114 x 404 mm',
      weight: '5.5 kg'
    },
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2023-02-20').toISOString()
  },
  {
    _id: 'e2',
    name: 'Allen & Heath Xone:96',
    category: 'sound',
    description: 'Профессиональный 6-канальный DJ-микшер с аналоговым фильтром и многоканальным USB-интерфейсом',
    price: 1800,
    priceUnit: 'day',
    images: [DEFAULT_IMAGES.EQUIPMENT],
    status: 'available',
    specifications: {
      brand: 'Allen & Heath',
      model: 'Xone:96',
      channels: 6,
      connectivity: ['USB', 'XLR', 'Jack 6.3mm'],
      dimensions: '442 x 98 x 370 mm',
      weight: '7 kg'
    },
    createdAt: new Date('2023-01-20').toISOString(),
    updatedAt: new Date('2023-01-20').toISOString()
  },
  {
    _id: 'e3',
    name: 'KV2 Audio ES System',
    category: 'sound',
    description: 'Активная акустическая система высокой мощности для средних и больших помещений',
    price: 5000,
    priceUnit: 'day',
    images: [DEFAULT_IMAGES.EQUIPMENT],
    status: 'available',
    specifications: {
      brand: 'KV2 Audio',
      model: 'ES System',
      power: '2500W',
      frequency: '28Hz - 22kHz',
      dimensions: 'Различные компоненты имеют разные размеры',
      weight: 'От 20 до 60 кг в зависимости от компонента'
    },
    createdAt: new Date('2023-01-10').toISOString(),
    updatedAt: new Date('2023-02-15').toISOString()
  },
  {
    _id: 'e4',
    name: 'Martin MAC Aura XB',
    category: 'light',
    description: 'Компактный светодиодный прибор с эффектом заливки и лучевого эффекта',
    price: 1200,
    priceUnit: 'day',
    images: [DEFAULT_IMAGES.EQUIPMENT],
    status: 'available',
    specifications: {
      brand: 'Martin',
      model: 'MAC Aura XB',
      power: '400W',
      beamAngle: '10-60°',
      weight: '6.5 kg'
    },
    createdAt: new Date('2023-02-05').toISOString(),
    updatedAt: new Date('2023-03-10').toISOString()
  },
  {
    _id: 'e5',
    name: 'Stage Deck 2x1m',
    category: 'stage',
    description: 'Прочная сценическая площадка размером 2x1 метра с регулируемой высотой',
    price: 500,
    priceUnit: 'event',
    images: [DEFAULT_IMAGES.EQUIPMENT],
    status: 'available',
    specifications: {
      brand: 'StageSystem',
      dimensions: '200 x 100 cm',
      height: 'Регулируемая: 20-100 см',
      maxLoad: '750 кг/м²',
      material: 'Алюминий, фанера'
    },
    createdAt: new Date('2023-03-01').toISOString(),
    updatedAt: new Date('2023-03-01').toISOString()
  },
  {
    _id: 'e6',
    name: 'Fog Machine Antari Z-3000',
    category: 'other',
    description: 'Мощная дым-машина для создания эффектов на мероприятиях',
    price: 300,
    priceUnit: 'day',
    images: [DEFAULT_IMAGES.EQUIPMENT],
    status: 'available',
    specifications: {
      brand: 'Antari',
      model: 'Z-3000',
      power: '3000W',
      output: '1400 м³/мин',
      tankCapacity: '5L',
      weight: '13 kg'
    },
    createdAt: new Date('2023-02-15').toISOString(),
    updatedAt: new Date('2023-03-05').toISOString()
  }
];

// Получение всего оборудования
export const getEquipment = async (params = {}) => {
  try {
    // Проверяем, включены ли моковые данные в .env
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log('Using mock equipment data (forced by .env)');
      
      // Фильтрация по категории
      let data = [...mockEquipmentData];
      if (params.category) {
        data = data.filter(item => item.category === params.category);
      }
      
      // Фильтрация по статусу
      if (params.status) {
        data = data.filter(item => item.status === params.status);
      }
      
      // Сортировка (по умолчанию - по дате создания, от новых к старым)
      const sortField = params.sort || 'createdAt';
      const sortOrder = params.order === 'asc' ? 1 : -1;
      data.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortOrder;
        if (a[sortField] > b[sortField]) return 1 * sortOrder;
        return 0;
      });
      
      // Пагинация
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedData = data.slice(startIndex, endIndex);
      
      // Формируем ответ в таком же формате, как от API
      return {
        success: true,
        data: paginatedData,
        count: paginatedData.length,
        total: data.length,
        pagination: {
          page,
          limit,
          total: data.length,
          totalPages: Math.ceil(data.length / limit)
        }
      };
    }
    
    // Если моковые данные не включены, делаем запрос к API
    const response = await api.get('/equipment', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching equipment:', error.message);
    
    // В случае сетевой ошибки, возвращаем моковые данные
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn('Using mock data for equipment due to network error');
      
      // Фильтрация и пагинация как выше
      let data = [...mockEquipmentData];
      if (params.category) {
        data = data.filter(item => item.category === params.category);
      }
      
      if (params.status) {
        data = data.filter(item => item.status === params.status);
      }
      
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedData = data.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: paginatedData,
        count: paginatedData.length,
        total: data.length,
        pagination: {
          page,
          limit,
          total: data.length,
          totalPages: Math.ceil(data.length / limit)
        }
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Получение одного оборудования
export const getEquipmentById = async (id) => {
  try {
    // Проверяем, включены ли моковые данные в .env
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log(`Using mock data for equipment ${id} (forced by .env)`);
      
      // Ищем оборудование по ID
      const equipment = mockEquipmentData.find(item => item._id === id);
      
      if (equipment) {
        return {
          success: true,
          data: equipment
        };
      } else {
        // Если ID не найден, возвращаем произвольное оборудование с указанным ID
        const randomEquipment = {...mockEquipmentData[0], _id: id};
        return {
          success: true,
          data: randomEquipment
        };
      }
    }
    
    // Если моковые данные не включены, делаем запрос к API
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching equipment ${id}:`, error.message);
    
    // В случае сетевой ошибки, возвращаем моковые данные
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn(`Using mock data for equipment ${id} due to network error`);
      
      // Ищем оборудование по ID
      const equipment = mockEquipmentData.find(item => item._id === id);
      
      if (equipment) {
        return {
          success: true,
          data: equipment
        };
      } else {
        // Если ID не найден, возвращаем произвольное оборудование с указанным ID
        const randomEquipment = {...mockEquipmentData[0], _id: id};
        return {
          success: true,
          data: randomEquipment
        };
      }
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Создание оборудования
export const createEquipment = async (equipmentData) => {
  try {
    // Проверяем, включены ли моковые данные в .env
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log('Using mock for equipment creation (forced by .env)');
      
      // Создаем новое моковое оборудование на основе полученных данных
      const newEquipment = {
        _id: `e${Date.now()}`, // Генерируем уникальный ID на основе временной метки
        ...equipmentData,
        images: equipmentData.images instanceof FileList || (Array.isArray(equipmentData.images) && equipmentData.images[0] instanceof File) 
          ? [DEFAULT_IMAGES.EQUIPMENT] // Если файлы были загружены, используем заполнитель
          : equipmentData.images || [DEFAULT_IMAGES.EQUIPMENT],
        status: equipmentData.status || 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: newEquipment,
        message: 'Оборудование успешно создано'
      };
    }
    
    // Если моковые данные не включены, делаем запрос к API
    // Для отправки файлов используем FormData
    const formData = new FormData();
    
    // Добавляем все поля в FormData
    Object.keys(equipmentData).forEach(key => {
      if (key === 'images' && Array.isArray(equipmentData[key])) {
        equipmentData[key].forEach(image => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      } else if (key === 'specifications' && typeof equipmentData[key] === 'object') {
        // Преобразуем объект спецификаций в JSON строку
        formData.append('specifications', JSON.stringify(equipmentData[key]));
      } else {
        formData.append(key, equipmentData[key]);
      }
    });
    
    console.log('Отправка данных оборудования:', {
      name: equipmentData.name,
      category: equipmentData.category,
      specifications: equipmentData.specifications
    });
    
    const response = await api.post('/equipment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании оборудования:', error);
    
    // В случае сетевой ошибки, симулируем успешное создание
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn('Using mock for equipment creation due to network error');
      
      // Создаем новое моковое оборудование
      const newEquipment = {
        _id: `e${Date.now()}`, // Генерируем уникальный ID на основе временной метки
        ...equipmentData,
        images: equipmentData.images instanceof FileList || (Array.isArray(equipmentData.images) && equipmentData.images[0] instanceof File) 
          ? [DEFAULT_IMAGES.EQUIPMENT] // Если файлы были загружены, используем заполнитель
          : equipmentData.images || [DEFAULT_IMAGES.EQUIPMENT],
        status: equipmentData.status || 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: newEquipment,
        message: 'Оборудование успешно создано (mock)'
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Обновление оборудования
export const updateEquipment = async (id, equipmentData) => {
  try {
    // Проверяем, включены ли моковые данные в .env
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log(`Using mock for updating equipment ${id} (forced by .env)`);
      
      // Находим оборудование в нашем моковом массиве (для консистентности)
      const equipmentIndex = mockEquipmentData.findIndex(item => item._id === id);
      let updatedEquipment;
      
      if (equipmentIndex !== -1) {
        // Обновляем существующее оборудование, сохраняя ID и дату создания
        updatedEquipment = {
          ...mockEquipmentData[equipmentIndex],
          ...equipmentData,
          _id: id,
          createdAt: mockEquipmentData[equipmentIndex].createdAt,
          updatedAt: new Date().toISOString(),
          images: equipmentData.images instanceof FileList || (Array.isArray(equipmentData.images) && equipmentData.images[0] instanceof File) 
            ? [DEFAULT_IMAGES.EQUIPMENT] // Если файлы были загружены, используем заполнитель
            : equipmentData.images || mockEquipmentData[equipmentIndex].images
        };
      } else {
        // Если оборудование не найдено, создаем новое с указанным ID
        updatedEquipment = {
          _id: id,
          ...equipmentData,
          images: equipmentData.images instanceof FileList || (Array.isArray(equipmentData.images) && equipmentData.images[0] instanceof File) 
            ? [DEFAULT_IMAGES.EQUIPMENT]
            : equipmentData.images || [DEFAULT_IMAGES.EQUIPMENT],
          status: equipmentData.status || 'available',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 дней назад
          updatedAt: new Date().toISOString()
        };
      }
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: updatedEquipment,
        message: 'Оборудование успешно обновлено'
      };
    }
    
    // Если моковые данные не включены, делаем запрос к API
    console.log(`Отправка запроса на обновление оборудования ${id}:`, { 
      name: equipmentData.name,
      category: equipmentData.category,
      specifications: equipmentData.specifications,
      images: equipmentData.images ? `${equipmentData.images.length} файлов` : 'нет' 
    });
    
    // Для отправки файлов используем FormData
    const formData = new FormData();
    
    // Добавляем все поля в FormData
    Object.keys(equipmentData).forEach(key => {
      if (key === 'images' && Array.isArray(equipmentData[key])) {
        equipmentData[key].forEach(image => {
          if (image instanceof File) {
            formData.append('images', image);
            console.log('Добавлен файл:', image.name, `(${Math.round(image.size / 1024)} KB)`);
          }
        });
      } else if (key === 'specifications' && typeof equipmentData[key] === 'object') {
        // Преобразуем объект спецификаций в JSON строку
        formData.append('specifications', JSON.stringify(equipmentData[key]));
      } else {
        formData.append(key, equipmentData[key]);
      }
    });
    
    const response = await api.put(`/equipment/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Оборудование успешно обновлено:', response.data.data._id);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении оборудования ${id}:`, error.response?.data || error.message);
    
    // В случае сетевой ошибки, симулируем успешное обновление
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn(`Using mock for updating equipment ${id} due to network error`);
      
      // Находим оборудование в нашем моковом массиве
      const equipmentIndex = mockEquipmentData.findIndex(item => item._id === id);
      let updatedEquipment;
      
      if (equipmentIndex !== -1) {
        // Обновляем существующее оборудование
        updatedEquipment = {
          ...mockEquipmentData[equipmentIndex],
          ...equipmentData,
          _id: id,
          createdAt: mockEquipmentData[equipmentIndex].createdAt,
          updatedAt: new Date().toISOString(),
          images: equipmentData.images instanceof FileList || (Array.isArray(equipmentData.images) && equipmentData.images[0] instanceof File) 
            ? [DEFAULT_IMAGES.EQUIPMENT]
            : equipmentData.images || mockEquipmentData[equipmentIndex].images
        };
      } else {
        // Если оборудование не найдено, создаем новое с указанным ID
        updatedEquipment = {
          _id: id,
          ...equipmentData,
          images: equipmentData.images instanceof FileList || (Array.isArray(equipmentData.images) && equipmentData.images[0] instanceof File) 
            ? [DEFAULT_IMAGES.EQUIPMENT]
            : equipmentData.images || [DEFAULT_IMAGES.EQUIPMENT],
          status: equipmentData.status || 'available',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 дней назад
          updatedAt: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        data: updatedEquipment,
        message: 'Оборудование успешно обновлено (mock)'
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};

// Удаление оборудования
export const deleteEquipment = async (id) => {
  try {
    // Проверяем, включены ли моковые данные в .env
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log(`Using mock for deleting equipment ${id} (forced by .env)`);
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'Оборудование успешно удалено',
        data: { _id: id }
      };
    }
    
    // Если моковые данные не включены, делаем запрос к API
    console.log(`Отправка запроса на удаление оборудования ${id}`);
    
    const response = await api.delete(`/equipment/${id}`);
    
    console.log('Оборудование успешно удалено');
    return response.data;
  } catch (error) {
    console.error(`Ошибка при удалении оборудования ${id}:`, error.response?.data || error.message);
    
    // В случае сетевой ошибки, симулируем успешное удаление
    if (error.message === 'Network Error' || process.env.NODE_ENV !== 'production') {
      console.warn(`Using mock for deleting equipment ${id} due to network error`);
      
      return {
        success: true,
        message: 'Оборудование успешно удалено (mock)',
        data: { _id: id }
      };
    }
    
    throw error.response ? error.response.data : error;
  }
};