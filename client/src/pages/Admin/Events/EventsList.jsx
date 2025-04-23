import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../../../contexts/EventsContext';
import '../Events/Events.css';

const EventsList = () => {
  const { 
    events, 
    loading, 
    error, 
    filters, 
    fetchEvents, 
    removeEvent, 
    setFilters 
  } = useEvents();
  
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  // Соответствие фильтра статусу
  const statusFilter = filters.status || 'all';

  useEffect(() => {
    fetchEvents();
  }, [filters, fetchEvents]);

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  // Функция для удаления события
  const handleDelete = async (id) => {
    try {
      await removeEvent(id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Ошибка при удалении события:', error);
    }
  };

  // Обработчик изменения фильтра
  const handleFilterChange = (status) => {
    setFilters({ ...filters, status });
  };

  return (
    <div className="admin-events-list">
      <div className="admin-events-header">
        <h2>Управление событиями</h2>
        <Link to="/admin/events/create" className="admin-btn admin-btn-primary">
          Добавить событие
        </Link>
      </div>
      
      <div className="admin-events-filters">
        <button 
          className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          Все события
        </button>
        <button 
          className={`admin-filter-btn ${statusFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleFilterChange('upcoming')}
        >
          Предстоящие
        </button>
        <button 
          className={`admin-filter-btn ${statusFilter === 'past' ? 'active' : ''}`}
          onClick={() => handleFilterChange('past')}
        >
          Прошедшие
        </button>
      </div>
      
      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Загрузка событий...</div>
      ) : events.length === 0 ? (
        <div className="admin-events-empty">
          События не найдены. {statusFilter !== 'all' && 'Попробуйте изменить фильтр.'}
        </div>
      ) : (
        <div className="admin-events-table-container">
          <table className="admin-events-table">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id}>
                  <td className="admin-event-image-cell">
                    <img 
                      src={event.image || '/images/event-placeholder.jpg'} 
                      alt={event.title} 
                      className="admin-event-thumbnail"
                    />
                  </td>
                  <td>{event.title}</td>
                  <td>{formatDate(event.date)}</td>
                  <td>
                    <span className={`admin-event-status admin-event-status-${event.status}`}>
                      {event.status === 'upcoming' ? 'Предстоящее' : 'Прошедшее'}
                    </span>
                  </td>
                  <td className="admin-event-actions">
                    <Link 
                      to={`/admin/events/edit/${event._id}`} 
                      className="admin-btn admin-btn-small admin-btn-secondary"
                    >
                      Редактировать
                    </Link>
                    <button 
                      onClick={() => setConfirmDelete(event)} 
                      className="admin-btn admin-btn-small admin-btn-danger"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {confirmDelete && (
        <div className="admin-events-modal-overlay">
          <div className="admin-events-modal">
            <h3 className="admin-events-modal-title">Подтверждение удаления</h3>
            <div className="admin-events-modal-content">
              <p>Вы действительно хотите удалить событие "{confirmDelete.title}"?</p>
              <p>Это действие нельзя будет отменить.</p>
            </div>
            <div className="admin-events-modal-actions">
              <button
                className="admin-events-modal-button admin-events-modal-button-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Отмена
              </button>
              <button
                className="admin-events-modal-button admin-events-modal-button-delete"
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

export default EventsList;