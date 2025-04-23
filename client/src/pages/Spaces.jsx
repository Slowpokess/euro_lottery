import React, { useState, useEffect, useCallback } from 'react';
import { useSpaces } from '../contexts';
import './Spaces.css';
// Импортируем схему помещений
import layoutMapImage from '../assets/images/spaces/layout-map.jpg';

// Вспомогательная функция для безопасной работы с данными
const getSafeValue = (obj, path, defaultValue = '') => {
  if (!obj) return defaultValue;
  
  // Обработка специальных случаев для обращения к элементам массива
  if (path.includes('[') && path.includes(']')) {
    // Например 'images[0]' -> обращение к первому элементу массива images
    // eslint-disable-next-line no-useless-escape
    const arrayMatch = path.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrayName = arrayMatch[1];
      const arrayIndex = parseInt(arrayMatch[2], 10);
      
      if (!obj[arrayName] || !Array.isArray(obj[arrayName]) || arrayIndex >= obj[arrayName].length) {
        return defaultValue;
      }
      
      return obj[arrayName][arrayIndex] ?? defaultValue;
    }
  }
  
  // Обычная обработка вложенных свойств через точку
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || !Object.prototype.hasOwnProperty.call(result, key)) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === null || result === undefined ? defaultValue : result;
};

