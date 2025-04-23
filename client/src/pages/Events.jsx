import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEvents } from '../contexts/EventsContext';
import './Events.css';

const Events = () => {
  const { t } = useTranslation();
  const { events, loading, error, setFilters, fetchEvents } = useEvents();
  const [showAllPast, setShowAllPast] = useState(false);

  // Фильтрация событий по статусу
  const upcomingEvents = events.filter(event => event.status === 'upcoming');
  const pastEvents = events.filter(event => event.status === 'past');
  
  // Показываем только первые 3 прошедших события, если не показываем все
  const displayedPastEvents = showAllPast ? pastEvents : pastEvents.slice(0, 3);

  useEffect(() => {
    // При монтировании компонента получаем предстоящие события
    setFilters({ status: 'upcoming', sort: 'date' });
    fetchEvents();
    
    // Затем получаем прошедшие события
    setFilters({ status: 'past', sort: '-date' });
    fetchEvents();
  }, [fetchEvents, setFilters]);

  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  return (
    <div className="page-container">
      <div className="events-hero">
        <div className="events-hero-overlay"></div>
        <div className="container">
          <h1 className="events-hero-title">{t('events.title')}</h1>
          <p className="events-hero-subtitle">
            {t('events.subtitle')}
          </p>
        </div>
      </div>

      <div className="container section">
        {loading ? (
          <div className="events-loading">{t('events.loading')}</div>
        ) : error ? (
          <div className="events-error">{error}</div>
        ) : (
          <>
            {upcomingEvents.length > 0 && (
              <div className="events-section">
                <h2 className="events-section-title">{t('events.upcoming')}</h2>
                <div className="events-grid">
                  {upcomingEvents.map((event) => (
                    <div key={event._id} className="event-card">
                      <div className="event-card-image">
                        <img src={event.image || '/images/event-placeholder.jpg'} alt={event.title} />
                      </div>
                      <div className="event-card-content">
                        <div className="event-card-date">{formatDate(event.date)}</div>
                        <h3 className="event-card-title">{event.title}</h3>
                        <p className="event-card-description">{event.description}</p>
                        <a href={event.ticketLink || '#'} className="event-card-button" target="_blank" rel="noopener noreferrer">
                          {t('events.viewDetails')}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div className="events-section">
                <h2 className="events-section-title">{t('events.past')}</h2>
                <div className="events-grid">
                  {displayedPastEvents.map((event) => (
                    <div key={event._id} className="event-card past-event">
                      <div className="event-card-image">
                        <img src={event.image || '/images/event-placeholder.jpg'} alt={event.title} />
                        <div className="event-card-badge">{t('events.completed')}</div>
                      </div>
                      <div className="event-card-content">
                        <div className="event-card-date">{formatDate(event.date)}</div>
                        <h3 className="event-card-title">{event.title}</h3>
                        <p className="event-card-description">{event.description}</p>
                        <a href={event.ticketLink || '#'} className="event-card-button secondary" target="_blank" rel="noopener noreferrer">
                          {t('events.viewDetails')}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                
                {pastEvents.length > 3 && (
                  <div className="events-more">
                    <button 
                      className="events-more-button"
                      onClick={() => setShowAllPast(!showAllPast)}
                    >
                      {showAllPast ? t('events.showLess') : t('events.showMore')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <div className="events-empty">{t('events.noEvents')}</div>
            )}
          </>
        )}
      </div>
      
      <div className="events-subscribe section">
        <div className="container">
          <h2 className="events-subscribe-title">{t('events.subscribeTitle')}</h2>
          <p className="events-subscribe-text">
            {t('events.subscribeText')}
          </p>
          <form className="events-subscribe-form">
            <input type="email" placeholder={t('events.emailPlaceholder')} required />
            <button type="submit">{t('events.subscribeButton')}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Events;