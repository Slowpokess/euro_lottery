import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import LotteryList from './LotteryList';
import { act } from 'react-dom/test-utils';

// Тестовые данные лотерей
const mockLotteries = [
  {
    id: 1,
    name: 'EuroMillions',
    description: 'Play Europe\'s biggest lottery game with huge jackpots! Match 5 numbers plus 2 Lucky Stars to win the top prize.',
    currentJackpot: '130000000.00',
    nextDrawDate: '2025-12-31T20:00:00Z',
    ticketPrice: 2.50,
    status: 'active'
  },
  {
    id: 2,
    name: 'PowerBall',
    description: 'The American classic with record-breaking jackpots! Match 5 numbers plus the PowerBall to win millions.',
    currentJackpot: '50000000.00',
    nextDrawDate: '2025-12-30T20:00:00Z',
    ticketPrice: 3.00,
    status: 'active'
  }
];

// Детали конкретной лотереи для теста детальной страницы
const mockLotteryDetails = {
  id: 1,
  name: 'EuroMillions',
  description: 'Play Europe\'s biggest lottery game with huge jackpots! Match 5 numbers plus 2 Lucky Stars to win the top prize.',
  currentJackpot: '130000000.00',
  nextDrawDate: '2025-12-31T20:00:00Z',
  ticketPrice: 2.50,
  status: 'active',
  mainNumbersCount: 5,
  mainNumbersRange: 50,
  extraNumbersCount: 2,
  extraNumbersRange: 12,
  rules: 'The rules of EuroMillions are simple. Choose 5 main numbers from 1-50 and 2 Lucky Stars from 1-12.',
  drawDays: ['Tuesday', 'Friday'],
  minJackpot: '17000000.00',
  recordJackpot: '210000000.00'
};

// Мокируем axios
jest.mock('axios', () => {
  return {
    create: jest.fn().mockReturnValue({
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    }),
    defaults: { baseURL: '' },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  };
});

// Мокирование модулей для предотвращения ошибок
jest.mock('../../store/slices/authSlice', () => ({
  logoutUser: jest.fn().mockReturnValue({ type: 'auth/logout' }),
  refreshToken: jest.fn().mockReturnValue({ type: 'auth/refreshToken' })
}));

jest.mock('../../store/slices/networkSlice', () => ({
  setNetworkStatus: jest.fn().mockReturnValue({ type: 'network/setStatus' }),
  showNetworkStatusNotification: jest.fn().mockReturnValue({ type: 'network/showNotification' }),
  updateOfflineOperationsCount: jest.fn().mockReturnValue({ type: 'network/updateOfflineCount' })
}));

// Мокируем API сервис
jest.mock('../../services/api', () => {
  return {
    lottery: {
      getLotteries: jest.fn((params = {}, options = {}) => Promise.resolve({
        data: mockLotteries
      }))
    },
    cache: {
      forceRefresh: jest.fn()
    }
  };
});

// Мокируем хук useNavigate из react-router-dom
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  const mockNavigate = jest.fn();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Мокируем компоненты интерфейса
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

// Мок для компонента LotteryCard
jest.mock('../../components/LotteryCard', () => {
  return function MockLotteryCard({ lottery, actionText, onAction }) {
    return (
      <div data-testid="lottery-card" className="lottery-card">
        <h4>{lottery.name}</h4>
        <p>{lottery.description}</p>
        <div data-testid="jackpot">€{lottery.currentJackpot}</div>
        <button onClick={onAction}>{actionText || 'Подробнее'}</button>
      </div>
    );
  };
});

// Мок ThemeContext
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
    name: 'light'
  })
}));

// Создание мока для хранилища Redux
const mockStore = configureMockStore([thunk]);

describe('LotteryList E2E Test', () => {
  let store;
  
  beforeEach(() => {
    // Создаем хранилище Redux
    store = mockStore({
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
    
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();
    
    // Очищаем моки API
    const apiService = require('../../services/api');
    apiService.lottery.getLotteries.mockClear();
    
    // Сбрасываем мок навигации
    const reactRouterDom = require('react-router-dom');
    const navigate = reactRouterDom.useNavigate();
    navigate.mockClear();
  });
  
  // Тест для проверки отображения страницы со списком лотерей
  test('renders lottery list correctly', async () => {
    // Рендерим компонент
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/lotteries']}>
            <LotteryList />
          </MemoryRouter>
        </Provider>
      );
    });
    
    // Проверяем отображение заголовка
    expect(screen.getByText('Доступные лотереи')).toBeInTheDocument();
    
    // Проверяем отображение лотерей
    expect(screen.getByText('EuroMillions')).toBeInTheDocument();
    expect(screen.getByText('PowerBall')).toBeInTheDocument();
    
    // Проверяем наличие кнопок "Подробнее"
    const detailButtons = screen.getAllByText('Подробнее');
    expect(detailButtons.length).toBeGreaterThan(0);
  });
  
  // Проверка функциональности обновления данных
  test('refresh button fetches new data', async () => {
    // Импортируем apiService для доступа к моку getLotteries
    const apiService = require('../../services/api');
    
    // Настраиваем getLotteries для проверки параметра forceRefresh
    apiService.lottery.getLotteries.mockImplementation((params = {}, options = {}) => {
      return Promise.resolve({
        data: mockLotteries
      });
    });
    
    // Рендерим компонент
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <LotteryList />
          </MemoryRouter>
        </Provider>
      );
    });
    
    // Очищаем предыдущие вызовы API
    apiService.lottery.getLotteries.mockClear();
    
    // Находим и кликаем на кнопку обновления
    await act(async () => {
      const refreshButton = screen.getByText('Обновить');
      fireEvent.click(refreshButton);
    });
    
    // Проверяем, что API был вызван с флагом forceRefresh=true
    expect(apiService.lottery.getLotteries).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ forceRefresh: true })
    );
  });
});