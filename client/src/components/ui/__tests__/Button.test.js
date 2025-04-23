import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

// Мок для react-router-dom, чтобы тестировать компоненты с использованием Link
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children, className, ...rest }) => (
    <a href={to} className={className} data-testid="mock-link" {...rest}>
      {children}
    </a>
  )
}));

describe('Button Component', () => {
  // Тест для кнопки с внутренним обработчиком
  it('renders button and triggers click handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const button = screen.getByText('Click Me');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Тест для кнопки с атрибутом 'to' (реализуется как Link из react-router-dom)
  it('renders as Link when "to" prop is provided', () => {
    render(
      <Button to="/some-path">Go to Page</Button>
    );
    
    const link = screen.getByText('Go to Page');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/some-path');
    expect(link.getAttribute('data-testid')).toBe('mock-link');
  });

  // Тест для кнопки с внешней ссылкой
  it('renders as anchor when "href" prop is provided', () => {
    render(
      <Button href="https://example.com">External Link</Button>
    );
    
    const link = screen.getByText('External Link');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  // Тест для различных вариантов кнопок
  it('applies different variants and sizes correctly', () => {
    const { rerender } = render(
      <Button variant="secondary" size="large">Custom Button</Button>
    );
    
    let button = screen.getByText('Custom Button');
    expect(button).toHaveClass('btn-secondary');
    expect(button).toHaveClass('btn-large');
    
    rerender(
      <Button variant="primary" size="small">Custom Button</Button>
    );
    
    button = screen.getByText('Custom Button');
    expect(button).toHaveClass('btn-primary');
    expect(button).toHaveClass('btn-small');
  });

  // Тест для кнопки на всю ширину
  it('applies fullWidth class when fullWidth is true', () => {
    render(
      <Button fullWidth>Full Width Button</Button>
    );
    
    const button = screen.getByText('Full Width Button');
    expect(button).toHaveClass('btn-full');
  });

  // Тест для дополнительных классов
  it('applies additional className', () => {
    render(
      <Button className="custom-class">Custom Class Button</Button>
    );
    
    const button = screen.getByText('Custom Class Button');
    expect(button).toHaveClass('custom-class');
  });
});