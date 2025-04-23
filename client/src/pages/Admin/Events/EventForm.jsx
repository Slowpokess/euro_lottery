import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../../contexts';
import './Events.css';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { currentEvent, loading: contextLoading, error: contextError, fetchEventById, addEvent, editEvent } = useEvents();
  
  const [formState, setFormState] = useState({
    title: '',
    date: '',
    description: '',
    image: '',
    status: 'upcoming',
    lineup: '',
    location: '',
    ticketLink: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isEditMode) {
      const loadEvent = async () => {
        try {
          setLoading(true);
          await fetchEventById(id);
        } catch (error) {
          setError('Ошибка при загрузке данных события');
        } finally {
          setLoading(false);
        }
      };
      
      loadEvent();
    }
  }, [isEditMode, id, fetchEventById]);
  
  // Update form when currentEvent changes
  useEffect(() => {
    if (currentEvent && isEditMode) {
      setFormState({
        title: currentEvent.title || '',
        date: currentEvent.date ? new Date(currentEvent.date).toISOString().split('T')[0] : '',
        description: currentEvent.description || '',
        image: currentEvent.image || '',
        status: currentEvent.status || 'upcoming',
        lineup: currentEvent.lineup || '',
        location: currentEvent.location || '',
        ticketLink: currentEvent.ticketLink || ''
      });
    }
  }, [currentEvent, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Простая валидация формы
    if (!formState.title || !formState.date || !formState.description) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (isEditMode) {
        await editEvent(id, formState);
      } else {
        await addEvent(formState);
      }
      
      // После успешного сохранения перенаправляем на список событий
      navigate('/admin/events');
    } catch (error) {
      setError(error.error || 'Ошибка при сохранении события');
      setLoading(false);
    }
  };
  
  if ((loading || contextLoading) && isEditMode) {
    return <div className="admin-loading">Загрузка данных события...</div>;
  }
  
  return (
    <div className="admin-event-form-container">
      <h2>{isEditMode ? 'Редактирование события' : 'Создание нового события'}</h2>
      
      {(error || contextError) && <div className="admin-form-error">{error || contextError}</div>}
      
      <form className="admin-event-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Название события *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formState.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="date">Дата проведения *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formState.date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="status">Статус события</label>
          <select
            id="status"
            name="status"
            value={formState.status}
            onChange={handleChange}
          >
            <option value="upcoming">Предстоящее</option>
            <option value="past">Прошедшее</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Описание события *</label>
          <textarea
            id="description"
            name="description"
            value={formState.description}
            onChange={handleChange}
            rows="5"
            required
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="image">URL изображения</label>
          <input
            type="text"
            id="image"
            name="image"
            value={formState.image}
            onChange={handleChange}
            placeholder="URL изображения или загрузите файл"
          />
          {/* В продакшн-версии здесь будет компонент для загрузки изображения */}
          <div className="image-upload-container">
            <button type="button" className="admin-btn admin-btn-secondary">
              Загрузить изображение
            </button>
            {formState.image && (
              <div className="image-preview">
                <img src={formState.image} alt="Предпросмотр" />
              </div>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="lineup">Лайн-ап</label>
          <textarea
            id="lineup"
            name="lineup"
            value={formState.lineup}
            onChange={handleChange}
            rows="3"
            placeholder="Список выступающих артистов, разделенных запятыми"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Место проведения</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formState.location}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="ticketLink">Ссылка на билеты</label>
          <input
            type="url"
            id="ticketLink"
            name="ticketLink"
            value={formState.ticketLink}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
        
        <div className="form-buttons">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/admin/events')}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            className="admin-btn admin-btn-primary"
            disabled={loading || contextLoading}
          >
            {(loading || contextLoading) ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm; 