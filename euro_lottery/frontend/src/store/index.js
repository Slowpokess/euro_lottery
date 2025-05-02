import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import lotteryReducer from './slices/lotterySlice';
import ticketReducer from './slices/ticketSlice';
import userReducer from './slices/userSlice';
import walletReducer from './slices/walletSlice';
import notificationReducer from './slices/notificationSlice';
import networkReducer from './slices/networkSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    lottery: lotteryReducer,
    ticket: ticketReducer,
    tickets: ticketReducer, // Добавляем tickets как псевдоним для ticket для совместимости
    user: userReducer,
    wallet: walletReducer,
    notifications: notificationReducer,
    network: networkReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
