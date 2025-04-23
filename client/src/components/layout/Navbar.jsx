import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import './Navbar.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  // Navigation items with translation keys
  const navItems = [
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.spaces'), path: '/spaces' },
    { name: t('nav.residents'), path: '/residents' },
    { name: t('nav.rent'), path: '/rent' },
    { name: 'ПРОМОУШН', path: '/promotion' },
    { name: t('nav.events'), path: '/events' },
    { name: t('nav.contacts'), path: '/contacts' }
  ];

  // Эффект для отслеживания скролла
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Закрывать мобильное меню при изменении маршрута
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo" style={{ zIndex: 1001 }}>
          COLLIDER
        </Link>

        <div 
          className="navbar-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ 
            zIndex: 1001,
            position: 'relative'
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <nav 
          className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}
          style={{ 
            zIndex: 990 
          }}
        >
          <ul className="navbar-nav">
            {navItems.map((item, index) => (
              <li key={index} className="nav-item">
                <Link 
                  to={item.path} 
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  style={{ 
                    display: 'inline-block', 
                    padding: '8px 0', 
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1
                  }}
                  onClick={(e) => {
                    // Предотвращаем всплытие события
                    e.stopPropagation();
                  }}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;