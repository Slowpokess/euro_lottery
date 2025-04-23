/**
 * Централизованные сообщения об ошибках для всего приложения
 * Это помогает поддерживать единый стиль сообщений и облегчает локализацию
 */

export const ErrorMessages = {
  // Общие ошибки
  SERVER_ERROR: "Ошибка сервера. Пожалуйста, попробуйте позже",
  NETWORK_ERROR: "Ошибка соединения. Проверьте подключение к интернету",
  UNAUTHORIZED: "Требуется авторизация для доступа",
  FORBIDDEN: "У вас нет прав для выполнения этого действия",
  NOT_FOUND: "Ресурс не найден",
  VALIDATION_ERROR: "Ошибка валидации данных",
  COMPONENT_ERROR: "Произошла ошибка при отображении этой части приложения. Мы уже работаем над решением.",
  ADMIN_ERROR: "Произошла ошибка в административной панели. Наша техническая команда уже уведомлена.",
  
  // Ошибки аутентификации
  AUTH_FAILED: "Неверный email или пароль",
  AUTH_EXPIRED: "Срок действия сессии истек. Пожалуйста, войдите снова",
  AUTH_REQUIRED: "Для доступа к этой странице необходимо войти в систему",
  
  // Ошибки форм
  FORM_INVALID: "Пожалуйста, проверьте правильность заполнения формы",
  FORM_SUBMISSION_FAILED: "Не удалось отправить форму. Попробуйте еще раз",
  
  // Ошибки промоушн-раздела
  FETCH_PROMOTIONS_ERROR: "Ошибка при загрузке услуг промоушена",
  CREATE_PROMOTION_ERROR: "Ошибка при создании услуги промоушена",
  UPDATE_PROMOTION_ERROR: "Ошибка при обновлении услуги промоушена",
  DELETE_PROMOTION_ERROR: "Ошибка при удалении услуги промоушена",
  
  // Ошибки запросов на промоушн
  SUBMIT_PROMOTION_CONTACT_ERROR: "Ошибка при отправке заявки на услуги промоушена",
  FETCH_PROMOTION_CONTACTS_ERROR: "Ошибка при загрузке заявок на услуги промоушена",
  
  // Ошибки событий
  FETCH_EVENTS_ERROR: "Ошибка при загрузке событий",
  CREATE_EVENT_ERROR: "Ошибка при создании события",
  UPDATE_EVENT_ERROR: "Ошибка при обновлении события",
  DELETE_EVENT_ERROR: "Ошибка при удалении события",
  
  // Ошибки новостей
  FETCH_NEWS_ERROR: "Ошибка при загрузке новостей",
  CREATE_NEWS_ERROR: "Ошибка при создании новости",
  UPDATE_NEWS_ERROR: "Ошибка при обновлении новости",
  DELETE_NEWS_ERROR: "Ошибка при удалении новости",
  
  // Ошибки запросов на аренду
  SUBMIT_RENT_REQUEST_ERROR: "Ошибка при отправке заявки на аренду",
  FETCH_RENT_REQUESTS_ERROR: "Ошибка при загрузке заявок на аренду",
  
  // Ошибки файлов
  FILE_UPLOAD_ERROR: "Ошибка при загрузке файла",
  FILE_SIZE_ERROR: "Размер файла превышает допустимый",
  FILE_TYPE_ERROR: "Недопустимый тип файла",
  
  // Ошибки загрузки данных
  DATA_LOADING_ERROR: "Ошибка при загрузке данных",
  DATA_SAVING_ERROR: "Ошибка при сохранении данных"
};

/**
 * Функция для получения сообщения об ошибке из объекта ошибки
 * Пытается извлечь сообщение из разных форматов ошибок API/сети
 */
export const getErrorMessage = (error) => {
  if (!error) {
    return ErrorMessages.SERVER_ERROR;
  }
  
  // Если ошибка уже в виде строки
  if (typeof error === 'string') {
    return error;
  }
  
  try {
    // Если у нас есть объект ошибки, попробуем из него извлечь сообщение
    // Сначала из полей ответа API (Axios)
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'string') {
        return error.response.data;
      }
      
      if (error.response.data.error) return error.response.data.error;
      if (error.response.data.message) return error.response.data.message;
      if (error.response.data.errorMessage) return error.response.data.errorMessage;
    }
    
    // Потом из полей стандартного объекта ошибки
    if (error.message) return error.message;
    if (error.error) return error.error;
    if (error.errorMessage) return error.errorMessage;
    if (error.statusText) return error.statusText;
    
    // Если объект можно безопасно преобразовать в строку, делаем это
    if (typeof error.toString === 'function') {
      const errorString = error.toString();
      if (errorString !== '[object Object]') {
        return errorString;
      }
    }
    
    // Если ничего не подошло, возвращаем общее сообщение
    return "Произошла ошибка";
  } catch (e) {
    return ErrorMessages.SERVER_ERROR;
  }
};