const Spaces = () => {
  const [activeSpace, setActiveSpace] = useState(null);
  const [didInitialLoad, setDidInitialLoad] = useState(false);
  const { spaces, loading, error, fetchSpaces, fetchSpaceByCustomId } = useSpaces();

  // Загрузка списка пространств только при первом рендере
  useEffect(() => {
    const loadSpaces = async () => {
      try {
        await fetchSpaces();
        setDidInitialLoad(true);
      } catch (error) {
        console.error('Failed to load spaces:', error);
      }
    };
    
    if (!didInitialLoad) {
      loadSpaces();
    }
  }, [fetchSpaces, didInitialLoad]);

  // Установка активного пространства после загрузки данных
  useEffect(() => {
    if (spaces.length > 0 && !activeSpace && didInitialLoad) {
      // Используем customId вместо id, основываясь на структуре данных
      const firstSpaceId = spaces[0].customId || spaces[0]._id;
      setActiveSpace(firstSpaceId);
    }
  }, [spaces, activeSpace, didInitialLoad]);

  // Загрузка детальных данных о пространстве при изменении активного пространства
  // Используем useCallback для предотвращения лишних вызовов
  const loadActiveSpaceDetails = useCallback(() => {
    if (activeSpace) {
      fetchSpaceByCustomId(activeSpace);
    }
  }, [activeSpace, fetchSpaceByCustomId]);

  useEffect(() => {
    if (activeSpace) {
      loadActiveSpaceDetails();
    }
  }, [activeSpace, loadActiveSpaceDetails]);

  // Находим активное пространство в списке 
  const activeSpaceData = spaces.find(space => 
    (space.customId === activeSpace) || (space._id === activeSpace)
  ) || {}; // Всегда возвращаем как минимум пустой объект для безопасной работы

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Загрузка пространств...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-container">
          <p>Ошибка загрузки: {error}</p>
        </div>
      </div>
    );
  }

  if (!activeSpaceData) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Выбор пространства...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Секция Герой */}
      <div className="spaces-hero">
        <div className="spaces-hero-overlay"></div>
        <div className="container">
          <h1 className="spaces-hero-title">Наши пространства</h1>
          <p className="spaces-hero-subtitle">
            2000 кв.м приміщення, 100000 кв звуку, нескінченність світла, лазери
          </p>
        </div>
      </div>

      {/* Основная секция */}
      <section className="spaces-main section">
        <div className="container">
          <div className="spaces-tabs">
            {spaces.map(space => (
              <button
                key={getSafeValue(space, '_id', '')}
                className={`spaces-tab ${activeSpace === (space.customId || space._id) ? 'active' : ''}`}
                onClick={() => setActiveSpace(space.customId || space._id)}
              >
                {getSafeValue(space, 'name', 'Пространство')}
              </button>
            ))}
          </div>

          <div className="spaces-content">
            <div className="spaces-gallery">
              <div className="spaces-main-image">
                {/* Используем getSafeValue для безопасного доступа к данным */}
                <img 
                  src={getSafeValue(activeSpaceData, 'images', []).length > 0 
                    ? getSafeValue(activeSpaceData, 'images[0]', '') 
                    : getSafeValue(activeSpaceData, 'image', '/images/space-placeholder.jpg')} 
                  alt={getSafeValue(activeSpaceData, 'name', 'Изображение пространства')}
                  loading="lazy" 
                />
              </div>
              <div className="spaces-thumbs">
                {/* Используем getSafeValue для безопасного доступа к данным */}
                {getSafeValue(activeSpaceData, 'images', []).length > 0 ? (
                  getSafeValue(activeSpaceData, 'images', []).map((image, index) => (
                    <div className="spaces-thumb" key={index}>
                      <img 
                        src={image} 
                        alt={`${getSafeValue(activeSpaceData, 'name', 'Пространство')} ${index + 1}`} 
                        loading="lazy"
                      />
                    </div>
                  ))
                ) : getSafeValue(activeSpaceData, 'image', '') ? (
                  <div className="spaces-thumb">
                    <img 
                      src={getSafeValue(activeSpaceData, 'image', '/images/space-placeholder.jpg')} 
                      alt={getSafeValue(activeSpaceData, 'name', 'Пространство')} 
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="spaces-info">
              <h2 className="spaces-title">{getSafeValue(activeSpaceData, 'name', 'Пространство')}</h2>
              
              <div className="spaces-meta">
                <div className="spaces-meta-item">
                  <strong>Вместимость:</strong> {getSafeValue(activeSpaceData, 'capacity', 'Не указано')}
                </div>
                <div className="spaces-meta-item">
                  <strong>Площадь:</strong> {getSafeValue(activeSpaceData, 'size') || getSafeValue(activeSpaceData, 'area', 'Не указано')} м²
                </div>
              </div>
              
              <div className="spaces-description">
                <p>{getSafeValue(activeSpaceData, 'description', 'Описание отсутствует')}</p>
              </div>
              
              {/* Проверяем наличие массива features или equipment */}
              {(getSafeValue(activeSpaceData, 'features', []).length > 0) || 
               (getSafeValue(activeSpaceData, 'equipment', []).length > 0) ? (
                <div className="spaces-features">
                  <h3>Особенности и оборудование:</h3>
                  <ul className="spaces-features-list">
                    {/* Отображаем features, если они есть */}
                    {getSafeValue(activeSpaceData, 'features', []).map((feature, index) => (
                      <li key={`feature-${index}`} className="spaces-feature-item">{feature}</li>
                    ))}
                    
                    {/* Отображаем equipment, если он есть */}
                    {getSafeValue(activeSpaceData, 'equipment', []).map((item, index) => (
                      <li key={`equipment-${index}`} className="spaces-feature-item">{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              
              <div className="spaces-actions">
                <a href="/contacts" className="spaces-button">Забронировать</a>
                <a href="#pricing" className="spaces-button secondary">Цены и условия</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция схемы помещения */}
      <section className="spaces-layout section" id="layout">
        <div className="container">
          <h2 className="section-title text-center">Схема помещений</h2>
          <div className="spaces-layout-image">
            {/* Используем импортированное изображение вместо прямого пути */}
            <img 
              src={layoutMapImage} 
              alt="Схема помещений COLLIDER" 
              loading="lazy"
            />
          </div>
          <div className="spaces-layout-legend">
            <div className="spaces-legend-item">
              <span className="spaces-legend-color" style={{backgroundColor: '#ff4d00'}}></span>
              <span className="spaces-legend-text">Главный зал</span>
            </div>
            <div className="spaces-legend-item">
              <span className="spaces-legend-color" style={{backgroundColor: '#00a2ff'}}></span>
              <span className="spaces-legend-text">Студия звукозаписи</span>
            </div>
            <div className="spaces-legend-item">
              <span className="spaces-legend-color" style={{backgroundColor: '#85cc16'}}></span>
              <span className="spaces-legend-text">Арт-галерея</span>
            </div>
            <div className="spaces-legend-item">
              <span className="spaces-legend-color" style={{backgroundColor: '#a855f7'}}></span>
              <span className="spaces-legend-text">Мастерские</span>
            </div>
            <div className="spaces-legend-item">
              <span className="spaces-legend-color" style={{backgroundColor: '#f59e0b'}}></span>
              <span className="spaces-legend-text">Кафе</span>
            </div>
          </div>
        </div>
      </section>

      {/* Секция цен */}
      <section className="spaces-pricing section" id="pricing">
        <div className="container">
          <h2 className="section-title text-center">Цены и условия аренды</h2>
          <div className="spaces-pricing-grid">
            <div className="spaces-pricing-card">
              <div className="spaces-pricing-header">
                <h3>Главный зал</h3>
                <div className="spaces-pricing-amount">от 20 000 грн</div>
                <div className="spaces-pricing-period">за день мероприятия</div>
              </div>
              <div className="spaces-pricing-features">
                <ul>
                  <li>Звуковая система включена</li>
                  <li>Базовое световое оборудование</li>
                  <li>Техническая поддержка</li>
                  <li>Гардероб</li>
                  <li>Охрана</li>
                </ul>
              </div>
              <div className="spaces-pricing-action">
                <a href="/contacts" className="spaces-pricing-button">Забронировать</a>
              </div>
            </div>

            <div className="spaces-pricing-card">
              <div className="spaces-pricing-header">
                <h3>Студия звукозаписи</h3>
                <div className="spaces-pricing-amount">от 800 грн</div>
                <div className="spaces-pricing-period">в час</div>
              </div>
              <div className="spaces-pricing-features">
                <ul>
                  <li>Звукорежиссер включен</li>
                  <li>Все оборудование студии</li>
                  <li>Аудиоредактирование</li>
                  <li>Комната отдыха для музыкантов</li>
                  <li>Чай/кофе</li>
                </ul>
              </div>
              <div className="spaces-pricing-action">
                <a href="/contacts" className="spaces-pricing-button">Забронировать</a>
              </div>
            </div>

            <div className="spaces-pricing-card">
              <div className="spaces-pricing-header">
                <h3>Арт-галерея</h3>
                <div className="spaces-pricing-amount">от 10 000 грн</div>
                <div className="spaces-pricing-period">за день</div>
              </div>
              <div className="spaces-pricing-features">
                <ul>
                  <li>Освещение включено</li>
                  <li>Базовая инсталляция</li>
                  <li>Стены для экспозиции</li>
                  <li>Возможность фуршета</li>
                  <li>Wi-Fi</li>
                </ul>
              </div>
              <div className="spaces-pricing-action">
                <a href="/contacts" className="spaces-pricing-button">Забронировать</a>
              </div>
            </div>

            <div className="spaces-pricing-card">
              <div className="spaces-pricing-header">
                <h3>Мастерские</h3>
                <div className="spaces-pricing-amount">от 4 000 грн</div>
                <div className="spaces-pricing-period">за день</div>
              </div>
              <div className="spaces-pricing-features">
                <ul>
                  <li>Специализированное оборудование</li>
                  <li>Место для хранения вещей</li>
                  <li>Возможность аренды инструментов</li>
                  <li>Доступ к кухне</li>
                  <li>Wi-Fi</li>
                </ul>
              </div>
              <div className="spaces-pricing-action">
                <a href="/contacts" className="spaces-pricing-button">Забронировать</a>
              </div>
            </div>
          </div>
          <div className="spaces-pricing-note">
            <p>* Цены указаны без НДС. Конечная стоимость зависит от дня недели, продолжительности аренды и дополнительных услуг.</p>
            <p>* Возможна аренда дополнительного оборудования и технического персонала.</p>
            <p>* Для резидентов COLLIDER действуют специальные тарифы.</p>
          </div>
        </div>
      </section>

      {/* Секция FAQ */}
      <section className="spaces-faq section">
        <div className="container">
          <h2 className="section-title text-center">Часто задаваемые вопросы</h2>
          <div className="spaces-faq-list">
            <div className="spaces-faq-item">
              <div className="spaces-faq-question">Каковы условия отмены бронирования?</div>
              <div className="spaces-faq-answer">
                <p>При отмене бронирования за 14 дней до события возвращается 100% предоплаты. За 7-13 дней - 50%. Менее чем за 7 дней предоплата не возвращается.</p>
              </div>
            </div>
            <div className="spaces-faq-item">
              <div className="spaces-faq-question">Можно ли привлекать своих специалистов по звуку и свету?</div>
              <div className="spaces-faq-answer">
                <p>Да, это возможно. Однако мы рекомендуем использовать наших специалистов, которые хорошо знакомы с оборудованием и особенностями помещений.</p>
              </div>
            </div>
            <div className="spaces-faq-item">
              <div className="spaces-faq-question">Возможна ли аренда в ночное время?</div>
              <div className="spaces-faq-answer">
                <p>Главный зал и студия звукозаписи доступны для аренды круглосуточно. Мастерские и галерея работают с 9:00 до 22:00.</p>
              </div>
            </div>
            <div className="spaces-faq-item">
              <div className="spaces-faq-question">Предоставляете ли вы услуги кейтеринга?</div>
              <div className="spaces-faq-answer">
                <p>Мы не предоставляем услуги кейтеринга напрямую, но можем порекомендовать проверенных партнеров или вы можете привлечь свою кейтеринговую компанию.</p>
              </div>
            </div>
            <div className="spaces-faq-item">
              <div className="spaces-faq-question">Есть ли у вас парковка?</div>
              <div className="spaces-faq-answer">
                <p>Да, у нас есть бесплатная парковка на 50 машиномест. При проведении крупных мероприятий рекомендуем заранее согласовать количество парковочных мест.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Контактная секция */}
      <section className="spaces-contact section">
        <div className="container">
          <div className="spaces-contact-content">
            <h2>Забронировать пространство</h2>
            <p>Готовы обсудить ваше мероприятие? Свяжитесь с нами для уточнения деталей и бронирования.</p>
            <div className="spaces-contact-buttons">
              <a href="/contacts" className="spaces-contact-button">Отправить заявку</a>
              <a href="tel:+380991234567" className="spaces-contact-button secondary">+38 (099) 123-45-67</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Spaces;