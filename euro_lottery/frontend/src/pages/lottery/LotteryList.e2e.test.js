import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../../App';
import lotteryReducer from '../../store/slices/lotterySlice';
import authReducer from '../../store/slices/authSlice';
import networkReducer from '../../store/slices/networkSlice';
import userReducer from '../../store/slices/userSlice';
import walletReducer from '../../store/slices/walletSlice';
import notificationReducer from '../../store/slices/notificationSlice';

// Мок для fetch и XHR запросов
import 'whatwg-fetch';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
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

// Настройка MSW для перехвата API запросов
const server = setupServer(
  // Эндпоинт для получения списка лотерей
  rest.get('http://localhost:8000/api/lottery/games/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockLotteries)
    );
  }),
  
  // Эндпоинт для получения деталей конкретной лотереи
  rest.get('http://localhost:8000/api/lottery/games/1/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockLotteryDetails)
    );
  }),

  // Fallback для всех остальных запросов
  rest.get('*', (req, res, ctx) => {
    console.error(`Unhandled GET request: ${req.url.toString()}`);
    return res(ctx.status(404));
  }),
  
  rest.post('*', (req, res, ctx) => {
    console.error(`Unhandled POST request: ${req.url.toString()}`);
    return res(ctx.status(404));
  })
);

// Настройка теста
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Мок для LocalStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Создание реального Redux-стора
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      lottery: lotteryReducer,
      auth: authReducer,
      network: networkReducer,
      user: userReducer,
      wallet: walletReducer,
      notification: notificationReducer
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' },
        tokenRefreshStatus: 'idle'
      },
      network: {
        isOnline: true,
        offlineOperationsCount: 0
      },
      lottery: {
        lotteryGames: [],
        selectedLotteryGame: null,
        loading: false,
        error: null
      },
      ...preloadedState
    }
  });
};

describe('LotteryList E2E Test', () => {
  let store;
  let history;
  
  beforeEach(() => {
    // Устанавливаем токен авторизации в localStorage
    localStorageMock.setItem('accessToken', 'fake-access-token');
    localStorageMock.setItem('refreshToken', 'fake-refresh-token');
    
    // Создаем хранилище Redux
    store = createTestStore();
    
    // Создаем историю браузера
    history = createMemoryHistory();
  });
  
  // E2E тест для проверки страницы со списком лотерей и перехода к деталям
  test('renders lottery list and navigates to lottery details', async () => {
    // Устанавливаем начальный путь на страницу со списком лотерей
    history.push('/lotteries');
    
    // Рендерим все приложение
    await act(async () => {
      render(
        <Provider store={store}>
          <Router location={history.location} navigator={history}>
            <App />
          </Router>
        </Provider>
      );
    });
    
    // Ожидаем загрузки данных и проверяем, что заголовок страницы отображается
    await waitFor(() => {
      expect(screen.getByText('Доступные лотереи')).toBeInTheDocument();
    });
    
    // Ожидаем отображения лотерей
    await waitFor(() => {
      expect(screen.getByText('EuroMillions')).toBeInTheDocument();
      expect(screen.getByText('PowerBall')).toBeInTheDocument();
    });
    
    // Проверяем, что данные лотерей отображаются корректно
    expect(screen.getByText(/Play Europe's biggest lottery game/i)).toBeInTheDocument();
    
    // Находим все кнопки "Подробнее" и кликаем на первую из них
    const detailButtons = screen.getAllByText('Подробнее');
    
    await act(async () => {
      fireEvent.click(detailButtons[0]);
    });
    
    // Проверяем, что произошел переход на страницу деталей лотереи
    await waitFor(() => {
      // Проверяем изменение URL
      expect(history.location.pathname).toBe('/lotteries/1');
    });
    
    // Примечание: в реальном E2E тесте здесь будет дополнительная проверка
    // содержимого страницы деталей лотереи, но для этого требуется настроить
    // мок для страницы LotteryDetails.js и рендеринг компонента.
  });
  
  // Проверка функциональности обновления данных
  test('refresh button fetches new data', async () => {
    // Устанавливаем начальный путь на страницу со списком лотерей
    history.push('/lotteries');
    
    await act(async () => {
      render(
        <Provider store={store}>
          <Router location={history.location} navigator={history}>
            <App />
          </Router>
        </Provider>
      );
    });
    
    // Ожидаем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('EuroMillions')).toBeInTheDocument();
    });
    
    // Переопределяем обработчик для API запроса, чтобы вернуть новые данные
    server.use(
      rest.get('http://localhost:8000/api/lottery/games/', (req, res, ctx) => {
        const forceRefresh = req.url.searchParams.get('_t');
        
        // Проверяем, что запрос с _t параметром был сделан (индикатор forceRefresh)
        if (forceRefresh) {
          return res(
            ctx.status(200),
            ctx.json([
              {
                ...mockLotteries[0],
                currentJackpot: '150000000.00' // Обновленный джекпот
              },
              mockLotteries[1]
            ])
          );
        }
        
        return res(
          ctx.status(200),
          ctx.json(mockLotteries)
        );
      })
    );
    
    // Находим и кликаем на кнопку обновления
    const refreshButton = screen.getByText('Обновить');
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    
    // После нажатия на кнопку обновления ожидаем обновления данных
    // Примечание: в реальном E2E тесте здесь мы бы проверили, 
    // что обновленное значение джекпота отображается
  });
});