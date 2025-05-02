import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import LotteryList from './LotteryList';

// Mock the axios module
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({
    data: [
      {
        id: 1,
        name: 'EuroMillions',
        description: 'Test lottery game',
        ticket_price: 2.50,
        main_numbers_count: 5,
        main_numbers_range: 50,
        extra_numbers_count: 2,
        extra_numbers_range: 12,
        next_draw: {
          id: 101,
          draw_date: '2023-12-31T20:00:00Z',
          jackpot_amount: 1000000.00
        }
      },
      {
        id: 2,
        name: 'PowerBall',
        description: 'Another test lottery',
        ticket_price: 3.00,
        main_numbers_count: 5,
        main_numbers_range: 69,
        extra_numbers_count: 1,
        extra_numbers_range: 26,
        next_draw: {
          id: 102,
          draw_date: '2023-12-30T20:00:00Z',
          jackpot_amount: 2000000.00
        }
      }
    ]
  }))
}));

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
  }
});

describe('LotteryList Component', () => {
  beforeEach(() => {
    store.clearActions();
  });

  test('renders loading state initially', () => {
    const loadingStore = mockStore({
      lottery: {
        lotteryGames: [],
        loading: true,
        error: null
      },
      auth: {
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      }
    });

    render(
      <Provider store={loadingStore}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  test('renders lottery games when loaded', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    // Wait for the component to load data
    await waitFor(() => {
      expect(screen.getByText('EuroMillions')).toBeInTheDocument();
      expect(screen.getByText('PowerBall')).toBeInTheDocument();
    });

    // Check that jackpot amounts are displayed
    expect(screen.getByText(/1,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/2,000,000/)).toBeInTheDocument();
  });

  test('navigates to lottery details when clicked', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('EuroMillions')).toBeInTheDocument();
    });

    // Mock implementation of window.location
    delete window.location;
    window.location = { href: '' };
    
    // Find and click the "View Details" button for the first lottery
    const viewDetailsButtons = screen.getAllByText(/View Details/i);
    userEvent.click(viewDetailsButtons[0]);
    
    // Check that correct lottery details are displayed or that navigation occurred
    await waitFor(() => {
      const storeActions = store.getActions();
      const navigateAction = storeActions.find(action => action.type === 'lottery/selectLotteryGame');
      expect(navigateAction).toBeDefined();
      expect(navigateAction.payload).toBe(1); // First lottery ID
    });
  });

  test('displays error message when API fails', async () => {
    const errorStore = mockStore({
      lottery: {
        lotteryGames: [],
        loading: false,
        error: 'Failed to load lottery games'
      },
      auth: {
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      }
    });

    render(
      <Provider store={errorStore}>
        <BrowserRouter>
          <LotteryList />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load lottery games/i)).toBeInTheDocument();
    });
  });
});