import React from 'react';
import Button from '../ui/Button';
import './InfoSection.css';

const InfoSection = ({ title, description, bgImage, linkTo }) => {
  return (
    <div className="info-section" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="info-overlay"></div>
      <div className="info-content">
        <h3 className="info-title">{title}</h3>
        <p className="info-description">{description}</p>
        <Button to={linkTo} variant="secondary">Докладніше</Button>
      </div>
    </div>
  );
};

export default InfoSection;