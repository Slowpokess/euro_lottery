import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Компонент для тестирования ErrorBoundary
 * Намеренно генерирует ошибку при нажатии на кнопку
 */
const ErrorThrower = ({ errorMessage = 'Тестовая ошибка' }) => {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  if (shouldThrow) {
    // Генерируем ошибку для тестирования ErrorBoundary
    throw new Error(errorMessage);
  }
  
  return (
    <div className="error-thrower">
      <h3>Тестовый компонент для ErrorBoundary</h3>
      <p>Нажмите на кнопку ниже, чтобы вызвать ошибку и проверить работу ErrorBoundary</p>
      <button 
        className="btn btn-danger"
        onClick={() => setShouldThrow(true)}
      >
        Вызвать ошибку
      </button>
    </div>
  );
};

ErrorThrower.propTypes = {
  errorMessage: PropTypes.string
};

export default ErrorThrower;