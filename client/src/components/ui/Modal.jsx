import React, { useEffect } from 'react';
import { useUI } from '../../contexts';
import './Modal.css';

const Modal = () => {
  const { modalState, closeModal, confirmModal } = useUI();
  const { isOpen, title, content, onConfirm } = modalState;

  // Закрытие модального окна по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Блокируем скролл на body при открытии модального окна
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Возвращаем скролл при закрытии
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, closeModal]);

  // Предотвращаем всплытие клика по содержимому модального окна
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-container" onClick={handleContentClick}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>
        <div className="modal-body">
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>
        <div className="modal-footer">
          <button className="modal-button modal-button-secondary" onClick={closeModal}>
            Отмена
          </button>
          {onConfirm && (
            <button className="modal-button modal-button-primary" onClick={confirmModal}>
              Подтвердить
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;