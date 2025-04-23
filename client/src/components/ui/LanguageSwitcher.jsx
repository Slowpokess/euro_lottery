import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button 
        className={`language-btn ${i18n.language === 'en' ? 'active' : ''}`} 
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
      <button 
        className={`language-btn ${i18n.language === 'ru' ? 'active' : ''}`} 
        onClick={() => changeLanguage('ru')}
      >
        RU
      </button>
      <button 
        className={`language-btn ${i18n.language === 'ua' ? 'active' : ''}`} 
        onClick={() => changeLanguage('ua')}
      >
        UA
      </button>
    </div>
  );
};

export default LanguageSwitcher;