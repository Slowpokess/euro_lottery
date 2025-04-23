import React, { createContext, useState, useContext } from 'react';

// Создание контекста UI с начальным значением для совместимости с React 19
export const UIContext = createContext({
  // Предоставляем заглушки для всех функций и начальные значения для всех свойств
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  modalState: { isOpen: false, content: null, title: '', onConfirm: null },
  openModal: () => {},
  closeModal: () => {},
  confirmModal: () => {},
  isLoading: false,
  setLoading: () => {},
  isMobileMenuOpen: false,
  openMobileMenu: () => {},
  closeMobileMenu: () => {}
});

// Хук для использования UI контекста с проверкой на null
export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

// Провайдер UI контекста
export const UIProvider = ({ children }) => {
  // Состояние для уведомлений
  const [notifications, setNotifications] = useState([]);
  // Состояние для модальных окон
  const [modalState, setModalState] = useState({
    isOpen: false,
    content: null,
    title: '',
    onConfirm: null
  });
  // Состояние загрузки
  const [isLoading, setIsLoading] = useState(false);
  // Состояние мобильного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Функция добавления уведомления
  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    
    // Автоматическое удаление уведомления после указанной продолжительности
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  // Функция удаления уведомления
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Функция открытия модального окна
  const openModal = (title, content, onConfirm = null) => {
    setModalState({
      isOpen: true,
      title,
      content,
      onConfirm
    });
  };

  // Функция закрытия модального окна
  const closeModal = () => {
    setModalState({
      isOpen: false,
      title: '',
      content: null,
      onConfirm: null
    });
  };

  // Функция подтверждения в модальном окне
  const confirmModal = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  };

  // Функция переключения состояния загрузки
  const setLoading = (state) => {
    setIsLoading(state);
  };

  // Функция открытия мобильного меню
  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  // Функция закрытия мобильного меню
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Значение контекста
  const value = {
    // Уведомления
    notifications,
    addNotification,
    removeNotification,
    
    // Модальные окна
    modalState,
    openModal,
    closeModal,
    confirmModal,
    
    // Индикатор загрузки
    isLoading,
    setLoading,
    
    // Мобильное меню
    isMobileMenuOpen,
    openMobileMenu,
    closeMobileMenu
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};