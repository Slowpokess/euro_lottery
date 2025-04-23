import React, { useState, useEffect } from 'react';
import { useResidents } from '../contexts';
import './Residents.css';

const Residents = () => {
  const [filter, setFilter] = useState('all');
  const { residents, loading, error, fetchResidents } = useResidents();
  
  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Фильтрация резидентов по категории
  const filteredResidents = filter === 'all' 
    ? residents 
    : residents.filter(resident => resident.category === filter);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Загрузка резидентов...</p>
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

  return (
    <div className="page-container">
      {/* Секция Герой */}
      <div className="residents-hero">
        <div className="residents-hero-overlay"></div>
        <div className="container">
          <h1 className="residents-hero-title">Резиденты</h1>
          <p className="residents-hero-subtitle">
            Світло-художники, продюсери, артисти аудіо-візуального напрямку, музиканти, дизайнери, арт-резиденції
          </p>
        </div>
      </div>

      {/* Основная секция */}
      <section className="residents-main section">
        <div className="container">
          <div className="residents-intro">
            <h2 className="section-title">Наши резиденты</h2>
            <p className="residents-intro-text">
              COLLIDER объединяет талантливых художников, музыкантов, технологов и креативных профессионалов, 
              которые работают и творят в нашем пространстве. Наши резиденты создают уникальные проекты, 
              проводят мастер-классы и участвуют в совместных мероприятиях.
            </p>
          </div>

          <div className="residents-filters">
            <button
              className={`residents-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span className="category-icon">🔍</span> Все категории
            </button>
            <button
              className={`residents-filter-btn ${filter === 'sound' ? 'active' : ''}`}
              onClick={() => setFilter('sound')}
            >
              <span className="category-icon">🔊</span> Звук
            </button>
            <button
              className={`residents-filter-btn ${filter === 'light' ? 'active' : ''}`}
              onClick={() => setFilter('light')}
            >
              <span className="category-icon">💡</span> Свет
            </button>
            <button
              className={`residents-filter-btn ${filter === 'visual' ? 'active' : ''}`}
              onClick={() => setFilter('visual')}
            >
              <span className="category-icon">🎨</span> Визуальное искусство
            </button>
            <button
              className={`residents-filter-btn ${filter === 'music' ? 'active' : ''}`}
              onClick={() => setFilter('music')}
            >
              <span className="category-icon">🎵</span> Музыка
            </button>
            <button
              className={`residents-filter-btn ${filter === 'design' ? 'active' : ''}`}
              onClick={() => setFilter('design')}
            >
              <span className="category-icon">✏️</span> Дизайн
            </button>
            <button
              className={`residents-filter-btn ${filter === 'tech' ? 'active' : ''}`}
              onClick={() => setFilter('tech')}
            >
              <span className="category-icon">💻</span> Технологии
            </button>
          </div>

          <div className="residents-grid">
            {filteredResidents.map(resident => (
              <div key={resident._id} className="resident-card">
                <div className="resident-image">
                  <img src={resident.image} alt={resident.name} />
                </div>
                <div className="resident-content">
                  <h3 className="resident-name">{resident.name}</h3>
                  <div className="resident-type">{resident.type}</div>
                  <p className="resident-description">{resident.description}</p>
                  <div className="resident-contacts">
                    {resident.contacts.website && (
                      <a href={resident.contacts.website} target="_blank" rel="noopener noreferrer" className="resident-contact-link">
                        Веб-сайт
                      </a>
                    )}
                    {resident.contacts.instagram && (
                      <a href={`https://instagram.com/${resident.contacts.instagram.slice(1)}`} target="_blank" rel="noopener noreferrer" className="resident-contact-link">
                        {resident.contacts.instagram}
                      </a>
                    )}
                    {resident.contacts.email && (
                      <a href={`mailto:${resident.contacts.email}`} className="resident-contact-link">
                        Email</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Секция "Стать резидентом" */}
      <section className="residents-join section">
        <div className="container">
          <div className="residents-join-content">
            <h2 className="residents-join-title">Стать резидентом COLLIDER</h2>
            <p className="residents-join-text">
              Мы постоянно ищем талантливых художников, музыкантов, технологов и креативных профессионалов 
              для сотрудничества и резиденций в нашем пространстве. Если вы хотите стать частью нашего 
              сообщества, заполните форму заявки.
            </p>
            <div className="residents-join-steps">
              <div className="residents-join-step">
                <div className="residents-step-number">1</div>
                <div className="residents-step-content">
                  <h3>Заполните заявку</h3>
                  <p>Расскажите о себе, своем опыте и творческом направлении</p>
                </div>
              </div>
              <div className="residents-join-step">
                <div className="residents-step-number">2</div>
                <div className="residents-step-content">
                  <h3>Интервью</h3>
                  <p>Мы свяжемся с вами для обсуждения деталей сотрудничества</p>
                </div>
              </div>
              <div className="residents-join-step">
                <div className="residents-step-number">3</div>
                <div className="residents-step-content">
                  <h3>Презентация</h3>
                  <p>Покажите свои работы и расскажите о будущих проектах</p>
                </div>
              </div>
              <div className="residents-join-step">
                <div className="residents-step-number">4</div>
                <div className="residents-step-content">
                  <h3>Добро пожаловать!</h3>
                  <p>Подписание договора и начало творческой деятельности</p>
                </div>
              </div>
            </div>
            <a href="/contacts" className="residents-join-button">Подать заявку</a>
          </div>
        </div>
      </section>

      {/* Секция "Коллаборации" */}
      <section className="residents-collaborations section">
        <div className="container">
          <h2 className="section-title text-center">Коллаборации резидентов</h2>
          <p className="residents-collab-intro">
            В COLLIDER мы поощряем сотрудничество между резидентами разных направлений. 
            Это позволяет создавать уникальные проекты на стыке искусства, музыки и технологий.
          </p>
          <div className="residents-collab-grid">
            <div className="residents-collab-item">
              <div className="residents-collab-image">
                <img src="/images/residents/collab-1.jpg" alt="Коллаборация" />
              </div>
              <div className="residents-collab-content">
                <h3>Sound & Light Installation</h3>
                <p>Совместный проект Sound Wave Studio и LightForm Collective, создавший иммерсивное аудио-визуальное пространство.</p>
              </div>
            </div>
            <div className="residents-collab-item">
              <div className="residents-collab-image">
                <img src="/images/residents/collab-2.jpg" alt="Коллаборация" />
              </div>
              <div className="residents-collab-content">
                <h3>Digital Music Experience</h3>
                <p>Techno Collective и Digital Architects разработали интерактивный музыкальный опыт с 3D-визуализациями звуковых волн.</p>
              </div>
            </div>
            <div className="residents-collab-item">
              <div className="residents-collab-image">
                <img src="/images/residents/collab-3.jpg" alt="Коллаборация" />
              </div>
              <div className="residents-collab-content">
                <h3>Artistic Technology Exhibition</h3>
                <p>Innovation Lab и Pixel Art Lab объединились для создания выставки на стыке технологий и цифрового искусства.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция "Отзывы" */}
      <section className="residents-testimonials section">
        <div className="container">
          <h2 className="section-title text-center">Что говорят наши резиденты</h2>
          <div className="residents-testimonials-grid">
            <div className="residents-testimonial">
              <div className="residents-testimonial-text">
                <p>"COLLIDER стал для нас идеальным местом для творчества и экспериментов. Благодаря коллаборациям с другими резидентами мы смогли реализовать проекты, которые ранее казались невозможными."</p>
              </div>
              <div className="residents-testimonial-author">
                <div className="residents-testimonial-avatar">
                  <img src="/images/residents/avatar-1.jpg" alt="Автор отзыва" />
                </div>
                <div className="residents-testimonial-info">
                  <div className="residents-testimonial-name">Алексей Петров</div>
                  <div className="residents-testimonial-position">Sound Wave Studio</div>
                </div>
              </div>
            </div>
            <div className="residents-testimonial">
              <div className="residents-testimonial-text">
                <p>"Резиденция в COLLIDER открыла для нас новые горизонты в области светового дизайна. Профессиональное оборудование и вдохновляющая атмосфера позволяют создавать уникальные инсталляции."</p>
              </div>
              <div className="residents-testimonial-author">
                <div className="residents-testimonial-avatar">
                  <img src="/images/residents/avatar-2.jpg" alt="Автор отзыва" />
                </div>
                <div className="residents-testimonial-info">
                  <div className="residents-testimonial-name">Мария Иванова</div>
                  <div className="residents-testimonial-position">LightForm Collective</div>
                </div>
              </div>
            </div>
            <div className="residents-testimonial">
              <div className="residents-testimonial-text">
                <p>"Будучи резидентами COLLIDER, мы получили доступ к современному оборудованию и, что более важно, к сообществу творческих профессионалов. Это позволило нам развивать наши проекты на новом уровне."</p>
              </div>
              <div className="residents-testimonial-author">
                <div className="residents-testimonial-avatar">
                  <img src="/images/residents/avatar-3.jpg" alt="Автор отзыва" />
                </div>
                <div className="residents-testimonial-info">
                  <div className="residents-testimonial-name">Дмитрий Сидоров</div>
                  <div className="residents-testimonial-position">Digital Architects</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Контактная секция */}
      <section className="residents-contact section">
        <div className="container">
          <div className="residents-contact-content">
            <h2>Заинтересованы в сотрудничестве?</h2>
            <p>
              Хотите стать резидентом, провести мероприятие или создать совместный проект с нашими резидентами? 
              Свяжитесь с нами, и мы обсудим возможности сотрудничества.
            </p>
            <a href="/contacts" className="residents-contact-button">Связаться с нами</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Residents;