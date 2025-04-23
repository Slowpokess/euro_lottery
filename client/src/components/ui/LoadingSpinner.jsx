import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }[size] || 'spinner-medium';

  const colorClass = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    light: 'spinner-light',
    dark: 'spinner-dark'
  }[color] || 'spinner-primary';

  return (
    <div className={`loading-spinner ${sizeClass} ${colorClass}`}>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;