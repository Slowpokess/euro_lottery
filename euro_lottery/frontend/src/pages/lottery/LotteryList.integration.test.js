import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import LotteryList from './LotteryList';
import apiService from '../../services/api';

// НЕ мокируем API-клиент, чтобы проверить реальные API вызовы
// Но перенаправляем их на тестовый эндпоинт

// Создаем тестовый эндпоинт для моков в API сервисе
jest.mock('../../services/api', () => {
  // Сохраняем оригинальный модуль
  const originalModule = jest.requireActual('../../services/api');
  
  // Создаем тестовые данные лотерей
  const mockLotteries = [
    {
      id: 1,
      name: 'EuroMillions',
      description: 'Test lottery game from integration',
      currentJackpot: '1000000.00',
      nextDrawDate: '2025-12-31T20:00:00Z',
      ticketPrice: 2.50,
      status: 'active'
    },
    {
      id: 2,
      name: 'PowerBall',
      description: 'Another test lottery from integration',
      currentJackpot: '2000000.00',
      nextDrawDate: '2025-12-30T20:00:00Z',
      ticketPrice: 3.00,
      status: 'active'
    }
  ];
  
  // Возвращаем модифицированный модуль с перезаписанными методами
  return {
    ...originalModule,
    lottery: {
      ...originalModule.lottery,
      // Перезаписываем только метод getLotteries для интеграционного теста
      getLotteries: jest.fn(() => Promise.resolve({
        data: mockLotteries,
        // Эмулируем структуру ответа axios
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      }))
    }
  };
});

// Мокируем только компоненты, не связанные с тестом
jest.mock('../../components/LoadingOverlay', () => ({
  LoadingPlaceholder: ({ children, isLoading }) => (
    <div data-testid="loading-placeholder">
      {isLoading ? <div>Loading...</div> : children}
    </div>
  ),
  useLoading: () => ({
    startLoading: jest.fn(),
    stopLoading: jest.fn()
  })
}));

// Мок для ThemeContext
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4A3AFF',
      textLight: '#888',
      textMedium: '#666',
      text: '#333',
      card: '#fff',
      border: '#eee',
      jackpot: '#FFC107'
    },
    name: 'light',
    shadows: { 
      sm: '0 2px 4px rgba(0,0,0,0.1)',
      lg: '0 4px 12px rgba(0,0,0,0.15)'
    },
    borderRadius: { md: '8px' },
    typography: { fontFamilyAlt: 'Arial' }
  })
}));

// Создаем мок для хранилища Redux
const mockStore = configureMockStore([thunk]);
const store = mockStore({
  lottery: {
    lotteryGames: [],
    loading: false,
    error: null
  },
  auth: {
    isAuthenticated: true,
    user: { id: 1, username: 'testuser' }
  },
  network: {
    isOnline: true,
    offlineOperationsCount: 0
  }
});

describe('LotteryList Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Интеграционный тест для проверки загрузки данных через API
  test('loads and displays lottery games from API', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    // Проверяем, что API был вызван
    await waitFor(() => {
      expect(apiService.lottery.getLotteries).toHaveBeenCalled();
    });

    // Ожидаем загрузки данных и проверяем, что компоненты лотерей отображаются
    await waitFor(() => {
      expect(screen.getByText('EuroMillions')).toBeInTheDocument();
      expect(screen.getByText('PowerBall')).toBeInTheDocument();
    });

    // Проверяем, что содержимое лотерей отображается правильно
    expect(screen.getByText('Test lottery game from integration')).toBeInTheDocument();
    expect(screen.getByText('Another test lottery from integration')).toBeInTheDocument();
    
    // Проверяем отображение джекпотов
    const jackpotElements = screen.getAllByText(/€\d+,\d+\.\d+/);
    expect(jackpotElements.length).toBeGreaterThan(0);

    // Проверяем наличие цен билетов
    expect(screen.getByText('€2.50')).toBeInTheDocument();
    expect(screen.getByText('€3.00')).toBeInTheDocument();
    
    // Проверяем наличие кнопок действий
    const actionButtons = screen.getAllByText('Подробнее');
    expect(actionButtons.length).toBe(2);
  });

  // Проверяем обработку сетевых ошибок
  test('handles network errors gracefully', async () => {
    // Временно переопределяем функцию getLotteries, чтобы она вызывала ошибку
    apiService.lottery.getLotteries.mockImplementationOnce(() => 
      Promise.reject(new Error('Network Error'))
    );

    render(
      <Provider store={store}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    // Проверяем, что API был вызван
    await waitFor(() => {
      expect(apiService.lottery.getLotteries).toHaveBeenCalled();
    });

    // Проверяем, что отображаются мок-данные при ошибке сети
    await waitFor(() => {
      expect(screen.getByText('EuroMillions')).toBeInTheDocument();
      expect(screen.getByText('Используются тестовые данные')).toBeInTheDocument();
    });
  });

  // Проверяем обновление данных через API при нажатии на кнопку "Обновить"
  test('refreshes data from API when refresh button is clicked', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    // Ожидаем загрузки данных
    await waitFor(() => {
      expect(apiService.lottery.getLotteries).toHaveBeenCalled();
    });

    // Находим и кликаем на кнопку обновления
    const refreshButton = screen.getByText('Обновить');
    refreshButton.click();

    // Проверяем, что API был вызван еще раз с параметром forceRefresh
    await waitFor(() => {
      expect(apiService.lottery.getLotteries).toHaveBeenCalledTimes(2);
      // Проверяем, что второй вызов был с параметром forceRefresh: true
      expect(apiService.lottery.getLotteries.mock.calls[1][1].forceRefresh).toBe(true);
    });
  });
});