import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNews } from '../../../contexts/NewsContext';
import './News.css';

const NEWS_CATEGORIES = [
  'news', 'events', 'announcements', 'features', 'articles', 'interviews', 'promotions', 'press'
];

const NewsList = () => {
  const { 
    news, 
    loading, 
    error, 
    total, 
    filters,
    stats,
    fetchNews,
    fetchNewsStats,
    removeNews,
    setFilters
  } = useNews();
  
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const limit = 12; // Количество новостей на странице
  
  const totalPages = Math.ceil(total / limit);
  const page = filters.page || 1;

  useEffect(() => {
    fetchNewsStats();
    fetchNews();
  }, [filters, fetchNews, fetchNewsStats]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
      page: 1 // Сбрасываем страницу при изменении фильтров
    });
  };

  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage
    });
  };

  const handleDelete = async (id) => {
    try {
      await removeNews(id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Ошибка при удалении новости:', error);
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published':
        return 'Опубликовано';
      case 'draft':
        return 'Черновик';
      case 'archived':
        return 'Архив';
      default:
        return status;
    }
  };

  return (
    <div className="admin-news-container">
      {/* Заголовок и кнопки */}
      <div className="admin-news-header">
        <h2>Список новостей</h2>
        <Link to="/admin/news/create" className="admin-btn admin-btn-primary">
          Создать новость
        </Link>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="admin-news-stats">
          <div className="admin-news-stat-card">
            <div className="admin-news-stat-value">{stats.total}</div>
            <div className="admin-news-stat-title">Всего новостей</div>
          </div>
          <div className="admin-news-stat-card">
            <div className="admin-news-stat-value">{stats.published}</div>
            <div className="admin-news-stat-title">Опубликовано</div>
          </div>
          <div className="admin-news-stat-card">
            <div className="admin-news-stat-value">{stats.draft}</div>
            <div className="admin-news-stat-title">Черновики</div>
          </div>
          <div className="admin-news-stat-card">
            <div className="admin-news-stat-value">{stats.featured}</div>
            <div className="admin-news-stat-title">Избранные</div>
          </div>
          <div className="admin-news-stat-card">
            <div className="admin-news-stat-value">{stats.recentViews}</div>
            <div className="admin-news-stat-title">Просмотры за неделю</div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="admin-news-filters">
        <div className="admin-news-filter-group">
          <label htmlFor="status">Статус:</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Все</option>
            <option value="published">Опубликованные</option>
            <option value="draft">Черновики</option>
            <option value="archived">Архив</option>
          </select>
        </div>

        <div className="admin-news-filter-group">
          <label htmlFor="category">Категория:</label>
          <select
            id="category"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">Все категории</option>
            {NEWS_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-news-filter-group">
          <label htmlFor="sort">Сортировка:</label>
          <select
            id="sort"
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
          >
            <option value="-publishDate">Сначала новые</option>
            <option value="publishDate">Сначала старые</option>
            <option value="-views">По просмотрам</option>
            <option value="title">По названию (А-Я)</option>
            <option value="-title">По названию (Я-А)</option>
          </select>
        </div>

        <div className="admin-news-search">
          <span className="admin-news-search-icon">🔍</span>
          <input
            type="text"
            name="search"
            placeholder="Поиск новостей..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Ошибка */}
      {error && <div className="admin-error">{error}</div>}

      {/* Список новостей */}
      {loading ? (
        <div className="admin-loading">Загрузка новостей...</div>
      ) : news.length > 0 ? (
        <div className="admin-news-grid">
          {news.map((item) => (
            <div key={item._id} className="admin-news-card">
              <div className="admin-news-card-image">
                <img src={item.image} alt={item.title} />
                <div className={`admin-news-card-status ${item.status}`}>
                  {getStatusLabel(item.status)}
                </div>
              </div>
              <div className="admin-news-card-content">
                <div className="admin-news-card-date">
                  {formatDate(item.publishDate)}
                </div>
                <h3 className="admin-news-card-title">{item.title}</h3>
                <p className="admin-news-card-excerpt">{item.excerpt}</p>
                
                {item.categories && item.categories.length > 0 && (
                  <div className="admin-news-card-categories">
                    {item.categories.map((category, idx) => (
                      <span key={idx} className="admin-news-card-category">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                    ))}
                  </div>
                )}
                
                {item.tags && item.tags.length > 0 && (
                  <div className="admin-news-card-tags">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="admin-news-card-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="admin-news-card-actions">
                  <Link 
                    to={`/admin/news/edit/${item._id}`}
                    className="admin-news-card-button"
                  >
                    ✏️ Редактировать
                  </Link>
                  <button 
                    className="admin-news-card-button delete"
                    onClick={() => setConfirmDelete(item)}
                  >
                    🗑️ Удалить
                  </button>
                </div>
                <div className="admin-news-card-views">
                  👁️ {item.views} просмотров
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty-message">
          Новости не найдены. Попробуйте изменить параметры фильтрации или создайте новость.
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="admin-news-pagination">
          <button
            className={`admin-news-pagination-button ${page === 1 ? 'disabled' : ''}`}
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
          >
            «
          </button>
          <button
            className={`admin-news-pagination-button ${page === 1 ? 'disabled' : ''}`}
            onClick={() => handlePageChange(Math.max(page - 1, 1))}
            disabled={page === 1}
          >
            ‹
          </button>
          
          {[...Array(totalPages)].map((_, idx) => {
            const pageNum = idx + 1;
            // Отображаем только текущую страницу и соседние
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= page - 1 && pageNum <= page + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  className={`admin-news-pagination-button ${pageNum === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            } else if (
              pageNum === page - 2 ||
              pageNum === page + 2
            ) {
              return <span key={pageNum}>...</span>;
            }
            return null;
          })}
          
          <button
            className={`admin-news-pagination-button ${page === totalPages ? 'disabled' : ''}`}
            onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
          >
            ›
          </button>
          <button
            className={`admin-news-pagination-button ${page === totalPages ? 'disabled' : ''}`}
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
          >
            »
          </button>
        </div>
      )}
      
      <div className="admin-news-pagination-info">
        Показано {news.length} из {total} новостей
      </div>

      {/* Модальное окно подтверждения удаления */}
      {confirmDelete && (
        <div className="admin-news-modal-overlay">
          <div className="admin-news-modal">
            <h3 className="admin-news-modal-title">Подтверждение удаления</h3>
            <div className="admin-news-modal-content">
              <p>Вы действительно хотите удалить новость "{confirmDelete.title}"?</p>
              <p>Это действие нельзя будет отменить.</p>
            </div>
            <div className="admin-news-modal-actions">
              <button
                className="admin-news-modal-button admin-news-modal-button-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Отмена
              </button>
              <button
                className="admin-news-modal-button admin-news-modal-button-delete"
                onClick={() => handleDelete(confirmDelete._id)}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsList;