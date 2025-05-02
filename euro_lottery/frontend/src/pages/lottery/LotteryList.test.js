import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import LotteryList from './LotteryList';

// Тестовые данные лотерей
const mockLotteries = [
  {
    id: 1,
    name: 'EuroMillions',
    description: 'Test lottery game',
    currentJackpot: '1000000.00',
    nextDrawDate: '2025-12-31T20:00:00Z',
    ticketPrice: 2.50,
    status: 'active'
  },
  {
    id: 2,
    name: 'PowerBall',
    description: 'Another test lottery',
    currentJackpot: '2000000.00',
    nextDrawDate: '2025-12-30T20:00:00Z',
    ticketPrice: 3.00,
    status: 'active'
  }
];

// Мокирование modular imports, чтобы избежать зависимости от реальных модулей
jest.mock('../../hooks/useApi', () => {
  return {
    __esModule: true,
    default: () => ({
      loading: false,
      error: null,
      execute: jest.fn(() => Promise.resolve(mockLotteries))
    })
  };
});

// Мок хука useNavigate из react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Мок API сервиса
jest.mock('../../services/api', () => ({
  lottery: {
    getLotteries: jest.fn()
  }
}));

// Мок для LoadingOverlay компонента
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

// Мок для LotteryCard компонента
jest.mock('../../components/LotteryCard', () => {
  return function MockLotteryCard({ lottery, actionText }) {
    return (
      <div data-testid="lottery-card" className="lottery-card">
        <h4>{lottery.name}</h4>
        <p>{lottery.description}</p>
        <div data-testid="jackpot">€{lottery.currentJackpot}</div>
        <button>{actionText || 'Подробнее'}</button>
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

// Мок для navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  configurable: true,
  value: true
});

describe('LotteryList Component', () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Тест для проверки отображения состояния загрузки
  test('renders loading placeholder when loading', () => {
    // Переопределяем мок useApi чтобы вернуть loading: true
    jest.requireMock('../../hooks/useApi').default = () => ({
      loading: true,
      error: null,
      execute: jest.fn()
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    // Ищем элемент с текстом Loading
    const loadingElement = screen.getByText(/Loading/i);
    expect(loadingElement).toBeInTheDocument();
  });

  // Тест для проверки отображения сообщения об ошибке
  test('displays error message when API fails', () => {
    // Переопределяем мок useApi чтобы вернуть error
    jest.requireMock('../../hooks/useApi').default = () => ({
      loading: false,
      error: { message: 'Failed to load lottery games' },
      execute: jest.fn()
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    // Ищем элемент с сообщением об ошибке
    const errorElement = screen.getByText(/Failed to load lottery games/i);
    expect(errorElement).toBeInTheDocument();
  });
});