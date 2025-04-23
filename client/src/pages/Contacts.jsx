import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Contacts.css';

const Contacts = () => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('contacts.form.errors.name');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('contacts.form.errors.emailRequired');
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t('contacts.form.errors.emailInvalid');
    }
    
    if (!formData.subject) {
      newErrors.subject = t('contacts.form.errors.subject');
    }
    
    if (!formData.message.trim()) {
      newErrors.message = t('contacts.form.errors.message');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // В реальном проекте здесь будет отправка формы на сервер
      console.log('Form data:', formData);
      setSubmitted(true);
      
      // Очищаем форму после успешной отправки
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }
  };

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="contacts-hero">
        <div className="contacts-hero-overlay"></div>
        <div className="container">
          <h1 className="contacts-hero-title">{t('contacts.hero.title')}</h1>
          <p className="contacts-hero-subtitle">
            {t('contacts.hero.subtitle')}
          </p>
        </div>
      </div>

      {/* Contact Information Section */}
      <section className="contacts-info section">
        <div className="container">
          <div className="contacts-info-grid">
            <div className="contacts-info-card">
              <div className="contacts-info-icon">📍</div>
              <h3 className="contacts-info-title">{t('contacts.info.address')}</h3>
              <p className="contacts-info-text">
                {t('contacts.info.addressLine')}<br />
                04107
              </p>
            </div>
            
            <div className="contacts-info-card">
              <div className="contacts-info-icon">📞</div>
              <h3 className="contacts-info-title">{t('contacts.info.phone')}</h3>
              <p className="contacts-info-text">
                <a href="tel:+380991234567">+38 (099) 123-45-67</a><br />
                <a href="tel:+380991234568">+38 (099) 123-45-68</a>
              </p>
            </div>
            
            <div className="contacts-info-card">
              <div className="contacts-info-icon">✉️</div>
              <h3 className="contacts-info-title">{t('contacts.info.email')}</h3>
              <p className="contacts-info-text">
                <a href="mailto:info@collider.com">info@collider.com</a><br />
                <a href="mailto:booking@collider.com">booking@collider.com</a>
              </p>
            </div>
            
            <div className="contacts-info-card">
              <div className="contacts-info-icon">🕒</div>
              <h3 className="contacts-info-title">{t('contacts.hours.title')}</h3>
              <p className="contacts-info-text">
                {t('contacts.hours.weekdays')}: {t('contacts.hours.weekdaysHours')}<br />
                {t('contacts.hours.weekend')}: {t('contacts.hours.weekendHours')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Секция карты и формы */}
      <section className="contacts-main section">
        <div className="container">
          <div className="contacts-main-grid">
            <div className="contacts-map">
              <h2 className="contacts-section-title">Как нас найти</h2>
              <div className="contacts-map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2540.3947862779144!2d30.494007484227596!3d50.47365496308711!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d4cf19955a2fb5%3A0x3a403fa1b3ce1c40!2sCollider%20(%D0%9A%D0%BE%D0%BB%D0%BB%D0%B0%D0%B9%D0%B4%D0%B5%D1%80)!5e0!3m2!1sru!2sua!4v1712368500168!5m2!1sru!2sua"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта расположения COLLIDER"
                ></iframe>
              </div>
              <div className="contacts-directions">
                <h3>Как добраться:</h3>
                <ul>
                  <li><strong>Метро:</strong> Станція метро Тараса Шевченка", 10 хвiлин пешком</li>
                  <li><strong>Автобус:</strong> вхід з, вулиця Кирилівська, 60, Київ</li>
                  <li><strong>Автомобиль:</strong> парковка доступна на территории комплекса (30 мест)</li>
                </ul>
              </div>
            </div>
            
            <div className="contacts-form">
              <h2 className="contacts-section-title">{t('contacts.form.title')}</h2>
              {submitted ? (
                <div className="contacts-form-success">
                  <h3>{t('contacts.form.thankYou')}</h3>
                  <p>{t('contacts.form.willContact')}</p>
                  <button 
                    className="contacts-form-new-btn"
                    onClick={() => setSubmitted(false)}
                  >
                    {t('contacts.form.newMessage')}
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">{t('contacts.form.name')} <span className="required">*</span></label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={errors.name ? 'input-error' : ''}
                    />
                    {errors.name && <div className="error-message">{errors.name}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">{t('contacts.form.email')} <span className="required">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'input-error' : ''}
                    />
                    {errors.email && <div className="error-message">{errors.email}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">{t('contacts.form.phone')}</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">{t('contacts.form.subject')} <span className="required">*</span></label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={errors.subject ? 'input-error' : ''}
                    >
                      <option value="">{t('contacts.form.selectSubject')}</option>
                      <option value="general">{t('contacts.form.subjectOptions.general')}</option>
                      <option value="booking">{t('contacts.form.subjectOptions.booking')}</option>
                      <option value="equipment">{t('contacts.form.subjectOptions.equipment')}</option>
                      <option value="collaboration">{t('contacts.form.subjectOptions.collaboration')}</option>
                      <option value="residency">{t('contacts.form.subjectOptions.residency')}</option>
                      <option value="other">{t('contacts.form.subjectOptions.other')}</option>
                    </select>
                    {errors.subject && <div className="error-message">{errors.subject}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message">{t('contacts.form.message')} <span className="required">*</span></label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className={errors.message ? 'input-error' : ''}
                    ></textarea>
                    {errors.message && <div className="error-message">{errors.message}</div>}
                  </div>
                  
                  <div className="form-group form-submit">
                    <button type="submit" className="contact-submit-btn">{t('contacts.form.button')}</button>
                  </div>
                </form>
              )}
            </div></div>
        </div>
      </section>

      {/* Секция социальных сетей */}
      <section className="contacts-social section">
        <div className="container">
          <h2 className="section-title text-center">Мы в социальных сетях</h2>
          <div className="contacts-social-links">
            <a href="https://instagram.com/collider" target="_blank" rel="noopener noreferrer" className="contacts-social-link">
              <div className="contacts-social-icon">
                <img src="/icons/social/instagram.svg" alt="Instagram" />
              </div>
              <div className="contacts-social-name">Instagram</div>
              <div className="contacts-social-username">@collider</div>
            </a>
            
            <a href="https://t.me/collider" target="_blank" rel="noopener noreferrer" className="contacts-social-link">
              <div className="contacts-social-icon">
                <img src="/icons/social/telegram.svg" alt="Telegram" />
              </div>
              <div className="contacts-social-name">Telegram</div>
              <div className="contacts-social-username">@collider</div>
            </a>
            
            <a href="https://facebook.com/collider" target="_blank" rel="noopener noreferrer" className="contacts-social-link">
              <div className="contacts-social-icon">
                <img src="/icons/social/facebook.svg" alt="Facebook" />
              </div>
              <div className="contacts-social-name">Facebook</div>
              <div className="contacts-social-username">@collider</div>
            </a>
            
            <a href="https://ra.co/clubs/collider" target="_blank" rel="noopener noreferrer" className="contacts-social-link">
              <div className="contacts-social-icon">
                <img src="/icons/social/ra.svg" alt="Resident Advisor" />
              </div>
              <div className="contacts-social-name">Resident Advisor</div>
              <div className="contacts-social-username">/clubs/collider</div>
            </a>
          </div>
        </div>
      </section>

      {/* Секция для организаторов мероприятий */}
      <section className="contacts-promoters section">
        <div className="container">
          <div className="contacts-promoters-content">
            <h2>Для организаторов мероприятий</h2>
            <p>
              Планируете провести концерт, выставку, вечеринку или другое мероприятие? 
              Наша команда поможет вам организовать событие любой сложности.
            </p>
            <div className="contacts-promoters-features">
              <div className="contacts-promoters-feature">
                <div className="contacts-feature-icon">🎵</div>
                <div className="contacts-feature-title">Профессиональное оборудование</div>
              </div>
              <div className="contacts-promoters-feature">
                <div className="contacts-feature-icon">👥</div>
                <div className="contacts-feature-title">Техническая поддержка</div>
              </div>
              <div className="contacts-promoters-feature">
                <div className="contacts-feature-icon">📅</div>
                <div className="contacts-feature-title">Гибкое расписание</div>
              </div>
              <div className="contacts-promoters-feature">
                <div className="contacts-feature-icon">🚪</div>
                <div className="contacts-feature-title">Различные пространства</div>
              </div>
            </div>
            <a href="mailto:booking@collider.com" className="contacts-promoters-button">
              Отправить заявку на проведение мероприятия
            </a>
          </div>
        </div>
      </section>

      {/* Секция FAQ */}
      <section className="contacts-faq section">
        <div className="container">
          <h2 className="section-title text-center">Часто задаваемые вопросы</h2>
          <div className="contacts-faq-list">
            <div className="contacts-faq-item">
              <div className="contacts-faq-question">Есть ли у вас парковка?</div>
              <div className="contacts-faq-answer">
                <p>Да, на территории COLLIDER есть парковка на 50 машиномест. Парковка бесплатна для посетителей мероприятий.</p>
              </div>
            </div>
            <div className="contacts-faq-item">
              <div className="contacts-faq-question">Как забронировать помещение для мероприятия?</div>
              <div className="contacts-faq-answer">
                <p>Для бронирования помещения вы можете связаться с нами по телефону, email или заполнить форму на сайте. Наш менеджер свяжется с вами для обсуждения деталей.</p>
              </div>
            </div>
            <div className="contacts-faq-item">
              <div className="contacts-faq-question">Работаете ли вы в выходные?</div>
              <div className="contacts-faq-answer">
                <p>Да, в выходные дни мы работаем с 12:00 до 00:00. В эти дни чаще всего проходят мероприятия и вечеринки.</p>
              </div>
            </div>
            <div className="contacts-faq-item">
              <div className="contacts-faq-question">Как стать резидентом COLLIDER?</div>
              <div className="contacts-faq-answer">
                <p>Для того чтобы стать резидентом, вам необходимо заполнить заявку на нашем сайте в разделе "Резиденты" или связаться с нами напрямую. После рассмотрения заявки мы пригласим вас на собеседование.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contacts;