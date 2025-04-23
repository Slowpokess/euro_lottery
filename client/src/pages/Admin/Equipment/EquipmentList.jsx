import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEquipment } from '../../../contexts/EquipmentContext';
import './Equipment.css';

const EquipmentList = () => {
  const {
    equipment,
    loading,
    error,
    filters,
    fetchEquipment,
    removeEquipment,
    setFilters
  } = useEquipment();

  const [confirmDelete, setConfirmDelete] = React.useState(null);

  useEffect(() => {
    fetchEquipment();
  }, [filters, fetchEquipment]);

  const handleCategoryChange = (category) => {
    setFilters({ ...filters, category });
  };

  const handleStatusChange = (status) => {
    setFilters({ ...filters, status });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это оборудование?')) {
      try {
        await removeEquipment(id);
      } catch (err) {
        console.error('Ошибка при удалении оборудования:', err);
      }
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      sound: 'Звук',
      light: 'Свет',
      stage: 'Сцена',
      other: 'Прочее'
    };
    return categories[category] || category;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      available: 'Доступно',
      unavailable: 'Недоступно',
      maintenance: 'На обслуживании'
    };
    return statuses[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      available: 'status-available',
      unavailable: 'status-unavailable',
      maintenance: 'status-maintenance'
    };
    return classes[status] || '';
  };

  if (loading) {
    return <div className="admin-loading">Загрузка списка оборудования...</div>;
  }

  return (
    <div className="admin-equipment-list">
      <div className="admin-equipment-header">
        <h2>Управление оборудованием</h2>
        <Link to="/admin/equipment/create" className="admin-btn admin-btn-primary">
          Добавить оборудование
        </Link>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      <div className="admin-equipment-filters">
        <div className="filter-group">
          <label>Категория:</label>
          <select 
            value={filters.category || 'all'} 
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="all">Все категории</option>
            <option value="sound">Звук</option>
            <option value="light">Свет</option>
            <option value="stage">Сцена</option>
            <option value="other">Прочее</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Статус:</label>
          <select 
            value={filters.status || 'all'} 
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="all">Все статусы</option>
            <option value="available">Доступно</option>
            <option value="unavailable">Недоступно</option>
            <option value="maintenance">На обслуживании</option>
          </select>
        </div>
      </div>

      {equipment.length === 0 ? (
        <div className="admin-empty-list">Оборудование не найдено</div>
      ) : (
        <div className="admin-equipment-table-container">
          <table className="admin-equipment-table">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => (
                <tr key={item._id}>
                  <td className="equipment-image-cell">
                    <img
                      src={item.images && item.images.length > 0 ? item.images[0] : '/images/equipment-placeholder.jpg'}
                      alt={item.name}
                      className="equipment-thumbnail"
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{getCategoryLabel(item.category)}</td>
                  <td>
                    {item.price} грн / {item.priceUnit === 'hour' ? 'час' : item.priceUnit === 'day' ? 'день' : 'мероприятие'}
                  </td>
                  <td>
                    <span className={`equipment-status ${getStatusClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="equipment-actions">
                    <Link
                      to={`/admin/equipment/edit/${item._id}`}
                      className="admin-btn admin-btn-small admin-btn-secondary"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => setConfirmDelete(item)}
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
        <div className="admin-equipment-modal-overlay">
          <div className="admin-equipment-modal">
            <h3 className="admin-equipment-modal-title">Подтверждение удаления</h3>
            <div className="admin-equipment-modal-content">
              <p>Вы действительно хотите удалить оборудование "{confirmDelete.name}"?</p>
              <p>Это действие нельзя будет отменить.</p>
            </div>
            <div className="admin-equipment-modal-actions">
              <button
                className="admin-equipment-modal-button admin-equipment-modal-button-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Отмена
              </button>
              <button
                className="admin-equipment-modal-button admin-equipment-modal-button-delete"
                onClick={() => {
                  handleDelete(confirmDelete._id);
                  setConfirmDelete(null);
                }}
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

export default EquipmentList;