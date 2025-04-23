import React from 'react';
import { Link } from 'react-router-dom';
import { useNews } from '../../contexts/NewsContext';
import './NewsSection.css';

const NewsSection = () => {
  const { news, loading } = useNews();
  
  // Получаем только последние 3 новости
  const recentNews = news.slice(0, 3);
  
  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  return (
    <section className="news-section section">
      <div className="container">
        <h2 className="section-title">Последние новости</h2>
        
        {loading ? (
          <div className="loading-container">Загрузка новостей...</div>
        ) : recentNews.length > 0 ? (
          <div className="news-grid">
            {recentNews.map((item) => (
              <div key={item._id} className="news-card">
                <div className="news-card-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="news-card-content">
                  <div className="news-card-date">{formatDate(item.publishDate)}</div>
                  <h3 className="news-card-title">{item.title}</h3>
                  <p className="news-card-excerpt">{item.excerpt}</p>
                  <Link to={`/news/${item.slug || item._id}`} className="news-card-link">
                    Читать далее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="news-empty">
            <p>Скоро здесь появятся новости...</p>
          </div>
        )}
        
        <div className="news-more">
          <Link to="/news" className="btn btn-secondary">
            Все новости
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;