import React, { useState, useEffect } from 'react';
import { usePromotions } from '../../../contexts';

const PromotionForm = ({ id, onCancel }) => {
  const { 
    currentPromotion, 
    loading, 
    error, 
    fetchPromotionById, 
    addPromotion, 
    editPromotion 
  } = usePromotions();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    category: 'organization',
    features: [''],
    pricing: '',
    status: 'active',
    featured: false,
    order: 0
  });
  
  useEffect(() => {
    if (id) {
      fetchPromotionById(id);
    }
  }, [id, fetchPromotionById]);
  
  useEffect(() => {
    if (id && currentPromotion) {
      setFormData({
        title: currentPromotion.title || '',
        description: currentPromotion.description || '',
        image: currentPromotion.image || '',
        category: currentPromotion.category || 'organization',
        features: currentPromotion.features && currentPromotion.features.length ? 
          currentPromotion.features : [''],
        pricing: currentPromotion.pricing || '',
        status: currentPromotion.status || 'active',
        featured: currentPromotion.featured || false,
        order: currentPromotion.order || 0
      });
    }
  }, [id, currentPromotion]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };
  
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };
  
  const removeFeature = (index) => {
    if (formData.features.length > 1) {
      const updatedFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        features: updatedFeatures
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty features
    const filteredFeatures = formData.features.filter(feature => feature.trim() !== '');
    const submissionData = {
      ...formData,
      features: filteredFeatures
    };
    
    try {
      if (id) {
        await editPromotion(id, submissionData);
      } else {
        await addPromotion(submissionData);
      }
      onCancel();
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };
  
  if (loading && id) {
    return <div className="admin-loading">Загрузка услуги...</div>;
  }
  
  return (
    <div className="admin-promotion-form-container">
      <h2>{id ? 'Редактировать услугу' : 'Добавить новую услугу'}</h2>
      
      {error && <div className="admin-error">{error}</div>}
      
      <form className="admin-promotion-form" onSubmit={handleSubmit}>
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="title">Название услуги *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="admin-promotion-form-input"
            required
          />
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="description">Описание услуги *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="admin-promotion-form-textarea"
            required
          ></textarea>
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="image">URL изображения</label>
          <input
            type="text"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="admin-promotion-form-input"
          />
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="category">Категория *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="admin-promotion-form-select"
            required
          >
            <option value="organization">Организация мероприятий</option>
            <option value="promotion">PR и продвижение</option>
            <option value="technical">Техническое обеспечение</option>
            <option value="production">Аудио продакшн</option>
            <option value="consulting">Консалтинг</option>
            <option value="other">Другое</option>
          </select>
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="pricing">Цена</label>
          <input
            type="text"
            id="pricing"
            name="pricing"
            value={formData.pricing}
            onChange={handleChange}
            className="admin-promotion-form-input"
            placeholder="Например: от 15000 грн"
          />
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="order">Порядок отображения</label>
          <input
            type="number"
            id="order"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="admin-promotion-form-input"
            min="0"
          />
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label" htmlFor="status">Статус</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="admin-promotion-form-select"
          >
            <option value="active">Активно</option>
            <option value="inactive">Неактивно</option>
          </select>
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
            />
            Рекомендуемая услуга
          </label>
        </div>
        
        <div className="admin-promotion-form-group">
          <label className="admin-promotion-form-label">Особенности и включенные услуги</label>
          <div className="admin-promotion-form-features">
            {formData.features.map((feature, index) => (
              <div key={index} className="admin-promotion-feature-item">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  className="admin-promotion-feature-input"
                  placeholder="Например: Разработка концепции мероприятия"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  disabled={formData.features.length === 1}
                >
                  Удалить
                </button>
              </div>
            ))}
            <button type="button" onClick={addFeature}>
              Добавить особенность
            </button>
          </div>
        </div>
        
        <div className="admin-promotion-form-buttons">
          <button 
            type="button" 
            className="admin-promotion-cancel-button"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            className="admin-promotion-submit-button"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : id ? 'Обновить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromotionForm;