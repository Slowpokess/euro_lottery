import React, { useState, useEffect } from 'react';
import { useSpaces } from '../contexts';
import './Spaces.css';

const Spaces = () => {
  const [activeSpace, setActiveSpace] = useState(null);
  const { spaces, loading, error, fetchSpaces, fetchSpaceByCustomId } = useSpaces();

  useEffect(() => {
    const loadSpaces = async () => {
      await fetchSpaces();
      // Set default active space after data is loaded
      if (spaces.length > 0 && !activeSpace) {
        setActiveSpace(spaces[0].id);
      }
    };
    
    loadSpaces();
  }, [fetchSpaces, spaces, activeSpace]);

  // When activeSpace changes, fetch the detailed data for that space
  useEffect(() => {
    if (activeSpace) {
      fetchSpaceByCustomId(activeSpace);
    }
  }, [activeSpace, fetchSpaceByCustomId]);

  const activeSpaceData = spaces.find(space => space.id === activeSpace);

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
                key={space.id}
                className={`spaces-tab ${activeSpace === space.id ? 'active' : ''}`}
                onClick={() => setActiveSpace(space.id)}
              >
                {space.name}
              </button>
            ))}
          </div>

          <div className="spaces-content">
            <div className="spaces-gallery">
              <div className="spaces-main-image">
                <img src={activeSpaceData.images[0]} alt={activeSpaceData.name} />
              </div>
              <div className="spaces-thumbs">
                {activeSpaceData.images.map((image, index) => (
                  <div className="spaces-thumb" key={index}>
                    <img src={image} alt={`${activeSpaceData.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="spaces-info">
              <h2 className="spaces-title">{activeSpaceData.name}</h2>
              
              <div className="spaces-meta">
                <div className="spaces-meta-item">
                  <strong>Вместимость:</strong> {activeSpaceData.capacity}
                </div>
                <div className="spaces-meta-item">
                  <strong>Площадь:</strong> {activeSpaceData.size}
                </div>
              </div>
              
              <div className="spaces-description">
                <p>{activeSpaceData.description}</p>
              </div>
              
              <div className="spaces-features">
                <h3>Особенности и оборудование:</h3>
                <ul className="spaces-features-list">
                  {activeSpaceData.features.map((feature, index) => (
                    <li key={index} className="spaces-feature-item">{feature}</li>
                  ))}
                </ul>
              </div>
              
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
            <img src="/images/spaces/layout-map.jpg" alt="Схема помещений COLLIDER" />
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