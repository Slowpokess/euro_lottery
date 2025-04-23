import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  // Тест для рендеринга компонента с дефолтными параметрами
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner-medium');
    expect(spinner).toHaveClass('spinner-primary');
  });

  // Тест для различных размеров
  it('applies different sizes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    
    let spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner-small');
    
    rerender(<LoadingSpinner size="large" />);
    spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner-large');
  });

  // Тест для различных цветов
  it('applies different colors correctly', () => {
    const { rerender } = render(<LoadingSpinner color="secondary" />);
    
    let spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner-secondary');
    
    rerender(<LoadingSpinner color="light" />);
    spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner-light');
    
    rerender(<LoadingSpinner color="dark" />);
    spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner-dark');
  });

  // Тест для проверки комбинирования размера и цвета
  it('combines size and color correctly', () => {
    render(<LoadingSpinner size="large" color="secondary" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner-large');
    expect(spinner).toHaveClass('spinner-secondary');
  });

  // Тест для невалидных значений размера
  it('falls back to default size for invalid size props', () => {
    render(<LoadingSpinner size="invalid-size" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner-medium');
  });

  // Тест для невалидных значений цвета
  it('falls back to default color for invalid color props', () => {
    render(<LoadingSpinner color="invalid-color" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner-primary');
  });
});