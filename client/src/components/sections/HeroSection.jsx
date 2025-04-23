import React from 'react';
import './HeroSection.css';

const HeroSection = ({ videoSrc }) => {
  return (
    <section className="hero-section">
      <div className="hero-video-container">
        <video 
          className="hero-video" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src={videoSrc} type="video/mp4" />
          Ваш браузер не поддерживает видео тег.
        </video>
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          <span className="hero-title-line">КРЕАТИВНИЙ</span>
          <span className="hero-title-line">КYЛЬТYРНИЙ</span>
          <span className="hero-title-line">КЛАСТЕР</span>
        </h1>
        <p className="hero-subtitle">
          Платформа взаємодії частинок. Експериментуйте зі світлом та звуком, навчайтесь та створюйте.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;