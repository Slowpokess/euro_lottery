import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNews } from '../../../contexts';
import './News.css';

const NEWS_CATEGORIES = [
  'news', 'events', 'announcements', 'features', 'articles', 'interviews', 'promotions', 'press'
];

const NewsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { currentNews, loading: contextLoading, error: contextError, fetchNewsById, addNews, editNews } = useNews();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'published',
    featured: false,
    categories: ['news'],
    tags: [],
    publishDate: new Date().toISOString().slice(0, 16)
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editorInitialized, setEditorInitialized] = useState(false);
  const editorRef = useRef(null);

  // Инициализация редактора
  const initializeEditor = () => {
    // В простой реализации используем обычный textarea
    // В реальном проекте здесь можно инициализировать WYSIWYG редактор (TinyMCE, CKEditor и т.д.)
    setEditorInitialized(true);
  };

  // Используем useEffect для загрузки данных новости
  useEffect(() => {
    // Определяем функцию fetchNewsData внутри useEffect
    const fetchNewsData = async () => {
      try {
        setLoading(true);
        await fetchNewsById(id);
      } catch (error) {
        setError('Ошибка при загрузке данных новости');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isEditMode) {
      fetchNewsData();
    }
    
    // Инициализация редактора содержимого
    initializeEditor();
    
    // Сохраняем ссылку на editorRef.current в переменную внутри эффекта
    const currentEditor = editorRef.current;
    
    return () => {
      // Очистка редактора при размонтировании, используя сохраненную ссылку
      if (currentEditor) {
        // Если используется библиотека редактора, здесь нужно добавить код для очистки
      }
    };
  }, [isEditMode, id, fetchNewsById]);
  
  // Effect for updating form data when currentNews changes
  useEffect(() => {
    if (currentNews && isEditMode) {
      setFormData({
        title: currentNews.title || '',
        content: currentNews.content || '',
        excerpt: currentNews.excerpt || '',
        status: currentNews.status || 'published',
        featured: currentNews.featured || false,
        categories: currentNews.categories || ['news'],
        tags: currentNews.tags || [],
        publishDate: formatDateTimeForInput(currentNews.publishDate) || new Date().toISOString().slice(0, 16)
      });
      
      // Если есть изображение, устанавливаем превью
      if (currentNews.image) {
        setImagePreview(currentNews.image);
      }
    }
  }, [currentNews, isEditMode]);
  
  // Форматирование даты и времени для input type="datetime-local"
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleContentChange = (e) => {
    setFormData(prev => ({
      ...prev,
      content: e.target.value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Создаем URL для превью изображения
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    // Если у поля input есть ref, можно сбросить его значение
    const fileInput = document.getElementById('news-image');
    if (fileInput) fileInput.value = '';
  };
  
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      // Добавляем категорию, если ее еще нет
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.includes(value) 
          ? prev.categories 
          : [...prev.categories, value]
      }));
    } else {
      // Удаляем категорию, но оставляем хотя бы одну
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat !== value).length > 0
          ? prev.categories.filter(cat => cat !== value)
          : prev.categories
      }));
    }
  };
  
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const generateExcerpt = () => {
    if (!formData.content) return;
    
    // Убираем HTML-теги и ограничиваем длину
    const plainText = formData.content.replace(/<[^>]*>/g, '');
    const excerpt = plainText.substring(0, 300) + (plainText.length > 300 ? '...' : '');
    
    setFormData(prev => ({ ...prev, excerpt }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Создаем объект FormData для отправки файлов
      const newsData = new FormData();
      
      // Добавляем все поля формы
      Object.keys(formData).forEach(key => {
        if (key === 'categories' || key === 'tags') {
          // Для массивов добавляем JSON строку
          newsData.append(key, JSON.stringify(formData[key]));
        } else {
          newsData.append(key, formData[key]);
        }
      });
      
      // Добавляем изображение, если оно выбрано
      if (imageFile) {
        newsData.append('image', imageFile);
      }
      
      // Отправляем запрос на создание или обновление через контекст
      if (isEditMode) {
        await editNews(id, newsData);
      } else {
        await addNews(newsData);
      }
      
      // Перенаправляем на список новостей
      navigate('/admin/news');
    } catch (error) {
      setError(error.error || 'Ошибка при сохранении новости');
      setLoading(false);
      console.error(error);
    }
  };
  
  const handleSaveAsDraft = () => {
    setFormData(prev => ({ ...prev, status: 'draft' }));
    // Форма будет отправлена при вызове handleSubmit
  };

  if ((loading || contextLoading) && isEditMode) {
    return <div className="admin-loading">Загрузка новости...</div>;
  }

  return (
    <div className="admin-news-form-container">
      <h2>{isEditMode ? 'Редактирование новости' : 'Создание новости'}</h2>
      
      {(error || contextError) && <div className="admin-error">{error || contextError}</div>}
      
      <form className="admin-news-form" onSubmit={handleSubmit}>
        {/* Заголовок */}
        <div className="admin-news-form-group">
          <label htmlFor="title">Заголовок новости *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength="200"
          />
        </div>
        
        {/* Строка с статусом, датой и флагом "избранное" */}
        <div className="admin-news-form-row">
          <div className="admin-news-form-group">
            <label htmlFor="status">Статус *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="published">Опубликовано</option>
              <option value="draft">Черновик</option>
              <option value="archived">Архив</option>
            </select>
          </div>
          
          <div className="admin-news-form-group">
            <label htmlFor="publishDate">Дата публикации *</label>
            <input
              type="datetime-local"
              id="publishDate"
              name="publishDate"
              value={formData.publishDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="admin-news-form-group admin-news-form-group-checkbox">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
            />
            <label htmlFor="featured">Избранная новость</label>
          </div>
        </div>
        
        {/* Изображение */}
        <div className="admin-news-form-group">
          <label htmlFor="news-image">Изображение</label>
          <input
            type="file"
            id="news-image"
            accept="image/*"
            onChange={handleImageChange}
          />
          
          {imagePreview && (
            <div className="admin-news-form-image-preview">
              <img src={imagePreview} alt="Preview" />
              <div className="admin-news-form-image-overlay">
                <button 
                  type="button" 
                  className="admin-news-form-image-remove"
                  onClick={handleRemoveImage}
                >
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Категории */}
        <div className="admin-news-form-group">
          <label>Категории</label>
          <div className="admin-news-form-categories">
            {NEWS_CATEGORIES.map((category) => (
              <div key={category} className="admin-news-form-group-checkbox">
                <input
                  type="checkbox"
                  id={`category-${category}`}
                  value={category}
                  checked={formData.categories.includes(category)}
                  onChange={handleCategoryChange}
                />
                <label htmlFor={`category-${category}`}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Теги */}
        <div className="admin-news-form-group">
          <label>Теги</label>
          
          <div className="admin-news-form-tags-container">
            {formData.tags.map((tag, index) => (
              <div key={index} className="admin-news-form-tag">
                {tag}
                <button 
                  type="button" 
                  className="admin-news-form-tag-remove"
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <div className="admin-news-form-tag-input">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Добавить тег..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button 
              type="button" 
              onClick={addTag}
            >
              Добавить
            </button>
          </div>
        </div>
        
        {/* Содержимое */}
        <div className="admin-news-form-group">
          <label htmlFor="content">Содержание новости *</label>
          {editorInitialized && (
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleContentChange}
              required
              className="admin-news-editor-content"
              rows="10"
            />
          )}
        </div>
        
        {/* Краткое описание */}
        <div className="admin-news-form-group">
          <label htmlFor="excerpt">
            Краткое описание
            <button 
              type="button" 
              onClick={generateExcerpt}
              className="admin-btn admin-btn-small admin-btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Сгенерировать из содержания
            </button>
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            maxLength="500"
            rows="3"
          />
        </div>
        
        {/* Кнопки */}
        <div className="admin-news-form-buttons">
          <button
            type="button"
            className="admin-news-form-button admin-news-form-button-cancel"
            onClick={() => navigate('/admin/news')}
          >
            Отмена
          </button>
          
          <button
            type="button"
            className="admin-news-form-button admin-news-form-button-draft"
            onClick={handleSaveAsDraft}
            disabled={loading || contextLoading}
          >
            Сохранить как черновик
          </button>
          
          <button
            type="submit"
            className="admin-news-form-button admin-news-form-button-submit"
            disabled={loading || contextLoading}
          >
            {(loading || contextLoading) ? 'Сохранение...' : isEditMode ? 'Обновить' : 'Опубликовать'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsForm;