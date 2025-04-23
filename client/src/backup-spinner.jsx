import React from 'react';

// Простой спиннер загрузки без каких-либо зависимостей
const BackupSpinner = ({ size = 'medium', color = 'primary' }) => {
  // Базовые стили для спиннера
  const baseStyle = {
    display: 'inline-block',
    borderRadius: '50%',
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    animation: 'spin 1s linear infinite',
  };

  // Размеры
  const sizes = {
    small: { width: '20px', height: '20px', borderWidth: '2px' },
    medium: { width: '40px', height: '40px', borderWidth: '3px' },
    large: { width: '60px', height: '60px', borderWidth: '4px' }
  };

  // Цвета
  const colors = {
    primary: '#888',
    secondary: '#6c757d',
    light: '#f8f9fa',
    dark: '#343a40'
  };

  // Объединяем стили
  const spinnerStyle = {
    ...baseStyle,
    ...sizes[size] || sizes.medium,
    borderColor: colors[color] || colors.primary
  };

  // Добавляем CSS анимацию
  const animationStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
      <style>{animationStyle}</style>
      <div style={spinnerStyle}></div>
    </div>
  );
};

export default BackupSpinner;