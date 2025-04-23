import { useState, useEffect } from 'react';
import { useEquipment } from '../contexts/EquipmentContext';
import { useRentRequests } from '../contexts/RentRequestsContext';
import './Rent.css';

const Rent = () => {
  const { equipment, loading, error, filters, fetchEquipment, setFilters } = useEquipment();
  const { submitRentRequest } = useRentRequests();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showRentForm, setShowRentForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [rentFormData, setRentFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    eventName: '',
    eventType: '',
    eventLocation: '',
    startDate: '',
    endDate: '',
    equipmentItems: [],
    additionalServices: {
      delivery: false,
      setup: false,
      operator: false
    },
    comment: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    // При монтировании компонента загружаем доступное оборудование
    setFilters({ status: 'available' });
    fetchEquipment();
  }, [fetchEquipment, setFilters]);

  const handleCategoryChange = (category) => {
    setFilters({ ...filters, category: category === 'all' ? '' : category });
  };

  // Функция для получения метки категории
  const getCategoryLabel = (category) => {
    const categories = {
      sound: 'Звук',
      light: 'Світло',
      stage: 'Сцена',
      other: 'Інше'
    };
    return categories[category] || category;
  };

  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRentFormSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация формы
    const errors = {};
    if (!rentFormData.name.trim()) errors.name = 'Будь ласка, вкажіть ваше ім\'я';
    if (!rentFormData.email.trim()) errors.email = 'Будь ласка, вкажіть ваш email';
    else if (!/^\S+@\S+\.\S+$/.test(rentFormData.email)) errors.email = 'Будь ласка, вкажіть коректний email';
    if (!rentFormData.phone.trim()) errors.phone = 'Будь ласка, вкажіть номер телефону';
    if (!rentFormData.startDate) errors.startDate = 'Будь ласка, виберіть дату початку оренди';
    if (!rentFormData.endDate) errors.endDate = 'Будь ласка, виберіть дату закінчення оренди';
    if (new Date(rentFormData.startDate) > new Date(rentFormData.endDate)) {
      errors.endDate = 'Дата закінчення не може бути раніше дати початку';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Отправка формы
    setFormSubmitting(true);
    try {
      const response = await submitRentRequest(rentFormData);
      console.log('Заявку успішно відправлено:', response);
      setRentFormData(prev => ({
        ...prev,
        requestId: response.data._id
      }));
      setFormSubmitted(true);
    } catch (error) {
      console.error('Помилка при відправленні заявки:', error);
      setFormErrors({
        submit: error.error || 'Сталася помилка при відправленні заявки. Будь ласка, спробуйте пізніше.'
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="rent-hero">
        <div className="rent-hero-overlay"></div>
        <div className="container">
          <h1 className="rent-hero-title">Оренда обладнання</h1>
          <p className="rent-hero-subtitle">
            Професійне звукове, світлове та сценічне обладнання для вашого заходу
          </p>
        </div>
      </div>

      <div className="container section">
        <div className="rent-filters">
          <div className="rent-search">
            <input
              type="text"
              placeholder="Пошук обладнання..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="rent-categories">
            <button
              className={`rent-category-btn ${filters.category === '' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('all')}
            >
              <span className="category-icon">🔍</span>
              Усі категорії
            </button>
            <button
              className={`rent-category-btn ${filters.category === 'sound' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('sound')}
            >
              <span className="category-icon">🔊</span>
              Звук
            </button>
            <button
              className={`rent-category-btn ${filters.category === 'light' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('light')}
            >
              <span className="category-icon">💡</span>
              Світло
            </button>
            <button
              className={`rent-category-btn ${filters.category === 'stage' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('stage')}
            >
              <span className="category-icon">🎭</span>
              Сцена
            </button>
            <button
              className={`rent-category-btn ${filters.category === 'other' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('other')}
            >
              <span className="category-icon">🔧</span>
              Інше
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rent-loading">Завантаження обладнання...</div>
        ) : error ? (
          <div className="rent-error">{error}</div>
        ) : filteredEquipment.length === 0 ? (
          <div className="rent-empty">
            Обладнання не знайдено.
            {searchTerm && ' Спробуйте змінити параметри пошуку.'}
          </div>
        ) : (
          <div className="rent-equipment-grid">
            {filteredEquipment.map((item) => (
              <div key={item._id} className="rent-equipment-card">
                <div className="rent-equipment-image">
                  <img src={item.images && item.images.length > 0 ? item.images[0] : '/images/equipment-placeholder.jpg'} alt={item.name} />
                </div>
                <div className="rent-equipment-content">
                  <h3 className="rent-equipment-title">{item.name}</h3>
                  <div className="rent-equipment-category">{getCategoryLabel(item.category)}</div>
                  <p className="rent-equipment-description">{item.description}</p>
                  
                  {Object.keys(item.specifications || {}).length > 0 && (
                    <div className="rent-equipment-specs">
                      <h4>Характеристики:</h4>
                      <ul>
                        {Object.entries(item.specifications).map(([key, value]) => (
                          <li key={key}>
                            <span className="spec-name">{key}:</span> {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="rent-equipment-price">
                    {item.price} грн / {item.priceUnit === 'hour' ? 'година' : item.priceUnit === 'day' ? 'день' : 'захід'}
                  </div>
                  
                  <button 
                    className="rent-order-btn"
                    onClick={() => {
                      setSelectedEquipment(item);
                      setRentFormData(prev => ({
                        ...prev,
                        equipmentItems: [{
                          equipment: item._id,
                          quantity: 1,
                          days: 1
                        }]
                      }));
                      setShowRentForm(true);
                    }}
                  >
                    Замовити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="rent-contact section">
        <div className="container">
          <h2 className="rent-contact-title">Потрібна консультація?</h2>
          <p className="rent-contact-text">
            Зв'яжіться з нами для отримання додаткової інформації про оренду обладнання або для оформлення замовлення.
          </p>
          <div className="rent-contact-buttons">
            <a href="tel:+380991234567" className="rent-contact-btn">+38 (099) 123-45-67</a>
            <a href="mailto:rent@collider.com" className="rent-contact-btn">rent@collider.com</a>
          </div>
        </div>
      </div>
      
      {/* Модальное окно формы заявки на аренду */}
      {showRentForm && (
        <div className="rent-form-modal-overlay" onClick={() => !formSubmitting && setShowRentForm(false)}>
          <div className="rent-form-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="rent-form-close" 
              onClick={() => !formSubmitting && setShowRentForm(false)}
              disabled={formSubmitting}
            >
              ×
            </button>
            
            <h2 className="rent-form-title">
              {formSubmitted ? 'Заявку відправлено!' : 'Оформлення заявки на оренду'}
            </h2>
            
            {formSubmitted ? (
              <div className="rent-form-success">
                <div className="rent-form-success-icon">✓</div>
                <h3>Дякуємо за вашу заявку!</h3>
                <p>Ми отримали вашу заявку на оренду обладнання та зв'яжемося з вами найближчим часом для підтвердження деталей.</p>
                <p>Номер вашої заявки: <strong>{rentFormData.requestId || '#TEMP-ID'}</strong></p>
                <button 
                  className="rent-form-button"
                  onClick={() => {
                    setShowRentForm(false);
                    setFormSubmitted(false);
                    setSelectedEquipment(null);
                    setRentFormData({
                      name: '',
                      email: '',
                      phone: '',
                      organization: '',
                      eventName: '',
                      eventType: '',
                      eventLocation: '',
                      startDate: '',
                      endDate: '',
                      equipmentItems: [],
                      additionalServices: {
                        delivery: false,
                        setup: false,
                        operator: false
                      },
                      comment: ''
                    });
                  }}
                >
                  Закрити
                </button>
              </div>
            ) : (
              <form className="rent-form" onSubmit={handleRentFormSubmit}>
                {/* Информация о выбранном оборудовании */}
                {selectedEquipment && (
                  <div className="rent-form-equipment">
                    <h3>Обране обладнання</h3>
                    <div className="rent-form-equipment-item">
                      <div className="rent-form-equipment-image">
                        <img src={selectedEquipment.images && selectedEquipment.images.length > 0 ? selectedEquipment.images[0] : '/images/equipment-placeholder.jpg'} alt={selectedEquipment.name} />
                      </div>
                      <div className="rent-form-equipment-details">
                        <h4>{selectedEquipment.name}</h4>
                        <div className="rent-form-equipment-category">{getCategoryLabel(selectedEquipment.category)}</div>
                        <div className="rent-form-equipment-price">
                          {selectedEquipment.price} грн / {selectedEquipment.priceUnit === 'hour' ? 'година' : selectedEquipment.priceUnit === 'day' ? 'день' : 'захід'}
                        </div>
                      </div>
                      <div className="rent-form-equipment-controls">
                        <div className="rent-form-quantity">
                          <label htmlFor="quantity">Кількість:</label>
                          <div className="rent-form-quantity-control">
                            <button 
                              type="button" 
                              onClick={() => {
                                const currentQty = rentFormData.equipmentItems[0].quantity;
                                if (currentQty > 1) {
                                  const updatedItems = [...rentFormData.equipmentItems];
                                  updatedItems[0].quantity = currentQty - 1;
                                  setRentFormData(prev => ({
                                    ...prev,
                                    equipmentItems: updatedItems
                                  }));
                                }
                              }}
                            >-</button>
                            <input 
                              type="number" 
                              id="quantity"
                              min="1" 
                              value={rentFormData.equipmentItems[0]?.quantity || 1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                const updatedItems = [...rentFormData.equipmentItems];
                                updatedItems[0].quantity = value;
                                setRentFormData(prev => ({
                                  ...prev,
                                  equipmentItems: updatedItems
                                }));
                              }}
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const currentQty = rentFormData.equipmentItems[0].quantity;
                                const updatedItems = [...rentFormData.equipmentItems];
                                updatedItems[0].quantity = currentQty + 1;
                                setRentFormData(prev => ({
                                  ...prev,
                                  equipmentItems: updatedItems
                                }));
                              }}
                            >+</button>
                          </div>
                        </div>
                        <div className="rent-form-days">
                          <label htmlFor="days">Кількість днів:</label>
                          <div className="rent-form-quantity-control">
                            <button 
                              type="button"
                              onClick={() => {
                                const currentDays = rentFormData.equipmentItems[0].days;
                                if (currentDays > 1) {
                                  const updatedItems = [...rentFormData.equipmentItems];
                                  updatedItems[0].days = currentDays - 1;
                                  setRentFormData(prev => ({
                                    ...prev,
                                    equipmentItems: updatedItems
                                  }));
                                }
                              }}
                            >-</button>
                            <input 
                              type="number" 
                              id="days"
                              min="1" 
                              value={rentFormData.equipmentItems[0]?.days || 1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                const updatedItems = [...rentFormData.equipmentItems];
                                updatedItems[0].days = value;
                                setRentFormData(prev => ({
                                  ...prev,
                                  equipmentItems: updatedItems
                                }));
                              }}
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const currentDays = rentFormData.equipmentItems[0].days;
                                const updatedItems = [...rentFormData.equipmentItems];
                                updatedItems[0].days = currentDays + 1;
                                setRentFormData(prev => ({
                                  ...prev,
                                  equipmentItems: updatedItems
                                }));
                              }}
                            >+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Форма с информацией */}
                <div className="rent-form-sections">
                  <div className="rent-form-section">
                    <h3>Контактна інформація</h3>
                    
                    <div className="rent-form-group">
                      <label htmlFor="name">Ваше ім'я <span className="required">*</span></label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={rentFormData.name}
                        onChange={(e) => {
                          setRentFormData(prev => ({ ...prev, name: e.target.value }));
                          if (formErrors.name) {
                            setFormErrors(prev => ({ ...prev, name: '' }));
                          }
                        }}
                        className={formErrors.name ? 'rent-form-error' : ''}
                      />
                      {formErrors.name && <div className="rent-form-error-message">{formErrors.name}</div>}
                    </div>
                    
                    <div className="rent-form-group">
                      <label htmlFor="email">Email <span className="required">*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={rentFormData.email}
                        onChange={(e) => {
                          setRentFormData(prev => ({ ...prev, email: e.target.value }));
                          if (formErrors.email) {
                            setFormErrors(prev => ({ ...prev, email: '' }));
                          }
                        }}
                        className={formErrors.email ? 'rent-form-error' : ''}
                      />
                      {formErrors.email && <div className="rent-form-error-message">{formErrors.email}</div>}
                    </div>
                    
                    <div className="rent-form-group">
                      <label htmlFor="phone">Телефон <span className="required">*</span></label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={rentFormData.phone}
                        onChange={(e) => {
                          setRentFormData(prev => ({ ...prev, phone: e.target.value }));
                          if (formErrors.phone) {
                            setFormErrors(prev => ({ ...prev, phone: '' }));
                          }
                        }}
                        className={formErrors.phone ? 'rent-form-error' : ''}
                      />
                      {formErrors.phone && <div className="rent-form-error-message">{formErrors.phone}</div>}
                    </div>
                    
                    <div className="rent-form-group">
                      <label htmlFor="organization">Організація</label>
                      <input
                        type="text"
                        id="organization"
                        name="organization"
                        value={rentFormData.organization}
                        onChange={(e) => setRentFormData(prev => ({ ...prev, organization: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="rent-form-section">
                    <h3>Інформація про захід</h3>
                    
                    <div className="rent-form-group">
                      <label htmlFor="eventName">Назва заходу</label>
                      <input
                        type="text"
                        id="eventName"
                        name="eventName"
                        value={rentFormData.eventName}
                        onChange={(e) => setRentFormData(prev => ({ ...prev, eventName: e.target.value }))}
                      />
                    </div>
                    
                    <div className="rent-form-group">
                      <label htmlFor="eventType">Тип заходу</label>
                      <select
                        id="eventType"
                        name="eventType"
                        value={rentFormData.eventType}
                        onChange={(e) => setRentFormData(prev => ({ ...prev, eventType: e.target.value }))}
                      >
                        <option value="">Виберіть тип заходу</option>
                        <option value="concert">Концерт</option>
                        <option value="festival">Фестиваль</option>
                        <option value="party">Вечірка</option>
                        <option value="corporate">Корпоратив</option>
                        <option value="wedding">Весілля</option>
                        <option value="conference">Конференція</option>
                        <option value="other">Інше</option>
                      </select>
                    </div>
                    
                    <div className="rent-form-group">
                      <label htmlFor="eventLocation">Місце проведення</label>
                      <input
                        type="text"
                        id="eventLocation"
                        name="eventLocation"
                        value={rentFormData.eventLocation}
                        onChange={(e) => setRentFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
                      />
                    </div>
                    
                    <div className="rent-form-row">
                      <div className="rent-form-group">
                        <label htmlFor="startDate">Дата початку <span className="required">*</span></label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={rentFormData.startDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            setRentFormData(prev => ({ ...prev, startDate: e.target.value }));
                            if (formErrors.startDate) {
                              setFormErrors(prev => ({ ...prev, startDate: '' }));
                            }
                          }}
                          className={formErrors.startDate ? 'rent-form-error' : ''}
                        />
                        {formErrors.startDate && <div className="rent-form-error-message">{formErrors.startDate}</div>}
                      </div>
                      
                      <div className="rent-form-group">
                        <label htmlFor="endDate">Дата закінчення <span className="required">*</span></label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={rentFormData.endDate}
                          min={rentFormData.startDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            setRentFormData(prev => ({ ...prev, endDate: e.target.value }));
                            if (formErrors.endDate) {
                              setFormErrors(prev => ({ ...prev, endDate: '' }));
                            }
                          }}
                          className={formErrors.endDate ? 'rent-form-error' : ''}
                        />
                        {formErrors.endDate && <div className="rent-form-error-message">{formErrors.endDate}</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="rent-form-section">
                  <h3>Додаткові послуги</h3>
                  
                  <div className="rent-form-checkboxes">
                    <div className="rent-form-checkbox">
                      <input
                        type="checkbox"
                        id="delivery"
                        name="delivery"
                        checked={rentFormData.additionalServices.delivery}
                        onChange={(e) => setRentFormData(prev => ({
                          ...prev,
                          additionalServices: {
                            ...prev.additionalServices,
                            delivery: e.target.checked
                          }
                        }))}
                      />
                      <label htmlFor="delivery">Доставка обладнання</label>
                    </div>
                    
                    <div className="rent-form-checkbox">
                      <input
                        type="checkbox"
                        id="setup"
                        name="setup"
                        checked={rentFormData.additionalServices.setup}
                        onChange={(e) => setRentFormData(prev => ({
                          ...prev,
                          additionalServices: {
                            ...prev.additionalServices,
                            setup: e.target.checked
                          }
                        }))}
                      />
                      <label htmlFor="setup">Монтаж/демонтаж обладнання</label>
                    </div>
                    
                    <div className="rent-form-checkbox">
                      <input
                        type="checkbox"
                        id="operator"
                        name="operator"
                        checked={rentFormData.additionalServices.operator}
                        onChange={(e) => setRentFormData(prev => ({
                          ...prev,
                          additionalServices: {
                            ...prev.additionalServices,
                            operator: e.target.checked
                          }
                        }))}
                      />
                      <label htmlFor="operator">Технічний фахівець</label>
                    </div>
                  </div>
                </div>
                
                <div className="rent-form-group">
                  <label htmlFor="comment">Коментар до замовлення</label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows="3"
                    value={rentFormData.comment}
                    onChange={(e) => setRentFormData(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Вкажіть будь-які додаткові вимоги або питання до замовлення..."
                  ></textarea>
                </div>
                
                {formErrors.submit && <div className="rent-form-submit-error">{formErrors.submit}</div>}
                
                <div className="rent-form-actions">
                  <button 
                    type="button" 
                    className="rent-form-cancel"
                    onClick={() => setShowRentForm(false)}
                    disabled={formSubmitting}
                  >
                    Скасувати
                  </button>
                  <button 
                    type="submit" 
                    className="rent-form-submit"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Відправлення...' : 'Відправити заявку'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rent;