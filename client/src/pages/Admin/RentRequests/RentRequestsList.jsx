import React, { useEffect, useState } from 'react';
import { useRentRequests } from '../../../contexts/RentRequestsContext';
import './RentRequests.css';

const RentRequestsList = () => {
  const {
    rentRequests,
    stats,
    loading,
    error,
    total,
    filters,
    fetchRentRequests,
    fetchRentRequestStats,
    updateRentRequest,
    removeRentRequest,
    setFilters
  } = useRentRequests();
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: '',
    adminComment: ''
  });

  const limit = 10; // Количество заявок на странице
  const totalPages = Math.ceil(total / limit);
  const page = filters.page || 1;

  useEffect(() => {
    fetchRentRequestStats();
    fetchRentRequests();
  }, [filters, fetchRentRequests, fetchRentRequestStats]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
      page: 1 // Сбрасываем страницу при изменении фильтров
    });
  };
  
  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage
    });
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    // Инициализируем форму изменения статуса
    setStatusForm({
      status: request.status,
      adminComment: request.adminComment || ''
    });
  };
  
  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;
    setStatusForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    
    try {
      await updateRentRequest(selectedRequest._id, statusForm);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Ошибка при обновлении статуса заявки:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeRentRequest(id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Ошибка при удалении заявки:', error);
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };
  
  // Более компактное форматирование даты для таблицы
  const formatShortDate = (dateString) => {
    const options = { day: 'numeric', month: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  // Получение текста статуса
  const getStatusLabel = (status) => {
    const statuses = {
      pending: 'На рассмотрении',
      confirmed: 'Подтверждена',
      rejected: 'Отклонена',
      canceled: 'Отменена',
      completed: 'Завершена'
    };
    return statuses[status] || status;
  };
  
  // Расчет промежутка аренды в днях
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  return (
    <div className="admin-rent-requests-container">
      {/* Заголовок */}
      <div className="admin-rent-requests-header">
        <h2>Заявки на аренду оборудования</h2>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="admin-rent-requests-stats">
          <div className="admin-rent-requests-stat-card">
            <div className="admin-rent-requests-stat-value">{stats.total}</div>
            <div className="admin-rent-requests-stat-title">Всего заявок</div>
          </div>
          <div className="admin-rent-requests-stat-card">
            <div className="admin-rent-requests-stat-value">{stats.byStatus.pending}</div>
            <div className="admin-rent-requests-stat-title">На рассмотрении</div>
          </div>
          <div className="admin-rent-requests-stat-card">
            <div className="admin-rent-requests-stat-value">{stats.byStatus.confirmed}</div>
            <div className="admin-rent-requests-stat-title">Подтверждено</div>
          </div>
          <div className="admin-rent-requests-stat-card">
            <div className="admin-rent-requests-stat-value">{stats.byStatus.completed}</div>
            <div className="admin-rent-requests-stat-title">Завершено</div>
          </div>
          <div className="admin-rent-requests-stat-card">
            <div className="admin-rent-requests-stat-value">{stats.byStatus.rejected}</div>
            <div className="admin-rent-requests-stat-title">Отклонено</div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="admin-rent-requests-filters">
        <div className="admin-rent-requests-filter-group">
          <label htmlFor="status">Статус:</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Все</option>
            <option value="pending">На рассмотрении</option>
            <option value="confirmed">Подтверждены</option>
            <option value="completed">Завершены</option>
            <option value="rejected">Отклонены</option>
            <option value="canceled">Отменены</option>
          </select>
        </div>

        <div className="admin-rent-requests-filter-group">
          <label htmlFor="startDate">С даты:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>

        <div className="admin-rent-requests-filter-group">
          <label htmlFor="endDate">По дату:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>

        <div className="admin-rent-requests-filter-group">
          <label htmlFor="sort">Сортировка:</label>
          <select
            id="sort"
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
          >
            <option value="-createdAt">Новые сначала</option>
            <option value="createdAt">Старые сначала</option>
            <option value="startDate">По дате начала аренды</option>
            <option value="-totalPrice">По стоимости (убыв.)</option>
            <option value="totalPrice">По стоимости (возр.)</option>
          </select>
        </div>

        <div className="admin-rent-requests-search">
          <span className="admin-rent-requests-search-icon">🔍</span>
          <input
            type="text"
            name="search"
            placeholder="Поиск по имени, email..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Ошибка */}
      {error && <div className="admin-error">{error}</div>}

      {/* Таблица заявок */}
      {loading ? (
        <div className="admin-loading">Загрузка заявок...</div>
      ) : rentRequests.length > 0 ? (
        <table className="admin-rent-requests-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Клиент</th>
              <th>Дата создания</th>
              <th>Период аренды</th>
              <th>Количество</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rentRequests.map((request) => (
              <tr key={request._id}>
                <td>#{request._id.substring(request._id.length - 6)}</td>
                <td>
                  <div>{request.name}</div>
                  <div style={{ fontSize: '0.825rem', color: '#666' }}>{request.email}</div>
                </td>
                <td>{formatShortDate(request.createdAt)}</td>
                <td>
                  <div>{formatShortDate(request.startDate)}</div>
                  <div>- {formatShortDate(request.endDate)}</div>
                  <div style={{ fontSize: '0.825rem', color: '#666' }}>
                    ({calculateDuration(request.startDate, request.endDate)} дн.)
                  </div>
                </td>
                <td>{request.equipmentItems.length} шт.</td>
                <td>{(request.totalPrice || 0).toLocaleString()} грн</td>
                <td>
                  <span className={`admin-rent-requests-status ${request.status}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </td>
                <td>
                  <div className="admin-rent-requests-actions">
                    <button
                      className="admin-rent-requests-action-button view"
                      onClick={() => handleViewRequest(request)}
                    >
                      👁️
                    </button>
                    <button
                      className="admin-rent-requests-action-button delete"
                      onClick={() => setConfirmDelete(request)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="admin-empty-message">
          Заявки не найдены. Попробуйте изменить параметры фильтрации.
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="admin-rent-requests-pagination">
          <button
            className={`admin-rent-requests-pagination-button ${page === 1 ? 'disabled' : ''}`}
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
          >
            «
          </button>
          <button
            className={`admin-rent-requests-pagination-button ${page === 1 ? 'disabled' : ''}`}
            onClick={() => handlePageChange(Math.max(page - 1, 1))}
            disabled={page === 1}
          >
            ‹
          </button>
          
          {[...Array(totalPages)].map((_, idx) => {
            const pageNum = idx + 1;
            // Отображаем только текущую страницу и соседние
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= page - 1 && pageNum <= page + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  className={`admin-rent-requests-pagination-button ${pageNum === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            } else if (
              pageNum === page - 2 ||
              pageNum === page + 2
            ) {
              return <span key={pageNum}>...</span>;
            }
            return null;
          })}
          
          <button
            className={`admin-rent-requests-pagination-button ${page === totalPages ? 'disabled' : ''}`}
            onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
          >
            ›
          </button>
          <button
            className={`admin-rent-requests-pagination-button ${page === totalPages ? 'disabled' : ''}`}
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
          >
            »
          </button>
        </div>
      )}
      
      <div className="admin-rent-requests-pagination-info">
        Показано {rentRequests.length} из {total} заявок
      </div>

      {/* Модальное окно просмотра заявки */}
      {selectedRequest && (
        <div className="admin-rent-requests-modal-overlay">
          <div className="admin-rent-requests-modal">
            <button 
              className="admin-rent-requests-modal-close"
              onClick={() => setSelectedRequest(null)}
            >
              ×
            </button>
            
            <h3 className="admin-rent-requests-modal-title">
              Заявка #{selectedRequest._id.substring(selectedRequest._id.length - 6)}
            </h3>
            
            <div className="admin-rent-requests-modal-content">
              <div className="admin-rent-requests-detail-group">
                {/* Информация о клиенте */}
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Имя клиента</div>
                  <div className="admin-rent-requests-detail-value">{selectedRequest.name}</div>
                </div>
                
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Email</div>
                  <div className="admin-rent-requests-detail-value">{selectedRequest.email}</div>
                </div>
                
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Телефон</div>
                  <div className="admin-rent-requests-detail-value">{selectedRequest.phone}</div>
                </div>
                
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Организация</div>
                  <div className="admin-rent-requests-detail-value">
                    {selectedRequest.organization || '—'}
                  </div>
                </div>
                
                {/* Информация о мероприятии */}
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Название мероприятия</div>
                  <div className="admin-rent-requests-detail-value">
                    {selectedRequest.eventName || '—'}
                  </div>
                </div>
                
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Тип мероприятия</div>
                  <div className="admin-rent-requests-detail-value">
                    {selectedRequest.eventType || '—'}
                  </div>
                </div>
                
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Место проведения</div>
                  <div className="admin-rent-requests-detail-value">
                    {selectedRequest.eventLocation || '—'}
                  </div>
                </div>
                
                {/* Информация о сроках */}
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Дата создания заявки</div>
                  <div className="admin-rent-requests-detail-value">
                    {formatDate(selectedRequest.createdAt)}
                  </div>
                </div>
                
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Дата начала аренды</div>
                  <div className="admin-rent-requests-detail-value">
                    {formatDate(selectedRequest.startDate)}
                  </div>
                </div>
                
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Дата окончания аренды</div>
                  <div className="admin-rent-requests-detail-value">
                    {formatDate(selectedRequest.endDate)}
                  </div>
                </div>
                
                <div className="admin-rent-requests-detail-item">
                  <div className="admin-rent-requests-detail-label">Продолжительность</div>
                  <div className="admin-rent-requests-detail-value">
                    {calculateDuration(selectedRequest.startDate, selectedRequest.endDate)} дней
                  </div>
                </div>
              </div>
              
              {/* Дополнительные услуги */}
              <div className="admin-rent-requests-detail-item">
                <div className="admin-rent-requests-detail-label">Дополнительные услуги</div>
                <div className="admin-rent-requests-detail-value">
                  {selectedRequest.additionalServices.delivery && <span>Доставка</span>}
                  {selectedRequest.additionalServices.setup && <span>, Монтаж/демонтаж</span>}
                  {selectedRequest.additionalServices.operator && <span>, Оператор</span>}
                  {!selectedRequest.additionalServices.delivery && 
                   !selectedRequest.additionalServices.setup && 
                   !selectedRequest.additionalServices.operator && '—'}
                </div>
              </div>
              
              {/* Комментарий клиента */}
              <div className="admin-rent-requests-detail-item">
                <div className="admin-rent-requests-detail-label">Комментарий клиента</div>
                <div className="admin-rent-requests-detail-value">
                  {selectedRequest.comment || '—'}
                </div>
              </div>
              
              {/* Список оборудования */}
              <div className="admin-rent-requests-equipment-list">
                <div className="admin-rent-requests-equipment-header">
                  Список оборудования
                </div>
                
                {selectedRequest.equipmentItems.map((item, index) => (
                  <div key={index} className="admin-rent-requests-equipment-item">
                    <div className="admin-rent-requests-equipment-image">
                      <img 
                        src={item.equipment.images && item.equipment.images.length > 0 ? item.equipment.images[0] : '/images/equipment-placeholder.jpg'} 
                        alt={item.equipment.name} 
                      />
                    </div>
                    
                    <div className="admin-rent-requests-equipment-details">
                      <div className="admin-rent-requests-equipment-name">
                        {item.equipment.name}
                      </div>
                      <div className="admin-rent-requests-equipment-category">
                        Категория: {item.equipment.category}
                      </div>
                      <div className="admin-rent-requests-equipment-price">
                        Цена: {item.equipment.price.toLocaleString()} грн / {item.equipment.priceUnit === 'day' ? 'день' : 
                              item.equipment.priceUnit === 'hour' ? 'час' : 'мероприятие'}
                      </div>
                    </div>
                    
                    <div className="admin-rent-requests-equipment-quantity">
                      <div className="admin-rent-requests-equipment-quantity-label">
                        Количество
                      </div>
                      <div className="admin-rent-requests-equipment-quantity-value">
                        {item.quantity} шт.
                      </div>
                      <div className="admin-rent-requests-equipment-quantity-label">
                        Дней
                      </div>
                      <div className="admin-rent-requests-equipment-quantity-value">
                        {item.days}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="admin-rent-requests-total-price">
                Итого: {(selectedRequest.totalPrice || 0).toLocaleString()} грн
              </div>
              
              {/* Форма изменения статуса */}
              <div className="admin-rent-requests-status-form">
                <div className="admin-rent-requests-status-form-title">
                  Обновить статус заявки
                </div>
                
                <div className="admin-rent-requests-status-form-group">
                  <label 
                    htmlFor="status" 
                    className="admin-rent-requests-status-form-label"
                  >
                    Статус
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={statusForm.status}
                    onChange={handleStatusFormChange}
                    className="admin-rent-requests-status-form-select"
                  >
                    <option value="pending">На рассмотрении</option>
                    <option value="confirmed">Подтверждена</option>
                    <option value="completed">Завершена</option>
                    <option value="rejected">Отклонена</option>
                    <option value="canceled">Отменена</option>
                  </select>
                </div>
                
                <div className="admin-rent-requests-status-form-group">
                  <label 
                    htmlFor="adminComment" 
                    className="admin-rent-requests-status-form-label"
                  >
                    Комментарий администратора
                  </label>
                  <textarea
                    id="adminComment"
                    name="adminComment"
                    value={statusForm.adminComment}
                    onChange={handleStatusFormChange}
                    className="admin-rent-requests-status-form-textarea"
                    placeholder="Добавьте комментарий к заявке..."
                  />
                </div>
                
                <div className="admin-rent-requests-status-form-buttons">
                  <button
                    className="admin-rent-requests-status-form-button admin-rent-requests-status-form-button-cancel"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Отмена
                  </button>
                  
                  <button
                    className="admin-rent-requests-status-form-button admin-rent-requests-status-form-button-confirm"
                    onClick={handleUpdateStatus}
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {confirmDelete && (
        <div className="admin-rent-requests-modal-overlay">
          <div className="admin-rent-requests-modal" style={{ maxWidth: '400px' }}>
            <h3 className="admin-rent-requests-modal-title">
              Подтверждение удаления
            </h3>
            <div className="admin-rent-requests-modal-content">
              <p>Вы действительно хотите удалить заявку #{confirmDelete._id.substring(confirmDelete._id.length - 6)}?</p>
              <p>Это действие нельзя будет отменить.</p>
            </div>
            <div className="admin-rent-requests-status-form-buttons">
              <button
                className="admin-rent-requests-status-form-button admin-rent-requests-status-form-button-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Отмена
              </button>
              <button
                className="admin-rent-requests-status-form-button admin-rent-requests-status-form-button-reject"
                onClick={() => handleDelete(confirmDelete._id)}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentRequestsList;