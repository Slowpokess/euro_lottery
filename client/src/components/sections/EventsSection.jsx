import React, { useState, useEffect } from 'react';
import { useEvents } from '../../contexts/EventsContext';
import EventCard from '../ui/EventCard';
import Button from '../ui/Button';
import { EVENT_STATUSES, PAGE_SIZES, DEFAULT_IMAGES } from '../../utils/constants';
import './EventsSection.css';

const EventsSection = () => {
  const { events, loading, setFilters, fetchEvents } = useEvents();
  const [showAllPast, setShowAllPast] = useState(false);
  
  useEffect(() => {
    // Сначала получим предстоящие события
    setFilters({ status: EVENT_STATUSES.UPCOMING, sort: 'date', limit: PAGE_SIZES.SMALL });
    fetchEvents();
    
    // Затем получим прошедшие события
    setFilters({ status: EVENT_STATUSES.PAST, sort: '-date', limit: PAGE_SIZES.SMALL });
    fetchEvents();
  }, [setFilters, fetchEvents]);
  
  // Фильтруем события
  const futureEvents = events.filter(event => event.status === EVENT_STATUSES.UPCOMING);
  const pastEvents = events.filter(event => event.status === EVENT_STATUSES.PAST);
  
  // Показывать только первые 3 прошедших события, если не показываем все
  const displayedPastEvents = showAllPast 
    ? pastEvents 
    : pastEvents.slice(0, PAGE_SIZES.SMALL);

  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  if (loading) {
    return (
      <section className="events-section section">
        <div className="container">
          <h2 className="section-title">Найближчі події</h2>
          <div className="loading-container">Завантаження подій...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="events-section section">
      <div className="container">
        <h2 className="section-title">Найближчі події</h2>
        
        {futureEvents.length > 0 && (
          <div className="events-group">
            <h3 className="events-subtitle">Майбутні події</h3>
            <div className="events-grid">
              {futureEvents.map((event) => (
                <EventCard
                  key={event._id}
                  title={event.title}
                  date={formatDate(event.date)}
                  description={event.description}
                  image={event.image || DEFAULT_IMAGES.EVENT}
                  link={event.ticketLink || 'https://www.instagram.com/collider_kyiv/'}
                />
              ))}
            </div>
          </div>
        )}
        
        {pastEvents.length > 0 && (
          <div className="events-group">
            <h3 className="events-subtitle">Минули події</h3>
            <div className="events-grid">
              {displayedPastEvents.map((event) => (
                <EventCard
                  key={event._id}
                  title={event.title}
                  date={formatDate(event.date)}
                  description={event.description}
                  image={event.image || DEFAULT_IMAGES.EVENT}
                  link={event.ticketLink || 'https://www.instagram.com/collider_kyiv/'}
                  isPast={true}
                />
              ))}
            </div>
            
            {pastEvents.length > PAGE_SIZES.SMALL && (
              <div className="events-more">
                <Button 
                  variant="text" 
                  onClick={() => setShowAllPast(!showAllPast)}
                >
                  {showAllPast ? 'Показати менше' : 'Показати більше'}
                </Button>
              </div>
            )}
          </div>
        )}
        
        {futureEvents.length === 0 && pastEvents.length === 0 && (
          <div className="events-empty">
            <p>Незабаром тут з'являться події...</p>
          </div>
        )}
        
        <div className="events-all-link">
          <Button to="/events" variant="secondary">Всі події</Button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;