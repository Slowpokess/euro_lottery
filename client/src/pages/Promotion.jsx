import React, { useState, useEffect } from 'react';
import { usePromotions, usePromotionContacts, useUI } from '../contexts';
import './Promotion.css';

const Promotion = () => {
  const { promotions, loading: promotionsLoading, error: promotionsError, fetchPromotions } = usePromotions();
  const { submitContact, loading: contactLoading, error: contactError, success: contactSuccess, resetSuccess } = usePromotionContacts();
  const { showNotification } = useUI();
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    eventType: '',
    message: '',
    budget: 'undefined',
    servicesNeeded: []
  });
  
  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);
  
  useEffect(() => {
    if (contactSuccess) {
      showNotification({
        type: 'success',
        message: 'Ваша заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.'
      });
      setContactForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        eventType: '',
        message: '',
        budget: 'undefined',
        servicesNeeded: []
      });
      resetSuccess();
    }
  }, [contactSuccess, showNotification, resetSuccess]);
  
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleServicesChange = (e) => {
    const { value, checked } = e.target;
    setContactForm(prev => {
      if (checked) {
        return {
          ...prev,
          servicesNeeded: [...prev.servicesNeeded, value]
        };
      } else {
        return {
          ...prev,
          servicesNeeded: prev.servicesNeeded.filter(service => service !== value)
        };
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitContact(contactForm);
    } catch (error) {
      console.error('Error submitting contact form:', error);
    }
  };

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="promotion-hero">
        <div className="promotion-hero-overlay"></div>
        <div className="container">
          <h1 className="promotion-hero-title">Промоушн</h1>
          <p className="promotion-hero-subtitle">
            Организация и продвижение мероприятий в культурном кластере COLLIDER
          </p>
        </div>
      </div>

      {/* Services Section */}
      <section className="promotion-services section">
        <div className="container">
          <h2 className="promotion-services-title">Наши услуги</h2>
          
          {promotionsLoading && (
            <div className="promotion-loading">Загрузка услуг...</div>
          )}
          
          {promotionsError && (
            <div className="promotion-error">Ошибка загрузки услуг: {typeof promotionsError === 'object' ? promotionsError.message || JSON.stringify(promotionsError) : promotionsError}</div>
          )}
          
          <div className="promotion-services-grid">
            {promotions.map(promotion => (
              <div key={promotion._id} className="promotion-service-card">
                <div className="promotion-service-image">
                  <img src={promotion.image} alt={promotion.title} />
                </div>
                <div className="promotion-service-content">
                  <h3 className="promotion-service-title">{promotion.title}</h3>
                  <p className="promotion-service-description">{promotion.description}</p>
                  {promotion.pricing && (
                    <p className="promotion-service-price">{promotion.pricing}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="promotion-process section">
        <div className="container">
          <h2 className="promotion-process-title">Как мы работаем</h2>
          <div className="promotion-process-steps">
            <div className="promotion-process-step">
              <div className="promotion-process-step-number">1</div>
              <h3 className="promotion-process-step-title">Обсуждение идеи</h3>
              <p className="promotion-process-step-description">
                Встреча с командой, обсуждение концепции и целей мероприятия.
              </p>
            </div>

            <div className="promotion-process-step">
              <div className="promotion-process-step-number">2</div>
              <h3 className="promotion-process-step-title">Планирование</h3>
              <p className="promotion-process-step-description">
                Разработка плана мероприятия, подбор подходящих площадок и оборудования.
              </p>
            </div>

            <div className="promotion-process-step">
              <div className="promotion-process-step-number">3</div>
              <h3 className="promotion-process-step-title">Реализация</h3>
              <p className="promotion-process-step-description">
                Организация и проведение мероприятия с полным техническим обеспечением.
              </p>
            </div>

            <div className="promotion-process-step">
              <div className="promotion-process-step-number">4</div>
              <h3 className="promotion-process-step-title">Анализ</h3>
              <p className="promotion-process-step-description">
                Подведение итогов, анализ результатов и планирование дальнейшего сотрудничества.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="promotion-contact-form section">
        <div className="container">
          <h2 className="promotion-contact-title">Начнем сотрудничество</h2>
          <p className="promotion-contact-text">
            Готовы обсудить ваше следующее мероприятие? Заполните форму ниже, и мы свяжемся с вами, чтобы обсудить детали.
          </p>
          
          {contactError && (
            <div className="promotion-form-error">
              {typeof contactError === 'object' ? contactError.message || JSON.stringify(contactError) : contactError}
            </div>
          )}
          
          <form className="promotion-form" onSubmit={handleSubmit}>
            <div className="promotion-form-row">
              <div className="promotion-form-group">
                <label htmlFor="name">Имя *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  required
                />
              </div>
              
              <div className="promotion-form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                />
              </div>
            </div>
            
            <div className="promotion-form-row">
              <div className="promotion-form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={contactForm.phone}
                  onChange={handleContactChange}
                />
              </div>
              
              <div className="promotion-form-group">
                <label htmlFor="company">Компания</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={contactForm.company}
                  onChange={handleContactChange}
                />
              </div>
            </div>
            
            <div className="promotion-form-group">
              <label htmlFor="eventType">Тип мероприятия *</label>
              <input
                type="text"
                id="eventType"
                name="eventType"
                value={contactForm.eventType}
                onChange={handleContactChange}
                placeholder="Например: концерт, выставка, корпоратив, etc."
                required
              />
            </div>
            
            <div className="promotion-form-group">
              <label htmlFor="message">Описание мероприятия *</label>
              <textarea
                id="message"
                name="message"
                value={contactForm.message}
                onChange={handleContactChange}
                rows="5"
                placeholder="Расскажите о вашем мероприятии, его целях, ожидаемом количестве участников и т.д."
                required
              ></textarea>
            </div>
            
            <div className="promotion-form-group">
              <label>Бюджет</label>
              <div className="promotion-form-radio-group">
                <div className="promotion-form-radio">
                  <input
                    type="radio"
                    id="budget-low"
                    name="budget"
                    value="low"
                    checked={contactForm.budget === 'low'}
                    onChange={handleContactChange}
                  />
                  <label htmlFor="budget-low">До 50 000 грн</label>
                </div>
                
                <div className="promotion-form-radio">
                  <input
                    type="radio"
                    id="budget-medium"
                    name="budget"
                    value="medium"
                    checked={contactForm.budget === 'medium'}
                    onChange={handleContactChange}
                  />
                  <label htmlFor="budget-medium">50 000 - 150 000 грн</label>
                </div>
                
                <div className="promotion-form-radio">
                  <input
                    type="radio"
                    id="budget-high"
                    name="budget"
                    value="high"
                    checked={contactForm.budget === 'high'}
                    onChange={handleContactChange}
                  />
                  <label htmlFor="budget-high">Более 150 000 грн</label>
                </div>
                
                <div className="promotion-form-radio">
                  <input
                    type="radio"
                    id="budget-undefined"
                    name="budget"
                    value="undefined"
                    checked={contactForm.budget === 'undefined'}
                    onChange={handleContactChange}
                  />
                  <label htmlFor="budget-undefined">Еще не определен</label>
                </div>
              </div>
            </div>
            
            <div className="promotion-form-group">
              <label>Необходимые услуги</label>
              <div className="promotion-form-checkbox-group">
                <div className="promotion-form-checkbox">
                  <input
                    type="checkbox"
                    id="service-organization"
                    name="servicesNeeded"
                    value="organization"
                    checked={contactForm.servicesNeeded.includes('organization')}
                    onChange={handleServicesChange}
                  />
                  <label htmlFor="service-organization">Организация мероприятий</label>
                </div>
                
                <div className="promotion-form-checkbox">
                  <input
                    type="checkbox"
                    id="service-promotion"
                    name="servicesNeeded"
                    value="promotion"
                    checked={contactForm.servicesNeeded.includes('promotion')}
                    onChange={handleServicesChange}
                  />
                  <label htmlFor="service-promotion">PR и продвижение</label>
                </div>
                
                <div className="promotion-form-checkbox">
                  <input
                    type="checkbox"
                    id="service-technical"
                    name="servicesNeeded"
                    value="technical"
                    checked={contactForm.servicesNeeded.includes('technical')}
                    onChange={handleServicesChange}
                  />
                  <label htmlFor="service-technical">Техническое обеспечение</label>
                </div>
                
                <div className="promotion-form-checkbox">
                  <input
                    type="checkbox"
                    id="service-production"
                    name="servicesNeeded"
                    value="production"
                    checked={contactForm.servicesNeeded.includes('production')}
                    onChange={handleServicesChange}
                  />
                  <label htmlFor="service-production">Аудио продакшн</label>
                </div>
                
                <div className="promotion-form-checkbox">
                  <input
                    type="checkbox"
                    id="service-consulting"
                    name="servicesNeeded"
                    value="consulting"
                    checked={contactForm.servicesNeeded.includes('consulting')}
                    onChange={handleServicesChange}
                  />
                  <label htmlFor="service-consulting">Консалтинг</label>
                </div>
                
                <div className="promotion-form-checkbox">
                  <input
                    type="checkbox"
                    id="service-other"
                    name="servicesNeeded"
                    value="other"
                    checked={contactForm.servicesNeeded.includes('other')}
                    onChange={handleServicesChange}
                  />
                  <label htmlFor="service-other">Другое</label>
                </div>
              </div>
            </div>
            
            <div className="promotion-form-submit">
              <button
                type="submit"
                className="promotion-contact-button"
                disabled={contactLoading}
              >
                {contactLoading ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Promotion;