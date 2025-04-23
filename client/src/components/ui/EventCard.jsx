import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import { DEFAULT_IMAGES } from '../../utils/constants';
import './EventCard.css';

// Default image path if none provided - using constants
const DEFAULT_IMAGE = DEFAULT_IMAGES.EVENT;

/**
 * EventCard Component
 * Displays an event with image, title, date, description and a call-to-action button
 */
const EventCard = ({ 
  title, 
  date, 
  description, 
  image, 
  link, 
  isPast = false,
  buttonText = 'Докладніше' // Default button text with translation
}) => {
  return (
    <div className={`event-card ${isPast ? 'event-card-past' : ''}`} data-testid="event-card">
      <div className="event-card-image">
        <img 
          src={image || DEFAULT_IMAGE} 
          alt={title} 
          onError={(e) => {
            e.target.src = DEFAULT_IMAGE; // Fallback if image fails to load
          }}
        />
        {isPast && <div className="event-card-badge">Завершено</div>}
      </div>
      <div className="event-card-content">
        <h3 className="event-card-title">{title}</h3>
        <div className="event-card-date">{date}</div>
        <p className="event-card-description">{description}</p>
        <Button 
          href={link} 
          variant={isPast ? 'secondary' : 'primary'}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

// PropTypes validation
EventCard.propTypes = {
  /** Event title */
  title: PropTypes.string.isRequired,
  /** Formatted date string */
  date: PropTypes.string.isRequired,
  /** Event description */
  description: PropTypes.string.isRequired,
  /** URL to event image */
  image: PropTypes.string,
  /** URL for "learn more" button */
  link: PropTypes.string.isRequired,
  /** Whether event is in the past */
  isPast: PropTypes.bool,
  /** Custom button text */
  buttonText: PropTypes.string
};

export default EventCard;