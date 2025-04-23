import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../../services/auth';
import { useAuth } from '../../contexts';
import './Dashboard.css';

const Dashboard = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user: authUser } = useAuth();
  
  useEffect(() => {
    // Получаем данные пользователя
    const fetchUser = async () => {
      try {
        if (isAuthenticated && authUser) {
          // Используем данные из контекста авторизации
          setUser(authUser);
          
          // Дополнительная проверка через API для обновления данных
          try {
            const response = await getCurrentUser();
            if (response?.user) {
              setUser({
                ...authUser,
                ...response.user
              });
            }
          } catch (apiError) {
            console.error('Ошибка при обновлении данных пользователя:', apiError);
          }
        } else {
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        logout();
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [navigate, isAuthenticated, authUser]);

  const handleLogout = () => {// Выход из аккаунта
    logout();
    navigate('/admin/login');
  };
  
    // Определяем заголовок текущей страницы
    const getPageTitle = () => {
      const path = location.pathname;
      
      if (path === '/admin/dashboard') return 'Панель управления';
      if (path.includes('/admin/events')) {
        if (path.includes('/create')) return 'Создание события';
        if (path.includes('/edit')) return 'Редактирование события';
        return 'Управление событиями';
      }
      if (path.includes('/admin/equipment')) {
        if (path.includes('/create')) return 'Добавление оборудования';
        if (path.includes('/edit')) return 'Редактирование оборудования';
        return 'Управление оборудованием';
      }
      if (path.includes('/admin/news')) {
        if (path.includes('/create')) return 'Создание новости';
        if (path.includes('/edit')) return 'Редактирование новости';
        return 'Управление новостями';
      }
      if (path.includes('/admin/rent-requests')) {
        return 'Заявки на аренду оборудования';
      }
      if (path.includes('/admin/promotion')) {
        return 'Промоушн и заявки';
      }
      
      return 'Панель администратора';
    };
  
    // Список разделов админ-панели
    const menuItems = [
      { name: 'Панель управления', path: '/admin/dashboard', icon: '📊' },
      { name: 'Управление событиями', path: '/admin/events', icon: '🗓️' },
      { name: 'Управление оборудованием', path: '/admin/equipment', icon: '🎛️' },
      { name: 'Управление новостями', path: '/admin/news', icon: '📰' },
      { name: 'Заявки на аренду', path: '/admin/rent-requests', icon: '📝' },
      { name: 'Промоушн', path: '/admin/promotion', icon: '🔊' }
    ];
  
    // Определяем, активен ли пункт меню
    const isActive = (path) => {
      if (path === '/admin/dashboard') {
        return location.pathname === path;
      }
      return location.pathname.startsWith(path);
    };
  
    if (loading) {
      return <div className="admin-loading">Загрузка...</div>;
    }
  
    return (
      <div className="admin-dashboard">
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-logo">COLLIDER</div>
            <div className="admin-subtitle">Админ-панель</div>
          </div>
          
          <nav className="admin-nav">
            <ul className="admin-nav-list">
              {menuItems.map((item, index) => (
                <li key={index} className="admin-nav-item">
                  <Link 
                    to={item.path} 
                    className={`admin-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="admin-sidebar-footer">
            <div className="admin-user">
              <div className="admin-user-name">{user?.username}</div>
              <div className="admin-user-role">{user?.role === 'admin' ? 'Администратор' : 'Редактор'}</div>
            </div>
            <button className="admin-logout-btn" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
        
        <div className="admin-content">
          <header className="admin-header">
            <h1 className="admin-page-title">{getPageTitle()}</h1>
          </header>
          
          <main className="admin-main">
            {/* Если переданы дочерние компоненты, отображаем их */}
            {children || (
              <div className="admin-dashboard-overview">
                <h2>Добро пожаловать в панель управления COLLIDER</h2>
                <p>Выберите раздел в меню слева для управления содержимым сайта.</p>
                
                <div className="admin-dashboard-stats">
                  <div className="admin-stat-card">
                    <div className="admin-stat-title">События</div>
                    <div className="admin-stat-value">12</div>
                    <div className="admin-stat-subtitle">Ближайшие: 5</div>
                  </div>
                  
                  <div className="admin-stat-card">
                    <div className="admin-stat-title">Оборудование</div>
                    <div className="admin-stat-value">48</div>
                    <div className="admin-stat-subtitle">Доступно: 32</div>
                  </div>
                  
                  <div className="admin-stat-card">
                    <div className="admin-stat-title">Новости</div>
                    <div className="admin-stat-value">7</div>
                    <div className="admin-stat-subtitle">За последний месяц</div>
                  </div>
                  
                  <div className="admin-stat-card">
                    <div className="admin-stat-title">Заявки на аренду</div>
                    <div className="admin-stat-value">15</div>
                    <div className="admin-stat-subtitle">Новых: 3</div>
                  </div>
                </div>
  
                <div className="admin-dashboard-quick-actions">
                  <h3>Быстрые действия</h3>
                  <div className="admin-quick-actions-grid">
                    <Link to="/admin/events/create" className="admin-quick-action-card">
                      <div className="admin-quick-action-icon">🗓️</div>
                      <div className="admin-quick-action-title">Создать событие</div>
                    </Link>
                    
                    <Link to="/admin/equipment/create" className="admin-quick-action-card">
                      <div className="admin-quick-action-icon">🎛️</div>
                      <div className="admin-quick-action-title">Добавить оборудование</div>
                    </Link>
                    
                    <Link to="/admin/news/create" className="admin-quick-action-card">
                      <div className="admin-quick-action-icon">📰</div>
                      <div className="admin-quick-action-title">Опубликовать новость</div>
                    </Link>
                    
                    <Link to="/admin/rent-requests" className="admin-quick-action-card">
                      <div className="admin-quick-action-icon">📝</div>
                      <div className="admin-quick-action-title">Просмотреть заявки</div>
                    </Link>
                    
                    <Link to="/admin/promotion" className="admin-quick-action-card">
                      <div className="admin-quick-action-icon">🔊</div>
                      <div className="admin-quick-action-title">Промоушн</div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            <Outlet />
          </main>
        </div>
      </div>
    );
  };
  
  export default Dashboard;