import React from 'react';
import { useTranslation } from 'react-i18next';
import './About.css';

const About = () => {
  const { t } = useTranslation();
  
  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="about-hero-overlay"></div>
        <div className="container">
          <h1 className="about-hero-title">{t('about.hero.title')}</h1>
          <p className="about-hero-subtitle">
            {t('about.hero.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Information */}
      <section className="about-main section">
        <div className="container">
          <div className="about-row">
            <div className="about-image">
              <img src="/images/about-main.jpg" alt="Collider space" />
            </div>
            <div className="about-content">
              <h2 className="about-title">{t('about.mission.title')}</h2>
              <p>{t('about.mission.p1')}</p>
              <p>{t('about.mission.p2')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features section">
        <div className="container">
          <h2 className="section-title text-center">{t('about.features.title')}</h2>
          <div className="about-features-grid">
            <div className="about-feature-card">
              <div className="about-feature-icon">🎵</div>
              <h3 className="about-feature-title">{t('about.features.sound.title')}</h3>
              <p className="about-feature-description">
                {t('about.features.sound.description')}
              </p>
            </div>

            <div className="about-feature-card">
              <div className="about-feature-icon">💡</div>
              <h3 className="about-feature-title">{t('about.features.light.title')}</h3>
              <p className="about-feature-description">
                {t('about.features.light.description')}
              </p>
            </div>

            <div className="about-feature-card">
              <div className="about-feature-icon">🎨</div>
              <h3 className="about-feature-title">{t('about.features.workshops.title')}</h3>
              <p className="about-feature-description">
                {t('about.features.workshops.description')}
              </p>
            </div>

            <div className="about-feature-card">
              <div className="about-feature-icon">🎓</div>
              <h3 className="about-feature-title">{t('about.features.education.title')}</h3>
              <p className="about-feature-description">
                {t('about.features.education.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team section">
        <div className="container">
          <h2 className="section-title text-center">{t('about.team.title')}</h2>
          <div className="about-team-grid">
            <div className="about-team-member">
              <div className="about-team-photo">
                <img src="/images/team-1.jpg" alt={t('about.team.member1.name')} />
              </div>
              <h3 className="about-team-name">{t('about.team.member1.name')}</h3>
              <p className="about-team-position">{t('about.team.member1.position')}</p>
              <p className="about-team-bio">
                {t('about.team.member1.bio')}
              </p>
            </div>

            <div className="about-team-member">
              <div className="about-team-photo">
                <img src="/images/team-2.jpg" alt={t('about.team.member2.name')} />
              </div>
              <h3 className="about-team-name">{t('about.team.member2.name')}</h3>
              <p className="about-team-position">{t('about.team.member2.position')}</p>
              <p className="about-team-bio">
                {t('about.team.member2.bio')}
              </p>
            </div>

            <div className="about-team-member">
              <div className="about-team-photo">
                <img src="/images/team-3.jpg" alt={t('about.team.member3.name')} />
              </div>
              <h3 className="about-team-name">{t('about.team.member3.name')}</h3>
              <p className="about-team-position">{t('about.team.member3.position')}</p>
              <p className="about-team-bio">
                {t('about.team.member3.bio')}
              </p>
            </div>

            <div className="about-team-member">
              <div className="about-team-photo">
                <img src="/images/team-4.jpg" alt={t('about.team.member4.name')} />
              </div>
              <h3 className="about-team-name">{t('about.team.member4.name')}</h3>
              <p className="about-team-position">{t('about.team.member4.position')}</p>
              <p className="about-team-bio">
                {t('about.team.member4.bio')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="about-history section">
        <div className="container">
          <h2 className="section-title text-center">{t('about.history.title')}</h2>
          <div className="about-timeline">
            <div className="about-timeline-item">
              <div className="about-timeline-date">{t('about.history.event1.date')}</div>
              <div className="about-timeline-content">
                <h3>{t('about.history.event1.title')}</h3>
                <p>{t('about.history.event1.description')}</p>
              </div>
            </div>

            <div className="about-timeline-item">
              <div className="about-timeline-date">{t('about.history.event2.date')}</div>
              <div className="about-timeline-content">
                <h3>{t('about.history.event2.title')}</h3>
                <p>{t('about.history.event2.description')}</p>
              </div>
            </div>

            <div className="about-timeline-item">
              <div className="about-timeline-date">{t('about.history.event3.date')}</div>
              <div className="about-timeline-content">
                <h3>{t('about.history.event3.title')}</h3>
                <p>{t('about.history.event3.description')}</p>
              </div>
            </div>

            <div className="about-timeline-item">
              <div className="about-timeline-date">{t('about.history.event4.date')}</div>
              <div className="about-timeline-content">
                <h3>{t('about.history.event4.title')}</h3>
                <p>{t('about.history.event4.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="about-contact section">
        <div className="container">
          <div className="about-contact-content">
            <h2>{t('about.contact.title')}</h2>
            <p>{t('about.contact.description')}</p>
            <a href="/contacts" className="about-contact-button">{t('about.contact.button')}</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;