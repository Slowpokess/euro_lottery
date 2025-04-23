import React, { useEffect, useState } from 'react';
import { usePromotionContacts } from '../../../contexts';

const PromotionContactDetail = ({ id, onBack }) => {
  const { 
    currentContact, 
    loading, 
    error, 
    fetchContactById, 
    updateContact 
  } = usePromotionContacts();
  
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    if (id) {
      fetchContactById(id);
    }
  }, [id, fetchContactById]);
  
  useEffect(() => {
    if (currentContact) {
      setStatus(currentContact.status || 'new');
      setNotes(currentContact.notes || '');
    }
  }, [currentContact]);
  
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };
  
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };
  
  const handleUpdate = async () => {
    try {
      await updateContact(id, { status, notes });
    } catch (err) {
      console.error('Error updating contact:', err);
    }
  };
  
  if (loading) {
    return <div className="admin-loading">Загрузка заявки...</div>;
  }
  
  if (error) {
    return <div className="admin-error">{error}</div>;
  }
  
  if (!currentContact) {
    return <div className="admin-error">Заявка не найдена</div>;
  }
  
  return (
    <div className="admin-promotion-contact-detail">
      <button onClick={onBack} className="admin-promotion-cancel-button">
        &larr; Назад к списку заявок
      </button>
      
      <h2>Заявка от {currentContact.name}</h2>
      
      <div className="admin-promotion-contact-details">
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Имя:</div>
          <div className="admin-promotion-contact-value">{currentContact.name}</div>
        </div>
        
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Email:</div>
          <div className="admin-promotion-contact-value">{currentContact.email}</div>
        </div>
        
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Телефон:</div>
          <div className="admin-promotion-contact-value">{currentContact.phone || 'Не указан'}</div>
        </div>
        
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Компания:</div>
          <div className="admin-promotion-contact-value">{currentContact.company || 'Не указана'}</div>
        </div>
        
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Тип мероприятия:</div>
          <div className="admin-promotion-contact-value">{currentContact.eventType}</div>
        </div>
        
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Описание мероприятия:</div>
          <div className="admin-promotion-contact-value admin-promotion-contact-message">
            {currentContact.message}
          </div>
        </div>
        
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Бюджет:</div>
          <div className="admin-promotion-contact-budget">
            <span className="admin-promotion-contact-budget-tag">
              {currentContact.budget === 'low' && 'До 50 000 грн'}
              {currentContact.budget === 'medium' && '50 000 - 150 000 грн'}
              {currentContact.budget === 'high' && 'Более 150 000 грн'}
              {currentContact.budget === 'undefined' && 'Не определен'}
            </span>
          </div>
        </div>
        
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Необходимые услуги:</div>
          <div className="admin-promotion-contact-services">
            {currentContact.servicesNeeded && currentContact.servicesNeeded.length > 0 ? (
              currentContact.servicesNeeded.map((service, index) => (
                <span key={index} className="admin-promotion-contact-service-tag">
                  {service === 'organization' && 'Организация мероприятий'}
                  {service === 'promotion' && 'PR и продвижение'}
                  {service === 'technical' && 'Техническое обеспечение'}
                  {service === 'production' && 'Аудио продакшн'}
                  {service === 'consulting' && 'Консалтинг'}
                  {service === 'other' && 'Другое'}
                </span>
              ))
            ) : (
              <span>Не выбраны</span>
            )}
          </div>
        </div>
        
        <div className="admin-promotion-contact-detail-row">
          <div className="admin-promotion-contact-label">Дата заявки:</div>
          <div className="admin-promotion-contact-value">
            {new Date(currentContact.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="admin-promotion-contact-update">
        <h3>Обновить статус</h3>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="status">Статус:</label>
          <select
            id="status"
            value={status}
            onChange={handleStatusChange}
            className="admin-promotion-form-select"
          >
            <option value="new">Новая</option>
            <option value="contacted">Связались</option>
            <option value="in-progress">В процессе</option>
            <option value="completed">Завершена</option>
            <option value="cancelled">Отменена</option>
          </select>
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="notes">Примечания:</label>
          <textarea
            id="notes"
            value={notes}
            onChange={handleNotesChange}
            className="admin-promotion-note-textarea"
            placeholder="Добавьте примечания по заявке"
          ></textarea>
        </div>
        
        <button 
          onClick={handleUpdate} 
          className="admin-promotion-submit-button"
          disabled={loading}
        >
          {loading ? 'Обновление...' : 'Обновить заявку'}
        </button>
      </div>
    </div>
  );
};

export default PromotionContactDetail;