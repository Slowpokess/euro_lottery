import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navItems = [
    { name: 'ПРО НАС', path: '/about' },
    { name: 'ПРИМІЩЕННЯ', path: '/spaces' },
    { name: 'РЕЗИДЕНТИ', path: '/residents' },
    { name: 'ОРЕНДА', path: '/rent' },
    { name: 'ПРОМОУШН', path: '/promotion' },
    { name: 'ІВЕНТИ', path: '/events' },
    { name: 'КОНТАКТИ', path: '/contacts' }
  ];

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-main">
          <div className="footer-logo">
            <Link to="/">COLLIDER</Link>
          </div>

          <nav className="footer-nav">
            <ul className="footer-nav-list">
              {navItems.map((item, index) => (
                <li key={index} className="footer-nav-item">
                  <Link to={item.path} className="footer-nav-link">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-info">
          <div className="footer-address">
            Київ, вул. Українська, 123
          </div>
          
          <div className="footer-socials">
            <a href="https://t.me/collider" target="_blank" rel="noopener noreferrer" className="social-link">
              Telegram
            </a>
            <a href="https://instagram.com/collider" target="_blank" rel="noopener noreferrer" className="social-link">
              Instagram
            </a>
            <a href="https://ra.co/clubs/collider" target="_blank" rel="noopener noreferrer" className="social-link">
              Resident Advisor
            </a>
          </div>
          
          <div className="footer-copyright">
            © 2025 COLLIDER. Усі права захищені.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;