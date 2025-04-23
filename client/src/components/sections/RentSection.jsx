import React from 'react';
import Button from '../ui/Button';
import './RentSection.css';

const RentSection = ({ bgImage }) => {
  return (
    <section className="rent-section" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="rent-overlay"></div>
      <div className="container">
        <div className="rent-content">
          <h2 className="rent-title">Оренда</h2>
          <p className="rent-description">
            Звукове, світлове та сценічне обладнання для ваших проєктів та заходів.
          </p>
          <Button to="/rent" variant="primary">
            Докладніше
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RentSection;